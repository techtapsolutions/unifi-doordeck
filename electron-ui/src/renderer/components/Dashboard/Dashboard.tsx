import React, { useState, useEffect } from 'react';
import { AppConfig, ServiceStatus, Statistics, ConnectionStatus } from '../../../shared/types';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import ServiceControls from './ServiceControls';
import StatisticsPanel from './StatisticsPanel';
import ConnectionStatusPanel from './ConnectionStatusPanel';
import ConfigurationTabs from './ConfigurationTabs';
import './Dashboard.css';

interface DashboardProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ config, onConfigChange }) => {
  const electronAPI = useElectronAPI();
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    isRunning: false,
    isInstalled: false,
  });
  const [statistics, setStatistics] = useState<Statistics>({
    totalUnlocks: 0,
    successfulUnlocks: 0,
    failedUnlocks: 0,
    errors24h: 0,
    averageResponseTime: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    unifi: { connected: false, lastCheck: new Date().toISOString() },
    doordeck: { connected: false, lastCheck: new Date().toISOString() },
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'logs'>('overview');

  useEffect(() => {
    loadInitialData();
    setupEventListeners();

    return () => {
      window.electronAPI.removeAllListeners(window.electronAPI.channels.SERVICE_STATUS_CHANGE);
      window.electronAPI.removeAllListeners(window.electronAPI.channels.STATISTICS_UPDATE);
      window.electronAPI.removeAllListeners(window.electronAPI.channels.CONNECTION_STATUS_CHANGE);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [statusResponse, statsResponse, connResponse] = await Promise.all([
        electronAPI.getServiceStatus(),
        electronAPI.getStatistics(),
        electronAPI.getConnectionStatus(),
      ]);

      if (statusResponse.success && statusResponse.data) {
        setServiceStatus(statusResponse.data as ServiceStatus);
      }

      if (statsResponse.success && statsResponse.data) {
        setStatistics(statsResponse.data as Statistics);
      }

      if (connResponse.success && connResponse.data) {
        setConnectionStatus(connResponse.data as ConnectionStatus);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const setupEventListeners = () => {
    window.electronAPI.on(
      window.electronAPI.channels.SERVICE_STATUS_CHANGE,
      (status: ServiceStatus) => {
        setServiceStatus(status);
      }
    );

    window.electronAPI.on(
      window.electronAPI.channels.STATISTICS_UPDATE,
      (stats: Statistics) => {
        setStatistics(stats);
      }
    );

    window.electronAPI.on(
      window.electronAPI.channels.CONNECTION_STATUS_CHANGE,
      (status: ConnectionStatus) => {
        setConnectionStatus(status);
      }
    );
  };

  const handleServiceAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      let response;
      switch (action) {
        case 'start':
          response = await electronAPI.startService();
          break;
        case 'stop':
          response = await electronAPI.stopService();
          break;
        case 'restart':
          response = await electronAPI.restartService();
          break;
      }

      if (!response.success) {
        console.error(`Failed to ${action} service:`, response.error);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  const handleConfigUpdate = async (newConfig: Partial<AppConfig>) => {
    try {
      const response = await electronAPI.setConfig(newConfig);
      if (response.success) {
        onConfigChange({ ...config, ...newConfig });
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const handleRefresh = () => {
    loadInitialData();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Doordeck Bridge</h1>
          <div className="header-actions">
            <button className="btn btn-icon" onClick={handleRefresh} title="Refresh (Ctrl+R)">
              ↻
            </button>
            <button
              className="btn btn-icon"
              onClick={() => electronAPI.minimizeToTray()}
              title="Minimize to Tray"
            >
              —
            </button>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`nav-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
          <button
            className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
        </nav>
      </header>

      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="dashboard-grid">
              <ServiceControls
                status={serviceStatus}
                onAction={handleServiceAction}
              />

              <ConnectionStatusPanel status={connectionStatus} />

              <StatisticsPanel statistics={statistics} />
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <ConfigurationTabs
            config={config}
            onConfigUpdate={handleConfigUpdate}
          />
        )}

        {activeTab === 'logs' && (
          <div className="logs-tab">
            {/* Log viewer will be added */}
            <p>Log viewer component coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
