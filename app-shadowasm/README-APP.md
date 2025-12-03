# ShadowASM Edition

**Zeroframe OS - Skeleton Crew Theme**

## Overview

This is the ShadowASM–focused edition of Zeroframe OS, demonstrating the **Skeleton Crew** Kiroween theme. ShadowASM is a high-level assembly playground that shows how minimal but complete system apps can be built on the OS skeleton.

## What Makes This Edition Special

- **Primary Focus**: ShadowASM system app opens automatically
- **Streamlined UX**: Ghost ABEND is hidden to maintain focus on assembly programming
- **Complete OS**: Full access to job engine, datasets, audit trail, and all core features
- **Shared Skeleton**: Built on `skeleton-core` library - same kernel, same capabilities

## Features

### ShadowASM
- High-level assembly language playground
- Local execution with output display
- Job submission integration (submit programs as simulation jobs)
- IPC messaging to other system apps
- Demonstrates OS extensibility

### Supporting Features
- Multi-tenant org isolation
- Dataset onboarding (CSV/Excel)
- Job submission and monitoring
- Scheduler with alerts
- Complete audit trail
- Developer playground for kernel inspection

## Running This App

```bash
# From repo root
npm install
npm run dev:shadowasm
```

The app will start at http://localhost:4174

## How It Uses the Skeleton

This app imports from `skeleton-core`:

```tsx
import { ZeroframeProvider, ZeroframeShell } from '@skeleton-core';

<ZeroframeShell
  title="Zeroframe OS – ShadowASM Edition"
  primaryAppId="shadowasm"
  appFilter={(app) => app.id !== 'ghost-abend'}
/>
```

The skeleton provides:
- Complete microkernel with syscall dispatcher
- All system apps and routing
- UI components and styling
- Context and state management

## Kiroween Theme: Skeleton Crew

ShadowASM embodies the Skeleton Crew theme by:
- Being a minimal but complete system app
- Demonstrating how to build on the OS skeleton
- Showing extensibility through the App API
- Proving that small apps can do powerful things

## Building for Production

```bash
npm run build:shadowasm
```

Output will be in `app-shadowasm/dist/`
