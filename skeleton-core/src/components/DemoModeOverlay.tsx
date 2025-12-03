import React from 'react';
import { useDemoMode } from '../core/ZeroframeContext';
import '../styles/DemoModeOverlay.css';

const DEMO_STEP_CONTENT: Record<string, { title: string; description: string }> = {
  intro: {
    title: 'Welcome to Zeroframe OS',
    description: 'Start on the Dashboard to see system status at a glance.',
  },
  'switch-user-roles': {
    title: 'Switch User Roles',
    description: 'Use the top bar to switch between roles (DEV, OPERATOR, AUDITOR, ADMIN) and notice how permissions change.',
  },
  'submit-job': {
    title: 'Submit a Job',
    description: 'As DEV, go to Job & Batch Center and submit a new job.',
  },
  'run-worker': {
    title: 'Run Worker Tick',
    description: 'Switch to OPERATOR, then use Run Worker Tick to process jobs. Watch status changes and toasts.',
  },
  'analyze-failure': {
    title: 'Analyze Failures',
    description: 'If a job fails, open Ghost ABEND to see severity, explanation, and retry it.',
  },
  'shadowasm-sim': {
    title: 'ShadowASM Simulation',
    description: 'Open ShadowASM, run a local program, and submit it as a simulation job.',
  },
  'audit-review': {
    title: 'Review Audit Trail',
    description: 'Open Telemetry & Audit Explorer to see everything logged.',
  },
  'wrap-up': {
    title: 'System Overview',
    description: 'Return to Dashboard to recap system status across workspaces.',
  },
};

export const DemoModeOverlay: React.FC = () => {
  const { demoState, disableDemoMode, nextDemoStep, previousDemoStep } = useDemoMode();

  if (!demoState.enabled) return null;

  const content = DEMO_STEP_CONTENT[demoState.currentStep];
  const stepIndex = Object.keys(DEMO_STEP_CONTENT).indexOf(demoState.currentStep);
  const totalSteps = Object.keys(DEMO_STEP_CONTENT).length;

  return (
    <div className="demo-overlay">
      <div className="demo-panel">
        <div className="demo-header">
          <span className="demo-badge">Demo Mode</span>
          <button
            className="demo-close"
            onClick={disableDemoMode}
            aria-label="Close Demo Mode"
          >
            ×
          </button>
        </div>
        <div className="demo-content">
          <div className="demo-step-indicator">
            Step {stepIndex + 1} of {totalSteps}
          </div>
          <h3 className="demo-title">{content.title}</h3>
          <p className="demo-description">{content.description}</p>
        </div>
        <div className="demo-controls">
          <button
            className="demo-btn demo-btn-secondary"
            onClick={previousDemoStep}
            disabled={stepIndex === 0}
          >
            ← Previous
          </button>
          <button
            className="demo-btn demo-btn-primary"
            onClick={nextDemoStep}
            disabled={stepIndex === totalSteps - 1}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
