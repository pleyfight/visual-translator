import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { SecurityHeaders, SecurityLogger } from './SecurityHeaders';
import { InputSanitizer, RateLimiter } from './InputSanitizer';
import { PermissionManager, Permission, UserRole } from './PermissionManager';

// Enhanced API wrapper with comprehensive security
export interface SecureApiOptions {
  requiredPermission?: Permission;
  rateLimitKey?: string;
  maxRequestsPerMinute?: number;
  requireCSRF?: boolean;
  sanitizeInput?: boolean;
  logAccess?: boolean;
}

export interface SecureApiRequest extends NextRequest {
  user: any;
  supabase: any;
  userRole: UserRole;
  clientIp: string;
  userAgent: string;
}

export function withSecureApi<TSchema = any>(
  schema?: z.ZodSchema<TSchema>,
  options: SecureApiOptions = {}
) {
  return function(
    handler: (req: SecureApiRequest, validatedData?: TSchema) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest): Promise<NextResponse> {
      const startTime = Date.now();
      let response: NextResponse;

      try {
        // Extract client information
        const clientIp = getClientIp(request);
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        // Step 1: Rate Limiting
        const rateLimitKey = options.rateLimitKey || clientIp;
        const maxRequests = options.maxRequestsPerMinute || 60;
        
        if (!RateLimiter.checkRateLimit(rateLimitKey, maxRequests, 60000)) {
          SecurityLogger.logSecurityEvent({
            type: 'rate_limit',
            severity: 'medium',
            message: 'Rate limit exceeded',
            ip: clientIp,
            userAgent
          });
          
          return NextResponse.json(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
            { status: 429 }
          );
        }

        // Step 2: Authentication
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const authHeader = request.headers.get('authorization');
        let user = null;

        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
          
          if (!error && authUser) {
            user = authUser;
          }
        }

        // Step 3: Permission Check
        const userRole = PermissionManager.getUserRole(user);
        
        if (options.requiredPermission) {
          if (!PermissionManager.hasPermission(userRole, options.requiredPermission)) {
            SecurityLogger.logSecurityEvent({
              type: 'authorization',
              severity: 'high',
              message: `Access denied for permission: ${options.requiredPermission}`,
              userId: user?.id,
              ip: clientIp,
              userAgent
            });

            return NextResponse.json(
              { error: 'Access denied', code: 'INSUFFICIENT_PERMISSIONS' },
              { status: 403 }
            );
          }
        }

        // Step 4: CSRF Protection for state-changing operations
        if (options.requireCSRF && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
          const csrfToken = request.headers.get('x-csrf-token');
          const sessionToken = request.cookies.get('csrf-token')?.value;

          if (!csrfToken || !sessionToken || !SecurityHeaders.validateCSRFToken(csrfToken, sessionToken)) {
            SecurityLogger.logSecurityEvent({
              type: 'suspicious_activity',
              severity: 'high',
              message: 'Invalid or missing CSRF token',
              userId: user?.id,
              ip: clientIp,
              userAgent
            });

            return NextResponse.json(
              { error: 'Invalid CSRF token', code: 'CSRF_INVALID' },
              { status: 403 }
            );
          }
        }

        // Step 5: Input Validation and Sanitization
        let validatedData: TSchema | undefined;

        if (schema) {
          let requestData: any;

          if (request.method === 'GET') {
            const url = new URL(request.url);
            requestData = Object.fromEntries(url.searchParams.entries());
          } else {
            try {
              const contentType = request.headers.get('content-type') || '';
              
              if (contentType.includes('application/json')) {
                requestData = await request.json();
              } else if (contentType.includes('multipart/form-data')) {
                const formData = await request.formData();
                requestData = Object.fromEntries(formData.entries());
              } else {
                requestData = {};
              }
            } catch (error) {
              SecurityLogger.logSecurityEvent({
                type: 'input_validation',
                severity: 'medium',
                message: 'Invalid request body format',
                userId: user?.id,
                ip: clientIp
              });

              return NextResponse.json(
                { error: 'Invalid request format', code: 'INVALID_FORMAT' },
                { status: 400 }
              );
            }
          }

          // Sanitize input if requested
          if (options.sanitizeInput) {
            requestData = InputSanitizer.validateApiParams(requestData);
          }

          // Validate against schema
          const validation = schema.safeParse(requestData);
          
          if (!validation.success) {
            SecurityLogger.logSecurityEvent({
              type: 'input_validation',
              severity: 'low',
              message: 'Input validation failed',
              userId: user?.id,
              ip: clientIp,
              additionalData: { errors: validation.error.errors }
            });

            return NextResponse.json(
              { 
                error: 'Validation failed', 
                code: 'VALIDATION_ERROR',
                details: validation.error.errors
              },
              { status: 400 }
            );
          }

          validatedData = validation.data;
        }

        // Step 6: Create secure request object
        const secureRequest = Object.assign(request, {
          user,
          supabase,
          userRole,
          clientIp,
          userAgent
        }) as SecureApiRequest;

        // Step 7: Execute handler
        response = await handler(secureRequest, validatedData);

        // Step 8: Apply security headers
        response = SecurityHeaders.apply(response);

        // Step 9: Access logging
        if (options.logAccess) {
          const duration = Date.now() - startTime;
          
          SecurityLogger.logSecurityEvent({
            type: 'authentication',
            severity: 'low',
            message: `API access: ${request.method} ${new URL(request.url).pathname}`,
            userId: user?.id,
            ip: clientIp,
            userAgent,
            additionalData: {
              statusCode: response.status,
              duration,
              userRole
            }
          });
        }

        return response;

      } catch (error) {
        const duration = Date.now() - startTime;

        SecurityLogger.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          message: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ip: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          additionalData: {
            duration,
            stack: error instanceof Error ? error.stack : undefined
          }
        });

        // Don't expose internal errors in production
        const errorMessage = process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error';

        response = NextResponse.json(
          { error: errorMessage, code: 'INTERNAL_ERROR' },
          { status: 500 }
        );

        return SecurityHeaders.apply(response);
      }
    };
  };
}

// Utility function to extract client IP
function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to connection IP
  return 'unknown';
}

// Predefined secure API configurations
export const SecureApiPresets = {
  // For anonymous file upload
  fileUpload: {
    requiredPermission: Permission.FILE_UPLOAD,
    rateLimitKey: 'file-upload',
    maxRequestsPerMinute: 10,
    requireCSRF: true,
    sanitizeInput: true,
    logAccess: true
  } as SecureApiOptions,

  // For job creation
  jobCreate: {
    requiredPermission: Permission.JOB_CREATE,
    rateLimitKey: 'job-create',
    maxRequestsPerMinute: 20,
    requireCSRF: true,
    sanitizeInput: true,
    logAccess: true
  } as SecureApiOptions,

  // For reading own data
  dataRead: {
    requiredPermission: Permission.JOB_READ_OWN,
    maxRequestsPerMinute: 100,
    sanitizeInput: true,
    logAccess: false
  } as SecureApiOptions
};