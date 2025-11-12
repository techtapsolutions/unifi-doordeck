import { retryWithBackoff, RetryConditions, createRetryWrapper } from '../../src/utils/retry';

describe('Retry Utility', () => {
  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          initialDelay: 10,
        })
      ).rejects.toThrow('Persistent failure');

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect shouldRetry condition', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Non-retryable error'));

      const shouldRetry = jest.fn().mockReturnValue(false);

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          initialDelay: 10,
          shouldRetry,
        })
      ).rejects.toThrow('Non-retryable error');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1,
        expect.any(Error),
        expect.any(Number)
      );
    });

    it('should apply exponential backoff', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      const onRetry = jest.fn((_attempt: number, _error: Error, delay: number) => {
        delays.push(delay);
      });

      await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        onRetry,
      });

      // Delays should increase exponentially (with jitter)
      // First delay should be around 100ms, second around 200ms
      expect(delays[0]).toBeGreaterThan(50);
      expect(delays[0]).toBeLessThan(150);
      expect(delays[1]).toBeGreaterThan(100);
      expect(delays[1]).toBeLessThan(300);
    });

    it('should respect maxDelay', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      const delays: number[] = [];
      const onRetry = jest.fn((_attempt: number, _error: Error, delay: number) => {
        delays.push(delay);
      });

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          initialDelay: 100,
          maxDelay: 200,
          backoffMultiplier: 3,
          onRetry,
        })
      ).rejects.toThrow();

      // All delays should be <= maxDelay (plus jitter tolerance)
      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(250); // 200 + 25% jitter
      });
    });
  });

  describe('RetryConditions', () => {
    describe('networkErrors', () => {
      it('should retry on timeout errors', () => {
        const error = new Error('Request timeout');
        expect(RetryConditions.networkErrors(error)).toBe(true);
      });

      it('should retry on connection errors', () => {
        const error = new Error('ECONNREFUSED');
        expect(RetryConditions.networkErrors(error)).toBe(true);
      });

      it('should not retry on other errors', () => {
        const error = new Error('Invalid input');
        expect(RetryConditions.networkErrors(error)).toBe(false);
      });
    });

    describe('serverErrors', () => {
      it('should retry on 500 errors', () => {
        const error = new Error('HTTP 500 Internal Server Error');
        expect(RetryConditions.serverErrors(error)).toBe(true);
      });

      it('should retry on 503 errors', () => {
        const error = new Error('HTTP 503 Service Unavailable');
        expect(RetryConditions.serverErrors(error)).toBe(true);
      });

      it('should not retry on 400 errors', () => {
        const error = new Error('HTTP 400 Bad Request');
        expect(RetryConditions.serverErrors(error)).toBe(false);
      });
    });

    describe('transientErrors', () => {
      it('should retry on network errors', () => {
        const error = new Error('timeout');
        expect(RetryConditions.transientErrors(error)).toBe(true);
      });

      it('should retry on server errors', () => {
        const error = new Error('500');
        expect(RetryConditions.transientErrors(error)).toBe(true);
      });

      it('should retry on rate limit errors', () => {
        const error = new Error('429 Too Many Requests');
        expect(RetryConditions.transientErrors(error)).toBe(true);
      });
    });
  });

  describe('createRetryWrapper', () => {
    it('should create a wrapper function that retries', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');

      const wrappedFn = createRetryWrapper(fn, {
        maxAttempts: 3,
        initialDelay: 10,
      });

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should pass through arguments to wrapped function', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const wrappedFn = createRetryWrapper(fn, { maxAttempts: 1 });

      await wrappedFn('test', 123, { key: 'value' });

      expect(fn).toHaveBeenCalledWith('test', 123, { key: 'value' });
    });
  });
});
