// Principle of Least Privilege (PoLP) implementation
import { z } from 'zod';

export enum Permission {
  // File operations
  FILE_UPLOAD = 'file:upload',
  FILE_READ = 'file:read',
  FILE_DELETE = 'file:delete',
  
  // Translation operations  
  TRANSLATION_CREATE = 'translation:create',
  TRANSLATION_READ = 'translation:read',
  TRANSLATION_CANCEL = 'translation:cancel',
  
  // Job operations
  JOB_READ_OWN = 'job:read:own',
  JOB_CREATE = 'job:create',
  JOB_CANCEL_OWN = 'job:cancel:own',
  
  // Admin operations (future)
  ADMIN_VIEW_ALL_JOBS = 'admin:jobs:view_all',
  ADMIN_MANAGE_USERS = 'admin:users:manage'
}

export enum UserRole {
  ANONYMOUS = 'anonymous',
  AUTHENTICATED = 'authenticated', 
  PREMIUM = 'premium',
  ADMIN = 'admin'
}

// Role-based permission matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ANONYMOUS]: [
    Permission.FILE_UPLOAD,
    Permission.FILE_READ,
    Permission.TRANSLATION_CREATE,
    Permission.TRANSLATION_READ,
    Permission.JOB_READ_OWN,
    Permission.JOB_CREATE
  ],
  
  [UserRole.AUTHENTICATED]: [
    ...ROLE_PERMISSIONS[UserRole.ANONYMOUS],
    Permission.FILE_DELETE,
    Permission.JOB_CANCEL_OWN
  ],
  
  [UserRole.PREMIUM]: [
    ...ROLE_PERMISSIONS[UserRole.AUTHENTICATED],
    Permission.TRANSLATION_CANCEL
  ],
  
  [UserRole.ADMIN]: [
    ...Object.values(Permission)
  ]
};

export class PermissionManager {
  static getUserRole(user: any): UserRole {
    if (!user) return UserRole.ANONYMOUS;
    
    // Check user metadata for role
    const role = user.user_metadata?.role || user.app_metadata?.role;
    
    if (role === 'admin') return UserRole.ADMIN;
    if (role === 'premium') return UserRole.PREMIUM;
    if (user.id) return UserRole.AUTHENTICATED;
    
    return UserRole.ANONYMOUS;
  }

  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  static checkPermission(user: any, permission: Permission): boolean {
    const role = this.getUserRole(user);
    return this.hasPermission(role, permission);
  }

  static enforcePermission(user: any, permission: Permission): void {
    if (!this.checkPermission(user, permission)) {
      const role = this.getUserRole(user);
      throw new Error(`Access denied. Role '${role}' lacks permission '${permission}'`);
    }
  }

  // Resource-specific permission checks
  static canAccessResource(user: any, resourceOwnerId: string, permission: Permission): boolean {
    // Users can access their own resources
    if (user?.id === resourceOwnerId) {
      return this.checkPermission(user, permission);
    }

    // Admins can access all resources
    const role = this.getUserRole(user);
    if (role === UserRole.ADMIN) {
      return this.hasPermission(role, permission);
    }

    return false;
  }

  // Rate limiting based on user role
  static getRateLimitForRole(userRole: UserRole): { maxRequests: number; windowMs: number } {
    switch (userRole) {
      case UserRole.ANONYMOUS:
        return { maxRequests: 10, windowMs: 60000 }; // 10 requests per minute
      
      case UserRole.AUTHENTICATED:
        return { maxRequests: 50, windowMs: 60000 }; // 50 requests per minute
        
      case UserRole.PREMIUM:
        return { maxRequests: 200, windowMs: 60000 }; // 200 requests per minute
        
      case UserRole.ADMIN:
        return { maxRequests: 1000, windowMs: 60000 }; // 1000 requests per minute
        
      default:
        return { maxRequests: 5, windowMs: 60000 }; // Very restrictive default
    }
  }

  // File size limits based on user role
  static getFileSizeLimitForRole(userRole: UserRole): number {
    switch (userRole) {
      case UserRole.ANONYMOUS:
        return 5 * 1024 * 1024; // 5MB
        
      case UserRole.AUTHENTICATED:
        return 10 * 1024 * 1024; // 10MB
        
      case UserRole.PREMIUM:
        return 50 * 1024 * 1024; // 50MB
        
      case UserRole.ADMIN:
        return 100 * 1024 * 1024; // 100MB
        
      default:
        return 1 * 1024 * 1024; // 1MB default
    }
  }

  // Maximum concurrent jobs based on user role
  static getMaxConcurrentJobs(userRole: UserRole): number {
    switch (userRole) {
      case UserRole.ANONYMOUS:
        return 1;
        
      case UserRole.AUTHENTICATED:
        return 3;
        
      case UserRole.PREMIUM:
        return 10;
        
      case UserRole.ADMIN:
        return 50;
        
      default:
        return 1;
    }
  }
}

// Audit logging for security events
export class SecurityAuditLogger {
  static logPermissionCheck(userId: string, permission: Permission, granted: boolean, resource?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      permission,
      granted,
      resource,
      ip: 'unknown', // Should be passed from request
      userAgent: 'unknown' // Should be passed from request
    };

    // In production, send to audit log system
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Permission Check:', logEntry);
    }
  }

  static logResourceAccess(userId: string, resourceType: string, resourceId: string, action: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      resourceType,
      resourceId,
      action,
      ip: 'unknown', // Should be passed from request
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📁 Resource Access:', logEntry);
    }
  }
}