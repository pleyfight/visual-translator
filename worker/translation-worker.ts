/**
 * AI Translation Worker
 * 
 * This worker process monitors the ai_jobs table for new translation jobs
 * and processes them using the Google Gemini API. It implements the
 * security measures described in your blueprint:
 * - Uses service role key (never exposed to client)
 * - Processes jobs asynchronously
 * - Stores results securely in the database
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Database types temporarily disabled for deployment
import pdf from 'pdf-parse';

// Server-side Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface JobConfig {
  targetLanguage: string;
  sourceLanguage?: string;
  assetType: string;
  filename: string;
}

type Job = Database['public']['Tables']['ai_jobs']['Row'];
type Asset = Database['public']['Tables']['assets']['Row'];
type AIResultInsert = Database['public']['Tables']['ai_results']['Insert'];

async function updateJobStatus(jobId: string, status: string, errorMessage?: string) {
  const updateData: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (status === 'processing') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }
  
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('ai_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error('Failed to update job status:', error);
  }
}

async function downloadAsset(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from('assets')
    .download(storagePath);

  if (error) {
    throw new Error(`Failed to download asset: ${error.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

async function translateWithGemini(text: string, targetLanguage: string, sourceLanguage: string = 'auto'): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `Translate the following text from ${sourceLanguage === 'auto' ? 'detected language' : sourceLanguage} to ${targetLanguage}. 
Preserve all formatting, structure, and special characters. Only return the translated text without any explanations:

${text}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Using pdf-parse to extract text from PDF files
  const data = await pdf(buffer);
  return data.text;
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  // TODO: Implement OCR for images
  // You could use Google Vision API, Tesseract.js, or Gemini Vision
  return "Mocked Image OCR text. Implement a real OCR service for production.";
}

async function extractTextFromDocument(buffer: Buffer, fileType: string): Promise<string> {
  if (fileType === 'text/plain') {
    return buffer.toString('utf-8');
  } else if (fileType === 'application/pdf') {
    return await extractTextFromPDF(buffer);
  } else if (fileType.startsWith('image/')) {
    return await extractTextFromImage(buffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function processTranslationJob(job: Job) {
  const startTime = Date.now();
  
  try {
    console.log(`Processing translation job ${job.id} for asset ${job.asset_id}`);
    
    // Update job status to processing
    await updateJobStatus(job.id, 'processing');
    
    // Get asset details
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', job.asset_id)
      .single();

    if (assetError || !asset) {
      throw new Error(`Asset not found: ${assetError?.message}`);
    }

    // Download the file
    const fileBuffer = await downloadAsset(asset.storage_path);
    
    // Extract text from the document
    const extractedText = await extractTextFromDocument(fileBuffer, asset.file_type);
    
    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the document');
    }

    // Translate the text
    const translatedText = await translateWithGemini(
      extractedText,
      job.config.targetLanguage,
      job.config.sourceLanguage
    );

    // Store the result
    const processingTime = Math.floor(Date.now() - startTime);
    
    const resultPayload: AIResultInsert = {
      job_id: job.id,
      result_type: 'translation',
      result_data: {
        original_text: extractedText,
        translated_text: translatedText,
        source_language: job.config.sourceLanguage,
        target_language: job.config.targetLanguage,
        file_type: asset.file_type,
        filename: asset.filename
      },
      confidence_score: 0.95, // TODO: Get actual confidence from Gemini
      processing_time_ms: processingTime
    };

    const { error: resultError } = await supabase
      .from('ai_results')
      .insert(resultPayload);

    if (resultError) {
      throw new Error(`Failed to store result: ${resultError.message}`);
    }

    // Mark job as completed
    await updateJobStatus(job.id, 'completed');
    console.log(`Job ${job.id} completed successfully in ${processingTime}ms`);

  } catch (error: any) {
    console.error(`Job ${job.id} failed:`, error.message);
    await updateJobStatus(job.id, 'failed', error.message);
  }
}

async function pollForJobs() {
  try {
    // Get pending jobs
    const { data: jobs, error } = await supabase
      .from('ai_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Failed to fetch jobs:', error);
      return;
    }

    if (jobs && jobs.length > 0) {
      console.log(`Found ${jobs.length} pending job(s)`);
      
      // Process jobs sequentially to avoid overwhelming the API
      for (const job of jobs) {
        await processTranslationJob(job);
      }
    }
  } catch (error) {
    console.error('Error in job polling:', error);
  }
}

async function startWorker() {
  console.log('🤖 AI Translation Worker starting...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set. Translation will fail.');
  }

  console.log('✅ Worker configured and ready');
  
  // Initial poll
  await pollForJobs();
  
  // Set up periodic polling
  setInterval(pollForJobs, 5000); // Poll every 5 seconds
  
  // Also listen for real-time changes
  const subscription = supabase
    .channel('ai-jobs')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_jobs'
      },
      async (payload) => {
        console.log('📨 New job received:', payload.new);
        if (payload.new) {
          await processTranslationJob(payload.new as Job);
        }
      }
    )
    .subscribe();

  console.log('🔄 Real-time job monitoring enabled');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down worker...');
    subscription.unsubscribe();
    process.exit(0);
  });
}

// Start the worker if this file is run directly
startWorker().catch(console.error);

export { processTranslationJob, startWorker };
