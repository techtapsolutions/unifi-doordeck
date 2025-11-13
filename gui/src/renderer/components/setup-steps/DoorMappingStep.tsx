/**
 * Door Mapping Step - Setup Wizard
 * Maps UniFi doors to Doordeck locks
 */

import React, { useState, useEffect } from 'react';
import type { Door, DoordeckLock, DoorMapping, UniFiConfig, DoordeckConfig } from '../../../shared/types';

interface DoorMappingStepProps {
  unifiConfig: UniFiConfig;
  doordeckConfig: DoordeckConfig;
  onNext: (mappings: DoorMapping[]) => void;
  onBack: () => void;
}

export default function DoorMappingStep({
  unifiConfig,
  doordeckConfig,
  onNext,
  onBack,
}: DoorMappingStepProps) {
  const [loading, setLoading] = useState(true);
  const [unifiDoors, setUnifiDoors] = useState<Door[]>([]);
  const [doordeckLocks, setDoordeckLocks] = useState<DoordeckLock[]>([]);
  const [mappings, setMappings] = useState<Map<string, string>>(new Map()); // unifiDoorId -> doordeckLockId
  const [siteId] = useState('default-site');

  useEffect(() => {
    discoverBothSystems();
  }, []);

  async function discoverBothSystems() {
    setLoading(true);

    try {
      // Discover UniFi doors
      const unifiResponse = await window.bridge.discoverDoorsWithConfig(unifiConfig);
      if (unifiResponse.success && unifiResponse.data) {
        setUnifiDoors(unifiResponse.data);
      }

      // Discover Doordeck locks
      const doordeckResponse = await window.bridge.listDoordeckLocks();
      if (doordeckResponse.success && doordeckResponse.data) {
        setDoordeckLocks(doordeckResponse.data);
      }
    } catch (error) {
      console.error('Failed to discover doors:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleMapping(unifiDoorId: string, doordeckLockId: string) {
    const newMappings = new Map(mappings);
    if (doordeckLockId === '') {
      newMappings.delete(unifiDoorId);
    } else {
      newMappings.set(unifiDoorId, doordeckLockId);
    }
    setMappings(newMappings);
  }

  function handleNext() {
    const doorMappings: DoorMapping[] = [];

    mappings.forEach((doordeckLockId, unifiDoorId) => {
      const unifiDoor = unifiDoors.find((d) => d.id === unifiDoorId);
      const doordeckLock = doordeckLocks.find((l) => l.id === doordeckLockId);

      if (unifiDoor && doordeckLock) {
        doorMappings.push({
          id: `mapping_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          unifiDoorId: unifiDoor.id,
          unifiDoorName: unifiDoor.name,
          doordeckLockId: doordeckLock.id,
          doordeckLockName: doordeckLock.name,
          siteId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    onNext(doorMappings);
  }

  function handleSkip() {
    // Continue without creating any mappings
    onNext([]);
  }

  if (loading) {
    return (
      <div className="setup-step door-mapping-step">
        <h2>Discovering Doors & Locks</h2>
        <div className="loading">
          <div className="spinner"></div>
          <p>Discovering doors from UniFi Access and locks from Doordeck...</p>
        </div>
      </div>
    );
  }

  const isAnyUnmappedDoor = unifiDoors.length > 0 && mappings.size === 0;

  return (
    <div className="setup-step door-mapping-step">
      <h2>Map Doors to Locks</h2>
      <p className="step-description">
        Map your UniFi Access doors to Doordeck locks. This allows the webhook system to trigger the correct
        door when a user unlocks via Doordeck.
      </p>

      {unifiDoors.length === 0 && (
        <div className="alert alert-warning">
          <p><strong>No UniFi doors found.</strong></p>
          <p>Make sure your UniFi Access controller has doors configured.</p>
        </div>
      )}

      {doordeckLocks.length === 0 && (
        <div className="alert alert-warning">
          <p><strong>No Doordeck locks found.</strong></p>
          <p>Make sure your Doordeck account has locks configured.</p>
        </div>
      )}

      {unifiDoors.length > 0 && doordeckLocks.length > 0 && (
        <div className="mapping-grid">
          <table className="mapping-table">
            <thead>
              <tr>
                <th>UniFi Door</th>
                <th>→</th>
                <th>Doordeck Lock</th>
              </tr>
            </thead>
            <tbody>
              {unifiDoors.map((door) => (
                <tr key={door.id}>
                  <td>
                    <div className="door-name">{door.name}</div>
                    {door.floor && <div className="door-floor">Floor: {door.floor}</div>}
                  </td>
                  <td className="arrow-cell">→</td>
                  <td>
                    <select
                      value={mappings.get(door.id) || ''}
                      onChange={(e) => handleMapping(door.id, e.target.value)}
                      className="form-control"
                    >
                      <option value="">-- Select Doordeck Lock --</option>
                      {doordeckLocks.map((lock) => (
                        <option key={lock.id} value={lock.id}>
                          {lock.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mapping-summary">
            <p>
              <strong>{mappings.size}</strong> of <strong>{unifiDoors.length}</strong> doors mapped
            </p>
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <div className="actions-right">
          <button className="btn btn-secondary" onClick={handleSkip}>
            Skip for Now
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={unifiDoors.length === 0 || doordeckLocks.length === 0}
          >
            {mappings.size > 0 ? `Continue with ${mappings.size} Mapping(s)` : 'Continue without Mappings'}
          </button>
        </div>
      </div>
    </div>
  );
}
