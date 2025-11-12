import { EventEmitter } from 'events';
import { BridgeConfig } from '../../config';
import { logger, HealthMonitor, HealthStatus } from '../../utils';
import { DoordeckClient } from '../../clients/doordeck';
import { UniFiClient } from '../../clients/unifi';
import { UniFiOSClient } from '../../clients/unifi/UniFiOSClient';
import { MappingService } from '../mapping';
import { EventTranslator } from '../events';
import {
  IBridgeService,
  IDoordeckClient,
  IUniFiClient,
  ServiceState,
  BridgeStats,
  UnlockCommand,
  UniFiDoorEvent,
  DoorMapping,
} from '../../types';

/**
 * Core bridge service that orchestrates communication between
 * Doordeck Cloud and UniFi Access controllers
 */
export class BridgeService extends EventEmitter implements IBridgeService {
  private state: ServiceState = ServiceState.STOPPED;
  private config: BridgeConfig | null = null;
  private doordeckClient: IDoordeckClient | null = null;
  private unifiClient: IUniFiClient | null = null;
  private mappingService: MappingService;
  private eventTranslator: EventTranslator;
  private healthMonitor: HealthMonitor;
  private stats: BridgeStats;
  private startedAt?: Date;
  private generatedSiteId?: string;

  constructor() {
    super();

    // Initialize mapping service
    this.mappingService = new MappingService();

    // Initialize event translator
    this.eventTranslator = new EventTranslator();

    // Initialize health monitor
    this.healthMonitor = new HealthMonitor({
      checkInterval: 30000, // 30 seconds
      failureThreshold: 3,
      timeout: 5000,
    });

    // Initialize statistics
    this.stats = {
      state: ServiceState.STOPPED,
      activeMappings: 0,
      unlocksProcessed: 0,
      eventsForwarded: 0,
      errors: 0,
    };

    // Set up mapping service event listeners
    this.mappingService.on('mapping-added', (mapping: DoorMapping) => {
      logger.info(`Mapping added event: ${mapping.name}`);
      this.stats.activeMappings = this.mappingService.getCount();
    });

    this.mappingService.on('mapping-removed', (lockId: string) => {
      logger.info(`Mapping removed event: ${lockId}`);
      this.stats.activeMappings = this.mappingService.getCount();
    });

    // Set up event translator event listeners
    this.eventTranslator.on('event-ready', ({ doordeckEvent, mapping }: any) => {
      // Forward translated event to Doordeck
      if (this.doordeckClient) {
        this.doordeckClient
          .sendDoorEvent(mapping.doordeckLockId, doordeckEvent)
          .then((success) => {
            if (success) {
              this.stats.eventsForwarded++;
              logger.debug(`Event forwarded to Doordeck: ${doordeckEvent.eventType}`);
            }
          })
          .catch((error) => {
            logger.error('Error forwarding event to Doordeck:', error);
          });
      }
    });

    logger.info('BridgeService created');
  }

  /**
   * Initialize the bridge service with configuration
   */
  async initialize(config: BridgeConfig): Promise<void> {
    try {
      logger.info('Initializing bridge service...');
      this.setState(ServiceState.STARTING);

      this.config = config;

      // Initialize Doordeck client
      logger.info('Initializing Doordeck client...');
      this.doordeckClient = new DoordeckClient(
        config.doordeck.apiToken,
        config.doordeck.refreshToken
      );
      await this.doordeckClient.initialize();

      // Set UniFi credentials for door registration
      // (will be used later in syncDoors)
      if (this.doordeckClient instanceof DoordeckClient) {
        // Construct full base URL for UniFi controller
        // Doordeck requires a full URL (not just hostname)
        const protocol = config.unifi.verifySsl === false ? 'https' : 'https'; // Always use HTTPS
        const port = config.unifi.port || 443;
        const baseUrl = `${protocol}://${config.unifi.host}:${port}`;

        if (config.unifi.username && config.unifi.password) {
          // Username/password authentication
          this.doordeckClient.setUniFiCredentials(
            baseUrl,
            config.unifi.username,
            config.unifi.password
          );
        } else if (config.unifi.apiKey) {
          // API key authentication - use placeholder credentials with API key
          // Doordeck needs these to create the UniFi controller integration
          this.doordeckClient.setUniFiCredentials(
            baseUrl,
            'api-key', // Placeholder username
            config.unifi.apiKey // Use API key as password
          );
        }
      }

      logger.info('Doordeck client initialized');

      // Set up Doordeck event listeners (DoordeckClient extends EventEmitter)
      if (this.doordeckClient instanceof DoordeckClient) {
        this.doordeckClient.on('door-started', (lockId: string) => {
          logger.info(`Doordeck door monitoring started: ${lockId}`);
        });

        this.doordeckClient.on('door-stopped', (lockId: string) => {
          logger.info(`Doordeck door monitoring stopped: ${lockId}`);
        });

        this.doordeckClient.on('event-sent', ({ lockId, event }: { lockId: string; event: UniFiDoorEvent }) => {
          logger.debug(`Event sent to Doordeck for lock ${lockId}: ${event.type}`);
        });

        // Listen for unlock commands from Doordeck
        this.doordeckClient.on('unlock-command', (command: UnlockCommand) => {
          logger.info(`Unlock command received from Doordeck: ${command.lockId}`);
          this.handleUnlockCommand(command).catch((error) => {
            logger.error('Error handling unlock command:', error);
          });
        });
      }

      // Initialize UniFi client based on authentication method
      logger.info('Initializing UniFi Access client...');

      if (config.unifi.apiKey) {
        // Use UniFiOSClient for API key authentication
        logger.info('Using UniFi OS Client (API key authentication)');
        this.unifiClient = new UniFiOSClient(config.unifi) as unknown as IUniFiClient;
        // Note: UniFiOSClient doesn't have initialize() method, it's ready to use
        logger.info('UniFi OS client initialized');
      } else if (config.unifi.username && config.unifi.password) {
        // Use legacy UniFiClient for username/password authentication
        logger.info('Using UniFi Client (username/password authentication)');
        this.unifiClient = new UniFiClient(
          config.unifi.reconnectDelay,
          config.unifi.maxRetries
        );
        await this.unifiClient.initialize();
        logger.info('UniFi Access client initialized');
      } else {
        throw new Error('No valid UniFi Access authentication configured');
      }

      // Set up UniFi event listeners
      if (this.unifiClient instanceof UniFiClient) {
        this.unifiClient.on('bootstrap-complete', () => {
          logger.info('UniFi Access bootstrap completed');
        });

        this.unifiClient.on('error', (error: Error) => {
          logger.error('UniFi Access error:', error);
          this.recordError(error);
        });

        this.unifiClient.on('connection-failed', (error: Error) => {
          logger.error('UniFi Access connection failed after max retries:', error);
          this.setState(ServiceState.ERROR);
        });
      }

      // Load door mappings from persistent storage
      logger.info('Loading door mappings...');
      await this.mappingService.load();
      logger.info(`Loaded ${this.mappingService.getCount()} door mappings`);

      this.setState(ServiceState.STOPPED);
      logger.info('Bridge service initialized');
    } catch (error) {
      this.setState(ServiceState.ERROR);
      this.recordError(error);
      throw error;
    }
  }

  /**
   * Start the bridge service
   */
  async start(): Promise<void> {
    try {
      if (this.state === ServiceState.RUNNING) {
        logger.warn('Bridge service already running');
        return;
      }

      if (!this.config) {
        throw new Error('Bridge service not initialized');
      }

      logger.info('Starting bridge service...');
      this.setState(ServiceState.STARTING);
      this.startedAt = new Date();

      // Authenticate with Doordeck
      if (!this.doordeckClient) {
        throw new Error('Doordeck client not initialized');
      }

      // Login to Doordeck Cloud API with email/password
      logger.info('Authenticating with Doordeck Cloud API...');
      const doordeckAuthenticated = await this.doordeckClient.login(
        this.config.doordeck.email,
        this.config.doordeck.password
      );

      if (!doordeckAuthenticated) {
        throw new Error('Failed to authenticate with Doordeck');
      }

      logger.info('Successfully authenticated with Doordeck Cloud API');


      // Connect to UniFi Access
      if (!this.unifiClient) {
        throw new Error('UniFi client not initialized');
      }

      logger.info('Connecting to UniFi Access...');

      // Check which authentication method to use
      if (this.config.unifi.apiKey) {
        // Using API key authentication - UniFiOSClient doesn't need login
        logger.info('Using API key authentication (UniFi OS)');
      } else if (this.config.unifi.username && this.config.unifi.password) {
        // Using username/password authentication
        logger.info('Using username/password authentication');
        const unifiConnected = await this.unifiClient.login(
          this.config.unifi.host,
          this.config.unifi.username,
          this.config.unifi.password
        );

        if (!unifiConnected) {
          throw new Error('Failed to connect to UniFi Access controller');
        }
      } else {
        throw new Error('No valid UniFi Access authentication configured (need either apiKey or username/password)');
      }

      logger.info('Connected to UniFi Access controller');

      // Start event listeners for UniFi door events (if supported)
      // Note: UniFiOSClient (API key auth) doesn't support WebSocket events yet
      if (typeof this.unifiClient.startEventListener === 'function') {
        logger.info('Starting UniFi event listeners...');
        this.unifiClient.startEventListener((event: UniFiDoorEvent) => {
          // Forward events to the handleUniFiEvent method
          this.handleUniFiEvent(event).catch((error) => {
            logger.error('Error handling UniFi event:', error);
          });
        });
      } else {
        logger.info('UniFi event listeners not available (using REST API polling mode)');
      }

      // Sync doors from UniFi to Doordeck
      logger.info('Syncing doors...');
      await this.syncDoors();

      // Start event translator
      logger.info('Starting event translator...');
      this.eventTranslator.start();

      // Start health monitoring
      logger.info('Starting health monitoring...');
      this.startHealthMonitoring();

      this.setState(ServiceState.RUNNING);
      logger.info('Bridge service started successfully');
      this.emit('started');
    } catch (error) {
      this.setState(ServiceState.ERROR);
      this.recordError(error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the bridge service
   */
  async stop(): Promise<void> {
    try {
      if (this.state === ServiceState.STOPPED) {
        logger.warn('Bridge service already stopped');
        return;
      }

      logger.info('Stopping bridge service...');
      this.setState(ServiceState.STOPPING);

      // Stop health monitoring
      logger.info('Stopping health monitoring...');
      this.healthMonitor.stop();

      // Stop event translator
      logger.info('Stopping event translator...');
      this.eventTranslator.stop();

      // Stop event listeners
      if (this.unifiClient) {
        logger.info('Stopping UniFi event listeners...');
        this.unifiClient.stopEventListener();
      }

      // Disconnect from UniFi Access
      if (this.unifiClient) {
        logger.info('Disconnecting from UniFi Access...');
        await this.unifiClient.disconnect();
      }

      // Disconnect from Doordeck
      if (this.doordeckClient) {
        logger.info('Disconnecting from Doordeck...');
        await this.doordeckClient.disconnect();
      }

      // Save and cleanup mapping service
      logger.info('Saving door mappings...');
      await this.mappingService.cleanup();

      this.setState(ServiceState.STOPPED);
      this.startedAt = undefined;
      logger.info('Bridge service stopped');
      this.emit('stopped');
    } catch (error) {
      this.setState(ServiceState.ERROR);
      this.recordError(error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Sync doors from UniFi to Doordeck
   */
  async syncDoors(): Promise<void> {
    const syncedDoors: DoorMapping[] = [];
    const failedDoors: Array<{ name: string; error: string }> = [];

    try {
      if (!this.unifiClient) {
        throw new Error('UniFi client not initialized');
      }

      if (!this.doordeckClient) {
        throw new Error('Doordeck client not initialized');
      }

      logger.info('Starting door synchronization...');

      // Discover doors from UniFi Access
      logger.info('Discovering UniFi doors...');
      const unifiDoors = await this.unifiClient.discoverDoors();

      if (unifiDoors.length === 0) {
        logger.warn('No UniFi doors found to synchronize');
        return;
      }

      logger.info(`Found ${unifiDoors.length} UniFi doors to synchronize`);

      // Register doors with Doordeck and start monitoring
      logger.info('Registering doors with Doordeck...');
      let successCount = 0;
      let failureCount = 0;

      for (const door of unifiDoors) {
        try {
          logger.info(`Processing door ${successCount + failureCount + 1}/${unifiDoors.length}: ${door.name} (${door.id})`);

          // Check if door already exists in mappings
          const existingMapping = this.mappingService.getMappingByUniFiDoorId(door.id);
          if (existingMapping) {
            logger.info(`Door already mapped, skipping: ${door.name}`);
            syncedDoors.push(existingMapping);
            successCount++;
            continue;
          }

          // Create door mapping
          const mapping: DoorMapping = {
            id: `mapping-${door.id}`,
            doordeckLockId: `lock-${door.id}`,
            unifiDoorId: door.id,
            siteId: this.config.siteId || this.generateSiteId(), // Use configured siteId or auto-generate
            name: door.name,
            enabled: true,
            metadata: door.metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Try to register door with Doordeck Cloud (optional)
          // If registration fails, we still add the door for local REST API access
          try {
            logger.debug(`Attempting Doordeck cloud registration: ${mapping.name}`);
            const registered = await this.doordeckClient.registerDoor(mapping);

            if (registered) {
              // Try to start monitoring for unlock commands from Doordeck
              const started = await this.doordeckClient.startDoor(mapping.doordeckLockId);
              if (started) {
                logger.info(`✓ Doordeck cloud sync enabled for: ${mapping.name}`);
              } else {
                logger.warn(`⚠ Doordeck monitoring unavailable for: ${mapping.name}`);
              }
            } else {
              logger.warn(`⚠ Doordeck cloud registration skipped for: ${mapping.name}`);
            }
          } catch (error) {
            // Log warning but continue - door will still work via local REST API
            logger.warn(`⚠ Doordeck cloud integration unavailable for ${mapping.name}:`, error);
            logger.info(`  → Door will be available via local REST API only`);
          }

          // Add to active mappings (works even without Doordeck cloud)
          await this.addDoorMapping(mapping);
          syncedDoors.push(mapping);
          successCount++;

          logger.info(
            `✓ Door synced successfully (${successCount}/${unifiDoors.length}): ${mapping.name}`
          );
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          logger.error(`Error syncing door ${door.name}:`, error);
          failedDoors.push({ name: door.name, error: errorMsg });
          failureCount++;
        }
      }

      // Update statistics
      this.stats.activeMappings = this.mappingService.getCount();

      // Log summary
      logger.info('===== Door Sync Summary =====');
      logger.info(`Total doors found: ${unifiDoors.length}`);
      logger.info(`Successfully synced: ${successCount}`);
      logger.info(`Failed: ${failureCount}`);
      logger.info(`Active mappings: ${this.stats.activeMappings}`);

      if (failedDoors.length > 0) {
        logger.warn('Failed doors:');
        failedDoors.forEach((failed) => {
          logger.warn(`  - ${failed.name}: ${failed.error}`);
        });
      }

      logger.info('=============================');

      // Emit sync completed event
      this.emit('doors-synced', {
        total: unifiDoors.length,
        synced: successCount,
        failed: failureCount,
        activeMappings: this.stats.activeMappings,
        failedDoors,
      });

      // Note: We no longer fail if Doordeck cloud sync doesn't work
      // Doors are still accessible via local REST API
    } catch (error) {
      this.recordError(error);
      logger.error('Door synchronization failed:', error);
      throw error;
    }
  }

  /**
   * Get current service statistics
   */
  getStats(): BridgeStats {
    return {
      ...this.stats,
      state: this.state,
      startedAt: this.startedAt,
      activeMappings: this.mappingService.getCount(),
    };
  }

  /**
   * Get current service state
   */
  getState(): ServiceState {
    return this.state;
  }

  /**
   * Handle unlock command from Doordeck
   */
  private async handleUnlockCommand(command: UnlockCommand): Promise<void> {
    try {
      logger.info(`Handling unlock command for lock: ${command.lockId}`);

      // Find door mapping
      const mapping = this.mappingService.getMapping(command.lockId);
      if (!mapping) {
        logger.warn(`No mapping found for lock: ${command.lockId}`);
        return;
      }

      if (!mapping.enabled) {
        logger.warn(`Mapping disabled for lock: ${command.lockId}`);
        return;
      }

      // Unlock door via UniFi
      if (this.unifiClient) {
        const success = await this.unifiClient.unlock(mapping.unifiDoorId);
        if (success) {
          this.stats.unlocksProcessed++;
          logger.info(`Successfully unlocked door: ${mapping.name}`);
          this.emit('door-unlocked', mapping);
        } else {
          logger.error(`Failed to unlock door: ${mapping.name}`);
        }
      }
    } catch (error) {
      this.recordError(error);
      logger.error('Error handling unlock command:', error);
    }
  }

  /**
   * Handle door event from UniFi
   * Called by UniFi event listener
   */
  private async handleUniFiEvent(event: UniFiDoorEvent): Promise<void> {
    try {
      logger.debug(`Handling UniFi event: ${event.type} for door: ${event.doorId}`);

      // Find door mapping by UniFi door ID
      const mapping = this.mappingService.getMappingByUniFiDoorId(event.doorId);

      if (!mapping) {
        logger.debug(`No mapping found for UniFi door: ${event.doorId}`);
        return;
      }

      if (!mapping.enabled) {
        logger.debug(`Mapping disabled for door: ${mapping.name}`);
        return;
      }

      // Translate and queue event for forwarding to Doordeck
      const queued = await this.eventTranslator.translateAndQueue(event, mapping);
      if (queued) {
        logger.debug(`Event queued for translation: ${event.type} for door ${mapping.name}`);
      }
    } catch (error) {
      this.recordError(error);
      logger.error('Error handling UniFi event:', error);
    }
  }

  /**
   * Set service state and emit event
   */
  private setState(state: ServiceState): void {
    const previousState = this.state;
    this.state = state;
    this.stats.state = state;

    if (previousState !== state) {
      logger.info(`Bridge service state changed: ${previousState} → ${state}`);
      this.emit('state-changed', { previous: previousState, current: state });
    }
  }

  /**
   * Record error in statistics
   */
  private recordError(error: unknown): void {
    this.stats.errors++;
    this.stats.lastError = error instanceof Error ? error.message : String(error);
    logger.error('Error recorded in statistics:', error);
  }

  /**
   * Generate a unique site ID based on configuration
   * Uses organization/host information to create a stable identifier
   */
  private generateSiteId(): string {
    if (this.generatedSiteId) {
      return this.generatedSiteId;
    }

    if (!this.config) {
      return 'default-site';
    }

    // Generate based on UniFi host to ensure consistency
    const host = this.config.unifi.host;
    const cleanHost = host.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    this.generatedSiteId = `site-${cleanHost}`;

    logger.info(`Generated site ID: ${this.generatedSiteId}`);
    return this.generatedSiteId;
  }

  /**
   * Add a door mapping
   */
  async addDoorMapping(mapping: DoorMapping): Promise<void> {
    await this.mappingService.addMapping(mapping);
    this.stats.activeMappings = this.mappingService.getCount();
    logger.info(`Door mapping added: ${mapping.name} (${mapping.doordeckLockId})`);
    this.emit('mapping-added', mapping);
  }

  /**
   * Remove a door mapping
   */
  async removeDoorMapping(lockId: string): Promise<boolean> {
    try {
      await this.mappingService.removeMapping(lockId);
      this.stats.activeMappings = this.mappingService.getCount();
      logger.info(`Door mapping removed: ${lockId}`);
      this.emit('mapping-removed', lockId);
      return true;
    } catch (error) {
      logger.error(`Failed to remove door mapping: ${lockId}`, error);
      return false;
    }
  }

  /**
   * Get all door mappings
   */
  getDoorMappings(): DoorMapping[] {
    return this.mappingService.getAllMappings();
  }

  /**
   * Get a specific door mapping
   */
  getDoorMapping(lockId: string): DoorMapping | undefined {
    return this.mappingService.getMapping(lockId);
  }

  /**
   * Start health monitoring for all components
   */
  private startHealthMonitoring(): void {
    // Register UniFi client health check
    this.healthMonitor.registerComponent('unifi', async () => {
      try {
        if (!this.unifiClient) {
          return {
            status: HealthStatus.UNHEALTHY,
            message: 'UniFi client not initialized',
            timestamp: new Date(),
          };
        }

        // Check if UniFi client is connected by checking if it's an instance with the method
        const isConnected =
          this.unifiClient instanceof UniFiClient && this.unifiClient.isClientConnected();
        return {
          status: isConnected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          message: isConnected ? 'UniFi connected' : 'UniFi disconnected',
          timestamp: new Date(),
          details: {
            connected: isConnected,
          },
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        };
      }
    });

    // Register Doordeck client health check
    this.healthMonitor.registerComponent('doordeck', async () => {
      try {
        if (!this.doordeckClient) {
          return {
            status: HealthStatus.UNHEALTHY,
            message: 'Doordeck client not initialized',
            timestamp: new Date(),
          };
        }

        // Check if Doordeck client is connected by checking if it's an instance with the method
        const isConnected =
          this.doordeckClient instanceof DoordeckClient &&
          this.doordeckClient.isConnected();
        const activeDoors =
          this.doordeckClient instanceof DoordeckClient
            ? this.doordeckClient.getActiveDoors().length
            : 0;

        return {
          status: isConnected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          message: isConnected ? 'Doordeck connected' : 'Doordeck disconnected',
          timestamp: new Date(),
          details: {
            connected: isConnected,
            activeDoors,
          },
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        };
      }
    });

    // Handle health status changes
    this.healthMonitor.on('status-changed', ({ component, currentStatus, health }) => {
      logger.info(
        `Health status changed for ${component}: ${currentStatus} - ${health.message}`
      );

      // Emit health status change event
      this.emit('health-changed', {
        component,
        status: currentStatus,
        health,
      });

      // Handle degraded or unhealthy states (graceful degradation)
      if (currentStatus === HealthStatus.UNHEALTHY) {
        logger.error(`Component ${component} is unhealthy - system may be degraded`);
        this.handleComponentUnhealthy(component);
      }
    });

    // Start the monitor
    this.healthMonitor.start();
  }

  /**
   * Handle unhealthy component (graceful degradation)
   */
  private handleComponentUnhealthy(component: string): void {
    switch (component) {
      case 'unifi':
        logger.warn('UniFi Access is unhealthy - unlock commands may fail');
        // System continues but unlock operations will fail gracefully
        break;

      case 'doordeck':
        logger.warn('Doordeck Cloud is unhealthy - event forwarding may be delayed');
        // Events will queue and be sent when connection recovers
        break;

      default:
        logger.warn(`Unknown component ${component} is unhealthy`);
    }
  }

  /**
   * Get health status of all components
   */
  getHealth() {
    return {
      overall: this.healthMonitor.getOverallHealth(),
      components: this.healthMonitor.getAllHealth(),
      stats: this.getStats(),
    };
  }
}
