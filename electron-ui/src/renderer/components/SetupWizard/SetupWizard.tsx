import React, { useState } from 'react';
import { AppConfig, DoorMapping } from '../../../shared/types';
import WelcomeStep from './steps/WelcomeStep';
import UniFiConfigStep from './steps/UniFiConfigStep';
import DoordeckConfigStep from './steps/DoordeckConfigStep';
import DoorMappingStep from './steps/DoorMappingStep';
import ServiceInstallStep from './steps/ServiceInstallStep';
import CompletionStep from './steps/CompletionStep';
import './SetupWizard.css';

interface SetupWizardProps {
  onComplete: (config: AppConfig) => void;
  initialConfig: AppConfig | null;
}

const STEPS = [
  'Welcome',
  'UniFi Access',
  'Doordeck',
  'Door Mapping',
  'Service Installation',
  'Complete',
] as const;

type Step = typeof STEPS[number];

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, initialConfig }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [config, setConfig] = useState<Partial<AppConfig>>(
    initialConfig || {
      unifi: { host: '', username: '', password: '', verifySSL: false },
      doordeck: { apiUrl: 'https://api.doordeck.com' },
      doorMappings: [],
      logging: { level: 'info', enableFileLogging: true },
      minimizeToTray: true,
      startWithWindows: false,
    }
  );

  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleUniFiConfig = (unifiConfig: AppConfig['unifi']) => {
    setConfig({ ...config, unifi: unifiConfig });
    handleNext();
  };

  const handleDoordeckConfig = (doordeckConfig: AppConfig['doordeck']) => {
    setConfig({ ...config, doordeck: doordeckConfig });
    handleNext();
  };

  const handleDoorMappings = (mappings: DoorMapping[]) => {
    setConfig({ ...config, doorMappings: mappings });
    handleNext();
  };

  const handleServiceInstall = () => {
    handleNext();
  };

  const handleComplete = () => {
    onComplete(config as AppConfig);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'Welcome':
        return <WelcomeStep onNext={handleNext} />;

      case 'UniFi Access':
        return (
          <UniFiConfigStep
            initialConfig={config.unifi}
            onNext={handleUniFiConfig}
            onBack={handleBack}
          />
        );

      case 'Doordeck':
        return (
          <DoordeckConfigStep
            initialConfig={config.doordeck}
            onNext={handleDoordeckConfig}
            onBack={handleBack}
          />
        );

      case 'Door Mapping':
        return (
          <DoorMappingStep
            unifiConfig={config.unifi!}
            doordeckConfig={config.doordeck!}
            initialMappings={config.doorMappings || []}
            onNext={handleDoorMappings}
            onBack={handleBack}
          />
        );

      case 'Service Installation':
        return (
          <ServiceInstallStep
            onNext={handleServiceInstall}
            onBack={handleBack}
          />
        );

      case 'Complete':
        return <CompletionStep onFinish={handleComplete} />;

      default:
        return null;
    }
  };

  return (
    <div className="setup-wizard">
      <div className="setup-wizard-header">
        <h1>Doordeck Bridge Setup</h1>
        <div className="step-indicator">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`step ${index === currentStepIndex ? 'active' : ''} ${
                index < currentStepIndex ? 'completed' : ''
              }`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-label">{step}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="setup-wizard-content">{renderStep()}</div>
    </div>
  );
};

export default SetupWizard;
