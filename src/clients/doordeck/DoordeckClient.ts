import { EventEmitter } from 'events';
import { com } from '@doordeck/doordeck-headless-sdk/kotlin/doordeck-sdk';
import { logger } from '../../utils/logger';
import { NodeSecureStorage } from '../../utils/NodeSecureStorage';
import { CommandListener } from '../../services/commands';
import { createUniFiController, validateUniFiControllerConfig } from './UniFiController';
import { IDoordeckClient, DoorMapping, UnlockCommand } from '../../types';

/**
 * Doordeck client that wraps the headless SDK and provides
 * integration with the Doordeck Cloud platform
 */
export class DoordeckClient extends EventEmitter implements IDoordeckClient {
  private secureStorage: NodeSecureStorage;
  private apiToken?: string;
  private refreshToken?: string;
  private isInitialized = false;
  private isAuthenticated = false;
  private activeDoors = new Set<string>();
  private commandListener: CommandListener;
  private unifiHost?: string;
  private unifiUsername?: string;
  private unifiPassword?: string;

  constructor(apiToken?: string, refreshToken?: string) {
    super();
    this.apiToken = apiToken;
    this.refreshToken = refreshToken;
    this.secureStorage = new NodeSecureStorage();
    this.commandListener = new CommandListener();

    // Forward unlock commands from CommandListener
    this.commandListener.on('unlock-command', (command: UnlockCommand) => {
      logger.info(`Unlock command received: ${command.lockId}`);
      this.emit('unlock-command', command);
    });
  }

  /**
   * Initialize the Doordeck SDK
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Doordeck client...');

      // Store tokens in secure storage if provided
      if (this.apiToken) {
        this.secureStorage.addCloudAuthToken(this.apiToken);
      }
      if (this.refreshToken) {
        this.secureStorage.addCloudRefreshToken(this.refreshToken);
      }

      // Create SDK configuration with Fusion host and custom secure storage
      // CRITICAL: setFusionHost() must be called on the Builder, not on storage
      logger.debug('Configuring SDK with Fusion API host: https://api.doordeck.com');
      const sdkConfig = new com.doordeck.multiplatform.sdk.config.SdkConfig.Builder()
        .setSecureStorageOverride(
          this.secureStorage as unknown as com.doordeck.multiplatform.sdk.storage.SecureStorage
        )
        .setFusionHost('https://api.doordeck.com')
        .setDebugLogging(false)
        .build();

      // Initialize SDK
      await com.doordeck.multiplatform.sdk.KDoordeckFactory.initialize(sdkConfig);

      this.isInitialized = true;
      logger.info('Doordeck client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Doordeck client:', error);
      throw error;
    }
  }

  /**
   * Authenticate with Doordeck Cloud API
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Doordeck client not initialized');
      }

      logger.info('Authenticating with Doordeck Cloud API...');

      // Use standard Cloud API login (accountless) - this returns a token response
      // The Fusion API endpoint returns 404, use the standard API instead
      const loginResponse = await com.doordeck.multiplatform.sdk.api.accountless().login(email, password);

      // Store the auth token from the login response
      if (loginResponse.authToken) {
        this.apiToken = loginResponse.authToken;
        this.secureStorage.addCloudAuthToken(loginResponse.authToken);
        logger.debug('Auth token received and stored');
      }

      this.isAuthenticated = true;
      logger.info('Successfully authenticated with Doordeck Cloud API');
      return true;
    } catch (error) {
      logger.error('Failed to authenticate with Doordeck:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Set UniFi Access controller credentials
   * Must be called before registering doors
   */
  setUniFiCredentials(host: string, username: string, password: string): void {
    this.unifiHost = host;
    this.unifiUsername = username;
    this.unifiPassword = password;
    logger.info('UniFi Access credentials configured');
  }

  /**
   * Register a door with Doordeck using Fusion API
   */
  async registerDoor(mapping: DoorMapping): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Doordeck client not initialized');
      }

      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Doordeck');
      }

      if (!this.unifiHost || !this.unifiUsername || !this.unifiPassword) {
        throw new Error('UniFi Access credentials not configured. Call setUniFiCredentials() first.');
      }

      logger.info(`Registering door with Doordeck: ${mapping.name} (${mapping.doordeckLockId})`);

      // Create UniFi Access controller object
      const controllerConfig = {
        baseUrl: this.unifiHost,
        username: this.unifiUsername,
        password: this.unifiPassword,
        doorId: mapping.unifiDoorId,
      };

      // Validate controller configuration
      const validation = validateUniFiControllerConfig(controllerConfig);
      if (!validation.valid) {
        throw new Error(
          `Invalid UniFi controller configuration: ${validation.errors.join(', ')}`
        );
      }

      // Create controller object
      const controller = createUniFiController(controllerConfig);

      logger.debug('UniFi controller created:', {
        baseUrl: controllerConfig.baseUrl,
        doorId: controllerConfig.doorId,
        username: controllerConfig.username,
      });

      // Enable door using Fusion API with proper controller
      await com.doordeck.multiplatform.sdk.api.fusion().enableDoor(
        mapping.name,
        mapping.siteId,
        controller
      );

      logger.info(`Door registered successfully with Doordeck: ${mapping.name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to register door ${mapping.name}:`, error);
      return false;
    }
  }

  /**
   * Start monitoring a door for unlock commands
   */
  async startDoor(lockId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Doordeck client not initialized');
      }

      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Doordeck');
      }

      logger.info(`Starting door monitoring: ${lockId}`);

      // Start door monitoring with Doordeck - this registers the door for unlock commands
      await com.doordeck.multiplatform.sdk.api.fusion().startDoor(lockId);

      // Add door to active set
      this.activeDoors.add(lockId);

      // Add door to command listener for polling
      this.commandListener.addDoor(lockId);

      // Start command listener if not already running
      if (!this.commandListener.isActive()) {
        await this.commandListener.start();
      }

      logger.info(`Door monitoring started: ${lockId}`);
      this.emit('door-started', lockId);

      return true;
    } catch (error) {
      logger.error(`Failed to start door monitoring for ${lockId}:`, error);
      return false;
    }
  }

  /**
   * Stop monitoring a door
   */
  async stopDoor(lockId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Doordeck client not initialized');
      }

      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Doordeck');
      }

      logger.info(`Stopping door monitoring: ${lockId}`);

      // Stop door monitoring with Doordeck
      await com.doordeck.multiplatform.sdk.api.fusion().stopDoor(lockId);

      // Remove from active set
      this.activeDoors.delete(lockId);

      // Remove from command listener
      this.commandListener.removeDoor(lockId);

      // Stop command listener if no doors are being monitored
      if (this.activeDoors.size === 0 && this.commandListener.isActive()) {
        await this.commandListener.stop();
      }

      logger.info(`Door monitoring stopped: ${lockId}`);
      this.emit('door-stopped', lockId);

      return true;
    } catch (error) {
      logger.error(`Failed to stop door monitoring for ${lockId}:`, error);
      return false;
    }
  }

  /**
   * Send door event to Doordeck cloud
   *
   * @param lockId - Doordeck lock ID
   * @param event - Event data (can be UniFiDoorEvent or translated DoordeckDoorEvent)
   */
  async sendDoorEvent(lockId: string, event: any): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Doordeck client not initialized');
      }

      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Doordeck');
      }

      logger.debug(`Sending door event to Doordeck: ${event.eventType || event.type} for lock ${lockId}`);

      // Get current door status
      const status = await com.doordeck.multiplatform.sdk.api.fusion().getDoorStatus(lockId);

      // Prepare door state update
      // The Fusion API expects door state updates in a specific format
      const doorState = {
        ...status,
        timestamp: event.timestamp || new Date().toISOString(),
        eventType: event.eventType || event.type,
        state: event.state || {},
        metadata: event.metadata || event.data || {},
      };

      // TODO: Implement proper event forwarding mechanism
      // The SDK documentation doesn't clearly specify how to send door state updates
      // back to Doordeck Cloud. Possible approaches:
      // 1. WebSocket connection to Doordeck Cloud
      // 2. HTTP POST to Fusion API endpoint
      // 3. Use a specific SDK method (not yet identified)
      //
      // For now, we log the event. This should be replaced with the actual
      // implementation once the proper mechanism is clarified with Doordeck documentation.
      logger.debug('Door event prepared for sending to Doordeck Cloud:', {
        lockId,
        eventType: doorState.eventType,
        timestamp: doorState.timestamp,
        state: doorState.state,
      });

      this.emit('event-sent', { lockId, event });

      return true;
    } catch (error) {
      logger.error(`Failed to send door event for ${lockId}:`, error);
      return false;
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting Doordeck client...');

      // Stop command listener
      if (this.commandListener.isActive()) {
        await this.commandListener.stop();
      }

      // Stop monitoring all active doors
      for (const lockId of this.activeDoors) {
        await this.stopDoor(lockId);
      }

      // Clear secure storage
      this.secureStorage.clear();

      this.isInitialized = false;
      this.isAuthenticated = false;

      logger.info('Doordeck client disconnected');
    } catch (error) {
      logger.error('Error during Doordeck client disconnect:', error);
      throw error;
    }
  }

  /**
   * Get current authentication status
   */
  isConnected(): boolean {
    return this.isInitialized && this.isAuthenticated;
  }

  /**
   * Get list of active door monitoring sessions
   */
  getActiveDoors(): string[] {
    return Array.from(this.activeDoors);
  }
}
