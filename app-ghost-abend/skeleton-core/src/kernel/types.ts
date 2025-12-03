// Zeroframe OS Microkernel Types
// This module defines the core microkernel abstractions: syscalls, capabilities, and IPC

import type { Job, Dataset, AuditEvent, User, Workspace, Org, OrgPlan, OrgRole } from '../types';

// Syscall names - all operations apps can perform through the kernel
export type SyscallName =
  | 'jobs.submit'
  | 'jobs.retry'
  | 'jobs.cancel'
  | 'jobs.list'
  | 'jobs.tick'
  | 'jobs.update'
  | 'datasets.list'
  | 'datasets.create'
  | 'audit.log'
  | 'audit.list'
  | 'security.whoami'
  | 'security.workspace'
  | 'messaging.send'
  | 'messaging.consume'
  | 'processes.list'
  | 'kernel.metrics'
  | 'snapshots.list'
  | 'snapshots.create'
  | 'snapshots.restore'
  | 'vfs.list'
  | 'vfs.readFile';

// Kernel error codes
export type KernelErrorCode =
  | 'FORBIDDEN_SYSCALL'
  | 'FORBIDDEN_ROLE'
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

// Kernel error structure
export interface KernelError {
  code: KernelErrorCode;
  message: string;
  syscall?: SyscallName;
  appId?: string;
  details?: unknown;
}

// Per-app capability descriptor
export interface AppCapabilityDescriptor {
  appId: string;
  allowedSyscalls: SyscallName[];
  allowedWorkspaces?: Workspace[]; // if undefined, all workspaces allowed
}

// Kernel message for IPC between apps
export interface KernelMessage {
  id: string;
  orgId: string; // Multi-tenant: org isolation
  fromAppId: string;
  toAppId: string;
  type: string;
  payload: unknown;
  timestamp: string;
  consumed?: boolean;
}

// Kernel Jobs API
export interface KernelJobsApi {
  listJobs: () => Job[];
  submitJob: (input: {
    name: string;
    type: Job['type'];
    workspace?: Workspace;
    description?: string;
    priority?: Job['priority'];
    scriptSummary?: string;
    tags?: string[];
    datasetId?: string;
    inputDatasetIds?: string[];
    outputDatasetIds?: string[];
  }) => Job;
  runWorkerTick: () => void;
  retryJob: (jobId: string) => void;
  cancelJob: (jobId: string) => void;
  updateJob: (jobId: string, updater: (job: Job) => Partial<Job>) => void;
}

// Kernel Datasets API
export interface KernelDatasetsApi {
  listDatasets: () => Dataset[];
  createDataset: (input: {
    name: string;
    workspace: Workspace;
    description?: string;
    source?: 'upload' | 'system' | 'synthetic';
    columns?: import('../types').DatasetColumn[];
    rowCount?: number;
    sampleRows?: Record<string, unknown>[];
  }) => Dataset;
}

// Kernel Audit API
export interface KernelAuditApi {
  listEvents: () => AuditEvent[];
  logEvent: (input: Omit<AuditEvent, 'id' | 'timestamp'> & { timestamp?: string }) => void;
}

// Kernel Security API
export interface KernelSecurityApi {
  whoAmI: () => User;
  currentWorkspace: () => Workspace;
  currentOrg: () => Org;
  currentOrgPlan: () => OrgPlan;
  currentOrgRole: () => OrgRole | null;
}

// Kernel Messaging API (IPC)
export interface KernelMessagingApi {
  sendMessage: (msg: KernelMessage) => void;
  consumeMessagesForApp: (appId: string) => KernelMessage[];
}

// Kernel Metrics - uptime and syscall counters
export interface KernelMetrics {
  bootTime: string;
  lastSyscallTime?: string;
  totalSyscalls: number;
  syscallsByName: Record<SyscallName, number>;
}

// OS Process Model
export type ProcessType = 'JOB' | 'SERVICE';
export type ProcessStatus = 'RUNNING' | 'SLEEPING' | 'STOPPED';

export interface OsProcess {
  pid: string;
  name: string;
  type: ProcessType;
  status: ProcessStatus;
  workspace?: Workspace;
  relatedJobId?: string;
  relatedAppId?: string;
  cpuUsage: number;
  memUsage: number;
  startedAt: string;
  lastActivityAt: string;
}

// Kernel Processes API
export interface KernelProcessesApi {
  listProcesses: () => OsProcess[];
}

// Syscall context passed to handlers
export interface SyscallContext {
  kernel: Kernel;
  activeUser: User;
  appId: string;
}

// Syscall handler function signature
export type SyscallHandler = (ctx: SyscallContext, args?: unknown) => unknown;

// Syscall result types
export type SyscallResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: KernelError };

// Kernel dispatcher interface
export interface KernelDispatcher {
  invoke: (appId: string, syscall: SyscallName, args?: unknown) => SyscallResult;
}

// VFS types
export type VfsNodeType = 'FILE' | 'DIR' | 'DEVICE';

export interface VfsNode {
  path: string;
  type: VfsNodeType;
  content?: string;
  children?: string[];
}

// Kernel VFS API
export interface KernelVfsApi {
  listPath: (path: string) => VfsNode | null;
  readFile: (path: string) => string | null;
}

// Kernel Snapshot
export interface KernelSnapshot {
  id: string;
  orgId: string; // Multi-tenant: org isolation
  label: string;
  createdAt: string;
  state: {
    jobs: Job[];
    datasets: Dataset[];
    auditEvents: AuditEvent[];
    activeUserId: string;
    activeWorkspace: Workspace;
    metrics: KernelMetrics;
  };
}

// Kernel Snapshots API
export interface KernelSnapshotsApi {
  listSnapshots: () => KernelSnapshot[];
  createSnapshot: (label?: string) => KernelSnapshot;
  restoreSnapshot: (id: string) => void;
}

// Scheduler types
export type SchedulerTriggerType = 'PROFILE_DATASET';

export interface SchedulerTrigger {
  id: string;
  orgId: string;
  workspace: Workspace;
  type: SchedulerTriggerType;
  datasetId: string;
  intervalMinutes: number;
  lastRunAt?: string;
  enabled: boolean;
}

// Kernel Scheduler API
export interface KernelSchedulerApi {
  listTriggers: () => SchedulerTrigger[];
  createTrigger: (input: {
    workspace: Workspace;
    type: SchedulerTriggerType;
    datasetId: string;
    intervalMinutes: number;
  }) => SchedulerTrigger;
  deleteTrigger: (triggerId: string) => void;
  tick: () => void;
}

// Alerts types
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertSource = 'JOB' | 'POLICY' | 'KERNEL' | 'SCHEDULER';

export interface KernelAlert {
  id: string;
  orgId: string;
  workspace?: Workspace;
  source: AlertSource;
  severity: AlertSeverity;
  message: string;
  jobId?: string;
  datasetId?: string;
  createdAt: string;
  acknowledgedAt?: string;
}

// Kernel Alerts API
export interface KernelAlertsApi {
  listAlerts: () => KernelAlert[];
  acknowledgeAlert: (alertId: string) => void;
}

// Main Kernel interface - the microkernel's syscall layer
export interface Kernel {
  sys: {
    jobs: KernelJobsApi;
    datasets: KernelDatasetsApi;
    audit: KernelAuditApi;
    security: KernelSecurityApi;
    messaging: KernelMessagingApi;
    processes: KernelProcessesApi;
    snapshots: KernelSnapshotsApi;
    vfs: KernelVfsApi;
  };
  capabilities: AppCapabilityDescriptor[];
  metrics: KernelMetrics;
  dispatcher: KernelDispatcher;
}
