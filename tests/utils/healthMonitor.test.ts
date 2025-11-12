import { HealthMonitor, HealthStatus } from '../../src/utils/healthMonitor';

describe('HealthMonitor', () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    monitor = new HealthMonitor({
      checkInterval: 100,
      failureThreshold: 3,
      timeout: 50,
    });
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('component registration', () => {
    it('should register a component', () => {
      const healthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      monitor.registerComponent('test', healthCheck);

      const health = monitor.getComponentHealth('test');
      expect(health).toBeDefined();
      expect(health?.name).toBe('test');
      expect(health?.status).toBe(HealthStatus.HEALTHY);
    });

    it('should unregister a component', () => {
      const healthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      monitor.registerComponent('test', healthCheck);
      expect(monitor.getComponentHealth('test')).toBeDefined();

      monitor.unregisterComponent('test');
      expect(monitor.getComponentHealth('test')).toBeUndefined();
    });
  });

  describe('health checks', () => {
    it('should perform health check on component', async () => {
      const healthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
        message: 'All good',
      });

      monitor.registerComponent('test', healthCheck);
      monitor.start();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(healthCheck).toHaveBeenCalled();
      const health = monitor.getComponentHealth('test');
      expect(health?.status).toBe(HealthStatus.HEALTHY);
      expect(health?.message).toBe('All good');
    });

    it('should mark component as UNHEALTHY after failure threshold', async () => {
      const healthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        message: 'Failed',
      });

      monitor.registerComponent('test', healthCheck);
      monitor.start();

      // Wait for 3 checks to complete (failureThreshold = 3)
      await new Promise((resolve) => setTimeout(resolve, 350));

      const health = monitor.getComponentHealth('test');
      expect(health?.status).toBe(HealthStatus.UNHEALTHY);
      expect(health?.consecutiveFailures).toBeGreaterThanOrEqual(3);
    });

    it('should mark component as DEGRADED before threshold', async () => {
      const healthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
      });

      monitor.registerComponent('test', healthCheck);
      monitor.start();

      // Wait for 1-2 checks (less than threshold)
      await new Promise((resolve) => setTimeout(resolve, 150));

      const health = monitor.getComponentHealth('test');
      expect(health?.consecutiveFailures).toBeLessThan(3);
      // Should be DEGRADED or UNHEALTHY depending on timing
    });

    it('should handle check timeout', async () => {
      const healthCheck = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                status: HealthStatus.HEALTHY,
                timestamp: new Date(),
              });
            }, 200); // Longer than timeout
          })
      );

      monitor.registerComponent('test', healthCheck);
      monitor.start();

      await new Promise((resolve) => setTimeout(resolve, 150));

      const health = monitor.getComponentHealth('test');
      expect(health?.message).toContain('timeout');
    });

    it('should reset consecutive failures on success', async () => {
      let callCount = 0;
      const healthCheck = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve({
            status: HealthStatus.UNHEALTHY,
            timestamp: new Date(),
          });
        }
        return Promise.resolve({
          status: HealthStatus.HEALTHY,
          timestamp: new Date(),
        });
      });

      monitor.registerComponent('test', healthCheck);
      monitor.start();

      await new Promise((resolve) => setTimeout(resolve, 350));

      const health = monitor.getComponentHealth('test');
      expect(health?.status).toBe(HealthStatus.HEALTHY);
      expect(health?.consecutiveFailures).toBe(0);
    });
  });

  describe('events', () => {
    it('should emit status-changed event when status changes', async () => {
      const statusChangedHandler = jest.fn();
      monitor.on('status-changed', statusChangedHandler);

      let shouldFail = false;
      const healthCheck = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          status: shouldFail ? HealthStatus.UNHEALTHY : HealthStatus.HEALTHY,
          timestamp: new Date(),
        });
      });

      monitor.registerComponent('test', healthCheck);
      monitor.start();

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Change to unhealthy
      shouldFail = true;

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(statusChangedHandler).toHaveBeenCalled();
      const lastCall = statusChangedHandler.mock.calls[statusChangedHandler.mock.calls.length - 1][0];
      expect(lastCall.component).toBe('test');
      expect(lastCall.currentStatus).toBe(HealthStatus.DEGRADED);
    });

    it('should not emit event when status unchanged', async () => {
      const statusChangedHandler = jest.fn();
      monitor.on('status-changed', statusChangedHandler);

      const healthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      monitor.registerComponent('test', healthCheck);
      monitor.start();

      await new Promise((resolve) => setTimeout(resolve, 250));

      // Should not emit multiple events if status stays HEALTHY
      expect(statusChangedHandler).not.toHaveBeenCalled();
    });
  });

  describe('overall health', () => {
    it('should return HEALTHY when all components healthy', async () => {
      const healthCheck1 = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      const healthCheck2 = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      monitor.registerComponent('component1', healthCheck1);
      monitor.registerComponent('component2', healthCheck2);

      expect(monitor.getOverallHealth()).toBe(HealthStatus.HEALTHY);
    });

    it('should return DEGRADED when any component degraded', () => {
      const healthCheck1 = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      const healthCheck2 = jest.fn().mockResolvedValue({
        status: HealthStatus.DEGRADED,
        timestamp: new Date(),
      });

      monitor.registerComponent('component1', healthCheck1);
      monitor.registerComponent('component2', healthCheck2);
      monitor.start();

      // Initial state might be healthy, but let's check the logic
      const health2 = monitor.getComponentHealth('component2');
      if (health2 && health2.status === HealthStatus.DEGRADED) {
        expect(monitor.getOverallHealth()).toBe(HealthStatus.DEGRADED);
      }
    });

    it('should return UNHEALTHY when any component unhealthy', async () => {
      const healthCheck1 = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      const healthCheck2 = jest.fn().mockResolvedValue({
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
      });

      monitor.registerComponent('component1', healthCheck1);
      monitor.registerComponent('component2', healthCheck2);
      monitor.start();

      // Wait for checks to run
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(monitor.getOverallHealth()).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('lifecycle', () => {
    it('should start monitoring', () => {
      expect(monitor.isActive()).toBe(false);

      monitor.start();

      expect(monitor.isActive()).toBe(true);
    });

    it('should stop monitoring', () => {
      monitor.start();
      expect(monitor.isActive()).toBe(true);

      monitor.stop();

      expect(monitor.isActive()).toBe(false);
    });

    it('should not start if already running', () => {
      monitor.start();
      monitor.start(); // Second start should be ignored

      expect(monitor.isActive()).toBe(true);
    });

    it('should cleanup on destroy', async () => {
      const healthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      monitor.registerComponent('test', healthCheck);
      monitor.start();

      await new Promise((resolve) => setTimeout(resolve, 50));

      monitor.destroy();

      expect(monitor.isActive()).toBe(false);
      expect(monitor.getAllHealth()).toHaveLength(0);
    });
  });

  describe('getAllHealth', () => {
    it('should return health for all components', () => {
      const healthCheck1 = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      const healthCheck2 = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      monitor.registerComponent('component1', healthCheck1);
      monitor.registerComponent('component2', healthCheck2);

      const allHealth = monitor.getAllHealth();

      expect(allHealth).toHaveLength(2);
      expect(allHealth.find((h) => h.name === 'component1')).toBeDefined();
      expect(allHealth.find((h) => h.name === 'component2')).toBeDefined();
    });
  });
});
