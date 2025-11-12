/**
 * Log Sanitization Utility
 *
 * Redacts sensitive information from log messages to prevent credential leakage.
 * Implements defense-in-depth by sanitizing at multiple levels.
 */

/**
 * Patterns to detect and redact sensitive data
 */
const SENSITIVE_PATTERNS = [
  // API Keys (various formats)
  { pattern: /apiKey['"]?\s*[:=]\s*['"]?([A-Za-z0-9_\-]{20,})/gi, replacement: 'apiKey: [REDACTED]' },
  { pattern: /api[_-]?key['"]?\s*[:=]\s*['"]?([A-Za-z0-9_\-]{20,})/gi, replacement: 'api_key: [REDACTED]' },
  { pattern: /X-API-KEY:\s*([A-Za-z0-9_\-]{20,})/gi, replacement: 'X-API-KEY: [REDACTED]' },

  // Passwords
  { pattern: /password['"]?\s*[:=]\s*['"]?([^'",\s]{6,})/gi, replacement: 'password: [REDACTED]' },
  { pattern: /passwd['"]?\s*[:=]\s*['"]?([^'",\s]{6,})/gi, replacement: 'passwd: [REDACTED]' },
  { pattern: /pwd['"]?\s*[:=]\s*['"]?([^'",\s]{6,})/gi, replacement: 'pwd: [REDACTED]' },

  // Tokens (JWT, Bearer, OAuth)
  { pattern: /token['"]?\s*[:=]\s*['"]?([A-Za-z0-9_\-\.]{20,})/gi, replacement: 'token: [REDACTED]' },
  { pattern: /Bearer\s+([A-Za-z0-9_\-\.]{20,})/gi, replacement: 'Bearer [REDACTED]' },
  { pattern: /Authorization:\s*Bearer\s+([A-Za-z0-9_\-\.]{20,})/gi, replacement: 'Authorization: Bearer [REDACTED]' },

  // JWT tokens (eyJ prefix)
  { pattern: /eyJ[A-Za-z0-9_\-]*\.eyJ[A-Za-z0-9_\-]*\.[A-Za-z0-9_\-]*/g, replacement: '[REDACTED-JWT]' },

  // Email addresses (context-aware - only in credential contexts)
  { pattern: /email['"]?\s*[:=]\s*['"]?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, replacement: 'email: [REDACTED]' },

  // Secret keys
  { pattern: /secret['"]?\s*[:=]\s*['"]?([A-Za-z0-9_\-]{20,})/gi, replacement: 'secret: [REDACTED]' },
  { pattern: /secretKey['"]?\s*[:=]\s*['"]?([A-Za-z0-9_\-]{20,})/gi, replacement: 'secretKey: [REDACTED]' },

  // Private keys (PEM format)
  { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi, replacement: '[REDACTED-PRIVATE-KEY]' },

  // Credit card numbers (basic pattern)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[REDACTED-CC]' },

  // SSN (US Social Security Numbers)
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED-SSN]' },

  // Connection strings with embedded credentials
  { pattern: /(?:mongodb|mysql|postgresql|postgres):\/\/([^:]+):([^@]+)@/gi, replacement: '$1://[REDACTED]:[REDACTED]@' },
];

/**
 * Sensitive field names that should be redacted in JSON objects
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'secretKey',
  'apiKey',
  'api_key',
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'privateKey',
  'private_key',
  'credentialKey',
  'encryptionKey',
  'encryption_key',
];

/**
 * Sanitize a log message by redacting sensitive information
 */
export function sanitizeLogMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return message;
  }

  let sanitized = message;

  // Apply all sensitive patterns
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

/**
 * Sanitize an object by redacting sensitive fields
 * Returns a deep copy with sensitive fields redacted
 */
export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  // Handle objects
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if field name is sensitive
    const isSensitiveField = SENSITIVE_FIELDS.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitiveField) {
      // Redact the value but keep the type information
      if (typeof value === 'string') {
        sanitized[key] = value ? '[REDACTED]' : '';
      } else if (typeof value === 'number') {
        sanitized[key] = 0;
      } else if (typeof value === 'boolean') {
        sanitized[key] = false;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value === 'string') {
      // Sanitize string values for patterns
      sanitized[key] = sanitizeLogMessage(value);
    } else {
      // Keep other values as-is
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize function arguments for logging
 * Useful for logging function calls with potentially sensitive data
 */
export function sanitizeArgs(...args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeLogMessage(arg);
    } else if (typeof arg === 'object') {
      return sanitizeObject(arg);
    } else {
      return arg;
    }
  });
}

/**
 * Create a sanitized error message
 */
export function sanitizeError(error: Error | unknown): string {
  if (error instanceof Error) {
    const message = sanitizeLogMessage(error.message);
    const stack = error.stack ? sanitizeLogMessage(error.stack) : '';

    return stack || message;
  }

  return sanitizeLogMessage(String(error));
}

/**
 * Mask a string by showing only first and last N characters
 * Useful for partially masking identifiers that aren't fully sensitive
 */
export function maskString(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return '[MASKED]';
  }

  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const masked = '*'.repeat(Math.max(8, value.length - visibleChars * 2));

  return `${start}${masked}${end}`;
}

/**
 * Redact email addresses but keep domain for debugging
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '[INVALID-EMAIL]';
  }

  const [localPart, domain] = email.split('@');

  if (localPart.length <= 2) {
    return `[REDACTED]@${domain}`;
  }

  const maskedLocal = localPart[0] + '*'.repeat(Math.max(3, localPart.length - 2)) + localPart[localPart.length - 1];
  return `${maskedLocal}@${domain}`;
}

/**
 * Check if a string appears to contain sensitive data
 */
export function containsSensitiveData(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Check against all sensitive patterns
  for (const { pattern } of SENSITIVE_PATTERNS) {
    if (pattern.test(str)) {
      return true;
    }
  }

  return false;
}
