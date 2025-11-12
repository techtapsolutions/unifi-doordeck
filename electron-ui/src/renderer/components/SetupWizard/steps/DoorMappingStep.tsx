import React, { useState, useEffect } from 'react';
import { AppConfig, DoorMapping, UniFiDoor, DoordeckDoor } from '../../../../shared/types';
import { useElectronAPI } from '../../../hooks/useElectronAPI';

interface DoorMappingStepProps {
  unifiConfig: AppConfig['unifi'];
  doordeckConfig: AppConfig['doordeck'];
  initialMappings: DoorMapping[];
  onNext: (mappings: DoorMapping[]) => void;
  onBack: () => void;
}

const DoorMappingStep: React.FC<DoorMappingStepProps> = ({
  unifiConfig,
  doordeckConfig,
  initialMappings,
  onNext,
  onBack,
}) => {
  const electronAPI = useElectronAPI();
  const [unifiDoors, setUnifiDoors] = useState<UniFiDoor[]>([]);
  const [doordeckDoors, setDoordeckDoors] = useState<DoordeckDoor[]>([]);
  const [mappings, setMappings] = useState<DoorMapping[]>(initialMappings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    discoverDoors();
  }, []);

  const discoverDoors = async () => {
    setLoading(true);
    setError(null);

    try {
      const [unifiResponse, doordeckResponse] = await Promise.all([
        electronAPI.discoverUniFiDoors(),
        electronAPI.discoverDoordeckDoors(),
      ]);

      if (unifiResponse.success && unifiResponse.data) {
        setUnifiDoors(unifiResponse.data);
      } else {
        setError('Failed to discover UniFi doors: ' + unifiResponse.error);
      }

      if (doordeckResponse.success && doordeckResponse.data) {
        setDoordeckDoors(doordeckResponse.data);
      } else {
        setError('Failed to discover Doordeck doors: ' + doordeckResponse.error);
      }
    } catch (err) {
      setError('Failed to discover doors');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (
    unifiDoorId: string,
    unifiDoorName: string,
    doordeckDoorId: string
  ) => {
    const doordeckDoor = doordeckDoors.find((d) => d.id === doordeckDoorId);

    if (!doordeckDoor) return;

    const existingMapping = mappings.find((m) => m.unifiDoorId === unifiDoorId);

    if (existingMapping) {
      setMappings(
        mappings.map((m) =>
          m.unifiDoorId === unifiDoorId
            ? {
                ...m,
                doordeckDoorId,
                doordeckDoorName: doordeckDoor.name,
              }
            : m
        )
      );
    } else {
      setMappings([
        ...mappings,
        {
          unifiDoorId,
          unifiDoorName,
          doordeckDoorId,
          doordeckDoorName: doordeckDoor.name,
          enabled: true,
        },
      ]);
    }
  };

  const handleToggleMapping = (unifiDoorId: string) => {
    setMappings(
      mappings.map((m) =>
        m.unifiDoorId === unifiDoorId ? { ...m, enabled: !m.enabled } : m
      )
    );
  };

  const handleRemoveMapping = (unifiDoorId: string) => {
    setMappings(mappings.filter((m) => m.unifiDoorId !== unifiDoorId));
  };

  const handleNext = () => {
    onNext(mappings);
  };

  const getMappedDoordeckId = (unifiDoorId: string): string => {
    const mapping = mappings.find((m) => m.unifiDoorId === unifiDoorId);
    return mapping?.doordeckDoorId || '';
  };

  return (
    <div className="wizard-step door-mapping-step">
      <div className="step-content">
        <h2>Door Mapping</h2>
        <p className="step-description">
          Map your UniFi Access doors to their corresponding Doordeck doors.
        </p>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Discovering doors...</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button className="btn btn-sm" onClick={discoverDoors}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="door-mapping-list">
              <h3>UniFi Access Doors ({unifiDoors.length})</h3>

              {unifiDoors.length === 0 && (
                <p className="empty-state">
                  No UniFi Access doors found. Please check your configuration and try
                  again.
                </p>
              )}

              {unifiDoors.map((unifiDoor) => (
                <div key={unifiDoor.id} className="door-mapping-item">
                  <div className="door-info">
                    <div className="door-name">{unifiDoor.name}</div>
                    <div className="door-meta">
                      {unifiDoor.location && <span>{unifiDoor.location}</span>}
                      <span className={`status ${unifiDoor.status}`}>
                        {unifiDoor.status}
                      </span>
                    </div>
                  </div>

                  <div className="mapping-controls">
                    <select
                      className="form-control"
                      value={getMappedDoordeckId(unifiDoor.id)}
                      onChange={(e) =>
                        handleMappingChange(unifiDoor.id, unifiDoor.name, e.target.value)
                      }
                    >
                      <option value="">Select Doordeck Door...</option>
                      {doordeckDoors.map((doordeckDoor) => (
                        <option key={doordeckDoor.id} value={doordeckDoor.id}>
                          {doordeckDoor.name}
                          {doordeckDoor.description && ` - ${doordeckDoor.description}`}
                        </option>
                      ))}
                    </select>

                    {getMappedDoordeckId(unifiDoor.id) && (
                      <div className="mapping-actions">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={
                              mappings.find((m) => m.unifiDoorId === unifiDoor.id)
                                ?.enabled || false
                            }
                            onChange={() => handleToggleMapping(unifiDoor.id)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveMapping(unifiDoor.id)}
                          title="Remove mapping"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mapping-summary">
              <h4>Mapping Summary</h4>
              <p>
                {mappings.length} door{mappings.length !== 1 ? 's' : ''} mapped,{' '}
                {mappings.filter((m) => m.enabled).length} enabled
              </p>
            </div>
          </>
        )}
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={mappings.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DoorMappingStep;
