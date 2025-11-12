import React from 'react';

interface CompletionStepProps {
  onFinish: () => void;
}

const CompletionStep: React.FC<CompletionStepProps> = ({ onFinish }) => {
  return (
    <div className="wizard-step completion-step">
      <div className="step-content">
        <div className="success-icon-large">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" fill="#10B981" />
            <path
              d="M30 50 L45 65 L70 35"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2>Setup Complete!</h2>

        <p className="completion-message">
          Your Doordeck Bridge has been successfully configured and is ready to use.
        </p>

        <div className="quick-start-guide">
          <h3>Quick Start Guide</h3>

          <div className="guide-section">
            <h4>1. Start the Service</h4>
            <p>
              Click the "Start Service" button in the dashboard to begin bridging door
              unlock events between UniFi Access and Doordeck.
            </p>
          </div>

          <div className="guide-section">
            <h4>2. Monitor Activity</h4>
            <p>
              The dashboard shows real-time statistics including unlock events, success
              rates, and connection status.
            </p>
          </div>

          <div className="guide-section">
            <h4>3. View Logs</h4>
            <p>
              Use the Logs tab to troubleshoot issues and monitor detailed activity. You
              can filter by log level and search for specific events.
            </p>
          </div>

          <div className="guide-section">
            <h4>4. Manage Door Mappings</h4>
            <p>
              Add, remove, or modify door mappings at any time from the Doors tab. Changes
              are applied immediately when the service restarts.
            </p>
          </div>
        </div>

        <div className="next-steps">
          <h3>Next Steps</h3>
          <ul>
            <li>Verify your door mappings are correct</li>
            <li>Test unlock functionality with a Doordeck door</li>
            <li>Configure logging preferences if needed</li>
            <li>Set up system tray preferences</li>
          </ul>
        </div>

        <div className="tips-box">
          <h4>💡 Pro Tips</h4>
          <ul>
            <li>The application minimizes to the system tray by default</li>
            <li>Right-click the tray icon for quick service controls</li>
            <li>Use Ctrl+R to refresh the dashboard</li>
            <li>Enable file logging for detailed troubleshooting</li>
          </ul>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-primary btn-large" onClick={onFinish}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CompletionStep;
