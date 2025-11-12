import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { UniFiDoorEvent, DoorEventType, DoorMapping } from '../../types';

/**
 * Door event in Doordeck format
 */
export interface DoordeckDoorEvent {
  /** Doordeck lock ID */
  lockId: string;

  /** Event type */
  eventType: string;

  /** Timestamp */
  timestamp: string;

  /** Door state */
  state?: {
    locked?: boolean;
    opened?: boolean;
    forced?: boolean;
    heldOpen?: boolean;
  };

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Queued event entry
 */
interface QueuedEvent {
  id: string;
  event: DoordeckDoorEvent;
  unifiEvent: UniFiDoorEvent;
  mapping: DoorMapping;
  timestamp: Date;
  attempts: number;
}

/**
 * Event translator that converts UniFi Access events to Doordeck format
 *
 * Features:
 * - Event type mapping
 * - Event queuing for offline scenarios
 * - Deduplication to prevent duplicate events
 * - Rate limiting/throttling
 * - Event enrichment with metadata
 */
export class EventTranslator extends EventEmitter {
  private eventQueue: QueuedEvent[] = [];
  private processedEvents = new Set<string>();
  private deduplicationWindow = 5000; // 5 seconds
  private maxQueueSize = 1000;
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;
  private processingDelay = 1000; // 1 second between batch processing

  constructor() {
    super();
  }

  /**
   * Start event processing
   */
  start(): void {
    if (this.isProcessing) {
      logger.warn('EventTranslator already processing');
      return;
    }

    logger.info('Starting event translator...');
    this.isProcessing = true;

    // Process queue periodically
    this.processingInterval = setInterval(() => {
      this.processQueue().catch((error) => {
        logger.error('Error processing event queue:', error);
      });
    }, this.processingDelay);

    logger.info('Event translator started');
  }

  /**
   * Stop event processing
   */
  stop(): void {
    if (!this.isProcessing) {
      logger.warn('EventTranslator not processing');
      return;
    }

    logger.info('Stopping event translator...');
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    // Clear deduplication set
    this.processedEvents.clear();

    logger.info(`Event translator stopped (${this.eventQueue.length} events in queue)`);
  }

  /**
   * Translate and queue a UniFi event for sending to Doordeck
   */
  async translateAndQueue(
    unifiEvent: UniFiDoorEvent,
    mapping: DoorMapping
  ): Promise<boolean> {
    try {
      // Check if event was already processed (deduplication)
      const eventId = this.generateEventId(unifiEvent, mapping);
      if (this.isRecentlyProcessed(eventId)) {
        logger.debug(`Duplicate event detected, skipping: ${eventId}`);
        return false;
      }

      // Check queue size
      if (this.eventQueue.length >= this.maxQueueSize) {
        logger.warn(`Event queue full (${this.maxQueueSize}), dropping oldest events`);
        // Remove oldest 10% of queue
        this.eventQueue.splice(0, Math.floor(this.maxQueueSize * 0.1));
      }

      // Translate event to Doordeck format
      const doordeckEvent = this.translateEvent(unifiEvent, mapping);

      // Create queued event entry
      const queuedEvent: QueuedEvent = {
        id: eventId,
        event: doordeckEvent,
        unifiEvent,
        mapping,
        timestamp: new Date(),
        attempts: 0,
      };

      // Add to queue
      this.eventQueue.push(queuedEvent);
      logger.debug(`Event queued: ${eventId} (queue size: ${this.eventQueue.length})`);

      // Mark as processed
      this.markAsProcessed(eventId);

      return true;
    } catch (error) {
      logger.error('Error translating and queuing event:', error);
      return false;
    }
  }

  /**
   * Translate UniFi event to Doordeck format
   */
  private translateEvent(
    unifiEvent: UniFiDoorEvent,
    mapping: DoorMapping
  ): DoordeckDoorEvent {
    // Map event type
    const eventType = this.mapEventType(unifiEvent.type);

    // Calculate door state based on event type
    const state = this.calculateDoorState(unifiEvent.type);

    // Build Doordeck event
    const doordeckEvent: DoordeckDoorEvent = {
      lockId: mapping.doordeckLockId,
      eventType,
      timestamp: unifiEvent.timestamp.toISOString(),
      state,
      metadata: {
        unifiDoorId: unifiEvent.doorId,
        doorName: mapping.name,
        siteId: mapping.siteId,
        originalEvent: unifiEvent.data,
      },
    };

    return doordeckEvent;
  }

  /**
   * Map UniFi event type to Doordeck event type
   */
  private mapEventType(type: DoorEventType): string {
    const typeMap: Record<DoorEventType, string> = {
      [DoorEventType.UNLOCKED]: 'door.unlocked',
      [DoorEventType.LOCKED]: 'door.locked',
      [DoorEventType.OPENED]: 'door.opened',
      [DoorEventType.CLOSED]: 'door.closed',
      [DoorEventType.FORCED]: 'door.forced',
      [DoorEventType.HELD_OPEN]: 'door.held_open',
      [DoorEventType.ACCESS_GRANTED]: 'access.granted',
      [DoorEventType.ACCESS_DENIED]: 'access.denied',
    };

    return typeMap[type] || 'door.event';
  }

  /**
   * Calculate door state based on event type
   */
  private calculateDoorState(type: DoorEventType): DoordeckDoorEvent['state'] {
    const state: DoordeckDoorEvent['state'] = {};

    switch (type) {
      case DoorEventType.UNLOCKED:
        state.locked = false;
        break;
      case DoorEventType.LOCKED:
        state.locked = true;
        break;
      case DoorEventType.OPENED:
        state.opened = true;
        break;
      case DoorEventType.CLOSED:
        state.opened = false;
        break;
      case DoorEventType.FORCED:
        state.forced = true;
        state.opened = true;
        break;
      case DoorEventType.HELD_OPEN:
        state.heldOpen = true;
        state.opened = true;
        break;
      case DoorEventType.ACCESS_GRANTED:
        // Access granted doesn't change door state directly
        break;
      case DoorEventType.ACCESS_DENIED:
        // Access denied doesn't change door state
        break;
    }

    return state;
  }

  /**
   * Process queued events
   */
  private async processQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return; // Nothing to process
    }

    // Process events in batches
    const batchSize = 10;
    const batch = this.eventQueue.splice(0, batchSize);

    for (const queuedEvent of batch) {
      try {
        queuedEvent.attempts++;

        // Emit event for sending to Doordeck
        this.emit('event-ready', {
          doordeckEvent: queuedEvent.event,
          mapping: queuedEvent.mapping,
          queuedEvent,
        });

        logger.debug(`Event processed: ${queuedEvent.id}`);
      } catch (error) {
        logger.error(`Error processing queued event ${queuedEvent.id}:`, error);

        // Re-queue if not exceeded max attempts
        if (queuedEvent.attempts < 3) {
          this.eventQueue.push(queuedEvent);
          logger.debug(`Event re-queued: ${queuedEvent.id} (attempt ${queuedEvent.attempts}/3)`);
        } else {
          logger.error(`Event dropped after max attempts: ${queuedEvent.id}`);
        }
      }
    }
  }

  /**
   * Generate unique event ID for deduplication
   */
  private generateEventId(event: UniFiDoorEvent, mapping: DoorMapping): string {
    return `${mapping.doordeckLockId}:${event.type}:${event.timestamp.getTime()}`;
  }

  /**
   * Check if event was recently processed
   */
  private isRecentlyProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Mark event as processed
   */
  private markAsProcessed(eventId: string): void {
    this.processedEvents.add(eventId);

    // Remove from set after deduplication window
    setTimeout(() => {
      this.processedEvents.delete(eventId);
    }, this.deduplicationWindow);
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueSize: this.eventQueue.length,
      processedCount: this.processedEvents.size,
      isProcessing: this.isProcessing,
      maxQueueSize: this.maxQueueSize,
      deduplicationWindow: this.deduplicationWindow,
    };
  }

  /**
   * Clear event queue
   */
  clearQueue(): void {
    const count = this.eventQueue.length;
    this.eventQueue = [];
    logger.info(`Event queue cleared (${count} events removed)`);
  }

  /**
   * Set deduplication window (in milliseconds)
   */
  setDeduplicationWindow(ms: number): void {
    this.deduplicationWindow = ms;
    logger.info(`Deduplication window set to ${ms}ms`);
  }

  /**
   * Set max queue size
   */
  setMaxQueueSize(size: number): void {
    this.maxQueueSize = size;
    logger.info(`Max queue size set to ${size}`);
  }

  /**
   * Set processing delay (in milliseconds)
   */
  setProcessingDelay(ms: number): void {
    this.processingDelay = ms;

    // Restart processing with new delay if already running
    if (this.isProcessing) {
      this.stop();
      this.start();
    }

    logger.info(`Processing delay set to ${ms}ms`);
  }
}
