import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { RateLimiter, rateLimiters, withAdvancedRateLimit } from './rate-limiter'

// Enhanced types for better DX
export interface AuthenticatedUser {
  id: string
  email?: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser
  supabase: SupabaseClient
}

// Standard API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  code?: string
  details?: any
  message?: string
}

// Handler type definitions for better type inference
export type ApiHandler<T = any> = (
  req: AuthenticatedRequest
) => Promise<NextResponse<ApiResponse<T>>>

export type ValidatedApiHandler<TSchema, TResponse = any> = (
  req: AuthenticatedRequest,
  data: TSchema
) => Promise<NextResponse<ApiResponse<TResponse>>>

// Environment validation
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
})

// Validate environment variables
const env = envSchema.safeParse(process.env)
if (!env.success) {
  console.warn('⚠️ Environment validation warnings:', env.error.errors)
}

// Create Supabase client for server-side operations
function createServerSupabase(token?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
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

// Enhanced error responses with proper typing and better DX
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

  // Helper methods for common error types
  static badRequest(message: string, details?: any) {
    return new ApiError(400, message, 'BAD_REQUEST', details)
  }

  static unauthorized(message = 'Unauthorized', details?: any) {
    return new ApiError(401, message, 'UNAUTHORIZED', details)
  }

  static forbidden(message = 'Forbidden', details?: any) {
    return new ApiError(403, message, 'FORBIDDEN', details)
  }

  static notFound(message = 'Not found', details?: any) {
    return new ApiError(404, message, 'NOT_FOUND', details)
  }

  static validation(message = 'Validation failed', details?: any) {
    return new ApiError(400, message, 'VALIDATION_ERROR', details)
  }

  static internal(message = 'Internal server error', details?: any) {
    return new ApiError(500, message, 'INTERNAL_ERROR', details)
  }

  static rateLimit(message = 'Too many requests', details?: any) {
    return new ApiError(429, message, 'RATE_LIMIT_EXCEEDED', details)
  }
}

// Helper function to create standardized API responses
export function createApiResponse<T>(
  data?: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, message }, { status })
}

export function createErrorResponse(
  error: string | ApiError,
  status?: number
): NextResponse<ApiResponse> {
  if (typeof error === 'string') {
    return NextResponse.json(
      { error, code: 'ERROR' },
      { status: status || 500 }
    )
  }
  
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
      details: error.details
    },
    { status: error.statusCode }
  )
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
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

// Enhanced JWT Authentication Middleware with better error handling
export function withAuth<T = any>(
  handler: ApiHandler<T>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
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
          Object.assign(request, { user: mockUser, supabase })
          return handler(request as AuthenticatedRequest)
        }
        
        throw ApiError.unauthorized('Missing authorization token')
      }
      
      // Create Supabase client with the user's token
      const supabase = createServerSupabase(token)
      
      // Verify the JWT and get user information
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        throw ApiError.unauthorized('Invalid or expired token', error)
      }
      
      // Add user and supabase client to request with proper typing
      Object.assign(request, { user, supabase })
      
      // Call the protected handler
      const response = await handler(request as AuthenticatedRequest)
      
      // Add security headers to response
      return addSecurityHeaders(response) as NextResponse<ApiResponse<T>>
      
    } catch (error) {
      console.error('🚫 Auth middleware error:', error)
      return createErrorResponse(error instanceof ApiError ? error : ApiError.unauthorized())
    }
  }
}

// Enhanced Zod Validation Middleware with better type inference
export function withValidation<TSchema, TResponse = any>(
  schema: z.ZodSchema<TSchema>
) {
  return function(
    handler: ValidatedApiHandler<TSchema, TResponse>
  ) {
    return async (request: AuthenticatedRequest): Promise<NextResponse<ApiResponse<TResponse>>> => {
      try {
        let rawData: any
        
        // Parse request data based on content type and method
        const contentType = request.headers.get('content-type')
        const method = request.method.toLowerCase()
        
        if (method === 'get' || method === 'delete') {
          // For GET/DELETE requests, use query parameters
          const url = new URL(request.url)
          rawData = Object.fromEntries(url.searchParams.entries())
          
          // Convert string values to appropriate types for common fields
          Object.keys(rawData).forEach(key => {
            const value = rawData[key]
            if (value === 'true' || value === 'false') {
              rawData[key] = value === 'true'
            } else if (!isNaN(Number(value)) && value !== '') {
              rawData[key] = Number(value)
            }
          })
        } else if (contentType?.includes('application/json')) {
          try {
            rawData = await request.json()
          } catch {
            throw ApiError.badRequest('Invalid JSON payload')
          }
        } else if (contentType?.includes('multipart/form-data')) {
          const formData = await request.formData()
          rawData = Object.fromEntries(formData.entries())
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          rawData = Object.fromEntries(formData.entries())
        } else {
          rawData = {}
        }
        
        // Validate the data with Zod
        const validation = schema.safeParse(rawData)
        
        if (!validation.success) {
          const errorDetails = validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
          
          throw ApiError.validation('Request validation failed', errorDetails)
        }
        
        // Call handler with validated data
        return await handler(request, validation.data)
        
      } catch (error) {
        console.error('🔍 Validation middleware error:', error)
        return createErrorResponse(
          error instanceof ApiError ? error : ApiError.badRequest('Request validation failed')
        )
      }
    }
  }
}

// Enhanced Logging Middleware with structured logging
interface RequestContext {
  requestId: string
  method: string
  url: string
  userAgent: string
  userId: string
  startTime: number
}

export function withLogging<T>(
  handler: ApiHandler<T>
) {
  return async (request: AuthenticatedRequest): Promise<NextResponse<ApiResponse<T>>> => {
    const requestId = crypto.randomUUID().slice(0, 8)
    const startTime = Date.now()
    const method = request.method
    const url = new URL(request.url)
    const pathname = url.pathname
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const userId = request.user?.id || 'anonymous'
    
    const context: RequestContext = {
      requestId,
      method,
      url: pathname,
      userAgent,
      userId,
      startTime
    }

    // Enhanced request logging
    console.log(`🚀 [${requestId}] ${method} ${pathname}`, {
      user: userId,
      userAgent: userAgent.slice(0, 100),
      timestamp: new Date().toISOString()
    })

    try {
      const response = await handler(request)
      const duration = Date.now() - startTime
      const status = response.status
      
      // Success logging with performance metrics
      const logLevel = status >= 400 ? '⚠️' : status >= 500 ? '❌' : '✅'
      console.log(`${logLevel} [${requestId}] ${method} ${pathname} - ${status} (${duration}ms)`, {
        user: userId,
        duration,
        status,
        timestamp: new Date().toISOString()
      })
      
      // Add request context to response headers for debugging
      if (process.env.NODE_ENV === 'development') {
        response.headers.set('X-Request-ID', requestId)
        response.headers.set('X-Response-Time', `${duration}ms`)
      }
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`💥 [${requestId}] ${method} ${pathname} - ERROR (${duration}ms)`, {
        user: userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
  }
}

// Enhanced middleware composition with better type safety
type MiddlewareFunction = (handler: any) => any

export function withMiddleware(
  ...middlewares: MiddlewareFunction[]
) {
  return function<T>(handler: T): T {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler) as T
  }
}

// Helper to get a unique identifier for rate limiting
const getRateLimitIdentifier = (req: NextRequest | AuthenticatedRequest): string => {
  const authReq = req as AuthenticatedRequest
  return authReq.user?.id || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
}

// Enhanced commonly used middleware combinations with better DX
export function withSecureApi<T = any>(
  limiter: RateLimiter = rateLimiters.api
) {
  return (handler: ApiHandler<T>) => {
    return withMiddleware(
      withAuth,
      withAdvancedRateLimit(limiter, getRateLimitIdentifier),
      withLogging
    )(handler)
  }
}

export function withSecureValidatedApi<TSchema, TResponse = any>(
  schema: z.ZodSchema<TSchema>,
  limiter: RateLimiter = rateLimiters.api
) {
  return (handler: ValidatedApiHandler<TSchema, TResponse>) => {
    return withMiddleware(
      withAuth,
      withAdvancedRateLimit(limiter, getRateLimitIdentifier),
      withValidation(schema),
      withLogging
    )(handler)
  }
}

// Convenience functions for common patterns
export function createApiEndpoint<T = any>(
  handler: ApiHandler<T>,
  options: {
    rateLimit?: RateLimiter
    skipAuth?: boolean
  } = {}
) {
  const { rateLimit = rateLimiters.api, skipAuth = false } = options
  
  if (skipAuth) {
    return withMiddleware(withLogging)(handler)
  }
  
  return withSecureApi<T>(rateLimit)(handler)
}

export function createValidatedApiEndpoint<TSchema, TResponse = any>(
  schema: z.ZodSchema<TSchema>,
  handler: ValidatedApiHandler<TSchema, TResponse>,
  options: {
    rateLimit?: RateLimiter
    skipAuth?: boolean
  } = {}
) {
  const { rateLimit = rateLimiters.api, skipAuth = false } = options
  
  if (skipAuth) {
    return withMiddleware(
      withValidation(schema),
      withLogging
    )(handler)
  }
  
  return withSecureValidatedApi<TSchema, TResponse>(schema, rateLimit)(handler)
}
