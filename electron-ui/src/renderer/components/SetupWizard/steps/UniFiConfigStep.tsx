import React, { useState } from 'react';
import { AppConfig } from '../../../../shared/types';
import { useElectronAPI } from '../../../hooks/useElectronAPI';

interface UniFiConfigStepProps {
  initialConfig?: AppConfig['unifi'];
  onNext: (config: AppConfig['unifi']) => void;
  onBack: () => void;
}

const UniFiConfigStep: React.FC<UniFiConfigStepProps> = ({
  initialConfig,
  onNext,
  onBack,
}) => {
  const electronAPI = useElectronAPI();
  const [config, setConfig] = useState<AppConfig['unifi']>(
    initialConfig || {
      host: '',
      username: '',
      password: '',
      verifySSL: false,
    }
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof AppConfig['unifi'], value: string | boolean) => {
    setConfig({ ...config, [field]: value });
    setErrors({ ...errors, [field]: '' });
    setTestResult(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.host.trim()) {
      newErrors.host = 'Host is required';
    } else if (!config.host.match(/^https?:\/\/.+/)) {
      newErrors.host = 'Host must be a valid URL (http:// or https://)';
    }

    if (!config.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!config.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await electronAPI.testUniFiConnection(
        config.host,
        config.username,
        config.password
      );

      if (response.success && response.data) {
        setTestResult({
          success: response.data.success,
          message: response.data.message,
        });
      } else {
        setTestResult({
          success: false,
          message: response.error || 'Connection test failed',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext(config);
    }
  };

  return (
    <div className="wizard-step unifi-config-step">
      <div className="step-content">
        <h2>UniFi Access Configuration</h2>
        <p className="step-description">
          Enter your UniFi Access controller details to enable door control integration.
        </p>

        <div className="form-group">
          <label htmlFor="host">
            Controller Host <span className="required">*</span>
          </label>
          <input
            id="host"
            type="text"
            className={`form-control ${errors.host ? 'error' : ''}`}
            placeholder="https://unifi-access.local:12445"
            value={config.host}
            onChange={(e) => handleChange('host', e.target.value)}
          />
          {errors.host && <span className="error-message">{errors.host}</span>}
          <span className="help-text">
            The URL of your UniFi Access controller (including port)
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="username">
            Username <span className="required">*</span>
          </label>
          <input
            id="username"
            type="text"
            className={`form-control ${errors.username ? 'error' : ''}`}
            placeholder="admin"
            value={config.username}
            onChange={(e) => handleChange('username', e.target.value)}
            autoComplete="username"
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Password <span className="required">*</span>
          </label>
          <input
            id="password"
            type="password"
            className={`form-control ${errors.password ? 'error' : ''}`}
            placeholder="••••••••"
            value={config.password}
            onChange={(e) => handleChange('password', e.target.value)}
            autoComplete="current-password"
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.verifySSL}
              onChange={(e) => handleChange('verifySSL', e.target.checked)}
            />
            <span>Verify SSL Certificate</span>
          </label>
          <span className="help-text">
            Disable this for self-signed certificates (not recommended for production)
          </span>
        </div>

        <div className="test-connection-section">
          <button
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? 'Testing Connection...' : 'Test Connection'}
          </button>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <span className="test-result-icon">
                {testResult.success ? '✓' : '✗'}
              </span>
              <span className="test-result-message">{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!testResult?.success}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UniFiConfigStep;
