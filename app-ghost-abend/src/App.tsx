import React from 'react';
import { ZeroframeShell } from '@skeleton-core';
import type { SystemApp } from '@skeleton-core';

/**
 * Ghost ABEND Edition
 * 
 * This app focuses on the "Resurrection" theme - analyzing failed jobs
 * and bringing them back to life. Ghost ABEND is the hero experience.
 */
const GhostAbendApp: React.FC = () => {
  return (
    <ZeroframeShell
      title="Zeroframe OS – Ghost ABEND Edition"
      primaryAppId="ghost-abend"
      appFilter={(app: SystemApp) => {
        // Show Ghost ABEND prominently, hide ShadowASM to keep focus
        if (app.id === 'shadowasm') return false;
        return true;
      }}
    />
  );
};

export default GhostAbendApp;
