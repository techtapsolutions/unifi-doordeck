/**
 * Doors Discovery and Mapping Step - Setup Wizard
 */

import React, { useState, useEffect } from 'react';
import type { Door, DoorMapping, UniFiConfig } from '../../../shared/types';

interface DoorsStepProps {
  unifiConfig: UniFiConfig;
  onNext: (mappings: DoorMapping[]) => void;
  onBack: () => void;
  onDoorsDiscovered: (doors: Door[]) => void;
}

export default function DoorsStep({
  unifiConfig,
  onNext,
  onBack,
  onDoorsDiscovered,
}: DoorsStepProps) {
  const [discovering, setDiscovering] = useState(false);
  const [doors, setDoors] = useState<Door[]>([]);
  const [selectedDoors, setSelectedDoors] = useState<Set<string>>(new Set());
  const [siteId, setSiteId] = useState('default-site');

  useEffect(() => {
    handleDiscover();
  }, []);

  async function handleDiscover() {
    console.log('[DoorsStep] Starting door discovery...');
    setDiscovering(true);

    try {
      console.log('[DoorsStep] Calling window.bridge.discoverDoors()...');
      const response = await window.bridge.discoverDoors();
      console.log('[DoorsStep] Discovery response:', response);

      if (response.success && response.data) {
        console.log('[DoorsStep] Success! Found', response.data.length, 'doors');
        console.log('[DoorsStep] Doors:', response.data);
        setDoors(response.data);
        onDoorsDiscovered(response.data);

        // Auto-select all doors
        const allIds = new Set(response.data.map((d) => d.id));
        setSelectedDoors(allIds);
      } else {
        console.error('[DoorsStep] Discovery failed or no doors found');
        console.error('[DoorsStep] Error:', response.error);
        setDoors([]);
      }
    } catch (error) {
      console.error('[DoorsStep] Exception during discovery:', error);
    } finally {
      console.log('[DoorsStep] Discovery complete');
      setDiscovering(false);
    }
  }

  function toggleDoor(doorId: string) {
    const newSelection = new Set(selectedDoors);
    if (newSelection.has(doorId)) {
      newSelection.delete(doorId);
    } else {
      newSelection.add(doorId);
    }
    setSelectedDoors(newSelection);
  }

  function handleNext() {
    const mappings: DoorMapping[] = Array.from(selectedDoors).map((doorId) => {
      const door = doors.find((d) => d.id === doorId)!;
      return {
        unifiDoorId: door.id,
        doordeckLockId: door.id, // Use same ID for now
        name: door.name,
        siteId,
      };
    });

    onNext(mappings);
  }

  return (
    <div className="setup-step doors-step">
      <h2>Discover Doors</h2>
      <p className="step-description">
        We'll automatically discover doors from your UniFi Access controller.
        Select which doors you want to enable for Doordeck access.
      </p>

      <div className="form-group">
        <label htmlFor="siteId">Site ID</label>
        <input
          type="text"
          id="siteId"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          placeholder="default-site"
          className="form-control"
        />
        <small>Organization/site identifier for grouping doors in Doordeck</small>
      </div>

      {discovering && (
        <div className="discovering">
          <div className="spinner"></div>
          <p>Discovering doors from {unifiConfig.host}...</p>
        </div>
      )}

      {!discovering && doors.length === 0 && (
        <div className="no-doors">
          <p>No doors found. Make sure your UniFi Access controller has doors configured.</p>
          <button className="btn btn-secondary" onClick={handleDiscover}>
            Retry Discovery
          </button>
        </div>
      )}

      {!discovering && doors.length > 0 && (
        <>
          <div className="doors-list">
            <h3>
              Found {doors.length} door{doors.length !== 1 ? 's' : ''}
            </h3>
            {doors.map((door) => (
              <div key={door.id} className="door-item">
                <input
                  type="checkbox"
                  id={`door-${door.id}`}
                  checked={selectedDoors.has(door.id)}
                  onChange={() => toggleDoor(door.id)}
                />
                <label htmlFor={`door-${door.id}`}>
                  <div className="door-name">{door.name}</div>
                  {door.floor && <div className="door-floor">Floor: {door.floor}</div>}
                  <div className="door-id">ID: {door.id}</div>
                </label>
              </div>
            ))}
          </div>

          <div className="selection-summary">
            <p>
              Selected: {selectedDoors.size} of {doors.length} door
              {doors.length !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        {doors.length > 0 && (
          <button className="btn btn-secondary" onClick={handleDiscover}>
            Refresh
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={selectedDoors.size === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
}
