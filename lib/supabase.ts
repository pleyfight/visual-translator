import { createClient } from '@supabase/supabase-js'

// These should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// For development, allow missing environment variables
const isDevelopment = process.env.NODE_ENV === 'development'

if (!isDevelopment && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Use placeholder values during development if not configured
const defaultUrl = 'https://placeholder.supabase.co'
const defaultKey = 'placeholder-key'

export const supabase = createClient(
  supabaseUrl || defaultUrl, 
  supabaseAnonKey || defaultKey, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// For server-side operations that need elevated privileges
export const createServiceSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.SUPABASE_URL || supabaseUrl || defaultUrl
  
  if (!serviceRoleKey) {
    if (!isDevelopment) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    }
    // Return a placeholder client in development
    return createClient(url, defaultKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Type definitions for our database schema
export type Database = {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_type: string
          file_size: number
          storage_path: string
          upload_date: string
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_type: string
          file_size: number
          storage_path: string
          upload_date?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          upload_date?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      ai_jobs: {
        Row: {
          id: string
          user_id: string
          asset_id: string
          job_type: 'translate' | 'ocr' | 'analyze'
          status: 'pending' | 'processing' | 'completed' | 'failed'
          config: Record<string, any>
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          asset_id: string
          job_type: 'translate' | 'ocr' | 'analyze'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          config?: Record<string, any>
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asset_id?: string
          job_type?: 'translate' | 'ocr' | 'analyze'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          config?: Record<string, any>
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_results: {
        Row: {
          id: string
          job_id: string
          result_type: string
          result_data: Record<string, any>
          confidence_score: number | null
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          result_type: string
          result_data: Record<string, any>
          confidence_score?: number | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          result_type?: string
          result_data?: Record<string, any>
          confidence_score?: number | null
          processing_time_ms?: number | null
          created_at?: string
        }
      }
    }
  }
}
