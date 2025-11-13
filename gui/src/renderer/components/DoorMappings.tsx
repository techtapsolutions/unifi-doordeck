/**
 * Door Mappings Component
 * Visual interface for mapping UniFi doors to Doordeck locks
 */

import React, { useState, useEffect } from 'react';
import type { Door, DoordeckLock, DoorMapping } from '../../shared/types';

interface DoorMappingsProps {
  onClose: () => void;
}

export default function DoorMappings({ onClose }: DoorMappingsProps) {
  // State
  const [unifiDoors, setUnifiDoors] = useState<Door[]>([]);
  const [doordeckLocks, setDoordeckLocks] = useState<DoordeckLock[]>([]);
  const [mappings, setMappings] = useState<DoorMapping[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);

  // Mapping creation state
  const [selectedUnifiDoor, setSelectedUnifiDoor] = useState<string | null>(null);
  const [selectedDoordeckLock, setSelectedDoordeckLock] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Load all data in parallel
      const [doorsResult, locksResult, mappingsResult] = await Promise.all([
        window.bridge.discoverDoors(),
        window.bridge.listDoordeckLocks(),
        window.bridge.listMappings(),
      ]);

      if (doorsResult.success && doorsResult.data) {
        setUnifiDoors(doorsResult.data);
      } else {
        console.warn('Failed to load UniFi doors:', doorsResult.error);
      }

      if (locksResult.success && locksResult.data) {
        setDoordeckLocks(locksResult.data);
      } else {
        console.warn('Failed to load Doordeck locks:', locksResult.error);
      }

      if (mappingsResult.success && mappingsResult.data) {
        setMappings(mappingsResult.data);
      } else {
        console.warn('Failed to load mappings:', mappingsResult.error);
      }
    } catch (err) {
      setError('Failed to load door data');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRediscover() {
    setDiscovering(true);
    setError(null);

    try {
      const [doorsResult, locksResult] = await Promise.all([
        window.bridge.discoverDoors(),
        window.bridge.listDoordeckLocks(),
      ]);

      if (doorsResult.success && doorsResult.data) {
        setUnifiDoors(doorsResult.data);
      }

      if (locksResult.success && locksResult.data) {
        setDoordeckLocks(locksResult.data);
      }
    } catch (err) {
      setError('Failed to rediscover doors');
    } finally {
      setDiscovering(false);
    }
  }

  async function handleCreateMapping() {
    if (!selectedUnifiDoor || !selectedDoordeckLock) {
      setError('Please select both a UniFi door and a Doordeck lock');
      return;
    }

    const unifiDoor = unifiDoors.find((d) => d.id === selectedUnifiDoor);
    const doordeckLock = doordeckLocks.find((l) => l.id === selectedDoordeckLock);

    if (!unifiDoor || !doordeckLock) {
      setError('Selected door or lock not found');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const result = await window.bridge.createMapping({
        unifiDoorId: unifiDoor.id,
        unifiDoorName: unifiDoor.name,
        doordeckLockId: doordeckLock.id,
        doordeckLockName: doordeckLock.name,
        siteId: doordeckLock.siteId,
      });

      if (result.success) {
        // Reload mappings
        const mappingsResult = await window.bridge.listMappings();
        if (mappingsResult.success && mappingsResult.data) {
          setMappings(mappingsResult.data);
        }

        // Clear selection
        setSelectedUnifiDoor(null);
        setSelectedDoordeckLock(null);
      } else {
        setError(result.error || 'Failed to create mapping');
      }
    } catch (err) {
      setError('Failed to create mapping');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteMapping(mappingId: string) {
    if (!confirm('Are you sure you want to delete this door mapping?')) {
      return;
    }

    try {
      const result = await window.bridge.deleteMapping(mappingId);

      if (result.success) {
        // Reload mappings
        const mappingsResult = await window.bridge.listMappings();
        if (mappingsResult.success && mappingsResult.data) {
          setMappings(mappingsResult.data);
        }
      } else {
        setError(result.error || 'Failed to delete mapping');
      }
    } catch (err) {
      setError('Failed to delete mapping');
    }
  }

  // Helper functions
  function isMapped(doorId: string, type: 'unifi' | 'doordeck'): boolean {
    if (type === 'unifi') {
      return mappings.some((m) => m.unifiDoorId === doorId);
    } else {
      return mappings.some((m) => m.doordeckLockId === doorId);
    }
  }

  function getMapping(doorId: string, type: 'unifi' | 'doordeck'): DoorMapping | undefined {
    if (type === 'unifi') {
      return mappings.find((m) => m.unifiDoorId === doorId);
    } else {
      return mappings.find((m) => m.doordeckLockId === doorId);
    }
  }

  const unmappedUnifiDoors = unifiDoors.filter((d) => !isMapped(d.id, 'unifi'));
  const unmappedDoordeckLocks = doordeckLocks.filter((l) => !isMapped(l.id, 'doordeck'));

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal door-mappings-modal">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading door data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal door-mappings-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2>Door Mappings</h2>
            <p className="subtitle">Map UniFi doors to Doordeck locks for webhook integration</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Stats Summary */}
          <div className="mappings-stats">
            <div className="stat-card">
              <div className="stat-value">{mappings.length}</div>
              <div className="stat-label">Active Mappings</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{unmappedUnifiDoors.length}</div>
              <div className="stat-label">Unmapped UniFi Doors</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{unmappedDoordeckLocks.length}</div>
              <div className="stat-label">Unmapped Doordeck Locks</div>
            </div>
          </div>

          {/* Create New Mapping */}
          <div className="create-mapping-section">
            <h3>Create New Mapping</h3>

            <div className="mapping-selector">
              <div className="selector-group">
                <label>UniFi Door</label>
                <select
                  value={selectedUnifiDoor || ''}
                  onChange={(e) => setSelectedUnifiDoor(e.target.value || null)}
                  disabled={unmappedUnifiDoors.length === 0 || creating}
                >
                  <option value="">Select UniFi Door...</option>
                  {unmappedUnifiDoors.map((door) => (
                    <option key={door.id} value={door.id}>
                      {door.name} {door.floor ? `(${door.floor})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mapping-arrow">→</div>

              <div className="selector-group">
                <label>Doordeck Lock</label>
                <select
                  value={selectedDoordeckLock || ''}
                  onChange={(e) => setSelectedDoordeckLock(e.target.value || null)}
                  disabled={unmappedDoordeckLocks.length === 0 || creating}
                >
                  <option value="">Select Doordeck Lock...</option>
                  {unmappedDoordeckLocks.map((lock) => (
                    <option key={lock.id} value={lock.id}>
                      {lock.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mapping-actions">
              <button
                className="btn btn-primary"
                onClick={handleCreateMapping}
                disabled={!selectedUnifiDoor || !selectedDoordeckLock || creating}
              >
                {creating ? 'Creating...' : 'Create Mapping'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleRediscover}
                disabled={discovering}
              >
                {discovering ? 'Discovering...' : 'Rediscover Doors'}
              </button>
            </div>
          </div>

          {/* Existing Mappings */}
          <div className="mappings-list-section">
            <h3>Existing Mappings ({mappings.length})</h3>

            {mappings.length === 0 ? (
              <div className="empty-state">
                <p>No door mappings configured yet.</p>
                <p className="help-text">
                  Create a mapping above to link a UniFi door with a Doordeck lock.
                  When a user unlocks via Doordeck, the webhook will trigger the corresponding UniFi door.
                </p>
              </div>
            ) : (
              <div className="mappings-table">
                <table>
                  <thead>
                    <tr>
                      <th>UniFi Door</th>
                      <th></th>
                      <th>Doordeck Lock</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td>
                          <div className="door-info">
                            <div className="door-name">{mapping.unifiDoorName}</div>
                            <div className="door-id">{mapping.unifiDoorId}</div>
                          </div>
                        </td>
                        <td className="arrow-cell">
                          <span className="mapping-arrow-large">↔</span>
                        </td>
                        <td>
                          <div className="door-info">
                            <div className="door-name">{mapping.doordeckLockName}</div>
                            <div className="door-id">{mapping.doordeckLockId}</div>
                          </div>
                        </td>
                        <td>
                          <div className="timestamp">
                            {new Date(mapping.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleDeleteMapping(mapping.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="help-section">
            <h4>How Door Mappings Work</h4>
            <ul>
              <li>
                <strong>Webhook Integration:</strong> When a user unlocks a door via Doordeck,
                the webhook sends the Doordeck lock ID to this bridge service.
              </li>
              <li>
                <strong>Mapping Lookup:</strong> The service uses these mappings to find the
                corresponding UniFi door ID.
              </li>
              <li>
                <strong>Physical Unlock:</strong> The bridge then sends an unlock command to
                the UniFi Access controller for that specific door.
              </li>
            </ul>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
