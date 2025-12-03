# Zeroframe OS Architecture

## Project Vision

Zeroframe OS is a browser-native, mainframe-inspired operating system built as a reusable skeleton template. It demonstrates how classic mainframe concepts (batch jobs, workspaces, audit trails, system apps) can be reimagined in a modern web environment.

The project is designed to be:
- **Extensible**: Easy to add new system apps and features
- **Educational**: Clear separation of concerns and well-documented patterns
- **Hackathon-ready**: Built for Kiroween with Skeleton Crew and Resurrection themes

## Development Phases

### ROOTS Phase (Complete)
Foundation and core structure:
- Core data models (User, Role, Workspace, Job, Dataset, AuditEvent, SystemApp)
- Desktop shell with tile-based navigation
- System apps registry and routing
- Basic UI screens (stubs)
- Kiroween dark theme

### BARK Phase (Complete)
Security and governance:
- Role-based permission system (DEV, OPERATOR, AUDITOR, ADMIN)
- Permission action mapping
- ZeroframeContext with activeUser, activeWorkspace, auditEvents
- Protected routes with permission checks
- Audit logging for all significant actions
- Top bar with user/workspace switchers

### TRUNK Phase (Complete)
Job engine and system apps:
- Real job engine with state machine
- Job event history and timeline
- Worker simulation with runWorkerTick
- Submit, retry, cancel operations
- Ghost ABEND parasitic app with failure analysis
- Comprehensive audit logging

### MICROKERNEL Phase (Current)
Microkernel architecture with syscalls and capabilities:
- Kernel abstraction with syscall layer (src/kernel/types.ts)
- Per-app capability descriptors (src/kernel/capabilities.ts)
- Syscall enforcement in useOsAppApi hook
- IPC/messaging bus between apps
- Audit logging for forbidden syscalls
- Clean separation between kernel and userland

## Microkernel Architecture

Zeroframe OS has evolved from a simple React context into a **microkernel-style architecture**. All system apps interact with core services through a well-defined kernel interface with syscalls and per-app capabilities.

### Kernel Structure

The Kernel object (defined in `src/kernel/types.ts`) exposes a `sys` API with six subsystems:

1. **jobs**: Job submission, retry, cancel, list, worker tick
2. **datasets**: Dataset listing
3. **audit**: Event logging and listing
4. **security**: User and workspace identity
5. **messaging**: Inter-process communication (IPC) between apps
6. **processes**: Process listing (jobs and services)

The Kernel also exposes **metrics** tracking uptime and syscall usage.

### Syscall Layer

System apps interact with the OS through the `useOsAppApi(appId)` hook, which routes all operations through the kernel's syscall layer. Each syscall has a name (e.g., `jobs.submit`, `audit.log`) and is subject to capability checks.

### Capability System

Each system app has an `AppCapabilityDescriptor` that defines which syscalls it can use:

```typescript
{
  appId: 'ghost-abend',
  allowedSyscalls: [
    'jobs.list',
    'jobs.retry',
    'audit.log',
    'messaging.send',
    'messaging.consume',
  ],
}
```

The kernel enforces these capabilities at runtime. Apps that attempt forbidden syscalls:
- Get a console warning
- Have an audit event logged with action `FORBIDDEN_SYSCALL`
- Receive an error preventing the operation

### IPC Messaging

Apps with `messaging.send` and `messaging.consume` capabilities can communicate via the kernel's message bus. Messages are stored in kernel memory and consumed by the target app.

Example:
```typescript
// ShadowASM sends a message
api.sendMessage?.('ghost-abend', 'EXECUTION_TRACE', { output: 'Hello' });

// Ghost ABEND consumes messages
const messages = api.consumeMessages?.() || [];
```

### Kernel Metrics & Process Model

The kernel tracks its own metrics:
- **bootTime**: When the kernel was initialized
- **lastSyscallTime**: Timestamp of the most recent syscall
- **totalSyscalls**: Total number of syscalls executed
- **syscallsByName**: Per-syscall counters

The kernel also exposes an **OsProcess** model derived from:
- **Jobs**: Each job becomes a process with status (RUNNING/SLEEPING/STOPPED)
- **Services**: Static system services (Worker Daemon, Ghost ABEND, ShadowASM, Console)

Apps with `processes.list` capability can query the kernel's view of running processes. This is the canonical proof that the microkernel layer is real—not ad-hoc UI state.

The **Process Manager** app (`/apps/processes`) and **Command Console** (`/apps/console`) demonstrate this by displaying kernel-derived processes and metrics.

## Core Principles

### 1. Single Source of Truth
All critical state lives in ZeroframeContext:
- activeUser, activeWorkspace
- jobs array with full event history
- auditEvents array
- All operations (submitJob, runWorkerTick, retryJob, cancelJob)

### 2. Immutable State Updates
Always use spread operators and functional updates:
```typescript
setJobs(prevJobs => prevJobs.map(j => 
  j.id === targetId ? { ...j, status: newStatus } : j
));
```

### 3. Event Sourcing for Jobs
Every job state change appends a JobEvent:
- Provides complete audit trail
- Enables timeline visualization
- Supports debugging and troubleshooting
- Never mutate events array

### 4. Permission-First Design
Check permissions before showing UI controls:
```typescript
const canSubmit = hasPermission('SUBMIT_JOB');
<button disabled={!canSubmit}>Submit Job</button>
```

### 5. Audit Everything
Log audit events for all user-visible actions:
- Job submissions, completions, failures
- User switches, workspace switches
- System app access
- Security policy changes

### 6. Parasitic System Apps
Apps like Ghost ABEND consume OS data without modifying it:
- Read-only access to jobs, datasets, audit events
- Provide value-added analysis and insights
- Don't bypass the OS's APIs

## Key Constraints

### TypeScript Strictness
- Keep strict mode enabled
- Use explicit types, avoid `any`
- Leverage union types for enums (JobStatus, Role, etc.)

### State Management
- Don't bypass ZeroframeContext for shared state
- Use local state only for UI-specific concerns (modals, filters)
- Keep context operations pure and predictable

### Audit Logging
- Never skip audit events for privileged operations
- Include userId, action, resourceType, resourceId, details
- Use consistent action naming conventions

### Job Engine Integrity
- Always append JobEvent when changing job state
- Preserve maxAttempts and retry logic
- Keep worker tick deterministic for testing
- Don't break the state machine

### Permission Checks
- Always check hasPermission before privileged operations
- Show helpful error messages when permission denied
- Don't expose sensitive data to unauthorized roles

## Extension Patterns

### Adding a New System App
1. Create page component in `src/pages/`
2. Create CSS file in `src/styles/`
3. Add entry to `SYSTEM_APPS` in `src/core/systemApps.ts`
4. Add route in `src/App.tsx`
5. (Optional) Wrap with `ProtectedRoute` if permissions required
6. Log audit event when app is accessed

### Adding a New Job Operation
1. Add function to `ZeroframeContext`
2. Add to `ZeroframeContextValue` interface
3. Check permissions if user-initiated
4. Update job state immutably
5. Append `JobEvent` to history
6. Log `AuditEvent`
7. Expose via `useZeroframe` hook
8. Add UI controls in Job Center

### Adding a New Permission
1. Add to `PermissionAction` union in `src/core/permissions.ts`
2. Add to relevant role mappings in `ROLE_PERMISSIONS`
3. Use `hasPermission(newAction)` in UI and operations
4. Document in security spec

### Adding a New Role
1. Add to `Role` union in `src/types.ts`
2. Add to `ROLE_PERMISSIONS` in `src/core/permissions.ts`
3. Add to user switcher in `TopBar`
4. Add mock user in `src/data/mockData.ts`
5. Document in security spec

## File Organization

```
src/
├── core/               # Core OS functionality
│   ├── ZeroframeContext.tsx   # Central state and operations
│   ├── permissions.ts         # RBAC logic
│   ├── systemApps.ts          # App registry
│   └── hackathonConfig.ts     # Kiroween metadata
├── pages/              # System app screens
│   ├── Desktop.tsx
│   ├── JobCenter.tsx
│   ├── DatasetExplorer.tsx
│   ├── Security.tsx
│   ├── AuditExplorer.tsx
│   ├── GhostAbend.tsx
│   ├── ShadowASM.tsx
│   └── DocsPage.tsx
├── components/         # Reusable UI components
│   ├── Layout.tsx
│   ├── TopBar.tsx
│   └── ProtectedRoute.tsx
├── styles/             # CSS modules
├── data/               # Mock data
│   └── mockData.ts
├── types.ts            # TypeScript type definitions
└── main.tsx            # Entry point
```

## Testing Strategy

When modifying the codebase:
1. Test with different user roles (DEV, OPERATOR, AUDITOR, ADMIN)
2. Verify permission checks work correctly
3. Check audit events are logged
4. Test job state transitions
5. Verify UI updates reactively
6. Test edge cases (empty states, max attempts, etc.)

## Future Directions

Potential extensions (not implemented):
- Job dependencies and DAGs
- Job scheduling (cron-like)
- Dataset versioning
- Real-time job monitoring
- Job templates and presets
- Multi-user collaboration
- Persistent storage (localStorage, backend)
- ShadowASM implementation (execution traces)
- More parasitic system apps

## Kiroween Themes

### Skeleton Crew
The project provides a complete skeleton OS that can be extended with new system apps and features. The architecture is designed to be a template for building similar systems.

### Resurrection
Ghost ABEND "resurrects" failed jobs by analyzing their death (failure) and providing insights to bring them back to life (retry with fixes).

## Multi-Tenancy (SaaS Platform)

Zeroframe OS is a **multi-tenant SaaS platform** with complete org isolation:

### Organization Model
- **Org**: Tenant entity with id, name, plan, createdAt, isActive
- **OrgPlan**: FREE, TEAM, ENTERPRISE with feature toggles and soft limits
- **OrgUser**: Links users to orgs with org-level roles (ORG_ADMIN, ORG_OPERATOR, ORG_DEVELOPER, ORG_AUDITOR)
- **User**: Has workspace-level role (DEV, OPERATOR, AUDITOR, ADMIN)

### Org Isolation
- All kernel-managed entities have `orgId`: Job, Dataset, AuditEvent, KernelSnapshot, KernelMessage
- All syscalls filter by `activeOrg.id` - no cross-org access possible
- Syscalls never accept orgId as parameter - kernel uses activeOrg context
- Switching orgs changes entire data view (jobs, datasets, audit, snapshots, VFS)

### Kernel Security API Extensions
- `currentOrg()`: Returns activeOrg
- `currentOrgPlan()`: Returns activeOrgPlan  
- `currentOrgRole()`: Returns user's role in activeOrg

### UI Integration
- Top bar has org switcher (before workspace switcher)
- Switching org logs audit event and updates all views
- Seeded orgs: Acme Corp (TEAM), Mainframe Labs (ENTERPRISE)

### System Apps Remain Org-Agnostic
- Apps use `kernel.sys.security.currentOrg()` to get org context
- Apps never directly access org state
- All org filtering happens in kernel syscalls

## Advanced Kernel Features

Zeroframe OS includes advanced kernel features built on the microkernel foundation:

### Boot Sequence
- OS displays animated boot screen before main app loads
- Shows simulated kernel initialization logs
- State managed by `hasBooted` in ZeroframeContext
- Runs on every page refresh (no persistence)

### Kernel Panic & Reboot
- Simulated kernel panic with error screen
- Triggered via `triggerKernelPanic(reason)` or console `panic` command
- Reboot via `rebootKernel()` resets metrics and re-runs boot
- Demonstrates error handling and recovery

### Snapshots
- Save/restore complete OS state through `kernel.sys.snapshots`
- Captures jobs, datasets, audit events, user, workspace, metrics
- Syscalls: `snapshots.list`, `snapshots.create`, `snapshots.restore`
- Restricted to OPERATOR and ADMIN roles
- Stored in memory only (lost on refresh)

### Virtual File System (VFS)
- Read-only hierarchical file system exposing OS resources
- Structure: `/DEV`, `/UAT`, `/PROD` workspaces with `/datasets`
- Pseudo-devices: `/dev/time`, `/dev/random`, `/dev/null`, `/dev/logger`
- Syscalls: `vfs.list`, `vfs.readFile`
- Accessible via console `ls` and `cat` commands

### Enhanced Console
- Terminal-like interface with kernel visibility
- Commands: `uptime`, `syscalls`, `ps`, `jobs`, `ls`, `cat`, `panic`, `run demo`
- `run demo` orchestrates end-to-end scenario (submit jobs, run worker, send IPC)
- Primary interface for showcasing kernel features to judges

## Microkernel Constraints for Future Agents

**CRITICAL: The microkernel architecture with central dispatcher is a core design principle of Zeroframe OS.**

When working on this codebase, you MUST:

1. **Preserve the kernel boundary**: Core OS logic lives in ZeroframeContext and is exposed through the Kernel interface. System apps MUST NOT bypass this layer.

2. **Use useOsAppApi for all app interactions**: System apps should call `useOsAppApi(appId)` to interact with the OS. Do not directly import ZeroframeContext operations in app code.

3. **ALL syscalls go through the dispatcher**: The central dispatcher in `kernel.dispatcher.invoke()` enforces capability checks, role checks, metrics, and error handling. Do NOT call `kernel.sys.*` directly from apps.

4. **Update capabilities when adding apps**: When creating a new system app, add its capability descriptor to `src/kernel/capabilities.ts` with the minimum required syscalls.

5. **Expose new features as syscalls**: When adding new OS functionality:
   - Add the syscall name to `SyscallName` in `src/kernel/types.ts`
   - Add the handler to `syscallHandlers` in `ZeroframeContext.tsx`
   - Add role mapping to `isRoleAllowedToCall()` in `src/kernel/rolePermissions.ts`
   - Update app capabilities in `src/kernel/capabilities.ts`
   - Document in `.kiro/specs/kernel-microkernel.yaml`

6. **Maintain dispatcher enforcement**: The dispatcher checks capabilities and roles for EVERY syscall. Do not remove or weaken these checks.

7. **Use structured errors**: All syscall failures return `KernelError` with proper error codes (FORBIDDEN_SYSCALL, FORBIDDEN_ROLE, INVALID_ARGUMENT, NOT_FOUND, INTERNAL_ERROR). Use `makeKernelError()` helper.

8. **Log forbidden syscalls**: When an app attempts a forbidden syscall, the dispatcher automatically logs it to the audit trail with action `FORBIDDEN_SYSCALL`.

9. **Test with different capabilities and roles**: When modifying the kernel or useOsAppApi, test with:
   - Apps that have different capability sets
   - Users with different roles (DEV, OPERATOR, AUDITOR, ADMIN)
   - Ensure both capability AND role checks work correctly

10. **Document syscall changes**: If you add, remove, or modify syscalls, update `.kiro/specs/kernel-microkernel.yaml` to reflect the changes.

11. **Preserve IPC messaging**: The messaging subsystem enables inter-app communication. Do not break the message bus or remove messaging capabilities without careful consideration.

12. **Keep the kernel lean**: The microkernel should contain only essential OS services. App-specific logic belongs in the apps themselves.

13. **Never bypass the dispatcher**: Even internal kernel operations should use the dispatcher when possible. The only exceptions are:
    - Internal helper functions (appendJobEvent, updateJobStatus, etc.)
    - Direct state updates within syscall handlers
    - Metrics recording (recordSyscall)

14. **Boot and panic are presentation layer**: Boot sequence and kernel panic are UI-level features that wrap the kernel. They don't affect kernel internals but provide better UX.

15. **VFS is read-only**: The VFS is intentionally read-only. Don't add write operations without careful consideration of security and consistency.

16. **Snapshots are memory-only**: Snapshots are stored in React state and lost on refresh. If adding persistence, ensure it doesn't break the microkernel boundary.

17. **Console is the demo interface**: The Command Console is the primary way to showcase kernel features. Keep it simple and focused on demonstrating capabilities.

## Zero-Data SaaS Approach

Zeroframe OS follows a **zero-data onboarding** model:

### No Pre-Seeded Mock Data
- The system does not rely on hardcoded mock datasets or jobs
- Each org brings its own data via the Data Onboarding app
- Empty states guide users to upload CSV/Excel files

### Data Onboarding Flow
1. User uploads CSV or Excel file
2. Browser-side parsing (PapaParse for CSV, xlsx for Excel)
3. Schema inference from first 50 rows
4. Dataset creation via `datasets.create` syscall
5. Automatic job submission (Ingest + Profile)
6. Jobs demonstrate the OS job engine

### Dataset Model Extensions
- `source`: 'upload' | 'system' | 'synthetic'
- `columns`: DatasetColumn[] with inferred types
- `rowCount`: Total number of rows
- `sampleRows`: First 50 rows for preview

### Storage Strategy
- Datasets stored in kernel memory (React state)
- Only metadata and preview rows kept
- Full data not persisted (intentional for demo scope)
- Org isolation enforced at kernel level

### Boot Screen Removed
- Boot screen disabled to avoid fake-looking animation
- App loads directly into normal shell
- `hasBooted` defaults to `true`
- `completeBoot()` is now a no-op

## Conclusion

Zeroframe OS is a demonstration of how mainframe concepts can be modernized while maintaining their core principles: reliability, auditability, and separation of concerns. The microkernel architecture adds another layer: **isolation and capability-based security**.

When in doubt, follow these guidelines:
- Keep it simple
- Maintain immutability
- Check permissions
- Log audit events
- Preserve the state machine
- Respect the kernel boundary
- Enforce capabilities
- Document your changes
- Use zero-data approach: guide users to upload their own data
