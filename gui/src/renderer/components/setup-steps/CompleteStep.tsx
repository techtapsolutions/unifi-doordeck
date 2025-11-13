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
          <h3>Webhooks</h3>
          <div className="summary-item">
            <span className="label">Status:</span>
            <span className="value">
              {config.webhook?.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {config.webhook?.enabled && (
            <>
              {config.webhook?.publicHost ? (
                <div className="summary-item">
                  <span className="label">Webhook URL:</span>
                  <span className="value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    http://{config.webhook.publicHost}:{config.webhook?.port || 34512}/webhook/doordeck
                  </span>
                </div>
              ) : (
                <p className="help-text" style={{ color: '#f59e0b', marginTop: '8px' }}>
                  ⚠️ No public host configured. Add your public IP or domain in Settings &gt; Advanced &gt; Webhooks.
                </p>
              )}
              <div className="summary-item">
                <span className="label">Signature Verification:</span>
                <span className="value">
                  {config.webhook?.verifySignature ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {!config.webhook?.secret && (
                <p className="help-text" style={{ color: '#f59e0b', marginTop: '8px' }}>
                  ⚠️ No webhook secret configured. Get it from Doordeck dashboard and add in Settings &gt; Advanced.
                </p>
              )}
            </>
          )}
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
          <li>Bridge service will start automatically on port 34512</li>
          <li>Doors will be registered with Doordeck Cloud</li>
          {config.webhook?.enabled && (
            <li>Webhook endpoint will be ready to receive events from Doordeck</li>
          )}
          <li>You'll be taken to the dashboard to monitor status</li>
        </ol>
        {config.webhook?.enabled && (
          <div className="help-text" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>
            <strong>📋 To complete webhook setup:</strong>
            <ol style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Go to Settings &gt; Advanced &gt; Webhooks and enter your public IP or domain</li>
              <li>Copy the generated webhook URL</li>
              <li>In Doordeck dashboard, create a webhook with that URL</li>
              <li>Copy the secret that Doordeck provides to you</li>
              <li>Paste it back into Settings &gt; Advanced &gt; Webhooks</li>
            </ol>
          </div>
        )}
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
