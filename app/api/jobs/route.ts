import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecureValidatedApi } from '@/lib/api-middleware'
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
async function handleGetJobs(request: any, validatedData: z.infer<typeof jobsQuerySchema>) {
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
      return NextResponse.json(
        { 
          error: 'Failed to fetch translation jobs', 
          details: error.message,
          code: 'QUERY_ERROR'
        },
        { status: 500 }
      )
    }
    
    // Handle single job query
    if (validatedData.jobId && jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Found ${jobs?.length || 0} jobs for user`)
    
    return NextResponse.json({
      success: true,
      jobs: validatedData.jobId ? jobs[0] : jobs,
      pagination: validatedData.jobId ? undefined : {
        limit,
        offset,
        hasMore: jobs && jobs.length === limit,
      }
    })
    
  } catch (error) {
    console.error('❌ Jobs GET API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Secure jobs handler for POST
async function handleCreateJob(request: any, validatedData: z.infer<typeof jobRequestSchema>) {
  try {
    console.log('🆕 Secure Jobs POST API called for user:', request.user.id)
    
    const { assetId, targetLanguage, sourceLanguage = 'auto', jobType = 'translate' } = validatedData

    // Verify the asset belongs to the user (RLS will also enforce this)
    const { data: asset, error: assetError } = await request.supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', request.user.id) // Explicit user check
      .single()

    if (assetError || !asset) {
      console.error('❌ Asset verification error:', assetError)
      return NextResponse.json(
        { 
          error: 'Asset not found or access denied', 
          code: 'ASSET_NOT_FOUND'
        },
        { status: 404 }
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
          sourceLanguage: sourceLanguage || 'auto',
          assetType: asset.file_type,
          filename: asset.filename
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('❌ Job creation error:', jobError)
      return NextResponse.json(
        { 
          error: 'Failed to create translation job',
          details: jobError.message,
          code: 'JOB_CREATION_ERROR'
        },
        { status: 500 }
      )
    }

    console.log('✅ Translation job created:', job.id)

    return NextResponse.json({
      success: true,
      job,
      message: 'Translation job created successfully'
    })

  } catch (error) {
    console.error('❌ Jobs POST API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Export the secured and validated endpoints
export const GET = withSecureValidatedApi(jobsQuerySchema)(handleGetJobs)
export const POST = withSecureValidatedApi(jobRequestSchema)(handleCreateJob)
