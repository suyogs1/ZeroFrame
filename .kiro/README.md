# .kiro Folder - Project Metadata

This folder contains all project metadata, specifications, and documentation for Zeroframe OS.

## 📁 Structure

### `/specs/` - Feature Specifications
Detailed YAML specifications for each major feature:
- `desktop.yaml` - Desktop shell and navigation
- `job-engine.yaml` - Batch job processing
- `security-and-audit.yaml` - RBAC and audit trail
- `system-apps.yaml` - System app registry
- `kernel-microkernel.yaml` - Microkernel architecture
- `kernel-features.yaml` - Advanced kernel features
- `orgs-multitenancy.yaml` - Multi-tenant SaaS
- `data-onboarding.yaml` - Zero-data CSV/Excel upload
- `data-lineage.yaml` - Job-dataset relationships
- `demo-flow.yaml` - Demo Mode walkthrough
- `alerts.yaml` - Alert system (future)
- `scheduler.yaml` - Job scheduling (future)
- `dev-playground.yaml` - Development tools (future)

### `/steering/` - Architecture & Guidance
High-level architecture and development guidance:
- `architecture.md` - Complete system architecture
- `demo-script.md` - Live demo script for judges

### `/hooks/` - Agent Hooks
Automation hooks for development workflow:
- `job-engine-hooks.yaml` - Job engine testing hooks
- `demo-hooks.yaml` - Demo mode hooks

### Root Files
- `project.yaml` - Project metadata and feature list
- `KIROWEEN_SUBMISSION.md` - Comprehensive hackathon submission
- `JUDGE_QUICK_GUIDE.md` - 2-minute overview for judges
- `HACKATHON_CHECKLIST.md` - Pre-submission checklist
- `README.md` - This file

## 🎯 For Judges

Start here:
1. **JUDGE_QUICK_GUIDE.md** - 2-minute overview
2. **KIROWEEN_SUBMISSION.md** - Full submission details
3. **steering/demo-script.md** - Live demo walkthrough

## 🏗️ For Developers

Start here:
1. **steering/architecture.md** - System architecture
2. **project.yaml** - Feature overview
3. **specs/** - Detailed feature specs

## 🎃 Kiroween 2024

This project was built for the Kiroween hackathon with two themes:

### 💀 Skeleton Crew
The entire OS is a skeleton template - minimal but complete foundation for building system apps.

### 👻 Resurrection
Ghost ABEND analyzes failed jobs and brings them back to life.

## 📊 Quick Stats

- **10 System Apps** fully functional
- **23 Assembly Instructions** in ShadowASM
- **1,400+ Lines** of kernel code
- **Multi-Tenant** with org isolation
- **Zero Runtime Errors**
- **Complete Type Safety**

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
http://localhost:5173

# Click "🎬 Demo Mode" for guided tour
```

## 📝 Documentation Philosophy

This project follows a **specification-driven development** approach:

1. **Specs** define what to build (YAML)
2. **Steering** guides how to build it (Markdown)
3. **Hooks** automate testing and validation (YAML)

All documentation is kept in sync with the codebase.

## 🎬 Demo Mode

The project includes a built-in Demo Mode that guides users through all features. This is the best way to experience Zeroframe OS.

## 🔧 Maintenance

When adding new features:
1. Create a spec in `/specs/`
2. Update `project.yaml`
3. Update `steering/architecture.md` if architecture changes
4. Add hooks in `/hooks/` for testing
5. Update submission docs if hackathon-relevant

## 📞 Questions?

Check the comprehensive documentation:
- Architecture: `steering/architecture.md`
- Demo Script: `steering/demo-script.md`
- Submission: `KIROWEEN_SUBMISSION.md`
- Main README: `../README.md`

---

**Built with 💀 for Kiroween 2024**
