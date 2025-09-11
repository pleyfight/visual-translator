import { NextResponse } from 'next/server';

// OWASP compliant security headers
export class SecurityHeaders {
  static apply(response: NextResponse): NextResponse {
    // Content Security Policy - Prevent XSS, data injection
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Next.js requires unsafe-inline for dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // XSS Protection (legacy but still useful)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Prevent framing (clickjacking protection)
    response.headers.set('X-Frame-Options', 'DENY');

    // Referrer policy for privacy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy to restrict features
    response.headers.set('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()'
    );

    // HSTS - Force HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Prevent caching of sensitive responses
    if (response.url?.includes('/api/')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }

    return response;
  }

  // CSRF token generation and validation
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken && token.length === 64;
  }
}

// Security event logging
export class SecurityLogger {
  static logSecurityEvent(event: {
    type: 'authentication' | 'authorization' | 'input_validation' | 'rate_limit' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    additionalData?: Record<string, any>;
  }): void {
    // In production, send to security monitoring system
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
      environment: process.env.NODE_ENV
    };

    if (process.env.NODE_ENV === 'development') {
      console.warn('🔐 Security Event:', logEntry);
    }

    // TODO: In production, send to security monitoring service
    // Examples: DataDog, Splunk, AWS CloudWatch, etc.
  }

  static logFailedAuthentication(userId?: string, ip?: string): void {
    this.logSecurityEvent({
      type: 'authentication',
      severity: 'medium',
      message: 'Failed authentication attempt',
      userId,
      ip
    });
  }

  static logSuspiciousActivity(message: string, additionalData?: Record<string, any>): void {
    this.logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'high',
      message,
      additionalData
    });
  }
}