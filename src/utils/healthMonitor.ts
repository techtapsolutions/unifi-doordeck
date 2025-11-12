import { EventEmitter } from 'events';
import { logger } from './logger';

/**
 * Health status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Component health information
 */
export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  lastCheck: Date;
  lastSuccess?: Date;
  lastFailure?: Date;
  consecutiveFailures: number;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Health monitor configuration
 */
export interface HealthMonitorOptions {
  /** Interval in ms to perform health checks */
  checkInterval: number;

  /** Number of consecutive failures before marking unhealthy */
  failureThreshold: number;

  /** Timeout for health check operations */
  timeout: number;
}

/**
 * Health Monitor
 *
 * Monitors health of system components and emits events on status changes
 *
 * @example
 * ```typescript
 * const healthMonitor = new HealthMonitor({
 *   checkInterval: 30000,
 *   failureThreshold: 3,
 *   timeout: 5000
 * });
 *
 * healthMonitor.registerComponent('unifi', async () => {
 *   const response = await unifiClient.ping();
 *   return {
 *     status: response.ok ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
 *     message: response.ok ? 'UniFi responsive' : 'UniFi not responding'
 *   };
 * });
 *
 * healthMonitor.on('status-changed', ({ component, status }) => {
 *   logger.info(`Component ${component} is now ${status}`);
 * });
 *
 * healthMonitor.start();
 * ```
 */
export class HealthMonitor extends EventEmitter {
  private components = new Map<string, {
    check: () => Promise<HealthCheckResult>;
    health: ComponentHealth;
  }>();

  private checkInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private options: HealthMonitorOptions;

  constructor(options: Partial<HealthMonitorOptions> = {}) {
    super();
    this.options = {
      checkInterval: options.checkInterval || 30000,
      failureThreshold: options.failureThreshold || 3,
      timeout: options.timeout || 5000,
    };
  }

  /**
   * Register a component for health monitoring
   */
  registerComponent(
    name: string,
    healthCheck: () => Promise<HealthCheckResult>
  ): void {
    this.components.set(name, {
      check: healthCheck,
      health: {
        name,
        status: HealthStatus.HEALTHY,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      },
    });

    logger.info(`Health monitor: registered component '${name}'`);
  }

  /**
   * Unregister a component
   */
  unregisterComponent(name: string): void {
    this.components.delete(name);
    logger.info(`Health monitor: unregistered component '${name}'`);
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      logger.warn('Health monitor already running');
      return;
    }

    logger.info('Starting health monitor...');
    this.isMonitoring = true;

    // Perform initial health check
    this.performHealthChecks().catch((error) => {
      logger.error('Initial health check failed:', error);
    });

    // Schedule periodic health checks
    this.checkInterval = setInterval(() => {
      this.performHealthChecks().catch((error) => {
        logger.error('Health check failed:', error);
      });
    }, this.options.checkInterval);

    logger.info(`Health monitor started (interval: ${this.options.checkInterval}ms)`);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      logger.warn('Health monitor not running');
      return;
    }

    logger.info('Stopping health monitor...');

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    this.isMonitoring = false;
    logger.info('Health monitor stopped');
  }

  /**
   * Perform health checks for all components
   */
  private async performHealthChecks(): Promise<void> {
    const checks: Promise<void>[] = [];

    for (const [name, component] of this.components.entries()) {
      checks.push(this.checkComponent(name, component));
    }

    await Promise.allSettled(checks);
  }

  /**
   * Check health of a single component
   */
  private async checkComponent(
    name: string,
    component: { check: () => Promise<HealthCheckResult>; health: ComponentHealth }
  ): Promise<void> {
    const previousStatus = component.health.status;

    try {
      // Execute health check with timeout
      const result = await this.executeWithTimeout(
        component.check(),
        this.options.timeout
      );

      // Update health information
      component.health.lastCheck = new Date();
      component.health.message = result.message;
      component.health.details = result.details;

      if (result.status === HealthStatus.HEALTHY) {
        component.health.lastSuccess = new Date();
        component.health.consecutiveFailures = 0;
        component.health.status = HealthStatus.HEALTHY;
      } else if (result.status === HealthStatus.DEGRADED) {
        component.health.status = HealthStatus.DEGRADED;
      } else {
        this.handleFailure(component.health);
      }
    } catch (error) {
      logger.error(`Health check failed for component '${name}':`, error);
      component.health.lastCheck = new Date();
      component.health.message =
        error instanceof Error ? error.message : 'Health check failed';
      this.handleFailure(component.health);
    }

    // Emit status change event
    if (previousStatus !== component.health.status) {
      logger.info(
        `Component '${name}' status changed: ${previousStatus} → ${component.health.status}`
      );

      this.emit('status-changed', {
        component: name,
        previousStatus,
        currentStatus: component.health.status,
        health: component.health,
      });
    }
  }

  /**
   * Handle component failure
   */
  private handleFailure(health: ComponentHealth): void {
    health.lastFailure = new Date();
    health.consecutiveFailures++;

    if (health.consecutiveFailures >= this.options.failureThreshold) {
      health.status = HealthStatus.UNHEALTHY;
    } else {
      health.status = HealthStatus.DEGRADED;
    }
  }

  /**
   * Execute async function with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Get health status of a component
   */
  getComponentHealth(name: string): ComponentHealth | undefined {
    return this.components.get(name)?.health;
  }

  /**
   * Get health status of all components
   */
  getAllHealth(): ComponentHealth[] {
    return Array.from(this.components.values()).map((c) => c.health);
  }

  /**
   * Get overall system health
   */
  getOverallHealth(): HealthStatus {
    const healths = this.getAllHealth();

    if (healths.length === 0) {
      return HealthStatus.HEALTHY;
    }

    if (healths.some((h) => h.status === HealthStatus.UNHEALTHY)) {
      return HealthStatus.UNHEALTHY;
    }

    if (healths.some((h) => h.status === HealthStatus.DEGRADED)) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.components.clear();
    this.removeAllListeners();
  }
}
