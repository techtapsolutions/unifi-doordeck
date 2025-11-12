import React, { useState } from 'react';
import { AppConfig } from '../../../../shared/types';
import { useElectronAPI } from '../../../hooks/useElectronAPI';

interface DoordeckConfigStepProps {
  initialConfig?: AppConfig['doordeck'];
  onNext: (config: AppConfig['doordeck']) => void;
  onBack: () => void;
}

const DoordeckConfigStep: React.FC<DoordeckConfigStepProps> = ({
  initialConfig,
  onNext,
  onBack,
}) => {
  const electronAPI = useElectronAPI();
  const [config, setConfig] = useState<AppConfig['doordeck']>(
    initialConfig || {
      apiUrl: 'https://api.doordeck.com',
    }
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof AppConfig['doordeck'], value: string) => {
    setConfig({ ...config, [field]: value });
    setErrors({ ...errors, [field]: '' });
    setTestResult(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.apiUrl.trim()) {
      newErrors.apiUrl = 'API URL is required';
    } else if (!config.apiUrl.match(/^https?:\/\/.+/)) {
      newErrors.apiUrl = 'API URL must be a valid URL';
    }

    if (!config.authToken?.trim() && (!config.clientId?.trim() || !config.clientSecret?.trim())) {
      newErrors.auth = 'Either Auth Token or Client ID/Secret is required';
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
      const response = await electronAPI.testDoordeckConnection(
        config.apiUrl,
        config.authToken
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
    <div className="wizard-step doordeck-config-step">
      <div className="step-content">
        <h2>Doordeck Configuration</h2>
        <p className="step-description">
          Configure your Doordeck API credentials to enable remote door control.
        </p>

        <div className="form-group">
          <label htmlFor="apiUrl">
            API URL <span className="required">*</span>
          </label>
          <input
            id="apiUrl"
            type="text"
            className={`form-control ${errors.apiUrl ? 'error' : ''}`}
            placeholder="https://api.doordeck.com"
            value={config.apiUrl}
            onChange={(e) => handleChange('apiUrl', e.target.value)}
          />
          {errors.apiUrl && <span className="error-message">{errors.apiUrl}</span>}
          <span className="help-text">The Doordeck API endpoint URL</span>
        </div>

        <div className="auth-section">
          <h3>Authentication Method</h3>
          <p className="section-description">
            Choose one of the following authentication methods:
          </p>

          <div className="auth-option">
            <h4>Option 1: Auth Token</h4>
            <div className="form-group">
              <label htmlFor="authToken">Auth Token</label>
              <input
                id="authToken"
                type="password"
                className="form-control"
                placeholder="Enter your Doordeck auth token"
                value={config.authToken || ''}
                onChange={(e) => handleChange('authToken', e.target.value)}
                autoComplete="off"
              />
              <span className="help-text">
                Get your auth token from the Doordeck dashboard
              </span>
            </div>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="auth-option">
            <h4>Option 2: OAuth Client Credentials</h4>
            <div className="form-group">
              <label htmlFor="clientId">Client ID</label>
              <input
                id="clientId"
                type="text"
                className="form-control"
                placeholder="Enter your OAuth client ID"
                value={config.clientId || ''}
                onChange={(e) => handleChange('clientId', e.target.value)}
                disabled={!!config.authToken}
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientSecret">Client Secret</label>
              <input
                id="clientSecret"
                type="password"
                className="form-control"
                placeholder="Enter your OAuth client secret"
                value={config.clientSecret || ''}
                onChange={(e) => handleChange('clientSecret', e.target.value)}
                autoComplete="off"
                disabled={!!config.authToken}
              />
              <span className="help-text">
                Create OAuth credentials in the Doordeck developer portal
              </span>
            </div>
          </div>

          {errors.auth && <span className="error-message">{errors.auth}</span>}
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

export default DoordeckConfigStep;
