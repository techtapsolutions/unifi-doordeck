/**
 * API Authentication Middleware
 *
 * Implements API key authentication for REST API endpoints.
 * Provides defense-in-depth by requiring authentication for all API operations.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { CredentialManager, CredentialType } from './CredentialManager';

/**
 * API Authentication Error
 */
export class ApiAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

/**
 * Authentication methods
 */
export enum AuthMethod {
  API_KEY = 'api-key',
  BEARER_TOKEN = 'bearer',
}

/**
 * API Authentication Manager
 */
export class ApiAuthManager {
  private static instance: ApiAuthManager;
  private credentialManager: CredentialManager;
  private apiKey: string | null = null;

  private constructor() {
    this.credentialManager = CredentialManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiAuthManager {
    if (!ApiAuthManager.instance) {
      ApiAuthManager.instance = new ApiAuthManager();
    }
    return ApiAuthManager.instance;
  }

  /**
   * Initialize API authentication with a new or existing key
   */
  async initialize(): Promise<void> {
    // Try to load existing API key
    this.apiKey = await this.credentialManager.getCredential(CredentialType.API_AUTH_KEY);

    if (!this.apiKey) {
      // Generate new API key
      this.apiKey = CredentialManager.generateApiKey(32);
      await this.credentialManager.setCredential(CredentialType.API_AUTH_KEY, this.apiKey);
      logger.info('Generated new API authentication key');
    } else {
      logger.info('Loaded existing API authentication key');
    }
  }

  /**
   * Get the current API key (for display/configuration)
   */
  async getApiKey(): Promise<string | null> {
    if (!this.apiKey) {
      await this.initialize();
    }
    return this.apiKey;
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(): Promise<string> {
    this.apiKey = CredentialManager.generateApiKey(32);
    await this.credentialManager.setCredential(CredentialType.API_AUTH_KEY, this.apiKey);
    logger.warn('API authentication key regenerated - all clients must update their keys');
    return this.apiKey;
  }

  /**
   * Validate an API key
   */
  async validateApiKey(providedKey: string): Promise<boolean> {
    if (!this.apiKey) {
      await this.initialize();
    }

    if (!this.apiKey || !providedKey) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return this.timingSafeEqual(providedKey, this.apiKey);
  }

  /**
   * Timing-safe string comparison
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
      result |= bufA[i] ^ bufB[i];
    }

    return result === 0;
  }

  /**
   * Extract API key from request headers
   */
  private extractApiKey(req: Request): string | null {
    // Check Authorization header (Bearer token format)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2) {
        const scheme = parts[0];
        const credentials = parts[1];

        if (scheme.toLowerCase() === 'bearer') {
          return credentials;
        }
      }
    }

    // Check X-API-Key header
    const apiKeyHeader = req.headers['x-api-key'] as string;
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // Check query parameter (less secure, but supported for convenience)
    const apiKeyQuery = req.query.apiKey as string;
    if (apiKeyQuery) {
      logger.warn('API key provided via query parameter - use headers for better security');
      return apiKeyQuery;
    }

    return null;
  }

  /**
   * Express middleware for API authentication
   */
  public createAuthMiddleware(options: {
    required?: boolean;
    methods?: AuthMethod[];
  } = {}) {
    const { required = true, methods = [AuthMethod.BEARER_TOKEN, AuthMethod.API_KEY] } = options;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Extract API key from request
        const providedKey = this.extractApiKey(req);

        if (!providedKey) {
          if (required) {
            logger.warn(`API authentication failed: No credentials provided for ${req.method} ${req.path}`);
            res.status(401).json({
              error: 'Authentication required',
              message: 'API key must be provided in Authorization header or X-API-Key header',
            });
            return;
          } else {
            // Authentication not required, continue
            next();
            return;
          }
        }

        // Validate API key
        const isValid = await this.validateApiKey(providedKey);

        if (!isValid) {
          logger.warn(`API authentication failed: Invalid API key for ${req.method} ${req.path}`);
          res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid API key',
          });
          return;
        }

        // Authentication successful
        logger.debug(`API authentication successful for ${req.method} ${req.path}`);
        next();
      } catch (error) {
        logger.error('API authentication error:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'Authentication processing failed',
        });
      }
    };
  }

  /**
   * Create middleware for specific endpoints
   */
  public requireAuth() {
    return this.createAuthMiddleware({ required: true });
  }

  /**
   * Create middleware for optional authentication
   */
  public optionalAuth() {
    return this.createAuthMiddleware({ required: false });
  }
}

/**
 * Express middleware factory functions for convenient use
 */

/**
 * Require API authentication for an endpoint
 */
export function requireApiAuth() {
  return ApiAuthManager.getInstance().requireAuth();
}

/**
 * Optional API authentication for an endpoint
 */
export function optionalApiAuth() {
  return ApiAuthManager.getInstance().optionalAuth();
}

/**
 * Initialize API authentication system
 */
export async function initializeApiAuth(): Promise<void> {
  const authManager = ApiAuthManager.getInstance();
  await authManager.initialize();
}

/**
 * Get the current API key (for display to users)
 */
export async function getApiKey(): Promise<string | null> {
  const authManager = ApiAuthManager.getInstance();
  return authManager.getApiKey();
}

/**
 * Regenerate API key
 */
export async function regenerateApiKey(): Promise<string> {
  const authManager = ApiAuthManager.getInstance();
  return authManager.regenerateApiKey();
}
