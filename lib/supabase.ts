import { createClient } from '@supabase/supabase-js'

// These should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// For development, allow missing environment variables
const isDevelopment = process.env.NODE_ENV === 'development'

if (!supabaseUrl || !supabaseAnonKey) {
  if (!isDevelopment) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }
  console.warn('⚠️ Missing Supabase environment variables - using placeholder values for development')
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
