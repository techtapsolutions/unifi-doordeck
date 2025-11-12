import React from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="wizard-step welcome-step">
      <div className="step-content">
        <div className="welcome-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="35" stroke="#4F46E5" strokeWidth="3" />
            <path
              d="M40 25V40L50 50"
              stroke="#4F46E5"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2>Welcome to Doordeck Bridge</h2>

        <p className="welcome-description">
          This setup wizard will guide you through configuring the Doordeck-UniFi Access
          integration. The bridge service enables seamless door control by synchronizing
          unlock events between Doordeck and UniFi Access systems.
        </p>

        <div className="feature-list">
          <div className="feature-item">
            <div className="feature-icon">✓</div>
            <div className="feature-text">
              <strong>UniFi Access Integration</strong>
              <p>Connect to your UniFi Access controller to manage door access</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">✓</div>
            <div className="feature-text">
              <strong>Doordeck API Configuration</strong>
              <p>Authenticate with Doordeck to enable remote door control</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">✓</div>
            <div className="feature-text">
              <strong>Door Mapping</strong>
              <p>Map your UniFi doors to corresponding Doordeck doors</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">✓</div>
            <div className="feature-text">
              <strong>Windows Service</strong>
              <p>Install as a Windows service for automatic startup</p>
            </div>
          </div>
        </div>

        <div className="welcome-footer">
          <p className="info-text">
            <strong>Note:</strong> You'll need administrator privileges to install the
            Windows service. Make sure you have your UniFi Access and Doordeck credentials
            ready.
          </p>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-primary btn-large" onClick={onNext}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeStep;
