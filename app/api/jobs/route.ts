import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecureValidatedApi, createApiResponse, createErrorResponse, ApiError, type AuthenticatedRequest, type ApiResponse } from '@/lib/api-middleware'
import { jobRequestSchema } from '@/lib/schemas'

// Request validation schema for jobs query (GET)
const jobsQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
})

// Secure jobs handler for GET
async function handleGetJobs(
  request: AuthenticatedRequest, 
  validatedData: z.infer<typeof jobsQuerySchema>
): Promise<NextResponse<ApiResponse>> {
  try {
    console.log('📋 Secure Jobs GET API called for user:', request.user.id)
    
    // Build query with user filtering (RLS will also enforce this)
    let query = request.supabase
      .from('ai_jobs')
      .select(`
        *,
        assets(filename, file_type),
        ai_results(*)
      `)
      .eq('user_id', request.user.id) // Explicitly filter by user
    
    // Apply optional filters
    if (validatedData.jobId) {
      query = query.eq('id', validatedData.jobId)
    } else if (validatedData.assetId) {
      query = query.eq('asset_id', validatedData.assetId)
    }
    
    if (validatedData.status) {
      query = query.eq('status', validatedData.status)
    }
    
    // Apply pagination
    const limit = validatedData.limit || 20
    const offset = validatedData.offset || 0
    query = query.range(offset, offset + limit - 1)
    
    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false })
    
    const { data: jobs, error } = await query
    
    if (error) {
      console.error('❌ Jobs query error:', error)
      return createErrorResponse(
        ApiError.internal('Failed to fetch translation jobs', error.message)
      )
    }
    
    // Handle single job query
    if (validatedData.jobId && jobs.length === 0) {
      return createErrorResponse(ApiError.notFound('Job not found'))
    }
    
    console.log(`✅ Found ${jobs?.length || 0} jobs for user`)
    
    return createApiResponse({
      jobs: validatedData.jobId ? jobs[0] : jobs,
      pagination: validatedData.jobId ? undefined : {
        limit,
        offset,
        hasMore: jobs && jobs.length === limit,
      }
    }, 'Jobs retrieved successfully')
    
  } catch (error) {
    console.error('❌ Jobs GET API error:', error)
    return createErrorResponse(ApiError.internal())
  }
}

// Secure jobs handler for POST
async function handleCreateJob(
  request: AuthenticatedRequest, 
  validatedData: any
): Promise<NextResponse<ApiResponse>> {
  try {
    console.log('🆕 Secure Jobs POST API called for user:', request.user.id)
    
    const { assetId, targetLanguage, sourceLanguage, jobType } = validatedData

    // Verify the asset belongs to the user (RLS will also enforce this)
    const { data: asset, error: assetError } = await request.supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', request.user.id) // Explicit user check
      .single()

    if (assetError || !asset) {
      console.error('❌ Asset verification error:', assetError)
      return createErrorResponse(
        ApiError.notFound('Asset not found or access denied', assetError?.message)
      )
    }

    // Create the translation job
    const { data: job, error: jobError } = await request.supabase
      .from('ai_jobs')
      .insert({
        user_id: request.user.id, // Explicitly set user_id
        asset_id: assetId,
        job_type: jobType,
        status: 'pending',
        config: {
          targetLanguage,
          sourceLanguage,
          assetType: asset.file_type,
          filename: asset.filename
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('❌ Job creation error:', jobError)
      return createErrorResponse(
        ApiError.internal('Failed to create translation job', jobError.message)
      )
    }

    console.log('✅ Translation job created:', job.id)

    return createApiResponse(
      { job },
      'Translation job created successfully',
      201
    )

  } catch (error) {
    console.error('❌ Jobs POST API error:', error)
    return createErrorResponse(ApiError.internal())
  }
}

// Export the secured and validated endpoints
export const GET = withSecureValidatedApi(jobsQuerySchema)(handleGetJobs)
export const POST = withSecureValidatedApi(jobRequestSchema)(handleCreateJob)