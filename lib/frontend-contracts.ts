import { z } from 'zod';

// Step 3: Front-End Data Contracts
// ============================================================================
// Description: These Zod schemas define the data structures and component
// properties that the front-end application will use.

// --- Component Prop Schemas ---
export const apiKeyInputPropsSchema = z.object({
  apiKey: z.string(),
  setApiKey: z.function().args(z.string()).returns(z.void()),
  onSave: z.function().returns(z.void()),
});

export const translationProgressPropsSchema = z.object({
  isProcessing: z.boolean(),
  onComplete: z.function().returns(z.void()),
});

export const documentViewerPropsSchema = z.object({
  originalFile: z.instanceof(File).nullable(),
  translatedFile: z.instanceof(File).nullable(),
  targetLanguage: z.string(),
});

export const progressStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.any(),
  completed: z.boolean(),
});

export const toastSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  action: z.any().optional(),
  variant: z.enum(['default', 'destructive']).optional(),
});

// --- API Service & Data Schemas ---
export const languageOptionSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export const imageAnalysisRequestSchema = z.object({
  imageFile: z.instanceof(File),
  targetLanguage: z.string(),
  apiKey: z.string(),
});

// --- Inferred Types ---
export type ApiKeyInputProps = z.infer<typeof apiKeyInputPropsSchema>;
export type TranslationProgressProps = z.infer<typeof translationProgressPropsSchema>;
export type DocumentViewerProps = z.infer<typeof documentViewerPropsSchema>;
export type ProgressStep = z.infer<typeof progressStepSchema>;
export type Toast = z.infer<typeof toastSchema>;
export type LanguageOption = z.infer<typeof languageOptionSchema>;
export type ImageAnalysisRequest = z.infer<typeof imageAnalysisRequestSchema>;