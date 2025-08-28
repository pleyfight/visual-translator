import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { analysisResultSchema, jobConfigSchema } from '../lib/schemas'

// Environment validation for worker
const workerEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  OCR_SERVICE_URL: z.string().url().optional(),
})

// Validate environment
const env = workerEnvSchema.safeParse(process.env)
if (!env.success) {
  console.error('❌ Worker environment validation failed:', env.error.errors)
  process.exit(1)
}

// Create Supabase client with service role key for server operations
const supabase = createClient(
  env.data.SUPABASE_URL,
  env.data.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Job processing status tracking
interface JobProcessor {
  isRunning: boolean
  activeJobs: Set<string>
  maxConcurrentJobs: number
}

const processor: JobProcessor = {
  isRunning: false,
  activeJobs: new Set(),
  maxConcurrentJobs: 3, // Process up to 3 jobs concurrently
}

// OCR Service interface
interface OCRResult {
  blocks: Array<{
    id: string
    text: string
    confidence: number
    bbox: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  pages: number
  language?: string
}

// Gemini API interface
interface TranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
  context?: string
}

interface TranslationResult {
  translatedText: string
  confidence: number
  sourceLanguage: string
  targetLanguage: string
}

// OCR Service implementation
async function performOCR(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
  try {
    console.log('🔍 Starting OCR processing...')
    
    // For now, we'll implement a mock OCR service
    // In production, this would integrate with services like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js for client-side processing
    
    if (env.data.OCR_SERVICE_URL) {
      // External OCR service
      const formData = new FormData()
      formData.append('file', new Blob([fileBuffer], { type: mimeType }))
      
      const response = await fetch(env.data.OCR_SERVICE_URL, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`OCR service error: ${response.statusText}`)
      }
      
      return await response.json()
    } else {
      // Mock OCR implementation for development
      console.log('⚠️ Using mock OCR service for development')
      
      const mockText = `Sample document text extracted from ${mimeType} file.
This is a multi-line document that would normally be processed by OCR.
The text contains various sentences that need to be translated.
Each block represents a different region of the document.`

      const lines = mockText.split('\n').filter(line => line.trim())
      
      return {
        blocks: lines.map((text, index) => ({
          id: `block_${index + 1}`,
          text: text.trim(),
          confidence: 0.95 + Math.random() * 0.05, // Mock confidence 95-100%
          bbox: {
            x: 50 + (index * 10),
            y: 100 + (index * 50),
            width: 500,
            height: 30,
          },
        })),
        pages: 1,
        language: 'en', // Mock detected language
      }
    }
  } catch (error) {
    console.error('❌ OCR processing failed:', error)
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Gemini API translation implementation
async function translateWithGemini(request: TranslationRequest): Promise<TranslationResult> {
  try {
    console.log(`🌐 Translating: "${request.text.substring(0, 50)}..." from ${request.sourceLanguage} to ${request.targetLanguage}`)
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.data.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Translate the following text from ${request.sourceLanguage} to ${request.targetLanguage}. Preserve the formatting and provide only the translation without explanations:

${request.text}`
          }]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent translations
          maxOutputTokens: 1000,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!translatedText) {
      throw new Error('No translation returned from Gemini API')
    }

    return {
      translatedText: translatedText.trim(),
      confidence: 0.9, // Gemini generally provides high-quality translations
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
    }
  } catch (error) {
    console.error('❌ Translation failed:', error)
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Main job processing function
async function handleNewJob(job: any): Promise<void> {
  const jobId = job.id
  console.log(`🚀 Processing job ${jobId}`)

  try {
    // Validate job configuration
    const configValidation = jobConfigSchema.safeParse(job.config)
    if (!configValidation.success) {
      throw new Error(`Invalid job configuration: ${configValidation.error.message}`)
    }

    const config = configValidation.data

    // 1. Update job status to 'processing'
    console.log(`📊 Updating job ${jobId} status to processing`)
    const { error: updateError } = await supabase
      .from('ai_jobs')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) {
      throw new Error(`Failed to update job status: ${updateError.message}`)
    }

    // 2. Download asset from storage
    console.log(`📥 Downloading asset for job ${jobId}`)
    const { data: asset } = await supabase
      .from('assets')
      .select('storage_path, file_type, filename')
      .eq('id', job.asset_id)
      .single()

    if (!asset) {
      throw new Error('Asset not found')
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('assets')
      .download(asset.storage_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download asset: ${downloadError?.message || 'File not found'}`)
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer())

    // 3. Run OCR service
    console.log(`🔍 Running OCR on ${asset.filename}`)
    const ocrResult = await performOCR(fileBuffer, asset.file_type)

    // 4. Call Gemini API for translation for each text block
    console.log(`🌐 Translating ${ocrResult.blocks.length} text blocks`)
    const translationPromises = ocrResult.blocks.map(block =>
      translateWithGemini({
        text: block.text,
        sourceLanguage: config.sourceLanguage === 'auto' 
          ? (ocrResult.language || 'en') 
          : config.sourceLanguage,
        targetLanguage: config.targetLanguage,
        context: `Document: ${asset.filename}`,
      })
    )

    const translations = await Promise.all(translationPromises)

    // 5. Combine results into the analysisResultSchema structure
    console.log(`📝 Combining results for job ${jobId}`)
    const analysisResult = {
      originalText: ocrResult.blocks.map(block => block.text).join('\n'),
      translatedText: translations.map(t => t.translatedText).join('\n'),
      sourceLanguage: config.sourceLanguage === 'auto' 
        ? (ocrResult.language || 'en') 
        : config.sourceLanguage,
      targetLanguage: config.targetLanguage,
      confidence: translations.reduce((sum, t) => sum + t.confidence, 0) / translations.length,
      detectedLanguage: ocrResult.language,
      textBlocks: ocrResult.blocks.map((block, index) => ({
        id: block.id,
        originalText: block.text,
        translatedText: translations[index]?.translatedText || '',
        confidence: translations[index]?.confidence || 0,
        position: block.bbox,
      })),
      metadata: {
        ocrEngine: 'gemini-vision', // or the actual OCR service used
        translationEngine: 'gemini-pro',
        processingTime: Date.now(),
        pages: ocrResult.pages,
        totalBlocks: ocrResult.blocks.length,
        documentType: asset.file_type,
        filename: asset.filename,
      },
    }

    // 6. Validate the final object
    console.log(`✅ Validating analysis result for job ${jobId}`)
    const validation = analysisResultSchema.safeParse(analysisResult)
    if (!validation.success) {
      throw new Error(`Analysis result validation failed: ${validation.error.message}`)
    }

    // 7. Save to ai_results and update job status to 'completed'
    console.log(`💾 Saving results for job ${jobId}`)
    const { error: resultError } = await supabase
      .from('ai_results')
      .insert({
        job_id: jobId,
        result_data: validation.data,
        created_at: new Date().toISOString(),
      })

    if (resultError) {
      throw new Error(`Failed to save results: ${resultError.message}`)
    }

    // Update job status to completed
    const { error: completeError } = await supabase
      .from('ai_jobs')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (completeError) {
      throw new Error(`Failed to mark job as completed: ${completeError.message}`)
    }

    console.log(`✅ Job ${jobId} completed successfully`)

  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error)

    // 8. On failure, update job status to 'failed'
    await supabase
      .from('ai_jobs')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    throw error
  } finally {
    // Remove job from active jobs set
    processor.activeJobs.delete(jobId)
  }
}

// Initialize job listener using Supabase real-time subscriptions
function initializeJobListener(): void {
  console.log('🎧 Initializing job listener...')

  const subscription = supabase
    .channel('ai_jobs_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_jobs',
        filter: 'status=eq.pending'
      },
      async (payload) => {
        const newJob = payload.new
        console.log(`📨 New job received: ${newJob.id}`)

        // Check if we can process more jobs
        if (processor.activeJobs.size >= processor.maxConcurrentJobs) {
          console.log(`⏳ Max concurrent jobs reached (${processor.maxConcurrentJobs}). Job ${newJob.id} will wait.`)
          return
        }

        // Add to active jobs
        processor.activeJobs.add(newJob.id)

        // Process job asynchronously
        handleNewJob(newJob).catch(error => {
          console.error(`❌ Failed to process job ${newJob.id}:`, error)
        })
      }
    )
    .subscribe((status) => {
      console.log(`📡 Subscription status: ${status}`)
      if (status === 'SUBSCRIBED') {
        processor.isRunning = true
        console.log('✅ Job listener initialized successfully')
      }
    })

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down job processor...')
    processor.isRunning = false
    subscription.unsubscribe()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down job processor...')
    processor.isRunning = false
    subscription.unsubscribe()
    process.exit(0)
  })
}

// Process any existing pending jobs on startup
async function processPendingJobs(): Promise<void> {
  console.log('🔄 Checking for pending jobs...')

  const { data: pendingJobs, error } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch pending jobs:', error)
    return
  }

  if (pendingJobs.length === 0) {
    console.log('✅ No pending jobs found')
    return
  }

  console.log(`📋 Found ${pendingJobs.length} pending jobs`)

  // Process jobs with concurrency limit
  for (const job of pendingJobs) {
    if (processor.activeJobs.size >= processor.maxConcurrentJobs) {
      console.log(`⏳ Max concurrent jobs reached. Remaining jobs will be processed as capacity becomes available.`)
      break
    }

    processor.activeJobs.add(job.id)
    handleNewJob(job).catch(error => {
      console.error(`❌ Failed to process pending job ${job.id}:`, error)
    })
  }
}

// Main worker entry point
async function startWorker(): Promise<void> {
  console.log('🤖 Starting Visual Translator Job Processor')
  console.log(`📊 Max concurrent jobs: ${processor.maxConcurrentJobs}`)

  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('ai_jobs').select('count').limit(1)
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`)
    }
    console.log('✅ Supabase connection established')

    // Process any existing pending jobs
    await processPendingJobs()

    // Initialize real-time job listener
    initializeJobListener()

    console.log('🎯 Job processor is ready and listening for new jobs')
  } catch (error) {
    console.error('❌ Failed to start worker:', error)
    process.exit(1)
  }
}

// Export for testing and external usage
export {
  startWorker,
  handleNewJob,
  initializeJobListener,
  performOCR,
  translateWithGemini,
  processor,
}

// Start worker if this file is run directly
if (require.main === module) {
  startWorker()
}
