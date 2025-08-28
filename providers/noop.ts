export async function translate(text: string, targetLang: string): Promise<string> {
  // No-op provider: returns the original text with a prefix to indicate no translation was performed
  // This is useful for development and testing when no translation provider is configured
  
  const provider = process.env.TRANSLATION_PROVIDER || 'noop'
  
  if (provider === 'noop') {
    return `[No translation configured - Original text]: ${text}`
  }
  
  // If we're here, it means a provider was set but something went wrong in the dispatcher
  throw new Error(
    `Translation provider "${provider}" is configured but not working. ` +
    'Please check your configuration or set TRANSLATION_PROVIDER=noop for testing.'
  )
}