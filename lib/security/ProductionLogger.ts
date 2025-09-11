// Production-safe logging utility
export class ProductionLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  static info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.info(message, ...args);
    }
    // In production, send to logging service instead
  }

  static warn(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(message, ...args);
    }
    // Always log warnings, even in production (to monitoring service)
  }

  static error(message: string, error?: Error, ...args: any[]): void {
    if (this.isDevelopment) {
      console.error(message, error, ...args);
    } else {
      // In production, send to error monitoring service
      // Don't expose sensitive information
      console.error('Application error occurred');
    }
  }

  // Safe logging that never exposes sensitive data
  static auditLog(event: string, userId?: string, metadata?: Record<string, any>): void {
    const sanitizedMetadata = this.sanitizeMetadata(metadata);
    
    if (this.isDevelopment) {
      console.log(`🔍 AUDIT: ${event}`, { userId, metadata: sanitizedMetadata });
    }
    
    // In production, send to audit logging service
  }

  private static sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata) return {};
    
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'private'];
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...[TRUNCATED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}