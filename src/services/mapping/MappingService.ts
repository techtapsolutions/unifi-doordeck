import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger';
import { DoorMapping } from '../../types';

/**
 * Service for managing door mappings between Doordeck and UniFi Access
 *
 * Responsibilities:
 * - Load and save door mappings to persistent storage
 * - CRUD operations for door mappings
 * - Validation of door mappings
 * - Event notifications for mapping changes
 */
export class MappingService extends EventEmitter {
  private mappings: Map<string, DoorMapping> = new Map();
  private mappingsFile: string;
  private isDirty = false;
  private saveTimer?: NodeJS.Timeout;
  private autoSaveDelay = 5000; // 5 seconds

  constructor(mappingsFilePath?: string) {
    super();

    // Default to mappings.json in the project root
    this.mappingsFile = mappingsFilePath || path.join(process.cwd(), 'mappings.json');

    logger.info(`MappingService initialized with file: ${this.mappingsFile}`);
  }

  /**
   * Load mappings from persistent storage
   */
  async load(): Promise<void> {
    try {
      logger.info('Loading door mappings from file...');

      // Check if file exists
      try {
        await fs.access(this.mappingsFile);
      } catch (error) {
        logger.info('Mappings file does not exist, starting with empty mappings');
        return;
      }

      // Read and parse file
      const data = await fs.readFile(this.mappingsFile, 'utf-8');
      const mappingsArray: DoorMapping[] = JSON.parse(data);

      // Convert dates from strings
      for (const mapping of mappingsArray) {
        mapping.createdAt = new Date(mapping.createdAt);
        mapping.updatedAt = new Date(mapping.updatedAt);
        this.mappings.set(mapping.doordeckLockId, mapping);
      }

      logger.info(`Loaded ${this.mappings.size} door mappings`);
      this.emit('mappings-loaded', this.mappings.size);
    } catch (error) {
      logger.error('Failed to load door mappings:', error);
      throw error;
    }
  }

  /**
   * Save mappings to persistent storage
   */
  async save(immediate = false): Promise<void> {
    try {
      // If not immediate, schedule auto-save
      if (!immediate) {
        this.isDirty = true;

        if (this.saveTimer) {
          clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(() => {
          this.save(true).catch((error) => {
            logger.error('Auto-save failed:', error);
          });
        }, this.autoSaveDelay);

        return;
      }

      if (!this.isDirty && !immediate) {
        return; // Nothing to save
      }

      logger.info('Saving door mappings to file...');

      // Convert Map to array
      const mappingsArray = Array.from(this.mappings.values());

      // Ensure directory exists
      const dir = path.dirname(this.mappingsFile);
      await fs.mkdir(dir, { recursive: true });

      // Write to file
      await fs.writeFile(
        this.mappingsFile,
        JSON.stringify(mappingsArray, null, 2),
        'utf-8'
      );

      this.isDirty = false;
      logger.info(`Saved ${mappingsArray.length} door mappings`);
      this.emit('mappings-saved', mappingsArray.length);
    } catch (error) {
      logger.error('Failed to save door mappings:', error);
      throw error;
    }
  }

  /**
   * Add a new door mapping
   */
  async addMapping(mapping: DoorMapping): Promise<void> {
    try {
      // Validate mapping
      this.validateMapping(mapping);

      // Check for duplicates
      if (this.mappings.has(mapping.doordeckLockId)) {
        throw new Error(`Mapping already exists for lock ID: ${mapping.doordeckLockId}`);
      }

      // Check for duplicate UniFi door ID
      for (const existing of this.mappings.values()) {
        if (existing.unifiDoorId === mapping.unifiDoorId) {
          throw new Error(`UniFi door ${mapping.unifiDoorId} is already mapped to lock ${existing.doordeckLockId}`);
        }
      }

      // Set timestamps
      const now = new Date();
      mapping.createdAt = now;
      mapping.updatedAt = now;

      // Add to map
      this.mappings.set(mapping.doordeckLockId, mapping);

      logger.info(`Added door mapping: ${mapping.name} (${mapping.doordeckLockId} \u2194 ${mapping.unifiDoorId})`);

      // Save to file (deferred)
      await this.save();

      this.emit('mapping-added', mapping);
    } catch (error) {
      logger.error('Failed to add door mapping:', error);
      throw error;
    }
  }

  /**
   * Update an existing door mapping
   */
  async updateMapping(lockId: string, updates: Partial<DoorMapping>): Promise<void> {
    try {
      const existing = this.mappings.get(lockId);

      if (!existing) {
        throw new Error(`Mapping not found for lock ID: ${lockId}`);
      }

      // Create updated mapping
      const updated: DoorMapping = {
        ...existing,
        ...updates,
        // Preserve immutable fields
        id: existing.id,
        doordeckLockId: existing.doordeckLockId,
        createdAt: existing.createdAt,
        // Update timestamp
        updatedAt: new Date(),
      };

      // Validate updated mapping
      this.validateMapping(updated);

      // Update in map
      this.mappings.set(lockId, updated);

      logger.info(`Updated door mapping: ${updated.name} (${lockId})`);

      // Save to file (deferred)
      await this.save();

      this.emit('mapping-updated', updated);
    } catch (error) {
      logger.error('Failed to update door mapping:', error);
      throw error;
    }
  }

  /**
   * Remove a door mapping
   */
  async removeMapping(lockId: string): Promise<void> {
    try {
      const mapping = this.mappings.get(lockId);

      if (!mapping) {
        throw new Error(`Mapping not found for lock ID: ${lockId}`);
      }

      // Remove from map
      this.mappings.delete(lockId);

      logger.info(`Removed door mapping: ${mapping.name} (${lockId})`);

      // Save to file (deferred)
      await this.save();

      this.emit('mapping-removed', lockId, mapping);
    } catch (error) {
      logger.error('Failed to remove door mapping:', error);
      throw error;
    }
  }

  /**
   * Get a door mapping by Doordeck lock ID
   */
  getMapping(lockId: string): DoorMapping | undefined {
    return this.mappings.get(lockId);
  }

  /**
   * Get a door mapping by UniFi door ID
   */
  getMappingByUniFiDoorId(unifiDoorId: string): DoorMapping | undefined {
    return Array.from(this.mappings.values()).find(
      (m) => m.unifiDoorId === unifiDoorId
    );
  }

  /**
   * Get all door mappings
   */
  getAllMappings(): DoorMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Get enabled door mappings only
   */
  getEnabledMappings(): DoorMapping[] {
    return Array.from(this.mappings.values()).filter((m) => m.enabled);
  }

  /**
   * Get door mappings for a specific site
   */
  getMappingsBySite(siteId: string): DoorMapping[] {
    return Array.from(this.mappings.values()).filter((m) => m.siteId === siteId);
  }

  /**
   * Check if a mapping exists
   */
  hasMapping(lockId: string): boolean {
    return this.mappings.has(lockId);
  }

  /**
   * Get total count of mappings
   */
  getCount(): number {
    return this.mappings.size;
  }

  /**
   * Clear all mappings
   */
  async clearAll(): Promise<void> {
    try {
      const count = this.mappings.size;
      this.mappings.clear();

      logger.warn(`Cleared all ${count} door mappings`);

      // Save to file immediately
      await this.save(true);

      this.emit('mappings-cleared', count);
    } catch (error) {
      logger.error('Failed to clear mappings:', error);
      throw error;
    }
  }

  /**
   * Validate a door mapping
   */
  private validateMapping(mapping: DoorMapping): void {
    const errors: string[] = [];

    if (!mapping.id || mapping.id.trim() === '') {
      errors.push('Mapping ID is required');
    }

    if (!mapping.doordeckLockId || mapping.doordeckLockId.trim() === '') {
      errors.push('Doordeck lock ID is required');
    }

    if (!mapping.unifiDoorId || mapping.unifiDoorId.trim() === '') {
      errors.push('UniFi door ID is required');
    }

    if (!mapping.siteId || mapping.siteId.trim() === '') {
      errors.push('Site ID is required');
    }

    if (!mapping.name || mapping.name.trim() === '') {
      errors.push('Door name is required');
    }

    if (typeof mapping.enabled !== 'boolean') {
      errors.push('Enabled flag must be a boolean');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid door mapping: ${errors.join(', ')}`);
    }
  }

  /**
   * Export mappings as JSON string
   */
  exportMappings(): string {
    const mappingsArray = Array.from(this.mappings.values());
    return JSON.stringify(mappingsArray, null, 2);
  }

  /**
   * Import mappings from JSON string
   */
  async importMappings(jsonData: string, merge = false): Promise<void> {
    try {
      const mappingsArray: DoorMapping[] = JSON.parse(jsonData);

      if (!Array.isArray(mappingsArray)) {
        throw new Error('Invalid mappings format: expected an array');
      }

      // Clear existing mappings if not merging
      if (!merge) {
        this.mappings.clear();
      }

      // Add all mappings
      for (const mapping of mappingsArray) {
        // Convert dates from strings
        mapping.createdAt = new Date(mapping.createdAt);
        mapping.updatedAt = new Date(mapping.updatedAt);

        // Validate
        this.validateMapping(mapping);

        // Add to map
        this.mappings.set(mapping.doordeckLockId, mapping);
      }

      logger.info(`Imported ${mappingsArray.length} door mappings`);

      // Save to file immediately
      await this.save(true);

      this.emit('mappings-imported', mappingsArray.length);
    } catch (error) {
      logger.error('Failed to import mappings:', error);
      throw error;
    }
  }

  /**
   * Cleanup and save before exit
   */
  async cleanup(): Promise<void> {
    try {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
      }

      // Save any pending changes
      if (this.isDirty) {
        await this.save(true);
      }

      logger.info('MappingService cleanup completed');
    } catch (error) {
      logger.error('Error during MappingService cleanup:', error);
      throw error;
    }
  }
}
