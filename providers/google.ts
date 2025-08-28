export async function translate(text: string, targetLang: string): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY

  if (!apiKey) {
    throw new Error('Google Translate API key not configured. Please set GOOGLE_TRANSLATE_API_KEY in your environment.')
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: 'text',
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.data && data.data.translations && data.data.translations.length > 0) {
      return data.data.translations[0].translatedText
    }
    
    throw new Error('No translation returned from Google Translate API')
  } catch (error) {
    console.error('Google Translate error:', error)
    throw new Error(`Google translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}