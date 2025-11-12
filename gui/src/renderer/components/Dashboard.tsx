/**
 * Main Dashboard Component
 * Displays service status, door controls, and logs
 */

import React, { useEffect, useState } from 'react';
import type { ServiceHealth, Door } from '../../shared/types';

export default function Dashboard() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [doors, setDoors] = useState<Door[]>([]);
  const [loading, setLoading] = useState(true);

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
      const [healthResponse, doorsResponse] = await Promise.all([
        window.bridge.getServiceHealth(),
        window.bridge.listDoors(),
      ]);

      if (healthResponse.success && healthResponse.data) {
        setHealth(healthResponse.data);
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
          <button className="btn btn-secondary">Settings</button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Service Status */}
        <section className="status-section">
          <h2>Service Status</h2>
          <div className="status-card">
            <div className="status-item">
              <span className="label">Status:</span>
              <span className={`status-badge ${health?.status || 'stopped'}`}>
                {health?.status || 'Unknown'}
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
