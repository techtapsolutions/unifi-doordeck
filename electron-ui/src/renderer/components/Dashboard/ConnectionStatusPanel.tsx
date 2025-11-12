import React from 'react';
import { ConnectionStatus } from '../../../shared/types';

interface ConnectionStatusPanelProps {
  status: ConnectionStatus;
}

const ConnectionStatusPanel: React.FC<ConnectionStatusPanelProps> = ({ status }) => {
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="panel connection-status-panel">
      <div className="panel-header">
        <h2>Connection Status</h2>
      </div>

      <div className="panel-content">
        <div className="connection-item">
          <div className="connection-header">
            <div className="connection-name">
              <span className={`status-indicator ${status.unifi.connected ? 'connected' : 'disconnected'}`}></span>
              <span className="connection-label">UniFi Access</span>
            </div>
            <span className={`connection-badge ${status.unifi.connected ? 'connected' : 'disconnected'}`}>
              {status.unifi.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="connection-details">
            <span className="detail-label">Last Check:</span>
            <span className="detail-value">{formatTime(status.unifi.lastCheck)}</span>
          </div>
          {status.unifi.error && (
            <div className="connection-error">
              <span className="error-icon">!</span>
              <span>{status.unifi.error}</span>
            </div>
          )}
        </div>

        <div className="connection-divider"></div>

        <div className="connection-item">
          <div className="connection-header">
            <div className="connection-name">
              <span className={`status-indicator ${status.doordeck.connected ? 'connected' : 'disconnected'}`}></span>
              <span className="connection-label">Doordeck API</span>
            </div>
            <span className={`connection-badge ${status.doordeck.connected ? 'connected' : 'disconnected'}`}>
              {status.doordeck.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="connection-details">
            <span className="detail-label">Last Check:</span>
            <span className="detail-value">{formatTime(status.doordeck.lastCheck)}</span>
          </div>
          {status.doordeck.error && (
            <div className="connection-error">
              <span className="error-icon">!</span>
              <span>{status.doordeck.error}</span>
            </div>
          )}
        </div>

        <div className="connection-summary">
          {status.unifi.connected && status.doordeck.connected ? (
            <div className="summary-message success">
              <span className="summary-icon">✓</span>
              <span>All systems operational</span>
            </div>
          ) : (
            <div className="summary-message warning">
              <span className="summary-icon">⚠</span>
              <span>Connection issues detected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatusPanel;
