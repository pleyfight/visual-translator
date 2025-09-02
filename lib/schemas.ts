import { z } from 'zod';

// Translation schema covering all possible translation keys
export const translationSchema = z.object({
  // Navigation & UI
  visualTranslator: z.string(),
  addApiKey: z.string(),
  documentTranslation: z.string(),
  preserveFormatting: z.string(),
  documentsTab: z.string(),
  imagesTab: z.string(),
  
  // File Upload
  uploadDocument: z.string(),
  uploadImage: z.string(),
  dragAndDrop: z.string(),
  supportsFormats: z.string(),
  removeFile: z.string(),
  
  // Language & Translation
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  translateDocument: z.string(),
  translateImage: z.string(),
  translating: z.string(),
  processing: z.string(),
  
  // Progress Steps
  processingFile: z.string(),
  analyzingContent: z.string(),
  translatingText: z.string(),
  finalizing: z.string(),
  translationInProgress: z.string(),
  pleaseWait: z.string(),
  
  // Document Viewer
  documentViewer: z.string(),
  originalDocument: z.string(),
  translatedDocument: z.string(),
  preview: z.string(),
  download: z.string(),
  translatedTo: z.string(),
  
  // API Key Management
  apiConfiguration: z.string(),
  geminiApiKey: z.string(),
  enterApiKey: z.string(),
  apiKeyStoredLocally: z.string(),
  save: z.string(),
  cancel: z.string(),
  editApiKey: z.string(),
  getApiKeyFromGoogle: z.string(),
  freeTierUsage: z.string(),
  requiredForTranslation: z.string(),
  pleaseAddApiKey: z.string(),
  selectSourceLanguage: z.string(),
  selectTargetLanguage: z.string(),
  
  // Authentication
  signInToStart: z.string(),
  signInAnonymously: z.string(),
  
  // Language codes
  auto: z.string(),
});

// Translation context schema
export const translationContextSchema = z.object({
  language: z.string(),
  setLanguage: z.function().args(z.string()).returns(z.void()),
  t: translationSchema,
});

// Infer TypeScript types from Zod schemas
export type TranslationKeys = z.infer<typeof translationSchema>;
export type TranslationContextType = z.infer<typeof translationContextSchema>;

// Language code validation schema
export const languageCodeSchema = z.enum([
  'auto', 'zh', 'zh-tw', 'en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'pt', 'ru',
  'ar', 'hi', 'th', 'vi', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'sk',
  'hu', 'ro', 'bg', 'hr', 'sr', 'sl', 'et', 'lv', 'lt', 'el', 'tr', 'he',
  'fa', 'ur', 'bn', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'mr', 'ne', 'si',
  'my', 'km', 'lo', 'ka', 'am', 'sw', 'zu', 'af', 'sq', 'az', 'be', 'bs',
  'ca', 'cy', 'eu', 'gl', 'is', 'ga', 'mk', 'mt', 'mn', 'uk', 'uz', 'kk',
  'ky', 'tg', 'tk', 'hy', 'id', 'ms', 'tl', 'haw', 'mg', 'sm', 'to', 'fj',
  'mi', 'ny', 'sn', 'yo', 'ig', 'ha', 'so', 'rw', 'xh', 'st', 'tn', 'ts',
  've', 'ss', 'nr'
]);

// UI language validation (supported UI languages)
export const uiLanguageSchema = z.enum(['en', 'es', 'fr', 'de']);

// File upload validation schemas
export const acceptedFileTypesSchema = z.enum(['documents', 'images']);

export const documentMimeTypesSchema = z.enum([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);

export const imageMimeTypesSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

// API request/response schemas
export const uploadRequestSchema = z.object({
  file: z.instanceof(File),
});

export const jobRequestSchema = z.object({
  assetId: z.string().uuid(),
  targetLanguage: languageCodeSchema,
  sourceLanguage: languageCodeSchema.default('auto'),
  jobType: z.enum(['translate', 'ocr', 'analyze']).default('translate'),
});

export const jobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export const jobResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  asset_id: z.string().uuid(),
  job_type: z.enum(['translate', 'ocr', 'analyze']),
  status: jobStatusSchema,
  config: z.record(z.any()),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  error_message: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const assetResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  filename: z.string(),
  file_type: z.string(),
  file_size: z.number().positive(),
  storage_path: z.string(),
  upload_date: z.string().datetime(),
  metadata: z.record(z.any()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Form validation schemas
export const apiKeyFormSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export const languageSelectionSchema = z.object({
  sourceLanguage: languageCodeSchema,
  targetLanguage: languageCodeSchema,
}).refine(
  (data) => data.sourceLanguage !== data.targetLanguage || data.sourceLanguage === 'auto',
  {
    message: "Source and target languages cannot be the same",
    path: ["targetLanguage"],
  }
);

// Environment variables validation
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Helper functions for validation
export const validateTranslations = (translations: unknown) => {
  return translationSchema.safeParse(translations);
};

export const validateLanguageCode = (code: unknown) => {
  return languageCodeSchema.safeParse(code);
};

export const validateUILanguage = (lang: unknown) => {
  return uiLanguageSchema.safeParse(lang);
};

export const validateJobRequest = (data: unknown) => {
  return jobRequestSchema.safeParse(data);
};

export const validateEnvironment = (env: unknown) => {
  return envSchema.safeParse(env);
};

// Additional schemas needed by worker
export const jobConfigSchema = z.object({
  sourceLanguage: languageCodeSchema,
  targetLanguage: languageCodeSchema,
  jobType: z.enum(['translate', 'ocr', 'analyze']).default('translate'),
});

// Analysis result schema for AI processing results
export const analysisResultSchema = z.object({
  originalText: z.string(),
  translatedText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  confidence: z.number().min(0).max(1),
  detectedLanguage: z.string().optional(),
  textBlocks: z.array(z.object({
    id: z.string(),
    originalText: z.string(),
    translatedText: z.string(),
    confidence: z.number().min(0).max(1),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  })),
  metadata: z.object({
    ocrEngine: z.string(),
    translationEngine: z.string(),
    processingTime: z.number(),
    pages: z.number(),
    totalBlocks: z.number(),
    documentType: z.string(),
    filename: z.string(),
  }),
});

export type JobConfig = z.infer<typeof jobConfigSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
