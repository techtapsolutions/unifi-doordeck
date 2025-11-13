/**
 * Setup Wizard Component
 * Guides users through first-time configuration
 */

import React, { useState } from 'react';
import type { SetupStep, BridgeConfig, Door, DoorMapping } from '../../shared/types';
import WelcomeStep from './setup-steps/WelcomeStep';
import UniFiStep from './setup-steps/UniFiStep';
import DoordeckStep from './setup-steps/DoordeckStep';
import DoorMappingStep from './setup-steps/DoorMappingStep';
import CompleteStep from './setup-steps/CompleteStep';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [config, setConfig] = useState<Partial<BridgeConfig>>({
    unifi: {},
    doordeck: {},
    logging: { level: 'info' },
    security: { apiAuthEnabled: true, logSanitization: true },
    server: { port: 3000, enabled: true },
    webhook: { enabled: true, verifySignature: true, port: 34512 },
  });
  const [unifiTested, setUnifiTested] = useState(false);
  const [doordeckTested, setDoordeckTested] = useState(false);
  const [discoveredDoors, setDiscoveredDoors] = useState<Door[]>([]);
  const [mappedDoors, setMappedDoors] = useState<DoorMapping[]>([]);

  const steps: SetupStep[] = ['welcome', 'unifi', 'doordeck', 'mapping', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  function handleNext(stepData?: any) {
    if (stepData) {
      if (currentStep === 'unifi') {
        setConfig({ ...config, unifi: stepData });
        setUnifiTested(true);
      } else if (currentStep === 'doordeck') {
        setConfig({ ...config, doordeck: stepData });
        setDoordeckTested(true);
      } else if (currentStep === 'mapping') {
        setMappedDoors(stepData);
      }
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  }

  function handleBack() {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  }

  async function handleComplete() {
    try {
      // Save configuration
      console.log('[Setup] Saving configuration...');
      const saveResponse = await window.bridge.completeSetup(config as BridgeConfig);
      if (!saveResponse.success) {
        alert(`Failed to save configuration: ${saveResponse.error}`);
        return;
      }
      console.log('[Setup] Configuration saved');

      // Install service
      console.log('[Setup] Installing service...');
      const installResponse = await window.bridge.installService();
      if (!installResponse.success) {
        alert(`Failed to install service: ${installResponse.error}\n\nNote: Installing a Windows service requires administrator privileges. Please run the application as administrator.`);
        return;
      }
      console.log('[Setup] Service installed');

      // Start service
      console.log('[Setup] Starting service...');
      const startResponse = await window.bridge.startService();
      if (!startResponse.success) {
        alert(`Service installed but failed to start: ${startResponse.error}\n\nYou can try starting it manually from the Dashboard.`);
        // Still complete setup even if start fails
      }
      console.log('[Setup] Service started');

      // Complete setup
      onComplete();
    } catch (error) {
      console.error('[Setup] Error:', error);
      alert(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="setup-wizard">
      <div className="setup-header">
        <h1>UniFi-Doordeck Bridge Setup</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="step-indicator">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      <div className="setup-content">
        {currentStep === 'welcome' && (
          <WelcomeStep onNext={handleNext} />
        )}

        {currentStep === 'unifi' && (
          <UniFiStep
            initialConfig={config.unifi}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'doordeck' && (
          <DoordeckStep
            initialConfig={config.doordeck}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'mapping' && (
          <DoorMappingStep
            unifiConfig={config.unifi!}
            doordeckConfig={config.doordeck!}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'complete' && (
          <CompleteStep
            config={config as BridgeConfig}
            mappedDoors={mappedDoors}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )}
      </div>

      <div className="setup-footer">
        <p className="help-text">
          Need help? Check the documentation or contact support.
        </p>
      </div>
    </div>
  );
}
