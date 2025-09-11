import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
});

const env = envSchema.parse(process.env);

interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslationResult {
  translatedText: string;
  confidence: number;
  sourceLanguage: string;
  targetLanguage: string;
}

export class TranslationService {
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text from ${request.sourceLanguage} to ${request.targetLanguage}. Preserve the formatting and provide only the translation without explanations:\n\n${request.text}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translatedText) {
      throw new Error('No translation returned from Gemini API');
    }

    return {
      translatedText: translatedText.trim(),
      confidence: 0.9,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
    };
  }

  async translateBatch(texts: string[], sourceLanguage: string, targetLanguage: string): Promise<TranslationResult[]> {
    return Promise.all(
      texts.map(text => this.translate({ text, sourceLanguage, targetLanguage }))
    );
  }
}

export const translationService = new TranslationService();