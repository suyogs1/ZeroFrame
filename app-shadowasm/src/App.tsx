import React from 'react';
import { ZeroframeShell } from '@skeleton-core';
import type { SystemApp } from '@skeleton-core';

/**
 * ShadowASM Edition
 * 
 * This app focuses on the "Skeleton Crew" theme - a minimal but complete
 * assembly playground that demonstrates OS extensibility. ShadowASM is the hero.
 */
const ShadowAsmApp: React.FC = () => {
  return (
    <ZeroframeShell
      title="Zeroframe OS – ShadowASM Edition"
      primaryAppId="shadowasm"
      appFilter={(app: SystemApp) => {
        // Show ShadowASM prominently, hide Ghost ABEND to keep focus
        if (app.id === 'ghost-abend') return false;
        return true;
      }}
    />
  );
};

export default ShadowAsmApp;
