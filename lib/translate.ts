import { translate as deeplTranslate } from '@/providers/deepl'
import { translate as googleTranslate } from '@/providers/google'
import { translate as libreTranslate } from '@/providers/libretranslate'
import { translate as noopTranslate } from '@/providers/noop'

export type TranslationProvider = 'deepl' | 'google' | 'libretranslate' | 'noop'

export async function translate(text: string, targetLang: string): Promise<string> {
  const provider = (process.env.TRANSLATION_PROVIDER || 'noop') as TranslationProvider

  switch (provider) {
    case 'deepl':
      return deeplTranslate(text, targetLang)
    case 'google':
      return googleTranslate(text, targetLang)
    case 'libretranslate':
      return libreTranslate(text, targetLang)
    case 'noop':
    default:
      return noopTranslate(text, targetLang)
  }
}