import { EventEmitter } from 'events';
import { com } from '@doordeck/doordeck-headless-sdk/kotlin/doordeck-sdk';
import { logger } from '../../utils/logger';
import { UnlockCommand } from '../../types';

/**
 * Service for listening to unlock commands from Doordeck Cloud
 *
 * NOTE: This is a polling-based implementation. The actual Doordeck Fusion API
 * might use WebSocket or a callback mechanism for real-time command delivery.
 * This implementation should be replaced with the proper mechanism once clarified.
 *
 * The Fusion API workflow:
 * 1. Doors are registered with Doordeck Cloud via enableDoor()
 * 2. Monitoring is started via startDoor()
 * 3. Unlock commands come from Doordeck mobile app via cloud
 * 4. This service detects and emits those commands
 */
export class CommandListener extends EventEmitter {
  private isListening = false;
  private pollingInterval?: NodeJS.Timeout;
  private monitoredDoors: Set<string> = new Set();
  private pollInterval: number;
  private doorStates: Map<string, any> = new Map();

  constructor(pollInterval = 5000) {
    super();
    this.pollInterval = pollInterval;
  }

  /**
   * Start listening for unlock commands
   */
  async start(): Promise<void> {
    if (this.isListening) {
      logger.warn('CommandListener already listening');
      return;
    }

    logger.info('Starting unlock command listener...');

    // TODO: Replace this polling mechanism with proper WebSocket or callback
    // when the actual Doordeck Fusion API command delivery mechanism is clarified
    this.pollingInterval = setInterval(() => {
      this.checkForUnlockCommands().catch((error) => {
        logger.error('Error checking for unlock commands:', error);
      });
    }, this.pollInterval);

    this.isListening = true;
    logger.info(`Command listener started (polling every ${this.pollInterval}ms)`);
  }

  /**
   * Stop listening for unlock commands
   */
  async stop(): Promise<void> {
    if (!this.isListening) {
      logger.warn('CommandListener not listening');
      return;
    }

    logger.info('Stopping unlock command listener...');

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    this.isListening = false;
    this.monitoredDoors.clear();
    this.doorStates.clear();

    logger.info('Command listener stopped');
  }

  /**
   * Add a door to monitor for unlock commands
   */
  addDoor(lockId: string): void {
    this.monitoredDoors.add(lockId);
    logger.debug(`Added door to command monitoring: ${lockId}`);
  }

  /**
   * Remove a door from monitoring
   */
  removeDoor(lockId: string): void {
    this.monitoredDoors.delete(lockId);
    this.doorStates.delete(lockId);
    logger.debug(`Removed door from command monitoring: ${lockId}`);
  }

  /**
   * Check for unlock commands by polling door status
   *
   * TODO: Replace with proper WebSocket or callback mechanism
   */
  private async checkForUnlockCommands(): Promise<void> {
    try {
      if (this.monitoredDoors.size === 0) {
        return; // No doors to monitor
      }

      for (const lockId of this.monitoredDoors) {
        try {
          // Get current door status from Doordeck
          const status = await com.doordeck.multiplatform.sdk.api.fusion().getDoorStatus(lockId);

          // Check if status indicates an unlock request
          // The exact status structure depends on Doordeck's API
          // This is a simplified implementation
          const previousState = this.doorStates.get(lockId);

          // If the door status has changed and indicates an unlock request
          if (this.hasUnlockRequest(status, previousState)) {
            logger.info(`Unlock command detected for lock: ${lockId}`);

            // Create unlock command
            const command: UnlockCommand = {
              lockId,
              userId: (status as any).user_id,
              timestamp: new Date(),
              data: status as unknown as Record<string, unknown>,
            };

            // Emit unlock command event
            this.emit('unlock-command', command);
          }

          // Store current state for next comparison
          this.doorStates.set(lockId, status);
        } catch (error) {
          logger.debug(`Error checking status for door ${lockId}:`, error);
          // Continue with next door
        }
      }
    } catch (error) {
      logger.error('Error in checkForUnlockCommands:', error);
    }
  }

  /**
   * Determine if the door status indicates an unlock request
   *
   * TODO: Update this logic based on actual Doordeck API response structure
   */
  private hasUnlockRequest(currentStatus: any, previousStatus: any): boolean {
    if (!currentStatus) {
      return false;
    }

    // If no previous status, this is the first check - no unlock request
    if (!previousStatus) {
      return false;
    }

    // Check if there's a pending unlock command in the status
    // This is speculative - actual field names depend on Doordeck API
    const hasPendingUnlock =
      currentStatus.pending_unlock === true ||
      currentStatus.unlock_requested === true ||
      (currentStatus.command === 'unlock' && currentStatus.executed !== true);

    // Check if unlock state changed
    const unlockStateChanged =
      currentStatus.unlock_state !== previousStatus.unlock_state &&
      currentStatus.unlock_state === 'requested';

    return hasPendingUnlock || unlockStateChanged;
  }

  /**
   * Get number of doors being monitored
   */
  getMonitoredDoorCount(): number {
    return this.monitoredDoors.size;
  }

  /**
   * Check if listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Set polling interval (in milliseconds)
   */
  setPollingInterval(interval: number): void {
    this.pollInterval = interval;

    // Restart polling with new interval if currently listening
    if (this.isListening) {
      this.stop().then(() => this.start());
    }
  }
}
