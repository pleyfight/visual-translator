import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Types for our middleware
interface AuthenticatedUser {
  id: string
  email?: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser
  supabase: ReturnType<typeof createClient>
}

// Environment validation
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
})

// Validate environment variables
const env = envSchema.safeParse(process.env)
if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.errors)
}

// Create Supabase client for server-side operations
function createServerSupabase(token?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })
  
  return client
}

// Enhanced error responses with proper typing
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // OWASP recommended security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CORS headers for our domain
  response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : 'https://yourdomain.com')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

// JWT Authentication Middleware
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract JWT token from Authorization header
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      if (!token) {
        // For development, allow requests without tokens for testing
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️  Development mode: Skipping auth for testing')
          const mockUser: AuthenticatedUser = {
            id: 'dev-user-id',
            email: 'dev@example.com'
          }
          const supabase = createServerSupabase()
          ;(request as any).user = mockUser
          ;(request as any).supabase = supabase
          return handler(request as AuthenticatedRequest)
        }
        
        throw new ApiError(401, 'Missing authorization token', 'MISSING_TOKEN')
      }
      
      // Create Supabase client with the user's token
      const supabase = createServerSupabase(token)
      
      // Verify the JWT and get user information
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        throw new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN', error)
      }
      
      // Add user and supabase client to request
      ;(request as any).user = user
      ;(request as any).supabase = supabase
      
      // Call the protected handler
      const response = await handler(request as AuthenticatedRequest)
      
      // Add security headers to response
      return addSecurityHeaders(response)
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      
      if (error instanceof ApiError) {
        return NextResponse.json(
          { 
            error: error.message, 
            code: error.code,
            details: error.details 
          },
          { status: error.statusCode }
        )
      }
      
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 401 }
      )
    }
  }
}

// Zod Validation Middleware
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function(
    handler: (req: AuthenticatedRequest, validatedData: T) => Promise<NextResponse>
  ) {
    return async (request: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        let data: any
        
        // Parse request data based on content type
        const contentType = request.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          data = await request.json()
        } else if (contentType?.includes('multipart/form-data')) {
          const formData = await request.formData()
          data = Object.fromEntries(formData.entries())
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          data = Object.fromEntries(formData.entries())
        } else {
          // For GET requests, use query parameters
          const url = new URL(request.url)
          data = Object.fromEntries(url.searchParams.entries())
        }
        
        // Validate the data with Zod
        const validation = schema.safeParse(data)
        
        if (!validation.success) {
          throw new ApiError(
            400, 
            'Validation failed', 
            'VALIDATION_ERROR',
            validation.error.errors
          )
        }
        
        // Call handler with validated data
        return await handler(request, validation.data)
        
      } catch (error) {
        console.error('Validation middleware error:', error)
        
        if (error instanceof ApiError) {
          return NextResponse.json(
            { 
              error: error.message, 
              code: error.code,
              details: error.details 
            },
            { status: error.statusCode }
          )
        }
        
        return NextResponse.json(
          { error: 'Request validation failed', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
    }
  }
}

// Rate Limiting Middleware (simple implementation)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

export function withRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (request: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        // Use user ID for rate limiting (fallback to IP in development)
        const identifier = request.user?.id || request.ip || 'unknown'
        const now = Date.now()
        
        // Get or create rate limit entry
        const userLimit = rateLimitMap.get(identifier) || { count: 0, lastReset: now }
        
        // Reset counter if window has passed
        if (now - userLimit.lastReset > windowMs) {
          userLimit.count = 0
          userLimit.lastReset = now
        }
        
        // Check if limit exceeded
        if (userLimit.count >= maxRequests) {
          throw new ApiError(
            429, 
            'Rate limit exceeded. Please try again later.',
            'RATE_LIMIT_EXCEEDED'
          )
        }
        
        // Increment counter
        userLimit.count++
        rateLimitMap.set(identifier, userLimit)
        
        // Call handler
        const response = await handler(request)
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', (maxRequests - userLimit.count).toString())
        response.headers.set('X-RateLimit-Reset', new Date(userLimit.lastReset + windowMs).toISOString())
        
        return response
        
      } catch (error) {
        if (error instanceof ApiError) {
          return NextResponse.json(
            { 
              error: error.message, 
              code: error.code 
            },
            { status: error.statusCode }
          )
        }
        
        return NextResponse.json(
          { error: 'Rate limiting error', code: 'RATE_LIMIT_ERROR' },
          { status: 500 }
        )
      }
    }
  }
}

// Logging Middleware
export function withLogging(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: AuthenticatedRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const method = request.method
    const url = request.url
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const userId = request.user?.id || 'anonymous'
    
    console.log(`📝 ${method} ${url} - User: ${userId} - Start`)
    
    try {
      const response = await handler(request)
      const duration = Date.now() - startTime
      const status = response.status
      
      console.log(`✅ ${method} ${url} - ${status} - ${duration}ms - User: ${userId}`)
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ ${method} ${url} - Error: ${error} - ${duration}ms - User: ${userId}`)
      throw error
    }
  }
}

// Compose multiple middlewares
export function withMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return function(handler: any) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Export commonly used middleware combinations
export const withSecureApi = withMiddleware(
  withAuth,
  withRateLimit(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  withLogging
)

export const withSecureValidatedApi = <T>(schema: z.ZodSchema<T>) =>
  withMiddleware(
    withAuth,
    withRateLimit(100, 15 * 60 * 1000),
    withValidation(schema),
    withLogging
  )
