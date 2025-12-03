# Ghost ABEND Edition

**Zeroframe OS - Resurrection Theme**

## Overview

This is the Ghost ABEND–focused edition of Zeroframe OS, demonstrating the **Resurrection** Kiroween theme. Ghost ABEND is a parasitic system app that analyzes failed jobs and helps bring them back to life.

## What Makes This Edition Special

- **Primary Focus**: Ghost ABEND system app opens automatically
- **Streamlined UX**: ShadowASM and other dev tools are hidden to maintain focus on job resurrection
- **Complete OS**: Full access to job engine, datasets, audit trail, and all core features
- **Shared Skeleton**: Built on `skeleton-core` library - same kernel, same capabilities

## Features

### Ghost ABEND
- Analyzes failed jobs with severity classification
- Provides root cause analysis (RCA)
- Suggests fixes and retry strategies
- One-click job resurrection

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
npm run dev:ghost
```

The app will start at http://localhost:4173

## How It Uses the Skeleton

This app imports from `skeleton-core`:

```tsx
import { ZeroframeProvider, ZeroframeShell } from '@skeleton-core';

<ZeroframeShell
  title="Zeroframe OS – Ghost ABEND Edition"
  primaryAppId="ghost-abend"
  appFilter={(app) => app.id !== 'shadowasm'}
/>
```

The skeleton provides:
- Complete microkernel with syscall dispatcher
- All system apps and routing
- UI components and styling
- Context and state management

## Kiroween Theme: Resurrection

Ghost ABEND embodies the Resurrection theme by:
- Analyzing the "death" of failed jobs
- Providing insights to understand what went wrong
- Offering a path to "resurrect" jobs with fixes
- Tracking retry attempts and success rates

## Building for Production

```bash
npm run build:ghost
```

Output will be in `app-ghost-abend/dist/`
