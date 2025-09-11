import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Environment validation for worker
const workerEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const env = workerEnvSchema.parse(process.env);

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export class DatabaseService {
  async updateJobStatus(jobId: string, status: string, errorMessage?: string) {
    const updates: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('ai_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  async getAsset(assetId: string) {
    const { data: asset, error } = await supabase
      .from('assets')
      .select('storage_path, file_type, filename')
      .eq('id', assetId)
      .single();

    if (error || !asset) {
      throw new Error('Asset not found');
    }

    return asset;
  }

  async downloadAsset(storagePath: string): Promise<Buffer> {
    const { data: fileData, error } = await supabase.storage
      .from('assets')
      .download(storagePath);

    if (error || !fileData) {
      throw new Error(`Failed to download asset: ${error?.message || 'File not found'}`);
    }

    return Buffer.from(await fileData.arrayBuffer());
  }

  async saveResult(jobId: string, resultData: any) {
    const { error } = await supabase
      .from('ai_results')
      .insert({
        job_id: jobId,
        result_data: resultData,
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to save results: ${error.message}`);
    }
  }
}

export const dbService = new DatabaseService();