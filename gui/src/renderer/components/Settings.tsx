/**
 * Settings Modal Component
 * Allows viewing and editing configuration after initial setup
 */

import React, { useState, useEffect } from 'react';
import type { BridgeConfig, Door } from '../../shared/types';

interface SettingsProps {
  onClose: () => void;
  onSave: () => void;
}

export default function Settings({ onClose, onSave }: SettingsProps) {
  const [config, setConfig] = useState<BridgeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unifi' | 'doordeck' | 'service' | 'advanced'>('unifi');
  const [discovering, setDiscovering] = useState(false);
  const [discoveredDoors, setDiscoveredDoors] = useState<Door[] | null>(null);
  const [serviceStatus, setServiceStatus] = useState<string>('unknown');
  const [serviceOperating, setServiceOperating] = useState(false);

  useEffect(() => {
    loadConfig();
    loadServiceStatus();
  }, []);

  async function loadConfig() {
    try {
      const response = await window.bridge.getConfig();
      if (response.success && response.data) {
        setConfig(response.data);
      } else {
        setError('Failed to load configuration');
      }
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!config) return;

    setSaving(true);
    setError(null);

    try {
      const response = await window.bridge.setConfig(config);
      if (response.success) {
        onSave();
        onClose();
      } else {
        setError(response.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestUniFi() {
    if (!config?.unifi) return;

    try {
      const response = await window.bridge.testUniFiConnection(config.unifi);
      if (response.success) {
        alert('UniFi connection successful!');
      } else {
        alert(`UniFi connection failed: ${response.error}`);
      }
    } catch (err) {
      alert('Failed to test UniFi connection');
    }
  }

  async function handleTestDoordeck() {
    if (!config?.doordeck) return;

    try {
      const response = await window.bridge.testDoordeckConnection(config.doordeck);
      if (response.success) {
        alert('Doordeck connection successful!');
      } else {
        alert(`Doordeck connection failed: ${response.error}`);
      }
    } catch (err) {
      alert('Failed to test Doordeck connection');
    }
  }

  async function handleDiscoverDoors() {
    if (!config?.unifi) return;

    setDiscovering(true);
    setError(null);
    setDiscoveredDoors(null);

    try {
      const response = await window.bridge.discoverDoorsWithConfig(config.unifi);
      if (response.success && response.data) {
        setDiscoveredDoors(response.data);
        if (response.data.length === 0) {
          setError('No doors found. Make sure your UniFi Access controller has doors configured.');
        }
      } else {
        setError(response.error || 'Failed to discover doors');
      }
    } catch (err) {
      setError('Failed to discover doors');
    } finally {
      setDiscovering(false);
    }
  }

  async function loadServiceStatus() {
    try {
      // First check if service is installed
      const installedResponse = await window.bridge.isServiceInstalled();
      if (!installedResponse.success || !installedResponse.data) {
        // Service is not installed
        setServiceStatus('not installed');
        return;
      }

      // Service is installed, now check if it's running
      const healthResponse = await window.bridge.getServiceHealth();
      if (healthResponse.success && healthResponse.data) {
        setServiceStatus(healthResponse.data.status);
      } else {
        // Service is installed but not running
        setServiceStatus('stopped');
      }
    } catch (err) {
      setServiceStatus('not installed');
    }
  }

  async function handleInstallService() {
    setServiceOperating(true);
    setError(null);

    try {
      const response = await window.bridge.installService();
      if (response.success) {
        alert('Service installed successfully! You can now start it.');
        await loadServiceStatus();
      } else {
        setError(response.error || 'Failed to install service');
        alert(`Failed to install service: ${response.error}\n\nMake sure you are running the application as Administrator.`);
      }
    } catch (err) {
      setError('Failed to install service');
      alert('Failed to install service. Make sure you are running as Administrator.');
    } finally {
      setServiceOperating(false);
    }
  }

  async function handleUninstallService() {
    if (!confirm('Are you sure you want to uninstall the service? This will stop the bridge service.')) {
      return;
    }

    setServiceOperating(true);
    setError(null);

    try {
      const response = await window.bridge.uninstallService();
      if (response.success) {
        alert('Service uninstalled successfully!');
        await loadServiceStatus();
      } else {
        setError(response.error || 'Failed to uninstall service');
        alert(`Failed to uninstall service: ${response.error}`);
      }
    } catch (err) {
      setError('Failed to uninstall service');
    } finally {
      setServiceOperating(false);
    }
  }

  async function handleStartService() {
    setServiceOperating(true);
    setError(null);

    try {
      const response = await window.bridge.startService();
      if (response.success) {
        alert('Service started successfully!');
        await loadServiceStatus();
      } else {
        setError(response.error || 'Failed to start service');
        alert(`Failed to start service: ${response.error}`);
      }
    } catch (err) {
      setError('Failed to start service');
    } finally {
      setServiceOperating(false);
    }
  }

  async function handleStopService() {
    setServiceOperating(true);
    setError(null);

    try {
      const response = await window.bridge.stopService();
      if (response.success) {
        alert('Service stopped successfully!');
        await loadServiceStatus();
      } else {
        setError(response.error || 'Failed to stop service');
        alert(`Failed to stop service: ${response.error}`);
      }
    } catch (err) {
      setError('Failed to stop service');
    } finally {
      setServiceOperating(false);
    }
  }

  async function handleRestartService() {
    setServiceOperating(true);
    setError(null);

    try {
      const response = await window.bridge.restartService();
      if (response.success) {
        alert('Service restarted successfully!');
        await loadServiceStatus();
      } else {
        setError(response.error || 'Failed to restart service');
        alert(`Failed to restart service: ${response.error}`);
      }
    } catch (err) {
      setError('Failed to restart service');
    } finally {
      setServiceOperating(false);
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal settings-modal">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="modal-overlay">
        <div className="modal settings-modal">
          <div className="error">
            <p>Failed to load configuration</p>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === 'unifi' ? 'active' : ''}`}
            onClick={() => setActiveTab('unifi')}
          >
            UniFi Access
          </button>
          <button
            className={`tab ${activeTab === 'doordeck' ? 'active' : ''}`}
            onClick={() => setActiveTab('doordeck')}
          >
            Doordeck
          </button>
          <button
            className={`tab ${activeTab === 'service' ? 'active' : ''}`}
            onClick={() => setActiveTab('service')}
          >
            Service
          </button>
          <button
            className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {activeTab === 'unifi' && (
            <div className="settings-section">
              <h3>UniFi Access Configuration</h3>

              <div className="form-group">
                <label htmlFor="unifi-host">Host/IP Address</label>
                <input
                  type="text"
                  id="unifi-host"
                  value={config.unifi.host}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      unifi: { ...config.unifi, host: e.target.value },
                    })
                  }
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="unifi-port">Port</label>
                <input
                  type="number"
                  id="unifi-port"
                  value={config.unifi.port || 443}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      unifi: { ...config.unifi, port: parseInt(e.target.value) },
                    })
                  }
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="unifi-apikey">API Key</label>
                <input
                  type="password"
                  id="unifi-apikey"
                  value={config.unifi.apiKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      unifi: { ...config.unifi, apiKey: e.target.value },
                    })
                  }
                  className="form-control"
                  placeholder="Optional - for API key authentication"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.unifi.skipSSLVerification || false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        unifi: { ...config.unifi, skipSSLVerification: e.target.checked },
                      })
                    }
                  />
                  <span>Skip SSL Certificate Verification</span>
                </label>
                <small className="warning-text">
                  Not recommended for production
                </small>
              </div>

              <div className="button-group">
                <button className="btn btn-secondary" onClick={handleTestUniFi}>
                  Test Connection
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleDiscoverDoors}
                  disabled={discovering}
                >
                  {discovering ? 'Discovering...' : 'Discover Doors'}
                </button>
              </div>

              {discovering && (
                <div className="discovering-status">
                  <div className="spinner-small"></div>
                  <span>Discovering doors from {config.unifi.host}...</span>
                </div>
              )}

              {discoveredDoors && discoveredDoors.length > 0 && (
                <div className="discovered-doors">
                  <h4>Discovered {discoveredDoors.length} door{discoveredDoors.length !== 1 ? 's' : ''}</h4>
                  <div className="doors-list-compact">
                    {discoveredDoors.map((door) => (
                      <div key={door.id} className="door-item-compact">
                        <div className="door-info">
                          <div className="door-name">{door.name}</div>
                          <div className="door-id">ID: {door.id}</div>
                          {door.floor && <div className="door-floor">Floor: {door.floor}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="help-text">
                    These doors are now available in your dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'doordeck' && (
            <div className="settings-section">
              <h3>Doordeck Configuration</h3>

              <div className="form-group">
                <label htmlFor="doordeck-email">Email</label>
                <input
                  type="email"
                  id="doordeck-email"
                  value={config.doordeck.email}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      doordeck: { ...config.doordeck, email: e.target.value },
                    })
                  }
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="doordeck-password">Password</label>
                <input
                  type="password"
                  id="doordeck-password"
                  value={config.doordeck.password}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      doordeck: { ...config.doordeck, password: e.target.value },
                    })
                  }
                  className="form-control"
                />
              </div>

              <button className="btn btn-secondary" onClick={handleTestDoordeck}>
                Test Connection
              </button>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="settings-section">
              <h3>Windows Service Management</h3>

              <div className="service-status-card">
                <div className="status-item">
                  <span className="label">Service Status:</span>
                  <span className={`status-badge ${serviceStatus === 'running' ? 'running' : serviceStatus === 'stopped' ? 'stopped' : 'error'}`}>
                    {serviceStatus === 'not installed' ? 'Not Installed' :
                     serviceStatus === 'running' ? 'Running' :
                     serviceStatus === 'stopped' ? 'Stopped' :
                     serviceStatus.charAt(0).toUpperCase() + serviceStatus.slice(1)}
                  </span>
                </div>
              </div>

              <p className="help-text" style={{ marginTop: '16px', marginBottom: '16px' }}>
                The Windows service runs the bridge in the background and handles webhook events from Doordeck.
                {serviceStatus === 'not installed' && (
                  <><br /><br /><strong>⚠️ Administrator privileges required:</strong> Installing a Windows service requires running this application as Administrator.</>
                )}
              </p>

              {serviceStatus === 'not installed' && (
                <div className="button-group">
                  <button
                    className="btn btn-success"
                    onClick={handleInstallService}
                    disabled={serviceOperating}
                  >
                    {serviceOperating ? 'Installing...' : 'Install Service'}
                  </button>
                </div>
              )}

              {serviceStatus !== 'not installed' && (
                <>
                  <div className="button-group" style={{ marginBottom: '12px' }}>
                    <button
                      className="btn btn-success"
                      onClick={handleStartService}
                      disabled={serviceOperating || serviceStatus === 'running'}
                    >
                      {serviceOperating ? 'Starting...' : 'Start Service'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleStopService}
                      disabled={serviceOperating || serviceStatus === 'stopped'}
                    >
                      {serviceOperating ? 'Stopping...' : 'Stop Service'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleRestartService}
                      disabled={serviceOperating || serviceStatus !== 'running'}
                    >
                      {serviceOperating ? 'Restarting...' : 'Restart Service'}
                    </button>
                  </div>

                  <div className="button-group">
                    <button
                      className="btn btn-danger"
                      onClick={handleUninstallService}
                      disabled={serviceOperating}
                    >
                      {serviceOperating ? 'Uninstalling...' : 'Uninstall Service'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={loadServiceStatus}
                      disabled={serviceOperating}
                    >
                      Refresh Status
                    </button>
                  </div>
                </>
              )}

              <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />

              <h3>Service Information</h3>
              <div className="info-section">
                <p><strong>Service Name:</strong> UniFi-Doordeck Bridge</p>
                <p><strong>Description:</strong> Bridge service between UniFi Access and Doordeck Cloud</p>
                <p><strong>Port:</strong> 34512</p>
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
                  You can also manage this service through Windows Services (services.msc).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="settings-section">
              <h3>Advanced Settings</h3>

              <div className="form-group">
                <label htmlFor="site-id">Site ID</label>
                <input
                  type="text"
                  id="site-id"
                  value={config.siteId || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      siteId: e.target.value,
                    })
                  }
                  className="form-control"
                  placeholder="default-site"
                />
                <small>Organization/site identifier for Doordeck</small>
              </div>

              <div className="form-group">
                <label htmlFor="log-level">Log Level</label>
                <select
                  id="log-level"
                  value={config.logging?.level || 'info'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      logging: {
                        ...config.logging,
                        level: e.target.value as any,
                      },
                    })
                  }
                  className="form-control"
                >
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />

              <h3>Webhook Configuration</h3>
              <p className="help-text" style={{ marginBottom: '16px' }}>
                Configure webhooks to receive real-time events from Doordeck Cloud.
                When a user unlocks a door via Doordeck, the webhook will automatically trigger the corresponding UniFi door.
              </p>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.webhook?.enabled ?? false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        webhook: {
                          ...config.webhook,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>Enable Webhook</span>
                </label>
                <small>Allow Doordeck to send unlock events to this bridge service</small>
              </div>

              {config.webhook?.enabled && (
                <>
                  <div className="form-group">
                    <label htmlFor="webhook-public-host">Public IP or Domain Name</label>
                    <input
                      type="text"
                      id="webhook-public-host"
                      value={config.webhook?.publicHost || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          webhook: {
                            ...config.webhook,
                            publicHost: e.target.value,
                          },
                        })
                      }
                      className="form-control"
                      placeholder="e.g., bridge.example.com or 203.0.113.5"
                    />
                    <small>
                      Enter the public IP address or domain name where this bridge can be reached from the internet.
                      <br />
                      <strong>💡 Tip:</strong> If running locally, you can use your LAN IP (find with <code>ipconfig</code> on Windows or <code>ifconfig</code> on Mac/Linux).
                      For internet access, use your public IP or set up port forwarding on your router.
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="webhook-url">Webhook URL</label>
                    <input
                      type="text"
                      id="webhook-url"
                      value={
                        config.webhook?.publicHost
                          ? `http://${config.webhook.publicHost}:${config.webhook?.port || 34512}/webhook/doordeck`
                          : 'Enter public IP or domain above to generate webhook URL'
                      }
                      readOnly
                      className="form-control"
                      style={{
                        backgroundColor: '#f9fafb',
                        cursor: 'text',
                        color: config.webhook?.publicHost ? '#111827' : '#9ca3af'
                      }}
                    />
                    <small>
                      Copy this URL and configure it in your Doordeck dashboard webhook settings.
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="webhook-secret">Webhook Secret (from Doordeck)</label>
                    <input
                      type="password"
                      id="webhook-secret"
                      value={config.webhook?.secret || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          webhook: {
                            ...config.webhook,
                            secret: e.target.value,
                          },
                        })
                      }
                      className="form-control"
                      placeholder="Paste secret from Doordeck webhook settings"
                    />
                    <small>
                      <strong>Important:</strong> Doordeck provides this secret to you when you create the webhook in their dashboard.
                      Copy it from Doordeck and paste it here - do NOT share this secret with Doordeck.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={config.webhook?.verifySignature ?? true}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            webhook: {
                              ...config.webhook,
                              verifySignature: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Verify Webhook Signatures</span>
                    </label>
                    <small className="warning-text">
                      Strongly recommended for security. Only disable for testing.
                    </small>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}
