export async function translate(text: string, targetLang: string): Promise<string> {
  const apiUrl = process.env.LIBRETRANSLATE_API_URL || 'https://libretranslate.de/translate'
  const apiKey = process.env.LIBRETRANSLATE_API_KEY

  try {
    const body: any = {
      q: text,
      source: 'auto',
      target: targetLang,
      format: 'text',
    }

    if (apiKey) {
      body.api_key = apiKey
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`LibreTranslate API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.translatedText) {
      return data.translatedText
    }
    
    throw new Error('No translation returned from LibreTranslate API')
  } catch (error) {
    console.error('LibreTranslate error:', error)
    throw new Error(`LibreTranslate translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}