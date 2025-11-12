/**
 * Welcome Step - Setup Wizard
 */

import React from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="setup-step welcome-step">
      <div className="step-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" />
          <path
            d="M32 16v32M16 32h32"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2>Welcome to UniFi-Doordeck Bridge</h2>

      <p className="intro-text">
        This wizard will help you connect your UniFi Access controller to Doordeck Cloud,
        enabling mobile credential access to your doors.
      </p>

      <div className="features-list">
        <div className="feature">
          <h3>What you'll need:</h3>
          <ul>
            <li>UniFi Access controller (IP address and credentials or API key)</li>
            <li>Doordeck account (email and password)</li>
            <li>5-10 minutes to complete setup</li>
          </ul>
        </div>

        <div className="feature">
          <h3>What we'll configure:</h3>
          <ul>
            <li>UniFi Access connection settings</li>
            <li>Doordeck Cloud authentication</li>
            <li>Door discovery and mapping</li>
            <li>Service startup and monitoring</li>
          </ul>
        </div>
      </div>

      <div className="security-notice">
        <h4>Security Notice</h4>
        <p>
          All credentials are securely stored using Windows Credential Manager.
          SSL/TLS encryption is enforced for all connections.
        </p>
      </div>

      <div className="step-actions">
        <button className="btn btn-primary" onClick={onNext}>
          Get Started
        </button>
      </div>
    </div>
  );
}
