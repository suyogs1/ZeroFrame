# Skeleton Core

The shared OS skeleton library for Zeroframe OS (Kiroween Edition).

## Overview

`skeleton-core` is the foundational library that powers all Zeroframe OS applications. It provides:

- **Microkernel Architecture**: Complete kernel with syscall dispatcher, capabilities, and role-based security
- **Multi-Tenancy**: Org-level isolation with workspace support
- **Job Engine**: Batch job processing with state machine and event history
- **Data Management**: Dataset onboarding, profiling, and lineage tracking
- **System Apps**: Extensible registry of system applications
- **Audit Trail**: Complete governance and compliance logging
- **UI Components**: Reusable React components with Kiroween dark theme

## Architecture

The skeleton follows a microkernel design where all system apps interact with core services through a well-defined kernel interface:

```
┌─────────────────────────────────────┐
│        System Apps (Userland)       │
│  Ghost ABEND, ShadowASM, Console... │
└──────────────┬──────────────────────┘
               │ useOsAppApi()
┌──────────────▼──────────────────────┐
│      Kernel Dispatcher Layer        │
│  Capability & Role Enforcement      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Kernel Subsystems           │
│  jobs, datasets, audit, security,   │
│  messaging, processes, snapshots    │
└─────────────────────────────────────┘
```

## Usage

Import the shell and provider in your app:

```tsx
import { ZeroframeProvider, ZeroframeShell } from 'skeleton-core';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <ZeroframeProvider>
      <BrowserRouter>
        <ZeroframeShell 
          title="My Zeroframe App"
          primaryAppId="ghost-abend"
        />
      </BrowserRouter>
    </ZeroframeProvider>
  );
}
```

## Key Exports

- `ZeroframeProvider`: Context provider for OS state
- `ZeroframeShell`: Complete OS shell with routing
- `useZeroframe()`: Hook to access OS context
- `useOsAppApi(appId)`: Hook for system apps to interact with kernel
- All system app pages and components

## Kiroween Themes

- **Skeleton Crew**: Complete OS skeleton that apps build upon
- **Resurrection**: Ghost ABEND brings failed jobs back to life

## License

MIT
