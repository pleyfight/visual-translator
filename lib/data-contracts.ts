import { z } from 'zod';

// Step 2: Backend Data Contracts
// ============================================================================
// Description: This is the complete data contract for all backend services.
// It defines the shapes of API requests, responses, and the final object
// stored in the `ai_results` table's `result_data` column.

// --- Common Utility Schemas ---
export const boundingBoxSchema = z.object({
  x0: z.number(),
  y0: z.number(),
  x1: z.number(),
  y1: z.number(),
});

// --- Service-Specific Schemas ---
export const geminiRequestSchema = z.object({
  prompt: z.string(),
  imageData: z.string().optional(),
});

export const translationRequestSchema = z.object({
  text: z.string(),
  targetLanguage: z.string(),
});

export const ocrResultSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  bbox: boundingBoxSchema,
});

// --- Final Stored Data Structure (for `ai_results.result_data`) ---
export const textElementSchema = z.object({
  text: z.string(),
  bbox: boundingBoxSchema,
  dominantColor: z.string(),
  fontFamily: z.string(),
  confidence: z.number().min(0).max(1),
});

export const translatedElementSchema = textElementSchema.extend({
  translatedText: z.string(),
});

export const analysisResultSchema = z.object({
  originalElements: z.array(textElementSchema),
  translatedElements: z.array(translatedElementSchema),
  targetLanguage: z.string(),
  modelUsed: z.string().optional(),
});

// --- Inferred Types ---
export type BoundingBox = z.infer<typeof boundingBoxSchema>;
export type GeminiRequest = z.infer<typeof geminiRequestSchema>;
export type TranslationRequest = z.infer<typeof translationRequestSchema>;
export type OcrResult = z.infer<typeof ocrResultSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type TranslatedElement = z.infer<typeof translatedElementSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;