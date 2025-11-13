/**
 * Main Dashboard Component
 * Displays service status, door controls, and logs
 */

import React, { useEffect, useState } from 'react';
import type { ServiceHealth, Door } from '../../shared/types';
import Settings from './Settings';
import DoorMappings from './DoorMappings';
import LogsViewer from './LogsViewer';
import UpdateNotification from './UpdateNotification';

export default function Dashboard() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [doors, setDoors] = useState<Door[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showMappings, setShowMappings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    loadDashboard();

    // Subscribe to service status updates
    const unsubscribe = window.bridge.onServiceStatus((status) => {
      if (health) {
        setHealth({ ...health, status: status as any });
      }
    });

    // Poll for updates every 5 seconds
    const interval = setInterval(loadDashboard, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  async function loadDashboard() {
    try {
      // Try to get health from bridge service
      const healthResponse = await window.bridge.getServiceHealth();
      if (healthResponse.success && healthResponse.data) {
        setHealth(healthResponse.data);
      } else {
        // Bridge service not running - test connections directly
        console.log('[Dashboard] Bridge service not available, testing connections directly...');
        const configResponse = await window.bridge.getConfig();
        if (configResponse.success && configResponse.data) {
          const config = configResponse.data;

          // Test UniFi connection
          let unifiConnected = false;
          if (config.unifi?.host && config.unifi?.apiKey) {
            const unifiTest = await window.bridge.testUniFiConnection(config.unifi);
            unifiConnected = unifiTest.success;
          }

          // Test Doordeck connection
          let doordeckConnected = false;
          if (config.doordeck?.email && config.doordeck?.password) {
            const doordeckTest = await window.bridge.testDoordeckConnection(config.doordeck);
            doordeckConnected = doordeckTest.success;
          }

          // Create mock health object with test results
          setHealth({
            status: 'stopped',
            uptime: 0,
            unifiConnected,
            doordeckConnected,
          });
        }
      }

      // Try to get doors from bridge service
      let doorsResponse = await window.bridge.listDoors();

      // If bridge service isn't running, discover doors directly from UniFi
      if (!doorsResponse.success || !doorsResponse.data || doorsResponse.data.length === 0) {
        console.log('[Dashboard] Bridge service not available, discovering doors directly...');
        const configResponse = await window.bridge.getConfig();
        if (configResponse.success && configResponse.data?.unifi) {
          const discoveryResponse = await window.bridge.discoverDoorsWithConfig(configResponse.data.unifi);
          if (discoveryResponse.success && discoveryResponse.data) {
            doorsResponse = discoveryResponse;
          }
        }
      }

      if (doorsResponse.success && doorsResponse.data) {
        setDoors(doorsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock(doorId: string) {
    try {
      const response = await window.bridge.unlockDoor(doorId);
      if (response.success) {
        // Show success notification
        alert('Door unlocked successfully!');
      } else {
        alert(`Failed to unlock door: ${response.error}`);
      }
    } catch (error) {
      alert(`Failed to unlock door: ${error}`);
    }
  }

  async function handleServiceAction(action: 'start' | 'stop' | 'restart') {
    try {
      let response;
      if (action === 'start') {
        response = await window.bridge.startService();
      } else if (action === 'stop') {
        response = await window.bridge.stopService();
      } else {
        response = await window.bridge.restartService();
      }

      if (response.success) {
        alert(`Service ${action}ed successfully!`);
        // Reload dashboard to update status
        setTimeout(loadDashboard, 2000);
      } else {
        alert(`Failed to ${action} service: ${response.error}`);
      }
    } catch (error) {
      alert(`Failed to ${action} service: ${error}`);
    }
  }

  async function handleCheckForUpdates() {
    try {
      const response = await window.bridge.checkForUpdates();
      if (!response.success) {
        alert(`Failed to check for updates: ${response.error}`);
      } else if (response.data && !response.data.available) {
        alert('You are already running the latest version!');
      }
    } catch (error) {
      alert(`Failed to check for updates: ${error}`);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>UniFi-Doordeck Bridge</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleCheckForUpdates}>
            Check for Updates
          </button>
          <button className="btn btn-secondary" onClick={() => setShowLogs(true)}>
            Logs
          </button>
          <button className="btn btn-secondary" onClick={() => setShowMappings(true)}>
            Door Mappings
          </button>
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Service Status */}
        <section className="status-section">
          <div className="section-header">
            <h2>Service Status</h2>
            <div className="service-controls">
              <button
                className="btn btn-small btn-success"
                onClick={() => handleServiceAction('start')}
                disabled={health?.status === 'running'}
              >
                Start
              </button>
              <button
                className="btn btn-small btn-danger"
                onClick={() => handleServiceAction('stop')}
                disabled={health?.status !== 'running'}
              >
                Stop
              </button>
              <button
                className="btn btn-small btn-secondary"
                onClick={() => handleServiceAction('restart')}
                disabled={health?.status !== 'running'}
              >
                Restart
              </button>
            </div>
          </div>
          <div className="status-card">
            <div className="status-item">
              <span className="label">Status:</span>
              <span className={`status-badge ${health?.status || 'stopped'}`}>
                {health?.status === 'stopped' ? 'Service Stopped' : health?.status || 'Unknown'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">UniFi:</span>
              <span className={`status-badge ${health?.unifiConnected ? 'running' : 'error'}`}>
                {health?.unifiConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Doordeck:</span>
              <span className={`status-badge ${health?.doordeckConnected ? 'running' : 'error'}`}>
                {health?.doordeckConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {health?.uptime && (
              <div className="status-item">
                <span className="label">Uptime:</span>
                <span className="value">{formatUptime(health.uptime)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Doors */}
        <section className="doors-section">
          <h2>Doors ({doors.length})</h2>
          <div className="doors-grid">
            {doors.map((door) => (
              <div key={door.id} className="door-card">
                <div className="door-info">
                  <h3>{door.name}</h3>
                  {door.floor && <p className="door-floor">Floor: {door.floor}</p>}
                  {door.isMonitored && (
                    <span className="monitoring-badge">Monitoring Active</span>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleUnlock(door.id)}
                >
                  Unlock
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={() => {
            setShowSettings(false);
            loadDashboard();
          }}
        />
      )}

      {showMappings && (
        <DoorMappings
          onClose={() => setShowMappings(false)}
        />
      )}

      {showLogs && (
        <LogsViewer
          onClose={() => setShowLogs(false)}
        />
      )}

      {/* Update notification - shows automatically when updates are available */}
      <UpdateNotification />
    </div>
  );
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
