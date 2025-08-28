import { z } from 'zod';
import { 
  languageSelectionSchema, 
  apiKeyFormSchema, 
  languageCodeSchema,
  validateLanguageCode,
  validateUILanguage,
  documentMimeTypesSchema,
  imageMimeTypesSchema
} from './schemas';

// File upload schema
export const uploadFileSchema = z.object({
  file: z.object({
    name: z.string().min(1),
    size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
    type: z.string().min(1),
  }),
  sourceLanguage: z.string().min(2).max(10),
  targetLanguage: z.string().min(2).max(10),
});

// File validation function
export const validateFileUpload = async (file: File): Promise<{
  isValid: boolean;
  error?: string;
}> => {
  try {
    // Check file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File too large. Maximum size is 10MB.'
      };
    }

    // Check file type using Zod schemas
    const isValidDocument = documentMimeTypesSchema.safeParse(file.type).success;
    const isValidImage = imageMimeTypesSchema.safeParse(file.type).success;
    
    if (!isValidDocument && !isValidImage) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload PDF, DOC, DOCX, TXT files or JPG, PNG, WEBP, GIF images.'
      };
    }

    // Additional checks can be added here (virus scanning, content validation, etc.)
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'File validation failed'
    };
  }
};

// Form validation helpers
export const useFormValidation = () => {
  const validateLanguageSelection = (sourceLanguage: string, targetLanguage: string) => {
    return languageSelectionSchema.safeParse({ sourceLanguage, targetLanguage });
  };

  const validateApiKey = (apiKey: string) => {
    return apiKeyFormSchema.safeParse({ apiKey });
  };

  const validateFile = (file: File | null, acceptedTypes: 'documents' | 'images') => {
    if (!file) {
      return { success: false, error: 'Please select a file' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 10MB.' };
    }

    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    const imageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    const allowedTypes = acceptedTypes === 'documents' ? documentTypes : imageTypes;
    
    if (!allowedTypes.includes(file.type)) {
      const fileTypeError = acceptedTypes === 'documents' 
        ? 'Please upload a PDF, DOC, DOCX, or TXT file'
        : 'Please upload a JPG, PNG, WEBP, or GIF image';
      return { success: false, error: fileTypeError };
    }

    return { success: true, data: file };
  };

  return {
    validateLanguageSelection,
    validateApiKey,
    validateFile,
    validateLanguageCode: (code: string) => validateLanguageCode(code),
    validateUILanguage: (lang: string) => validateUILanguage(lang),
  };
};

// Error message helpers
export const getValidationErrorMessage = (error: z.ZodError): string => {
  const firstError = error.errors[0];
  if (firstError) {
    return firstError.message;
  }
  return 'Validation failed';
};

export const getFieldErrorMessage = (error: z.ZodError, fieldName: string): string | undefined => {
  const fieldError = error.errors.find(err => err.path.includes(fieldName));
  return fieldError?.message;
};

// Type guards
export const isValidLanguageCode = (code: unknown): code is string => {
  return languageCodeSchema.safeParse(code).success;
};

export const isValidUILanguage = (lang: unknown): lang is 'en' | 'es' | 'fr' | 'de' => {
  return validateUILanguage(lang).success;
};

// API response helpers
export const handleApiResponse = async <T>(
  response: Response,
  schema?: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> => {
  try {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (schema) {
      const validation = schema.safeParse(data);
      if (!validation.success) {
        return {
          success: false,
          error: 'Invalid response format from server'
        };
      }
      return { success: true, data: validation.data };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Local storage helpers with validation
export const getValidatedFromStorage = <T>(
  key: string, 
  schema: z.ZodSchema<T>, 
  defaultValue: T
): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    const validation = schema.safeParse(parsed);
    
    return validation.success ? validation.data : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setValidatedToStorage = <T>(
  key: string, 
  value: T, 
  schema: z.ZodSchema<T>
): boolean => {
  try {
    const validation = schema.safeParse(value);
    if (!validation.success) {
      console.warn(`Failed to validate data for storage key ${key}:`, validation.error);
      return false;
    }
    
    localStorage.setItem(key, JSON.stringify(validation.data));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage key ${key}:`, error);
    return false;
  }
};
