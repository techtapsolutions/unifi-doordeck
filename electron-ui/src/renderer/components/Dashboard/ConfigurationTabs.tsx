import React, { useState } from 'react';
import { AppConfig } from '../../../shared/types';

interface ConfigurationTabsProps {
  config: AppConfig;
  onConfigUpdate: (config: Partial<AppConfig>) => void;
}

const ConfigurationTabs: React.FC<ConfigurationTabsProps> = ({ config, onConfigUpdate }) => {
  const [activeConfigTab, setActiveConfigTab] = useState<'unifi' | 'doordeck' | 'doors' | 'logging'>('unifi');

  const handleUniFiUpdate = (field: keyof AppConfig['unifi'], value: string | boolean) => {
    onConfigUpdate({
      unifi: {
        ...config.unifi,
        [field]: value,
      },
    });
  };

  const handleDoordeckUpdate = (field: keyof AppConfig['doordeck'], value: string) => {
    onConfigUpdate({
      doordeck: {
        ...config.doordeck,
        [field]: value,
      },
    });
  };

  const handleLoggingUpdate = (field: keyof AppConfig['logging'], value: string | boolean) => {
    onConfigUpdate({
      logging: {
        ...config.logging,
        [field]: value,
      },
    });
  };

  return (
    <div className="configuration-tabs">
      <div className="config-nav">
        <button
          className={`config-nav-tab ${activeConfigTab === 'unifi' ? 'active' : ''}`}
          onClick={() => setActiveConfigTab('unifi')}
        >
          UniFi Access
        </button>
        <button
          className={`config-nav-tab ${activeConfigTab === 'doordeck' ? 'active' : ''}`}
          onClick={() => setActiveConfigTab('doordeck')}
        >
          Doordeck
        </button>
        <button
          className={`config-nav-tab ${activeConfigTab === 'doors' ? 'active' : ''}`}
          onClick={() => setActiveConfigTab('doors')}
        >
          Door Mappings
        </button>
        <button
          className={`config-nav-tab ${activeConfigTab === 'logging' ? 'active' : ''}`}
          onClick={() => setActiveConfigTab('logging')}
        >
          Logging
        </button>
      </div>

      <div className="config-content">
        {activeConfigTab === 'unifi' && (
          <div className="config-section">
            <h3>UniFi Access Configuration</h3>

            <div className="form-group">
              <label>Controller Host</label>
              <input
                type="text"
                className="form-control"
                value={config.unifi.host}
                onChange={(e) => handleUniFiUpdate('host', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                value={config.unifi.username}
                onChange={(e) => handleUniFiUpdate('username', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={config.unifi.password}
                onChange={(e) => handleUniFiUpdate('password', e.target.value)}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.unifi.verifySSL}
                  onChange={(e) => handleUniFiUpdate('verifySSL', e.target.checked)}
                />
                <span>Verify SSL Certificate</span>
              </label>
            </div>
          </div>
        )}

        {activeConfigTab === 'doordeck' && (
          <div className="config-section">
            <h3>Doordeck Configuration</h3>

            <div className="form-group">
              <label>API URL</label>
              <input
                type="text"
                className="form-control"
                value={config.doordeck.apiUrl}
                onChange={(e) => handleDoordeckUpdate('apiUrl', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Auth Token</label>
              <input
                type="password"
                className="form-control"
                value={config.doordeck.authToken || ''}
                onChange={(e) => handleDoordeckUpdate('authToken', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Client ID</label>
              <input
                type="text"
                className="form-control"
                value={config.doordeck.clientId || ''}
                onChange={(e) => handleDoordeckUpdate('clientId', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Client Secret</label>
              <input
                type="password"
                className="form-control"
                value={config.doordeck.clientSecret || ''}
                onChange={(e) => handleDoordeckUpdate('clientSecret', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeConfigTab === 'doors' && (
          <div className="config-section">
            <h3>Door Mappings</h3>
            <p>Manage door mappings between UniFi Access and Doordeck.</p>

            <div className="door-mappings-list">
              {config.doorMappings.length === 0 ? (
                <p className="empty-state">No door mappings configured.</p>
              ) : (
                config.doorMappings.map((mapping) => (
                  <div key={mapping.unifiDoorId} className="mapping-card">
                    <div className="mapping-info">
                      <div className="mapping-row">
                        <span className="mapping-label">UniFi Door:</span>
                        <span className="mapping-value">{mapping.unifiDoorName}</span>
                      </div>
                      <div className="mapping-row">
                        <span className="mapping-label">Doordeck Door:</span>
                        <span className="mapping-value">{mapping.doordeckDoorName}</span>
                      </div>
                    </div>
                    <div className="mapping-status">
                      <span className={`badge ${mapping.enabled ? 'enabled' : 'disabled'}`}>
                        {mapping.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className="btn btn-primary">Add Mapping</button>
          </div>
        )}

        {activeConfigTab === 'logging' && (
          <div className="config-section">
            <h3>Logging Configuration</h3>

            <div className="form-group">
              <label>Log Level</label>
              <select
                className="form-control"
                value={config.logging.level}
                onChange={(e) => handleLoggingUpdate('level', e.target.value)}
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.logging.enableFileLogging}
                  onChange={(e) => handleLoggingUpdate('enableFileLogging', e.target.checked)}
                />
                <span>Enable File Logging</span>
              </label>
            </div>

            {config.logging.enableFileLogging && (
              <div className="form-group">
                <label>Log Path</label>
                <input
                  type="text"
                  className="form-control"
                  value={config.logging.logPath || ''}
                  onChange={(e) => handleLoggingUpdate('logPath', e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationTabs;
