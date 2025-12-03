// Core Context & Providers
export { ZeroframeProvider, useZeroframe } from './core/ZeroframeContext';

// Shell Component
export { ZeroframeShell } from './ZeroframeShell';
export type { ZeroframeShellProps } from './ZeroframeShell';

// Kernel Types & API
export type { Kernel, KernelMetrics, KernelSnapshot, OsProcess } from './kernel/types';
export { useOsAppApi } from './core/useOsAppApi';

// Core Types
export type {
  User,
  Role,
  Workspace,
  Job,
  JobStatus,
  JobType,
  Dataset,
  AuditEvent,
  SystemApp,
  Org,
  OrgPlan,
  OrgUser,
  OrgRole
} from './types';

// System Apps Registry
export { SYSTEM_APPS } from './core/systemApps';

// Components
export { default as Layout } from './components/Layout';
export { default as ProtectedRoute } from './components/ProtectedRoute';
export { ToastContainer } from './components/ToastContainer';
export { DemoModeOverlay } from './components/DemoModeOverlay';
export { BootScreen } from './components/BootScreen';
export { KernelPanicScreen } from './components/KernelPanicScreen';
export { default as TopBar } from './components/TopBar';

// Pages
export { default as Desktop } from './pages/Desktop';
export { DashboardPage } from './pages/DashboardPage';
export { default as DocsPage } from './pages/DocsPage';
export { default as JobCenter } from './pages/JobCenter';
export { default as DatasetExplorer } from './pages/DatasetExplorer';
export { default as Security } from './pages/Security';
export { default as AuditExplorer } from './pages/AuditExplorer';
export { default as GhostAbend } from './pages/GhostAbend';
export { default as ShadowASM } from './pages/ShadowASM';
export { default as Console } from './pages/Console';
export { default as ProcessManager } from './pages/ProcessManager';
export { default as DataOnboarding } from './pages/DataOnboarding';

// Permissions
export { hasPermission, ROLE_PERMISSIONS } from './core/permissions';
export type { PermissionAction } from './core/permissions';

// Utilities
export { computeDatasetProfile, formatProfileStat, getNullPercentage } from './core/datasetProfiling';
export { HACKATHON_CONFIG } from './core/hackathonConfig';
