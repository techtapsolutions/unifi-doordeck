import { logger } from './logger';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;

  /** Initial delay in milliseconds */
  initialDelay: number;

  /** Maximum delay in milliseconds */
  maxDelay: number;

  /** Backoff multiplier (default: 2 for exponential backoff) */
  backoffMultiplier: number;

  /** Optional retry condition function */
  shouldRetry?: (error: Error) => boolean;

  /** Optional callback on each retry */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = Math.min(initialDelay * Math.pow(multiplier, attempt - 1), maxDelay);
  // Add jitter (±25% randomization) to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await apiClient.fetchData(),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 1000,
 *     maxDelay: 10000,
 *     backoffMultiplier: 2,
 *     shouldRetry: (error) => error.message.includes('timeout'),
 *     onRetry: (attempt, error, delay) => {
 *       logger.warn(`Retry attempt ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt >= opts.maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateBackoffDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      // Call retry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt, lastError, delay);
      } else {
        logger.debug(
          `Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms: ${lastError.message}`
        );
      }

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript requires it
  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Create a retry wrapper function
 *
 * @param fn - Function to wrap with retry logic
 * @param options - Retry configuration options
 * @returns Wrapped function with retry logic
 *
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryWrapper(
 *   async (url: string) => await fetch(url),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 *
 * const response = await fetchWithRetry('https://api.example.com/data');
 * ```
 */
export function createRetryWrapper<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: Partial<RetryOptions> = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Common retry conditions
 */
export const RetryConditions = {
  /**
   * Retry on network errors
   */
  networkErrors: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('etimedout') ||
      message.includes('connection')
    );
  },

  /**
   * Retry on HTTP 5xx server errors
   */
  serverErrors: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('500') || message.includes('502') || message.includes('503');
  },

  /**
   * Retry on rate limit errors (429)
   */
  rateLimitErrors: (error: Error): boolean => {
    return error.message.toLowerCase().includes('429') ||
           error.message.toLowerCase().includes('rate limit');
  },

  /**
   * Retry on transient errors (network, server, rate limit)
   */
  transientErrors: (error: Error): boolean => {
    return (
      RetryConditions.networkErrors(error) ||
      RetryConditions.serverErrors(error) ||
      RetryConditions.rateLimitErrors(error)
    );
  },
};
