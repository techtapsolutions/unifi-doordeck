/**
 * Door Mapping Storage Service
 * Manages persistent storage of UniFi <-> Doordeck door mappings
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { DoorMapping } from '../shared/types';

const CONFIG_DIR = process.env.APPDATA
  ? join(process.env.APPDATA, 'unifi-doordeck-bridge-gui')
  : join(process.env.HOME || '', '.unifi-doordeck-bridge-gui');

const MAPPINGS_FILE = join(CONFIG_DIR, 'door-mappings.json');

/**
 * Load all door mappings from storage
 */
export function loadMappings(): DoorMapping[] {
  try {
    if (existsSync(MAPPINGS_FILE)) {
      const data = readFileSync(MAPPINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Handle both formats: { mappings: [...] } and [...]
      return Array.isArray(parsed) ? parsed : (parsed.mappings || []);
    }
  } catch (error) {
    console.error('Failed to load door mappings:', error);
  }
  return [];
}

/**
 * Save door mappings to storage
 */
export function saveMappings(mappings: DoorMapping[]): void {
  try {
    // Save in the format { mappings: [...] } for consistency with GUI
    const data = { mappings };
    writeFileSync(MAPPINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save door mappings:', error);
    throw error;
  }
}

/**
 * Get all door mappings
 */
export function getMappings(): DoorMapping[] {
  return loadMappings();
}

/**
 * Get mapping by UniFi door ID
 */
export function getMappingByUnifiDoorId(unifiDoorId: string): DoorMapping | undefined {
  const mappings = loadMappings();
  return mappings.find((m) => m.unifiDoorId === unifiDoorId);
}

/**
 * Get mapping by Doordeck lock ID
 */
export function getMappingByDoordeckLockId(doordeckLockId: string): DoorMapping | undefined {
  const mappings = loadMappings();
  return mappings.find((m) => m.doordeckLockId === doordeckLockId);
}

/**
 * Get mapping by ID
 */
export function getMappingById(id: string): DoorMapping | undefined {
  const mappings = loadMappings();
  return mappings.find((m) => m.id === id);
}

/**
 * Create a new door mapping
 */
export function createMapping(
  unifiDoorId: string,
  unifiDoorName: string,
  doordeckLockId: string,
  doordeckLockName: string,
  siteId?: string
): DoorMapping {
  const mappings = loadMappings();

  // Check for existing mapping
  const existingByUnifi = mappings.find((m) => m.unifiDoorId === unifiDoorId);
  if (existingByUnifi) {
    throw new Error(`UniFi door ${unifiDoorId} is already mapped`);
  }

  const existingByDoordeck = mappings.find((m) => m.doordeckLockId === doordeckLockId);
  if (existingByDoordeck) {
    throw new Error(`Doordeck lock ${doordeckLockId} is already mapped`);
  }

  // Create new mapping
  const now = new Date().toISOString();
  const mapping: DoorMapping = {
    id: `mapping_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    unifiDoorId,
    unifiDoorName,
    doordeckLockId,
    doordeckLockName,
    siteId,
    createdAt: now,
    updatedAt: now,
  };

  mappings.push(mapping);
  saveMappings(mappings);

  return mapping;
}

/**
 * Update an existing door mapping
 */
export function updateMapping(
  id: string,
  updates: Partial<Omit<DoorMapping, 'id' | 'createdAt'>>
): DoorMapping {
  const mappings = loadMappings();
  const index = mappings.findIndex((m) => m.id === id);

  if (index === -1) {
    throw new Error(`Mapping ${id} not found`);
  }

  // Update mapping
  mappings[index] = {
    ...mappings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveMappings(mappings);

  return mappings[index];
}

/**
 * Delete a door mapping
 */
export function deleteMapping(id: string): void {
  const mappings = loadMappings();
  const filtered = mappings.filter((m) => m.id !== id);

  if (filtered.length === mappings.length) {
    throw new Error(`Mapping ${id} not found`);
  }

  saveMappings(filtered);
}

/**
 * Delete all door mappings
 */
export function clearMappings(): void {
  saveMappings([]);
}
