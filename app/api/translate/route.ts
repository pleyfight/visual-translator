import { NextRequest, NextResponse } from 'next/server'
import { translate } from '@/lib/translate'

interface TranslationRequest {
  text: string
  targetLang: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TranslationRequest
    const { text, targetLang } = body

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text and targetLang' },
        { status: 400 }
      )
    }

    const translatedText = await translate(text, targetLang)

    return NextResponse.json({
      translatedText,
      originalText: text,
      targetLanguage: targetLang
    })
  } catch (error) {
    console.error('Translation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}