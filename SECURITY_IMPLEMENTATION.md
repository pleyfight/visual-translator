# API Security Implementation

## Overview

This document describes the comprehensive security implementation for the Visual Translator API endpoints. The security system ensures that all API calls are authenticated, validated, rate-limited, and properly logged.

## Security Architecture

### 1. Authentication Middleware (`withAuth`)

**Purpose**: Verify Supabase JWT tokens and ensure only authenticated users can access API endpoints.

**Features**:
- JWT token extraction from Authorization header
- Token validation using Supabase Auth
- User context injection into request
- Development mode bypass for testing
- Comprehensive error handling

**Implementation**:
```typescript
export const withAuth = (handler) => async (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const supabase = createServerSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new ApiError(401, 'Invalid or expired token')
  }
  
  request.user = user
  request.supabase = supabase
  return handler(request)
}
```

### 2. Validation Middleware (`withValidation`)

**Purpose**: Validate all incoming data using Zod schemas before processing.

**Features**:
- Support for JSON, form-data, and URL-encoded requests
- Query parameter validation for GET requests
- Comprehensive error reporting
- Type-safe validated data injection

**Implementation**:
```typescript
export const withValidation = (schema) => (handler) => async (request) => {
  const data = await parseRequestData(request)
  const validation = schema.safeParse(data)
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.error.errors)
  }
  
  return handler(request, validation.data)
}
```

### 3. Rate Limiting Middleware (`withRateLimit`)

**Purpose**: Prevent abuse by limiting requests per user/IP within a time window.

**Features**:
- Per-user rate limiting (falls back to IP in development)
- Configurable limits and time windows
- Automatic counter reset
- Rate limit headers in responses

**Default Limits**:
- 100 requests per 15 minutes per user
- Configurable per endpoint

### 4. Security Headers Middleware

**Purpose**: Add OWASP-recommended security headers to all responses.

**Headers Applied**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CORS headers for proper domain restrictions

### 5. Logging Middleware (`withLogging`)

**Purpose**: Comprehensive request/response logging for monitoring and debugging.

**Logged Information**:
- Request method, URL, and user ID
- Request duration and response status
- Error details and stack traces
- Performance metrics

**Log Format**:
```
📝 POST /api/upload - User: user-123 - Start
✅ POST /api/upload - 200 - 450ms - User: user-123
```

## Endpoint Security Implementation

### Upload Endpoint (`/api/upload`)

**Security Measures**:
- JWT authentication required
- File validation (type, size, content)
- User-specific storage paths
- Asset ownership enforcement via RLS
- Comprehensive error handling

**Validation Schema**:
```typescript
const uploadRequestSchema = z.object({
  sourceLanguage: z.string().min(2).max(10),
  targetLanguage: z.string().min(2).max(10),
})
```

**Usage**:
```typescript
export const POST = withSecureValidatedApi(uploadRequestSchema)(handleUpload)
```

### Jobs Endpoint (`/api/jobs`)

**Security Measures**:
- JWT authentication for all operations
- Asset ownership verification
- User-scoped queries via RLS
- Input validation for all parameters
- Pagination limits to prevent data exposure

**Validation Schemas**:
```typescript
// GET requests
const jobsQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
})

// POST requests
const jobRequestSchema = z.object({
  assetId: z.string().uuid(),
  targetLanguage: z.string().min(2).max(10),
  sourceLanguage: z.string().min(2).max(10).optional(),
  jobType: z.enum(['translate']).optional(),
})
```

## Database Security (RLS)

### Row Level Security Policies

**Assets Table**:
```sql
-- Users can only access their own assets
CREATE POLICY "Users can access own assets" ON assets
  FOR ALL USING (auth.uid() = user_id);
```

**AI Jobs Table**:
```sql
-- Users can only access their own jobs
CREATE POLICY "Users can access own jobs" ON ai_jobs
  FOR ALL USING (auth.uid() = user_id);
```

**AI Results Table**:
```sql
-- Users can only access results for their own jobs
CREATE POLICY "Users can access own results" ON ai_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_jobs 
      WHERE ai_jobs.id = ai_results.job_id 
      AND ai_jobs.user_id = auth.uid()
    )
  );
```

## Error Handling

### Standardized Error Responses

All API errors follow a consistent format:

```typescript
{
  error: string,          // Human-readable error message
  code: string,          // Machine-readable error code
  details?: any          // Additional error details (validation errors, etc.)
}
```

### Error Codes

- `MISSING_TOKEN`: Authorization header missing
- `INVALID_TOKEN`: JWT token invalid or expired
- `VALIDATION_ERROR`: Request data validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `UPLOAD_ERROR`: File upload failed
- `ASSET_NOT_FOUND`: Asset not found or access denied
- `JOB_CREATION_ERROR`: Translation job creation failed
- `QUERY_ERROR`: Database query failed
- `INTERNAL_ERROR`: Unexpected server error

## Development vs Production

### Development Mode Features

- **Auth Bypass**: Endpoints can be accessed without JWT for testing
- **Mock User**: Automatic mock user injection for development
- **Verbose Logging**: Additional debug information
- **CORS**: Permissive CORS for localhost

### Production Security

- **Strict Auth**: All endpoints require valid JWT tokens
- **Domain Restrictions**: CORS limited to production domain
- **Rate Limiting**: Full rate limiting enforcement
- **Error Sanitization**: Reduced error details in responses

## Usage Examples

### Secure API Endpoint

```typescript
import { withSecureValidatedApi } from '@/lib/api-middleware'
import { z } from 'zod'

const requestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

async function handleRequest(request: AuthenticatedRequest, data: z.infer<typeof requestSchema>) {
  // request.user contains authenticated user info
  // request.supabase is configured with user's token
  // data is validated and type-safe
  
  const result = await request.supabase
    .from('table')
    .insert({ ...data, user_id: request.user.id })
  
  return NextResponse.json({ success: true, result })
}

export const POST = withSecureValidatedApi(requestSchema)(handleRequest)
```

### Manual Middleware Composition

```typescript
import { withMiddleware, withAuth, withValidation, withRateLimit, withLogging } from '@/lib/api-middleware'

const customSecuredApi = withMiddleware(
  withAuth,
  withRateLimit(50, 10 * 60 * 1000), // 50 requests per 10 minutes
  withValidation(mySchema),
  withLogging
)

export const POST = customSecuredApi(myHandler)
```

## Monitoring and Observability

### Request Logging

All requests are logged with:
- Timestamp and duration
- User identification
- Request details (method, URL, user agent)
- Response status and error details
- Performance metrics

### Security Events

Special attention is given to:
- Authentication failures
- Rate limit violations
- Validation errors
- Unauthorized access attempts
- File upload security violations

## Best Practices

1. **Always use middleware**: Never implement API endpoints without security middleware
2. **Validate everything**: Use Zod schemas for all incoming data
3. **Explicit user checks**: Always verify user ownership of resources
4. **Fail securely**: Provide minimal error information in production
5. **Log security events**: Monitor for suspicious activity
6. **Regular token rotation**: Implement proper token refresh mechanisms
7. **Database constraints**: Use RLS as the primary security mechanism
8. **Input sanitization**: Validate and sanitize all user inputs
9. **Rate limiting**: Implement appropriate limits for each endpoint
10. **Security headers**: Always include OWASP-recommended headers

## Testing Security

### Development Testing

```bash
# Test without authentication (development mode)
curl -X POST http://localhost:3000/api/upload

# Test with invalid token
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer invalid-token"

# Test rate limiting
for i in {1..102}; do
  curl -X GET http://localhost:3000/api/jobs
done
```

### Production Verification

1. Verify all endpoints require authentication
2. Test rate limiting enforcement
3. Validate error response format
4. Check security headers presence
5. Verify RLS policy enforcement
6. Test input validation edge cases

## Security Checklist

- [ ] All endpoints use authentication middleware
- [ ] All inputs are validated with Zod schemas
- [ ] Rate limiting is properly configured
- [ ] Security headers are applied
- [ ] Error responses don't leak sensitive information
- [ ] Database RLS policies are in place
- [ ] File uploads are properly validated
- [ ] User ownership is verified for all resources
- [ ] Logging captures security events
- [ ] Development/production modes are properly configured
