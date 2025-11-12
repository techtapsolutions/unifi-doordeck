/**
 * UniFi Configuration Step - Setup Wizard
 */

import React, { useState } from 'react';
import type { UniFiConfig } from '../../../shared/types';

interface UniFiStepProps {
  initialConfig?: Partial<UniFiConfig>;
  onNext: (config: UniFiConfig) => void;
  onBack: () => void;
}

export default function UniFiStep({ initialConfig, onNext, onBack }: UniFiStepProps) {
  const [authMethod, setAuthMethod] = useState<'apiKey' | 'password'>(
    initialConfig?.apiKey ? 'apiKey' : 'password'
  );
  const [host, setHost] = useState(initialConfig?.host || '');
  const [port, setPort] = useState(initialConfig?.port?.toString() || '443');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [username, setUsername] = useState(initialConfig?.username || '');
  const [password, setPassword] = useState(initialConfig?.password || '');
  const [caCertPath, setCaCertPath] = useState(initialConfig?.caCertPath || '');
  const [skipSSLVerification, setSkipSSLVerification] = useState(initialConfig?.skipSSLVerification || false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    const config: UniFiConfig = {
      host,
      port: parseInt(port),
      ...(authMethod === 'apiKey' ? { apiKey } : { username, password }),
      ...(caCertPath && { caCertPath }),
      ...(skipSSLVerification && { skipSSLVerification }),
    };

    try {
      const response = await window.bridge.testUniFiConnection(config);
      if (response.success && response.data) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({
          success: false,
          message: response.error || 'Connection failed',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  }

  function handleNext() {
    const config: UniFiConfig = {
      host,
      port: parseInt(port),
      ...(authMethod === 'apiKey' ? { apiKey } : { username, password }),
      ...(caCertPath && { caCertPath }),
      ...(skipSSLVerification && { skipSSLVerification }),
    };
    onNext(config);
  }

  const isValid =
    host &&
    port &&
    (authMethod === 'apiKey' ? apiKey : username && password) &&
    testResult?.success;

  return (
    <div className="setup-step unifi-step">
      <h2>Configure UniFi Access</h2>
      <p className="step-description">
        Enter your UniFi Access controller connection details.
      </p>

      <div className="form-group">
        <label htmlFor="host">Controller Host/IP Address *</label>
        <input
          type="text"
          id="host"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="192.168.1.1"
          className="form-control"
        />
        <small>IP address or hostname of your UniFi Access controller</small>
      </div>

      <div className="form-group">
        <label htmlFor="port">Port</label>
        <input
          type="number"
          id="port"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="443"
          className="form-control"
        />
        <small>Default: 443 (HTTPS)</small>
      </div>

      <div className="form-group">
        <label>Authentication Method</label>
        <div className="auth-method-selector">
          <button
            className={`btn ${authMethod === 'apiKey' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAuthMethod('apiKey')}
          >
            API Key (Recommended)
          </button>
          <button
            className={`btn ${authMethod === 'password' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAuthMethod('password')}
          >
            Username/Password
          </button>
        </div>
      </div>

      {authMethod === 'apiKey' ? (
        <div className="form-group">
          <label htmlFor="apiKey">API Key *</label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your UniFi OS API key"
            className="form-control"
          />
          <small>
            Generate an API key in UniFi OS under Settings → Admins & Users
          </small>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="form-control"
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="caCertPath">Custom CA Certificate (Optional)</label>
        <input
          type="text"
          id="caCertPath"
          value={caCertPath}
          onChange={(e) => setCaCertPath(e.target.value)}
          placeholder="C:\path\to\ca-cert.pem"
          className="form-control"
          disabled={skipSSLVerification}
        />
        <small>
          Path to CA certificate file for self-signed certificates.
        </small>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={skipSSLVerification}
            onChange={(e) => setSkipSSLVerification(e.target.checked)}
          />
          <span>Skip SSL Certificate Verification</span>
        </label>
        <small className="warning-text">
          ⚠️ Not recommended for production. Use only for testing with self-signed certificates.
        </small>
      </div>

      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          {testResult.message}
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleTest}
          disabled={!host || !port || (authMethod === 'apiKey' ? !apiKey : !username || !password) || testing}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!isValid}
        >
          Next
        </button>
      </div>
    </div>
  );
}
