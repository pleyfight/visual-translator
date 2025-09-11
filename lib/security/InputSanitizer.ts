import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Comprehensive input validation and sanitization
export class InputSanitizer {
  
  // Sanitize text content to prevent XSS
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove null bytes and control characters
    const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Use DOMPurify for XSS prevention
    return DOMPurify.sanitize(cleaned, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  // Validate and sanitize language codes
  static validateLanguageCode(code: string): string {
    const languageSchema = z.string()
      .min(2)
      .max(10)
      .regex(/^[a-z]{2,3}(-[A-Z]{2})?$|^auto$/);
    
    const validation = languageSchema.safeParse(code);
    if (!validation.success) {
      throw new Error('Invalid language code format');
    }

    return validation.data;
  }

  // Validate file names and prevent directory traversal
  static validateFileName(fileName: string): string {
    if (typeof fileName !== 'string') {
      throw new Error('File name must be a string');
    }

    // Remove dangerous characters and path traversal attempts
    const sanitized = fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/\.\./g, '')
      .replace(/^\.+/, '')
      .trim();

    if (sanitized.length === 0) {
      throw new Error('Invalid file name');
    }

    if (sanitized.length > 255) {
      throw new Error('File name too long');
    }

    return sanitized;
  }

  // Validate MIME types against allowlist
  static validateMimeType(mimeType: string, allowedTypes: string[]): string {
    const mimeSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/);
    
    const validation = mimeSchema.safeParse(mimeType);
    if (!validation.success) {
      throw new Error('Invalid MIME type format');
    }

    if (!allowedTypes.includes(validation.data)) {
      throw new Error(`MIME type ${validation.data} not allowed`);
    }

    return validation.data;
  }

  // Sanitize translation text to prevent prompt injection
  static sanitizeTranslationText(text: string): string {
    if (typeof text !== 'string') {
      throw new Error('Translation text must be a string');
    }

    // Remove potential prompt injection patterns
    const dangerous = [
      /ignore\s+previous\s+instructions?/gi,
      /system\s*:/gi,
      /assistant\s*:/gi,
      /human\s*:/gi,
      /<\s*script\s*>/gi,
      /javascript\s*:/gi,
      /data\s*:/gi,
      /vbscript\s*:/gi
    ];

    let sanitized = text;
    dangerous.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    });

    // Limit text length to prevent DoS
    if (sanitized.length > 10000) {
      throw new Error('Text too long for translation');
    }

    return this.sanitizeText(sanitized);
  }

  // Validate UUID format
  static validateUUID(uuid: string): string {
    const uuidSchema = z.string().uuid();
    const validation = uuidSchema.safeParse(uuid);
    
    if (!validation.success) {
      throw new Error('Invalid UUID format');
    }

    return validation.data;
  }

  // Validate API endpoint parameters
  static validateApiParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      // Sanitize parameter names
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanKey.length === 0) continue;

      // Sanitize values based on type
      if (typeof value === 'string') {
        sanitized[cleanKey] = this.sanitizeText(value);
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        sanitized[cleanKey] = value;
      } else if (typeof value === 'boolean') {
        sanitized[cleanKey] = value;
      }
      // Skip other types for security
    }

    return sanitized;
  }
}

// Rate limiting to prevent abuse
export class RateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(identifier: string, maxAttempts = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const current = this.attempts.get(identifier);

    if (!current || now > current.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= maxAttempts) {
      return false;
    }

    current.count++;
    return true;
  }

  static getRemainingAttempts(identifier: string, maxAttempts = 10): number {
    const current = this.attempts.get(identifier);
    if (!current || Date.now() > current.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - current.count);
  }
}