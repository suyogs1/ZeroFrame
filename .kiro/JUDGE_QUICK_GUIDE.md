# Zeroframe OS - Judge Quick Guide

## 🎃 What is This?

A **browser-native mainframe OS** demonstrating the **Skeleton Crew** pattern: one shared OS skeleton powering two distinct applications.

## 🦴 Monorepo Structure

This is a **Kiroween Skeleton Crew–compliant monorepo** with:
- **skeleton-core/** - Shared OS library (microkernel, system apps, components)
- **app-ghost-abend/** - Ghost ABEND Edition (Resurrection theme)
- **app-shadowasm/** - ShadowASM Edition (Skeleton Crew theme)

## 🏆 Kiroween Themes

### 💀 Skeleton Crew
**Demonstrated by the monorepo itself:** One skeleton (`skeleton-core`) powers two complete applications with just 25 lines of app-specific code each.

### 👻 Resurrection  
**Demonstrated by Ghost ABEND Edition:** Analyzes "dead" (failed) jobs and brings them back to life with one-click retry.

## ⚡ 2-Minute Demo

### Option 1: Ghost ABEND Edition (Resurrection)
```bash
npm install
npm run dev:ghost
# Open http://localhost:4173
```

### Option 2: ShadowASM Edition (Skeleton Crew)
```bash
npm install
npm run dev:shadowasm
# Open http://localhost:4174
```

Both apps have **Demo Mode** - click "🎬 Demo Mode" in top bar for guided tour.

## 🎯 Key Features to Check

### 1. Data Onboarding (Zero-Data Approach)
- Click "Data Onboarding" tile
- Upload any CSV or Excel file
- Watch automatic schema inference
- See auto-submitted jobs (Ingest + Profile)

### 2. Ghost ABEND (Resurrection Theme)
- Click "Ghost ABEND" tile
- View failed jobs with severity analysis
- See failure explanations and suggestions
- Click "Retry Job" to resurrect it

### 3. ShadowASM (Skeleton Crew)
- Click "ShadowASM" tile
- Try sample programs (Mainframe, Fibonacci, etc.)
- Write assembly with mainframe instructions (B, BE, BH, BNL, etc.)
- Submit as simulation job

### 4. Microkernel Architecture
- Click "Command Console" tile
- Run: `syscalls` - see kernel metrics
- Run: `ps` - view processes
- Run: `run demo` - orchestrated scenario

### 5. Multi-Tenancy
- Switch orgs in top bar (Acme Corp ↔ Mainframe Labs)
- Notice complete data isolation
- Different plans (TEAM vs ENTERPRISE)

## 🔍 Technical Highlights

### Microkernel Design
```typescript
// Apps use capability-checked syscalls
const api = useOsAppApi('ghost-abend');
api.retryJob(jobId);  // Routed through kernel dispatcher
```

### Zero-Data Philosophy
- No hardcoded mock data
- Users bring their own datasets
- Browser-side parsing (PapaParse + xlsx)
- Automatic profiling and lineage

### Complete Audit Trail
- Every action logged
- Immutable event stream
- Org-isolated
- View in Audit Explorer

## 📊 Stats

- **10 System Apps** fully functional
- **20+ Assembly Instructions** in ShadowASM
- **Multi-Tenant** with org isolation
- **1,400+ Lines** of kernel code
- **Complete Type Safety** (TypeScript strict mode)
- **Zero Runtime Errors**

## 🎨 Kiroween Aesthetic

- Dark spooky theme
- Mainframe-inspired tile navigation
- Toast notifications
- Responsive design
- Professional yet haunting

## 🚀 Quick Start

```bash
# Install all dependencies
npm install

# Run Ghost ABEND Edition (port 4173)
npm run dev:ghost

# OR run ShadowASM Edition (port 4174)
npm run dev:shadowasm

# OR run both simultaneously in separate terminals
```

## 📁 Key Files to Review

### Skeleton Core (Shared Library)
1. **skeleton-core/src/core/ZeroframeContext.tsx** - Kernel implementation
2. **skeleton-core/src/kernel/types.ts** - Microkernel types
3. **skeleton-core/src/ZeroframeShell.tsx** - Reusable OS shell
4. **skeleton-core/src/pages/GhostAbend.tsx** - Resurrection theme
5. **skeleton-core/src/pages/ShadowASM.tsx** - Assembly interpreter

### Applications (Thin Shells)
6. **app-ghost-abend/src/App.tsx** - 25 lines, Ghost ABEND focus
7. **app-shadowasm/src/App.tsx** - 25 lines, ShadowASM focus

### Documentation
8. **.kiro/steering/architecture.md** - Complete architecture
9. **MONOREPO_MIGRATION.md** - Migration details
10. **SKELETON_CREW_COMPLETE.md** - Verification report

## 🎯 Judging Criteria Alignment

### Innovation
- Microkernel architecture in React
- Zero-data onboarding approach
- Browser-native OS concept

### Technical Execution
- Type-safe syscall layer
- Capability-based security
- Multi-tenant isolation
- Complete audit trail

### Theme Implementation
- **Skeleton Crew**: Extensible OS template
- **Resurrection**: Ghost ABEND failure recovery

### User Experience
- Demo Mode walkthrough
- Toast notifications
- Responsive design
- Professional polish

### Completeness
- 10 working system apps
- Full job lifecycle
- Dataset management
- Security & governance

## 💡 Cool Details

1. **Kernel Panic**: Try `panic` in console
2. **Snapshots**: Save/restore OS state
3. **VFS**: Virtual filesystem (`ls /`, `cat /dev/time`)
4. **IPC**: Apps can message each other
5. **Lineage**: Track job-dataset relationships
6. **Profiling**: Auto-compute dataset statistics

## 🎬 Video Demo Script

1. Show Dashboard (0:00-0:15)
2. Upload dataset (0:15-0:45)
3. Watch jobs process (0:45-1:00)
4. Ghost ABEND analysis (1:00-1:30)
5. ShadowASM demo (1:30-2:00)
6. Console commands (2:00-2:30)
7. Wrap-up (2:30-3:00)

## 📞 Questions?

Check the comprehensive docs:
- `.kiro/KIROWEEN_SUBMISSION.md` - Full submission
- `.kiro/steering/architecture.md` - Architecture guide
- `.kiro/steering/demo-script.md` - Demo script
- `README.md` - Getting started

---

**Built with 💀 for Kiroween 2024**
