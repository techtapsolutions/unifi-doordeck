import { EventEmitter } from 'events';
import { AccessApi } from 'unifi-access';
import { logger } from '../../utils/logger';
import { CircuitBreaker, retryWithBackoff, RetryConditions } from '../../utils';
import {
  IUniFiClient,
  UniFiDoor,
  UniFiDoorStatus,
  UniFiDoorEvent,
  DoorEventType,
} from '../../types';

/**
 * UniFi Access client that manages communication with UniFi Access controllers
 */
export class UniFiClient extends EventEmitter implements IUniFiClient {
  private api: AccessApi;
  private isInitialized = false;
  private isConnected = false;
  private eventListenerActive = false;
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectDelay: number;
  private maxRetries: number;
  private retryCount = 0;
  private circuitBreaker: CircuitBreaker;

  // Store connection details for reconnection
  private host?: string;
  private username?: string;
  private password?: string;

  constructor(reconnectDelay = 5000, maxRetries = 3) {
    super();
    this.api = new AccessApi();
    this.reconnectDelay = reconnectDelay;
    this.maxRetries = maxRetries;

    // Initialize circuit breaker for UniFi API calls
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      name: 'UniFiAPI',
    });

    // Set up circuit breaker event listeners
    this.circuitBreaker.on('open', () => {
      logger.error('UniFi API circuit breaker OPENED - blocking requests');
      this.emit('circuit-open');
    });

    this.circuitBreaker.on('half-open', () => {
      logger.info('UniFi API circuit breaker HALF_OPEN - testing recovery');
      this.emit('circuit-half-open');
    });

    this.circuitBreaker.on('close', () => {
      logger.info('UniFi API circuit breaker CLOSED - service recovered');
      this.emit('circuit-close');
    });

    // Set up API event listeners
    this.setupApiEventListeners();
  }

  /**
   * Set up event listeners for the UniFi Access API
   */
  private setupApiEventListeners(): void {
    // Listen for bootstrap events (initial data load)
    this.api.on('bootstrap', () => {
      logger.info('UniFi Access bootstrap completed');
      this.isInitialized = true;
      this.retryCount = 0; // Reset retry count on successful connection
      this.emit('bootstrap-complete');
    });

    // Listen for WebSocket messages
    this.api.on('message', (message: any) => {
      logger.debug('UniFi Access message received:', message);
      this.handleApiMessage(message);
    });

    // Listen for errors
    this.api.on('error', (error: Error) => {
      logger.error('UniFi Access API error:', error);
      this.emit('error', error);
      this.handleConnectionError(error);
    });
  }

  /**
   * Handle messages from the UniFi Access API
   */
  private handleApiMessage(message: any): void {
    try {
      // Parse door events from UniFi Access messages
      // The exact message format will depend on UniFi Access API
      // This is a basic implementation that can be refined

      if (message.event && message.door_id) {
        const doorEvent: UniFiDoorEvent = {
          doorId: message.door_id,
          type: this.mapUniFiEventType(message.event),
          timestamp: new Date(message.timestamp || Date.now()),
          data: message,
        };

        logger.debug(`Door event: ${doorEvent.type} for door ${doorEvent.doorId}`);
        this.emit('door-event', doorEvent);
      }
    } catch (error) {
      logger.error('Error handling UniFi Access message:', error);
    }
  }

  /**
   * Map UniFi Access event types to our DoorEventType enum
   */
  private mapUniFiEventType(eventType: string): DoorEventType {
    const eventMap: Record<string, DoorEventType> = {
      unlock: DoorEventType.UNLOCKED,
      lock: DoorEventType.LOCKED,
      open: DoorEventType.OPENED,
      close: DoorEventType.CLOSED,
      forced: DoorEventType.FORCED,
      held_open: DoorEventType.HELD_OPEN,
      access_granted: DoorEventType.ACCESS_GRANTED,
      access_denied: DoorEventType.ACCESS_DENIED,
    };

    return eventMap[eventType.toLowerCase()] || DoorEventType.ACCESS_GRANTED;
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  private handleConnectionError(error: Error): void {
    this.isConnected = false;

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.warn(
        `UniFi Access connection lost. Reconnecting in ${this.reconnectDelay}ms (attempt ${this.retryCount}/${this.maxRetries})...`
      );

      this.reconnectTimer = setTimeout(() => {
        if (this.host && this.username && this.password) {
          this.login(this.host, this.username, this.password).catch((err) => {
            logger.error('Reconnection attempt failed:', err);
          });
        }
      }, this.reconnectDelay);
    } else {
      logger.error('Max reconnection attempts reached. Manual intervention required.');
      this.emit('connection-failed', error);
    }
  }

  /**
   * Initialize the client
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing UniFi Access client...');
      // Basic initialization - actual connection happens in login()
      this.isInitialized = false;
      logger.info('UniFi Access client ready for login');
    } catch (error) {
      logger.error('Failed to initialize UniFi Access client:', error);
      throw error;
    }
  }

  /**
   * Authenticate with UniFi Access controller with retry logic
   */
  async login(host: string, username: string, password: string): Promise<boolean> {
    try {
      logger.info(`Connecting to UniFi Access controller at ${host}...`);

      // Store credentials for reconnection
      this.host = host;
      this.username = username;
      this.password = password;

      // Login to UniFi Access controller with retry logic
      const success = await retryWithBackoff(
        async () => {
          const result = await this.api.login(host, username, password);
          if (!result) {
            throw new Error('Login returned false');
          }
          return result;
        },
        {
          maxAttempts: 3,
          initialDelay: 2000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          shouldRetry: RetryConditions.networkErrors,
          onRetry: (attempt, error, delay) => {
            logger.warn(
              `UniFi login attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`
            );
          },
        }
      );

      if (success) {
        this.isConnected = true;
        logger.info('Successfully connected to UniFi Access controller');

        // Wait for bootstrap to complete
        await this.waitForBootstrap();

        return true;
      } else {
        logger.error('Failed to authenticate with UniFi Access controller');
        return false;
      }
    } catch (error) {
      logger.error('Error during UniFi Access login:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Wait for bootstrap to complete (with timeout)
   */
  private async waitForBootstrap(timeout = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Bootstrap timeout'));
      }, timeout);

      this.once('bootstrap-complete', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * Discover all doors from the controller
   */
  async discoverDoors(): Promise<UniFiDoor[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to UniFi Access controller');
      }

      if (!this.isInitialized) {
        throw new Error('UniFi Access client not initialized (bootstrap not complete)');
      }

      logger.info('Discovering doors from UniFi Access...');

      // Get doors from the API (doors is an array)
      const doors: UniFiDoor[] = [];

      if (this.api.doors && Array.isArray(this.api.doors)) {
        for (const doorData of this.api.doors) {
          const door: UniFiDoor = {
            id: (doorData as any).unique_id || (doorData as any).id,
            name: (doorData as any).name || `Door ${(doorData as any).unique_id}`,
            floor: (doorData as any).floor_id,
            metadata: doorData as Record<string, unknown>,
          };
          doors.push(door);
        }
      }

      logger.info(`Discovered ${doors.length} doors`);
      return doors;
    } catch (error) {
      logger.error('Error discovering doors:', error);
      throw error;
    }
  }

  /**
   * Unlock a specific door with circuit breaker and retry logic
   */
  async unlock(doorId: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to UniFi Access controller');
      }

      logger.info(`Unlocking door: ${doorId}`);

      // Execute unlock through circuit breaker with retry logic
      const success = await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            // Find the door in the doors array
            if (!this.api.doors || !Array.isArray(this.api.doors)) {
              throw new Error('Doors not available');
            }

            const door = this.api.doors.find(
              (d: any) => d.unique_id === doorId || d.id === doorId
            );

            if (!door) {
              // Don't retry if door not found
              throw new Error(`Door ${doorId} not found`);
            }

            // Call the unlock API with the door object
            const result = await this.api.unlock(door as any);
            if (!result) {
              throw new Error('Unlock returned false');
            }
            return result;
          },
          {
            maxAttempts: 2,
            initialDelay: 500,
            maxDelay: 2000,
            backoffMultiplier: 2,
            shouldRetry: RetryConditions.transientErrors,
            onRetry: (attempt, error, delay) => {
              logger.warn(
                `Unlock retry ${attempt} for door ${doorId}: ${error.message}. Retrying in ${delay}ms...`
              );
            },
          }
        );
      });

      logger.info(`Door ${doorId} unlocked successfully`);
      return success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error unlocking door ${doorId}: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get door status
   */
  async getDoorStatus(doorId: string): Promise<UniFiDoorStatus | null> {
    try {
      if (!this.isConnected || !this.isInitialized) {
        throw new Error('Not connected to UniFi Access controller');
      }

      // Find door in the doors array
      if (!this.api.doors || !Array.isArray(this.api.doors)) {
        throw new Error('Doors not available');
      }

      const doorData = this.api.doors.find(
        (d: any) => d.unique_id === doorId || d.id === doorId
      );

      if (!doorData) {
        logger.warn(`Door ${doorId} not found`);
        return null;
      }

      // Extract status information
      // The exact structure depends on the UniFi Access API
      const status: UniFiDoorStatus = {
        doorId,
        isUnlocked: (doorData as any).is_unlocked || false,
        isOpen: (doorData as any).is_open || false,
        lastUpdate: new Date((doorData as any).last_update || Date.now()),
      };

      return status;
    } catch (error) {
      logger.error(`Error getting door status for ${doorId}:`, error);
      return null;
    }
  }

  /**
   * Start listening for door events
   */
  startEventListener(callback: (event: UniFiDoorEvent) => void): void {
    if (this.eventListenerActive) {
      logger.warn('Event listener already active');
      return;
    }

    logger.info('Starting UniFi Access event listener...');

    // Register callback for door events
    this.on('door-event', callback);

    this.eventListenerActive = true;
    logger.info('UniFi Access event listener started');
  }

  /**
   * Stop listening for door events
   */
  stopEventListener(): void {
    if (!this.eventListenerActive) {
      logger.warn('Event listener not active');
      return;
    }

    logger.info('Stopping UniFi Access event listener...');

    // Remove all door-event listeners
    this.removeAllListeners('door-event');

    this.eventListenerActive = false;
    logger.info('UniFi Access event listener stopped');
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from UniFi Access controller...');

      // Clear reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }

      // Stop event listener
      if (this.eventListenerActive) {
        this.stopEventListener();
      }

      // Logout from API
      if (this.isConnected) {
        await this.api.logout();
      }

      this.isConnected = false;
      this.isInitialized = false;
      this.retryCount = 0;

      logger.info('UniFi Access client disconnected');
    } catch (error) {
      logger.error('Error during UniFi Access disconnect:', error);
      throw error;
    }
  }

  /**
   * Get current connection status
   */
  isClientConnected(): boolean {
    return this.isConnected && this.isInitialized;
  }

  /**
   * Get controller information
   */
  getControllerInfo(): any {
    return {
      host: this.host,
      connected: this.isConnected,
      initialized: this.isInitialized,
      controller: this.api.controller,
      deviceCount: this.api.devices ? Object.keys(this.api.devices).length : 0,
      doorCount: this.api.doors ? Object.keys(this.api.doors).length : 0,
      floorCount: this.api.floors ? Object.keys(this.api.floors).length : 0,
    };
  }
}
