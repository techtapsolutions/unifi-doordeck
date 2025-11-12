import { EventEmitter } from 'events';
import { logger } from './logger';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  /** Circuit is closed, requests pass through */
  CLOSED = 'closed',

  /** Circuit is open, requests are blocked */
  OPEN = 'open',

  /** Circuit is half-open, testing if service recovered */
  HALF_OPEN = 'half_open',
}

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;

  /** Number of successes in half-open state before closing circuit */
  successThreshold: number;

  /** Time in ms to wait before transitioning from open to half-open */
  timeout: number;

  /** Optional name for logging */
  name?: string;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  openedAt?: Date;
  lastFailure?: Date;
  lastSuccess?: Date;
}

/**
 * Circuit Breaker pattern implementation
 *
 * Prevents cascading failures by "opening" the circuit when too many
 * failures occur, then periodically testing recovery.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests are blocked
 * - HALF_OPEN: Testing recovery, limited requests pass through
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   timeout: 60000,
 *   name: 'UniFiAPI'
 * });
 *
 * breaker.on('open', () => logger.error('Circuit opened'));
 * breaker.on('close', () => logger.info('Circuit closed'));
 *
 * async function callAPI() {
 *   return await breaker.execute(async () => {
 *     return await fetch('https://api.example.com');
 *   });
 * }
 * ```
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private openedAt?: Date;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private resetTimer?: NodeJS.Timeout;

  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions) {
    super();
    this.options = {
      name: 'CircuitBreaker',
      ...options,
    };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      throw new Error(
        `Circuit breaker [${this.options.name}] is OPEN - request blocked`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.lastSuccess = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.options.successThreshold) {
        this.close();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.lastFailure = new Date();
    this.failureCount++;

    logger.debug(
      `Circuit breaker [${this.options.name}] failure ${this.failureCount}/${this.options.failureThreshold}`
    );

    if (
      this.state === CircuitState.HALF_OPEN ||
      this.failureCount >= this.options.failureThreshold
    ) {
      this.open();
    }
  }

  /**
   * Open the circuit
   */
  private open(): void {
    if (this.state === CircuitState.OPEN) {
      return; // Already open
    }

    this.state = CircuitState.OPEN;
    this.openedAt = new Date();
    this.successCount = 0;

    logger.warn(
      `Circuit breaker [${this.options.name}] OPENED after ${this.failureCount} failures`
    );

    this.emit('open', {
      failures: this.failureCount,
      timestamp: this.openedAt,
    });

    // Schedule transition to half-open
    this.resetTimer = setTimeout(() => {
      this.halfOpen();
    }, this.options.timeout);
  }

  /**
   * Transition to half-open state
   */
  private halfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    this.failureCount = 0;

    logger.info(`Circuit breaker [${this.options.name}] transitioning to HALF_OPEN`);

    this.emit('half-open', {
      timestamp: new Date(),
    });
  }

  /**
   * Close the circuit
   */
  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = undefined;

    logger.info(`Circuit breaker [${this.options.name}] CLOSED - service recovered`);

    this.emit('close', {
      timestamp: new Date(),
    });
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }

    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = undefined;

    logger.info(`Circuit breaker [${this.options.name}] manually reset`);
    this.emit('reset');
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      totalRequests: this.totalRequests,
      openedAt: this.openedAt,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
    };
  }

  /**
   * Check if circuit is allowing requests
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
    this.removeAllListeners();
  }
}
