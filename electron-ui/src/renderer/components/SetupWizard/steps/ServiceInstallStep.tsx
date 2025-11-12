import React, { useState } from 'react';
import { useElectronAPI } from '../../../hooks/useElectronAPI';

interface ServiceInstallStepProps {
  onNext: () => void;
  onBack: () => void;
}

const ServiceInstallStep: React.FC<ServiceInstallStepProps> = ({ onNext, onBack }) => {
  const electronAPI = useElectronAPI();
  const [bridgePath, setBridgePath] = useState('C:\\Program Files\\Doordeck\\bridge.exe');
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);

    try {
      const response = await electronAPI.installService(bridgePath);

      if (response.success) {
        setInstalled(true);
      } else {
        setError(response.error || 'Failed to install service');
      }
    } catch (err) {
      setError('An unexpected error occurred during installation');
    } finally {
      setInstalling(false);
    }
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="wizard-step service-install-step">
      <div className="step-content">
        <h2>Service Installation</h2>
        <p className="step-description">
          Install the Doordeck Bridge as a Windows service to run automatically on startup.
        </p>

        <div className="info-box">
          <div className="info-icon">ℹ</div>
          <div className="info-content">
            <h4>Administrator Privileges Required</h4>
            <p>
              Installing a Windows service requires administrator privileges. You may be
              prompted to allow this application to make changes to your device.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bridgePath">Bridge Service Executable Path</label>
          <div className="path-input-group">
            <input
              id="bridgePath"
              type="text"
              className="form-control"
              value={bridgePath}
              onChange={(e) => setBridgePath(e.target.value)}
              disabled={installed}
            />
            <button className="btn btn-secondary" disabled={installed}>
              Browse...
            </button>
          </div>
          <span className="help-text">
            Path to the compiled bridge service executable
          </span>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {installed && (
          <div className="success-banner">
            <span className="success-icon">✓</span>
            <div className="success-content">
              <h4>Service Installed Successfully</h4>
              <p>
                The Doordeck Bridge service has been installed and will start automatically
                with Windows.
              </p>
            </div>
          </div>
        )}

        <div className="service-features">
          <h4>Service Features</h4>
          <ul>
            <li>Automatic startup with Windows</li>
            <li>Runs in the background without user login</li>
            <li>Automatic restart on failure</li>
            <li>Centralized logging and monitoring</li>
          </ul>
        </div>

        {!installed && (
          <div className="install-action">
            <button
              className="btn btn-primary btn-large"
              onClick={handleInstall}
              disabled={installing || !bridgePath}
            >
              {installing ? 'Installing Service...' : 'Install Service'}
            </button>
          </div>
        )}
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack} disabled={installing}>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!installed && !installing}
        >
          {installed ? 'Next' : 'Skip'}
        </button>
      </div>
    </div>
  );
};

export default ServiceInstallStep;
