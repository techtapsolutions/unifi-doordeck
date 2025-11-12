/**
 * Doordeck Configuration Step - Setup Wizard
 */

import React, { useState } from 'react';
import type { DoordeckConfig } from '../../../shared/types';

interface DoordeckStepProps {
  initialConfig?: Partial<DoordeckConfig>;
  onNext: (config: DoordeckConfig) => void;
  onBack: () => void;
}

export default function DoordeckStep({
  initialConfig,
  onNext,
  onBack,
}: DoordeckStepProps) {
  const [email, setEmail] = useState(initialConfig?.email || '');
  const [password, setPassword] = useState(initialConfig?.password || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    const config: DoordeckConfig = {
      email,
      password,
    };

    try {
      const response = await window.bridge.testDoordeckConnection(config);
      if (response.success && response.data) {
        setTestResult({ success: true, message: 'Authentication successful!' });
      } else {
        setTestResult({
          success: false,
          message: response.error || 'Authentication failed',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed',
      });
    } finally {
      setTesting(false);
    }
  }

  function handleNext() {
    const config: DoordeckConfig = {
      email,
      password,
    };
    onNext(config);
  }

  const isValid = email && password && testResult?.success;

  return (
    <div className="setup-step doordeck-step">
      <h2>Configure Doordeck</h2>
      <p className="step-description">
        Enter your Doordeck account credentials to enable cloud integration.
      </p>

      <div className="info-box">
        <h4>Don't have a Doordeck account?</h4>
        <p>
          Visit{' '}
          <a href="https://doordeck.com" target="_blank" rel="noopener noreferrer">
            doordeck.com
          </a>{' '}
          to create an account.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="form-control"
        />
        <small>Your Doordeck account email</small>
      </div>

      <div className="form-group">
        <label htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="form-control"
        />
        <small>Your Doordeck account password</small>
      </div>

      <div className="security-notice">
        <h4>Security Information</h4>
        <p>
          Your credentials are securely stored in Windows Credential Manager and never
          transmitted in plain text. The bridge uses your credentials only to authenticate
          with Doordeck Cloud and retrieve access tokens.
        </p>
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
          disabled={!email || !password || testing}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button className="btn btn-primary" onClick={handleNext} disabled={!isValid}>
          Next
        </button>
      </div>
    </div>
  );
}
