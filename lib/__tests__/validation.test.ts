import { describe, it, expect } from 'vitest';
import { 
  validateFileUpload,
  useFormValidation 
} from '../validation';
import { 
  validateLanguageCode, 
  validateUILanguage
} from '../schemas';

describe('Validation Functions', () => {
  describe('validateLanguageCode', () => {
    it('should accept valid language codes', () => {
      const result = validateLanguageCode('en');
      expect(result.success).toBe(true);
    });

    it('should accept auto language code', () => {
      const result = validateLanguageCode('auto');
      expect(result.success).toBe(true);
    });

    it('should reject invalid language codes', () => {
      const result = validateLanguageCode('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('validateUILanguage', () => {
    it('should accept supported UI languages', () => {
      ['en', 'es', 'fr', 'de'].forEach(lang => {
        const result = validateUILanguage(lang);
        expect(result.success).toBe(true);
      });
    });

    it('should reject unsupported UI languages', () => {
      const result = validateUILanguage('zh');
      expect(result.success).toBe(false);
    });
  });

  describe('validateFileUpload', () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      // Create a buffer of the specified size filled with zeros
      const buffer = new ArrayBuffer(size);
      const blob = new Blob([buffer], { type });
      return new File([blob], name, { type, lastModified: Date.now() });
    };

    it('should accept valid PDF files', async () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024);
      const result = await validateFileUpload(file);
      expect(result.isValid).toBe(true);
    });

    it('should accept valid image files', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const result = await validateFileUpload(file);
      expect(result.isValid).toBe(true);
    });

    it('should reject files that are too large', async () => {
      const file = createMockFile('large.pdf', 'application/pdf', 11 * 1024 * 1024); // 11MB
      const result = await validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject unsupported file types', async () => {
      const file = createMockFile('test.exe', 'application/x-executable', 1024);
      const result = await validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });
  });

  describe('useFormValidation', () => {
    const { validateLanguageSelection, validateApiKey, validateFile } = useFormValidation();

    it('should validate language selection correctly', () => {
      const valid = validateLanguageSelection('en', 'es');
      expect(valid.success).toBe(true);

      const invalid = validateLanguageSelection('en', 'en');
      expect(invalid.success).toBe(false);

      const autoValid = validateLanguageSelection('auto', 'en');
      expect(autoValid.success).toBe(true);
    });

    it('should validate API keys correctly', () => {
      const valid = validateApiKey('valid-api-key');
      expect(valid.success).toBe(true);

      const invalid = validateApiKey('');
      expect(invalid.success).toBe(false);
    });

    it('should validate file uploads correctly', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const valid = validateFile(file, 'documents');
      expect(valid.success).toBe(true);

      const invalidType = validateFile(file, 'images');
      expect(invalidType.success).toBe(false);

      const noFile = validateFile(null, 'documents');
      expect(noFile.success).toBe(false);
    });
  });
});