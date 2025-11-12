import { CircuitBreaker, CircuitState } from '../../src/utils/circuitBreaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 100,
      name: 'TestBreaker',
    });
  });

  afterEach(() => {
    breaker.destroy();
  });

  describe('initialization', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.isOpen()).toBe(false);
    });

    it('should have initial stats', () => {
      const stats = breaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('successful execution', () => {
    it('should execute function and return result', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reset failure count on success', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');

      await expect(breaker.execute(fn)).rejects.toThrow('Failure');
      expect(breaker.getStats().failures).toBe(1);

      await breaker.execute(fn);
      expect(breaker.getStats().failures).toBe(0);
    });
  });

  describe('failure handling', () => {
    it('should track failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      await expect(breaker.execute(fn)).rejects.toThrow('Failure');
      expect(breaker.getStats().failures).toBe(1);

      await expect(breaker.execute(fn)).rejects.toThrow('Failure');
      expect(breaker.getStats().failures).toBe(2);
    });

    it('should open circuit after failure threshold', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow('Failure');
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.isOpen()).toBe(true);
    });

    it('should block requests when OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Now requests should be blocked without calling fn
      fn.mockClear();
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    it('should transition to HALF_OPEN after timeout', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      // Wait for HALF_OPEN
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Succeed 2 times (success threshold)
      fn.mockResolvedValue('success');
      await breaker.execute(fn);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      await breaker.execute(fn);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen on failure in HALF_OPEN state', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      // Wait for HALF_OPEN
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Fail once - should reopen
      await expect(breaker.execute(fn)).rejects.toThrow('Failure');
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('events', () => {
    it('should emit "open" event when circuit opens', async () => {
      const openHandler = jest.fn();
      breaker.on('open', openHandler);

      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(openHandler).toHaveBeenCalledTimes(1);
      expect(openHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          failures: 3,
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit "half-open" event when transitioning', async () => {
      const halfOpenHandler = jest.fn();
      breaker.on('half-open', halfOpenHandler);

      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      // Wait for HALF_OPEN transition
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(halfOpenHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit "close" event when circuit closes', async () => {
      const closeHandler = jest.fn();
      breaker.on('close', closeHandler);

      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      // Wait for HALF_OPEN
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Close with successes
      fn.mockResolvedValue('success');
      await breaker.execute(fn);
      await breaker.execute(fn);

      expect(closeHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('manual reset', () => {
    it('should reset circuit to CLOSED state', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Manual reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getStats().failures).toBe(0);
      expect(breaker.getStats().successes).toBe(0);
    });

    it('should emit "reset" event', () => {
      const resetHandler = jest.fn();
      breaker.on('reset', resetHandler);

      breaker.reset();

      expect(resetHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('statistics', () => {
    it('should track total requests', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const failFn = jest.fn().mockRejectedValue(new Error('Failure'));

      await breaker.execute(successFn);
      await expect(breaker.execute(failFn)).rejects.toThrow();
      await breaker.execute(successFn);

      expect(breaker.getStats().totalRequests).toBe(3);
    });

    it('should track last failure and success timestamps', async () => {
      const fn = jest.fn();

      fn.mockRejectedValue(new Error('Failure'));
      await expect(breaker.execute(fn)).rejects.toThrow();

      const stats1 = breaker.getStats();
      expect(stats1.lastFailure).toBeInstanceOf(Date);
      expect(stats1.lastSuccess).toBeUndefined();

      fn.mockResolvedValue('success');
      await breaker.execute(fn);

      const stats2 = breaker.getStats();
      expect(stats2.lastSuccess).toBeInstanceOf(Date);
    });
  });
});
