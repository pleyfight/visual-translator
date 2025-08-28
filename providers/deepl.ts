export async function translate(text: string, targetLang: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY
  const apiUrl = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate'

  if (!apiKey) {
    throw new Error('DeepL API key not configured. Please set DEEPL_API_KEY in your environment.')
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang.toUpperCase(),
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.translations && data.translations.length > 0) {
      return data.translations[0].text
    }
    
    throw new Error('No translation returned from DeepL API')
  } catch (error) {
    console.error('DeepL translation error:', error)
    throw new Error(`DeepL translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}