/**
 * Setup Complete Step - Setup Wizard
 */

import React, { useState } from 'react';
import type { BridgeConfig, DoorMapping } from '../../../shared/types';

interface CompleteStepProps {
  config: BridgeConfig;
  mappedDoors: DoorMapping[];
  onComplete: () => void;
  onBack: () => void;
}

export default function CompleteStep({
  config,
  mappedDoors,
  onComplete,
  onBack,
}: CompleteStepProps) {
  const [completing, setCompleting] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    try {
      await onComplete();
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="setup-step complete-step">
      <div className="success-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 32l8 8 16-16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2>Setup Complete!</h2>
      <p className="step-description">
        Your UniFi-Doordeck Bridge is ready to start. Review your configuration below.
      </p>

      <div className="config-summary">
        <div className="summary-section">
          <h3>UniFi Access</h3>
          <div className="summary-item">
            <span className="label">Controller:</span>
            <span className="value">{config.unifi.host}:{config.unifi.port || 443}</span>
          </div>
          <div className="summary-item">
            <span className="label">Authentication:</span>
            <span className="value">
              {config.unifi.apiKey ? 'API Key' : 'Username/Password'}
            </span>
          </div>
        </div>

        <div className="summary-section">
          <h3>Doordeck</h3>
          <div className="summary-item">
            <span className="label">Email:</span>
            <span className="value">{config.doordeck.email}</span>
          </div>
        </div>

        <div className="summary-section">
          <h3>Doors</h3>
          <div className="summary-item">
            <span className="label">Mapped Doors:</span>
            <span className="value">{mappedDoors.length}</span>
          </div>
          <ul className="doors-summary">
            {mappedDoors.map((mapping) => (
              <li key={mapping.unifiDoorId}>{mapping.name}</li>
            ))}
          </ul>
        </div>

        <div className="summary-section">
          <h3>Security</h3>
          <div className="summary-item">
            <span className="label">Credential Storage:</span>
            <span className="value">Windows Credential Manager</span>
          </div>
          <div className="summary-item">
            <span className="label">SSL/TLS:</span>
            <span className="value">Enabled (Mandatory)</span>
          </div>
          <div className="summary-item">
            <span className="label">Log Sanitization:</span>
            <span className="value">
              {config.security?.logSanitization ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      <div className="next-steps">
        <h3>What happens next?</h3>
        <ol>
          <li>Configuration will be saved securely</li>
          <li>Bridge service will start automatically</li>
          <li>Doors will be registered with Doordeck Cloud</li>
          <li>You'll be taken to the dashboard to monitor status</li>
        </ol>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack} disabled={completing}>
          Back
        </button>
        <button
          className="btn btn-primary btn-large"
          onClick={handleComplete}
          disabled={completing}
        >
          {completing ? 'Starting Service...' : 'Complete Setup & Start Service'}
        </button>
      </div>
    </div>
  );
}
