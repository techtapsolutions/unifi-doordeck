import React, { useState, useEffect } from 'react';
import SetupWizard from './components/SetupWizard/SetupWizard';
import Dashboard from './components/Dashboard/Dashboard';
import { AppConfig } from '../shared/types';
import { useElectronAPI } from './hooks/useElectronAPI';

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const electronAPI = useElectronAPI();

  useEffect(() => {
    loadConfig();

    // Listen for setup wizard trigger
    window.electronAPI.on('show-setup-wizard', () => {
      setShowSetupWizard(true);
    });

    return () => {
      window.electronAPI.removeAllListeners('show-setup-wizard');
    };
  }, []);

  const loadConfig = async () => {
    try {
      const response = await electronAPI.getConfig();
      if (response.success && response.data) {
        setConfig(response.data);
        setShowSetupWizard(response.data.firstRun);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = async (newConfig: AppConfig) => {
    try {
      await electronAPI.setConfig(newConfig);
      await electronAPI.completeSetup();
      setConfig(newConfig);
      setShowSetupWizard(false);
    } catch (error) {
      console.error('Failed to save setup config:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Doordeck Bridge...</p>
      </div>
    );
  }

  if (showSetupWizard || !config) {
    return <SetupWizard onComplete={handleSetupComplete} initialConfig={config} />;
  }

  return <Dashboard config={config} onConfigChange={setConfig} />;
};

export default App;
