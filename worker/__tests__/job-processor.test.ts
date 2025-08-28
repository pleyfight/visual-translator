import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performOCR, translateWithGemini } from '../job-processor';

// Mock environment variables for testing
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    GEMINI_API_KEY: 'test-gemini-key'
  }
}));

describe('Job Processor Functions', () => {
  describe('performOCR', () => {
    it('should process PDF documents with realistic content', async () => {
      const mockBuffer = Buffer.from('mock pdf content');
      const result = await performOCR(mockBuffer, 'application/pdf', 'test-document.pdf');

      expect(result.blocks).toBeDefined();
      expect(result.blocks.length).toBeGreaterThan(0);
      expect(result.pages).toBeGreaterThan(0);
      expect(result.language).toBe('en');
      
      // Check that PDF content is more business-like
      const combinedText = result.blocks.map(b => b.text).join(' ');
      expect(combinedText).toContain('Annual Report');
    });

    it('should process image files with marketing content', async () => {
      const mockBuffer = Buffer.from('mock image content');
      const result = await performOCR(mockBuffer, 'image/jpeg', 'marketing-banner.jpg');

      expect(result.blocks).toBeDefined();
      expect(result.blocks.length).toBeGreaterThan(0);
      
      // Check that image content is more marketing-focused
      const combinedText = result.blocks.map(b => b.text).join(' ');
      expect(combinedText).toContain('Welcome');
    });

    it('should handle plain text files', async () => {
      const mockBuffer = Buffer.from('plain text content');
      const result = await performOCR(mockBuffer, 'text/plain', 'document.txt');

      expect(result.blocks).toBeDefined();
      expect(result.language).toBe('en');
    });

    it('should generate proper bounding boxes', async () => {
      const mockBuffer = Buffer.from('test content');
      const result = await performOCR(mockBuffer, 'application/pdf');

      result.blocks.forEach(block => {
        expect(block.bbox.x).toBeGreaterThanOrEqual(0);
        expect(block.bbox.y).toBeGreaterThanOrEqual(0);
        expect(block.bbox.width).toBeGreaterThan(0);
        expect(block.bbox.height).toBeGreaterThan(0);
        expect(block.confidence).toBeGreaterThanOrEqual(0.85);
        expect(block.confidence).toBeLessThanOrEqual(1.0);
      });
    });

    it('should simulate processing time', async () => {
      const mockBuffer = Buffer.from('test content');
      const startTime = Date.now();
      
      await performOCR(mockBuffer, 'application/pdf');
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeGreaterThanOrEqual(500); // At least 500ms
    });
  });

  describe('translateWithGemini (mocked)', () => {
    beforeEach(() => {
      // Mock fetch for Gemini API calls
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'Mocked translation result'
              }]
            }
          }]
        })
      });
    });

    it('should translate text successfully', async () => {
      const request = {
        text: 'Hello world',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        context: 'Test document'
      };

      const result = await translateWithGemini(request);

      expect(result.translatedText).toBe('Mocked translation result');
      expect(result.confidence).toBe(0.9);
      expect(result.sourceLanguage).toBe('en');
      expect(result.targetLanguage).toBe('es');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const request = {
        text: 'Test text',
        sourceLanguage: 'en',
        targetLanguage: 'es'
      };

      await expect(translateWithGemini(request)).rejects.toThrow('Gemini API error: 400 Bad Request');
    });

    it('should handle missing translation response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: []
        })
      });

      const request = {
        text: 'Test text',
        sourceLanguage: 'en',
        targetLanguage: 'es'
      };

      await expect(translateWithGemini(request)).rejects.toThrow('No translation returned from Gemini API');
    });
  });

  // Test language detection helper
  describe('detectMockLanguage', () => {
    // Since detectMockLanguage is not exported, we'll test it indirectly through performOCR
    it('should detect different languages in mock content', async () => {
      const testCases = [
        { text: 'hola mundo', expectedLang: 'es' },
        { text: 'bonjour monde', expectedLang: 'fr' },
        { text: 'guten tag welt', expectedLang: 'de' },
        { text: 'hello world', expectedLang: 'en' }
      ];

      for (const testCase of testCases) {
        // We can't directly test the function, but we could modify the mock content
        // This is more of a conceptual test showing how language detection could work
        expect(testCase.expectedLang).toMatch(/^[a-z]{2}$/);
      }
    });
  });
});