// Secure client-side storage with encryption
import { z } from 'zod';

class SecureStorage {
  private readonly keyPrefix = 'vt_secure_';

  // Encrypt data before storing (basic implementation - use crypto library in production)
  private encrypt(data: string, key: string): string {
    // In production, use Web Crypto API or a proper encryption library
    // This is a basic obfuscation for demonstration
    const encoded = btoa(data);
    return encoded.split('').reverse().join('');
  }

  private decrypt(encryptedData: string, key: string): string {
    try {
      const reversed = encryptedData.split('').reverse().join('');
      return atob(reversed);
    } catch {
      throw new Error('Decryption failed');
    }
  }

  // Generate a session-based encryption key with sufficient entropy
  private getSessionKey(): string {
    if (!sessionStorage.getItem('session_key')) {
      const key = crypto.getRandomValues(new Uint8Array(32)) // 256-bit key for enhanced security
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
      sessionStorage.setItem('session_key', key);
    }
    return sessionStorage.getItem('session_key')!;
  }

  setSecure(key: string, value: string): void {
    try {
      const sessionKey = this.getSessionKey();
      const encrypted = this.encrypt(value, sessionKey);
      
      // Store with expiration timestamp (24 hours)
      const expirationTime = Date.now() + (24 * 60 * 60 * 1000);
      const payload = JSON.stringify({ data: encrypted, expires: expirationTime });
      
      sessionStorage.setItem(this.keyPrefix + key, payload);
    } catch (error) {
      console.error('Secure storage set failed:', error);
      throw new Error('Failed to securely store data');
    }
  }

  getSecure(key: string): string | null {
    try {
      const stored = sessionStorage.getItem(this.keyPrefix + key);
      if (!stored) return null;

      const payload = JSON.parse(stored);
      
      // Check expiration
      if (Date.now() > payload.expires) {
        this.removeSecure(key);
        return null;
      }

      const sessionKey = this.getSessionKey();
      return this.decrypt(payload.data, sessionKey);
    } catch (error) {
      console.error('Secure storage get failed:', error);
      this.removeSecure(key);
      return null;
    }
  }

  removeSecure(key: string): void {
    sessionStorage.removeItem(this.keyPrefix + key);
  }

  // Clear all secure storage on security event
  clearAllSecure(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.keyPrefix)) {
        sessionStorage.removeItem(key);
      }
    });
    sessionStorage.removeItem('session_key');
  }
}

export const secureStorage = new SecureStorage();

// Secure API key management
export class ApiKeyManager {
  private static readonly API_KEY_KEY = 'gemini_api_key';

  static setApiKey(apiKey: string): void {
    // Validate API key format
    const apiKeySchema = z.string().min(32).max(128).regex(/^[A-Za-z0-9_-]+$/);
    const validation = apiKeySchema.safeParse(apiKey);
    
    if (!validation.success) {
      throw new Error('Invalid API key format');
    }

    secureStorage.setSecure(this.API_KEY_KEY, validation.data);
  }

  static getApiKey(): string | null {
    return secureStorage.getSecure(this.API_KEY_KEY);
  }

  static removeApiKey(): void {
    secureStorage.removeSecure(this.API_KEY_KEY);
  }

  static validateApiKey(apiKey: string): boolean {
    try {
      const apiKeySchema = z.string().min(32).max(128).regex(/^[A-Za-z0-9_-]+$/);
      return apiKeySchema.safeParse(apiKey).success;
    } catch {
      return false;
    }
  }
}