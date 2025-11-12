import React from 'react';
import { ServiceStatus } from '../../../shared/types';

interface ServiceControlsProps {
  status: ServiceStatus;
  onAction: (action: 'start' | 'stop' | 'restart') => void;
}

const ServiceControls: React.FC<ServiceControlsProps> = ({ status, onAction }) => {
  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="panel service-controls-panel">
      <div className="panel-header">
        <h2>Service Status</h2>
        <span className={`status-badge ${status.isRunning ? 'running' : 'stopped'}`}>
          {status.isRunning ? 'Running' : 'Stopped'}
        </span>
      </div>

      <div className="panel-content">
        <div className="service-info">
          <div className="info-row">
            <span className="info-label">Status:</span>
            <span className="info-value">
              {status.isInstalled
                ? status.isRunning
                  ? 'Running'
                  : 'Stopped'
                : 'Not Installed'}
            </span>
          </div>

          {status.isRunning && (
            <>
              <div className="info-row">
                <span className="info-label">Uptime:</span>
                <span className="info-value">{formatUptime(status.uptime)}</span>
              </div>

              {status.pid && (
                <div className="info-row">
                  <span className="info-label">Process ID:</span>
                  <span className="info-value">{status.pid}</span>
                </div>
              )}
            </>
          )}

          {status.lastError && (
            <div className="info-row error">
              <span className="info-label">Last Error:</span>
              <span className="info-value">{status.lastError}</span>
            </div>
          )}
        </div>

        <div className="service-actions">
          {status.isInstalled ? (
            <>
              {!status.isRunning ? (
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => onAction('start')}
                >
                  Start Service
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onAction('stop')}
                  >
                    Stop Service
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => onAction('restart')}
                  >
                    Restart Service
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="not-installed-message">
              <p>Service is not installed. Please run the setup wizard or install manually.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceControls;
