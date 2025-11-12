/**
 * Main Application Component
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SetupWizard from './components/SetupWizard';
import Dashboard from './components/Dashboard';
import type { BridgeConfig } from '../shared/types';

function App() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  async function checkConfiguration() {
    try {
      const response = await window.bridge.getConfig();
      if (response.success && response.data) {
        // Check if configuration is complete
        const config = response.data;
        const configured =
          !!config.unifi?.host &&
          !!config.doordeck?.email &&
          (!!config.unifi.apiKey || (!!config.unifi.username && !!config.unifi.password));

        setIsConfigured(configured);
      } else {
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
      setIsConfigured(false);
    } finally {
      setLoading(false);
    }
  }

  function handleSetupComplete() {
    setIsConfigured(true);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!isConfigured ? (
          <>
            <Route path="/setup" element={<SetupWizard onComplete={handleSetupComplete} />} />
            <Route path="*" element={<Navigate to="/setup" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
