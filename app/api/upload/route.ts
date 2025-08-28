import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { uploadFileSchema, validateFileUpload } from '@/lib/validation'
import { withSecureValidatedApi } from '@/lib/api-middleware'

// Request validation schema for upload
const uploadRequestSchema = z.object({
  sourceLanguage: z.string().min(2).max(10),
  targetLanguage: z.string().min(2).max(10),
})

// Secure upload handler
async function handleUpload(request: any, validatedData: z.infer<typeof uploadRequestSchema>) {
  try {
    console.log('📄 Secure Upload API called for user:', request.user.id)
    
    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      )
    }
    
    console.log('📄 File received:', { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    })
    
    // Additional file validation
    const fileValidation = await validateFileUpload(file)
    if (!fileValidation.isValid) {
      console.error('❌ File validation error:', fileValidation.error)
      return NextResponse.json(
        { 
          error: fileValidation.error,
          code: 'FILE_VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }
    
    // Create a unique path for the file
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const storagePath = `${request.user.id}/${fileName}`
    
    // Upload file to Supabase Storage with user-specific path
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await request.supabase.storage
      .from('assets')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })
    
    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError)
      return NextResponse.json(
        { 
          error: 'Failed to upload file', 
          details: uploadError.message,
          code: 'UPLOAD_ERROR'
        },
        { status: 500 }
      )
    }
    
    console.log('✅ File uploaded to Supabase:', uploadData.path)
    
    // Save asset metadata to database (RLS will ensure user can only create assets for themselves)
    const { data: asset, error: dbError } = await request.supabase
      .from('assets')
      .insert({
        user_id: request.user.id, // Explicitly set user_id
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        metadata: {
          original_name: file.name,
          upload_timestamp: new Date().toISOString(),
          source_language: validatedData.sourceLanguage,
          target_language: validatedData.targetLanguage,
        }
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('❌ Asset creation error:', dbError)
      
      // Clean up uploaded file if asset creation fails
      await request.supabase.storage
        .from('assets')
        .remove([storagePath])
      
      return NextResponse.json(
        { 
          error: 'Failed to save asset metadata', 
          details: dbError.message,
          code: 'ASSET_ERROR'
        },
        { status: 500 }
      )
    }
    
    console.log('✅ Asset created:', asset)
    
    return NextResponse.json({
      success: true,
      asset,
      message: 'File uploaded successfully',
    })
    
  } catch (error) {
    console.error('❌ Upload API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Export the secured and validated endpoint
export const POST = withSecureValidatedApi(uploadRequestSchema)(handleUpload)
