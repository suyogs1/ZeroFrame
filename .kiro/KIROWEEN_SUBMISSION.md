# Zeroframe OS - Kiroween 2024 Hackathon Submission

## 🎃 Project Overview

**Zeroframe OS** is a browser-native, mainframe-inspired operating system that brings classic mainframe concepts into the modern web. Built as a complete skeleton template, it demonstrates how batch jobs, workspaces, audit trails, and system apps can be reimagined with contemporary UX.

**Hackathon Themes:**
- ✅ **Skeleton Crew**: Complete OS skeleton that apps build upon
- ✅ **Resurrection**: Ghost ABEND brings failed jobs back to life

## 🏆 What We Built

### Core Operating System
- **Microkernel Architecture**: Syscall layer with capability-based security
- **Multi-Tenant SaaS Platform**: Complete org isolation with plan-based features
- **Job Engine**: Full batch job lifecycle with state machine and retry logic
- **Role-Based Access Control**: DEV, OPERATOR, AUDITOR, ADMIN roles
- **Audit Trail**: Complete governance with immutable event log
- **Virtual File System**: Read-only hierarchical filesystem exposing OS resources

### System Applications

1. **Dashboard** - System health overview with job stats and activity
2. **Job & Batch Center** - Submit, monitor, and manage batch jobs
3. **Dataset Explorer** - Browse and analyze uploaded datasets
4. **Data Onboarding** - Zero-data CSV/Excel upload with schema inference
5. **Ghost ABEND** 👻 - Failure analysis and job resurrection (Resurrection theme)
6. **ShadowASM** 💀 - High-level assembly playground with mainframe instructions
7. **Process Manager** - View kernel processes (jobs and services)
8. **Command Console** - Terminal interface with kernel visibility
9. **Security Center** - User and role management
10. **Audit Explorer** - Complete audit trail with filtering

### Advanced Features

- **Data Lineage**: Track job-dataset relationships and dependencies
- **Dataset Profiling**: Automatic statistical analysis of uploaded data
- **Kernel Snapshots**: Save/restore complete OS state
- **IPC Messaging**: Inter-process communication between apps
- **Kernel Panic & Reboot**: Simulated error handling and recovery
- **Demo Mode**: Guided walkthrough of all features

## 🎯 Kiroween Theme Implementation

### Skeleton Crew 💀
The entire OS is designed as a **skeleton template** - a minimal but complete foundation:
- Clean separation between kernel and userland
- Well-defined syscall interface for apps
- Extensible system app registry
- Reusable patterns for building new apps
- Complete documentation and architecture guides

### Resurrection 👻
**Ghost ABEND** embodies the resurrection theme:
- Analyzes "dead" (failed) jobs
- Provides root cause analysis
- Suggests fixes based on failure patterns
- Allows one-click retry to "resurrect" jobs
- Uses dataset profiling to enhance failure analysis
- Tracks RCA notes for continuous improvement

## 🚀 Technical Highlights

### Microkernel Design
```typescript
// All system apps interact through the kernel
const api = useOsAppApi('ghost-abend');
const jobs = api.jobs;  // Capability-checked access
api.retryJob(jobId);    // Syscall with audit logging
```

### Zero-Data Onboarding
- No pre-seeded mock data
- Users upload their own CSV/Excel files
- Browser-side parsing and schema inference
- Automatic job submission for ingestion and profiling
- Dataset profiles enhance failure analysis

### Multi-Tenancy
- Complete org isolation at kernel level
- Plan-based feature toggles (FREE, TEAM, ENTERPRISE)
- Org-level roles separate from workspace roles
- All syscalls filter by active org

### ShadowASM Assembly Language
- 20+ instructions including mainframe-style branches (B, BE, BH, BL, BNH, BNL, BNE)
- Arithmetic: ADD, SUB, MUL, DIV, MOD, INC, DEC
- Branching: CMP, JMP/B, JE/BE, JNE/BNE, JG/BH, JL/BL, JGE/BNL, JLE/BNH
- Data movement: LOAD, MOVE
- I/O: PRINT, HALT, NOP
- Sample programs: Sum, Countdown, Fibonacci, Multiply, Comparison, Mainframe

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    System Apps                          │
│  Dashboard | Jobs | Datasets | Ghost ABEND | ShadowASM │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Kernel Syscall Layer                       │
│  jobs.* | datasets.* | audit.* | security.* | vfs.*    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              ZeroframeContext (State)                   │
│  Jobs | Datasets | Users | Orgs | Audit | Metrics      │
└─────────────────────────────────────────────────────────┘
```

## 🎨 User Experience

- **Dark Kiroween Theme**: Spooky but professional aesthetic
- **Toast Notifications**: Real-time feedback for all operations
- **Demo Mode**: Step-by-step guided tour
- **Responsive Design**: Works on desktop and tablet
- **Tile-Based Navigation**: Mainframe-inspired desktop
- **Real-time Updates**: React state management with HMR

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context + Hooks
- **Data Parsing**: PapaParse (CSV) + xlsx (Excel)
- **Styling**: CSS Modules with CSS Variables
- **Type Safety**: Strict TypeScript with no `any`

## 📈 Metrics & Achievements

- **20+ System Features** implemented
- **10 System Apps** fully functional
- **1,400+ Lines** of kernel code
- **Complete Type Safety** with TypeScript
- **Zero Runtime Errors** in production build
- **Comprehensive Audit Logging** for all operations
- **Multi-Tenant Architecture** with org isolation
- **20+ Assembly Instructions** in ShadowASM

## 🎬 Demo Flow

1. **Dashboard** - See system overview
2. **Data Onboarding** - Upload CSV/Excel file
3. **Job Center** - Watch auto-submitted jobs process
4. **Dataset Explorer** - View uploaded data with profile stats
5. **Ghost ABEND** - Analyze any failed jobs
6. **ShadowASM** - Write assembly programs targeting datasets
7. **Process Manager** - View kernel processes
8. **Console** - Run kernel commands
9. **Audit Explorer** - Review complete audit trail

## 🏗️ Project Structure

```
zeroframe-os/
├── src/
│   ├── core/              # Kernel and context
│   │   ├── ZeroframeContext.tsx
│   │   ├── useOsAppApi.ts
│   │   ├── permissions.ts
│   │   └── datasetProfiling.ts
│   ├── kernel/            # Microkernel types
│   │   ├── types.ts
│   │   ├── capabilities.ts
│   │   └── rolePermissions.ts
│   ├── pages/             # System apps
│   │   ├── Dashboard.tsx
│   │   ├── JobCenter.tsx
│   │   ├── DataOnboarding.tsx
│   │   ├── GhostAbend.tsx
│   │   ├── ShadowASM.tsx
│   │   └── ...
│   ├── components/        # Reusable UI
│   └── styles/            # CSS modules
├── .kiro/                 # Project metadata
│   ├── specs/             # Feature specifications
│   ├── steering/          # Architecture docs
│   └── hooks/             # Agent hooks
└── README.md
```

## 🎯 Future Enhancements

- Job dependencies and DAGs
- Job scheduling (cron-like)
- Dataset versioning
- Real-time job monitoring with WebSockets
- Backend persistence (currently in-memory)
- More system apps (log viewer, metrics dashboard)
- ShadowASM debugger with breakpoints
- Job templates and presets

## 🙏 Acknowledgments

Built for **Kiroween 2024** - the spookiest hackathon of the year! 🎃

Special thanks to the Kiro team for creating an amazing AI-powered development environment that made building this complex system possible.

## 📝 License

MIT License - Feel free to use this skeleton template for your own projects!

---

**Built with 💀 for Kiroween 2024**

*"From the skeleton of mainframes past, we resurrect the future of web-based operating systems."*
