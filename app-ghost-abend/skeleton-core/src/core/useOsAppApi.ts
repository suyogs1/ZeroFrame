// OS App API - Clean SDK for system apps running on Zeroframe OS
// This hook provides a unified interface for system apps to interact with the OS
// Now routes through the microkernel's syscall layer with capability enforcement

import React from 'react';
import { useZeroframe } from './ZeroframeContext';
import type { Job, Workspace, Dataset } from '../types';
import type { SyscallName, KernelMessage, OsProcess, VfsNode, KernelSnapshot, KernelMetrics } from '../kernel/types';

export interface OsAppApi {
  activeUser: ReturnType<typeof useZeroframe>['activeUser'];
  activeWorkspace: Workspace;
  jobs: Job[];
  datasets?: Dataset[];
  submitJob?: (input: {
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
  listDatasets?: () => Dataset[];
  retryJob?: (jobId: string) => void;
  cancelJob?: (jobId: string) => void;
  runWorkerTick?: () => void;
  updateJob?: (jobId: string, updater: (job: Job) => Partial<Job>) => void;
  createDataset?: (input: {
    name: string;
    workspace: Workspace;
    description?: string;
    source?: 'upload' | 'system' | 'synthetic';
    columns?: import('../types').DatasetColumn[];
    rowCount?: number;
    sampleRows?: Record<string, unknown>[];
  }) => Dataset;
  logAppAudit: (details: {
    action: string;
    resourceType: 'SYSTEM_APP' | 'JOB' | 'DATASET' | 'CUSTOM';
    resourceId?: string;
    details?: string;
  }) => void;
  sendMessage?: (toAppId: string, type: string, payload: unknown) => void;
  consumeMessages?: () => KernelMessage[];
  listProcesses?: () => OsProcess[];
  listVfsPath?: (path: string) => VfsNode | null;
  readVfsFile?: (path: string) => string | null;
  listSnapshots?: () => KernelSnapshot[];
  createSnapshot?: (label?: string) => KernelSnapshot;
  restoreSnapshot?: (id: string) => void;
  getMetrics?: () => KernelMetrics;
}

/**
 * useOsAppApi - The official SDK hook for Zeroframe OS system apps
 * 
 * Routes all operations through the microkernel's syscall layer with per-app capability checks.
 * Apps can only perform operations they have been granted permission for.
 * 
 * @param appId - The unique identifier for the system app (e.g., 'ghost-abend', 'shadowasm')
 * @returns OsAppApi - A capability-gated interface to interact with the OS
 * 
 * Example usage:
 * ```tsx
 * const api = useOsAppApi('ghost-abend');
 * const failedJobs = api.jobs.filter(j => j.status === 'FAILED');
 * if (api.retryJob) api.retryJob(jobId); // Only if app has 'jobs.retry' capability
 * api.logAppAudit?.({ action: 'ANALYSIS_RUN', resourceType: 'SYSTEM_APP' });
 * ```
 */
export function useOsAppApi(appId: string): OsAppApi {
  const { kernel, jobs, datasets, activeUser, activeWorkspace, activeOrg } = useZeroframe();

  // Memoize the API to avoid recreating on every render
  return React.useMemo(() => {
    // Central call function - routes through dispatcher
    function call<T>(syscall: SyscallName, args?: unknown): T {
      const result = kernel.dispatcher.invoke(appId, syscall, args);
      if (!result.ok) {
        console.warn(`[useOsAppApi] Syscall failed: ${syscall}`, result.error);
        throw result.error;
      }
      return result.value as T;
    }

    // Build API object with only the capabilities this app has
    const api: OsAppApi = {
      activeUser,
      activeWorkspace,
      jobs: jobs.filter(j => j.orgId === activeOrg.id),
      datasets: datasets.filter(d => d.orgId === activeOrg.id),
      logAppAudit: () => {}, // Will be overridden below
    };

    // Conditionally add listDatasets function (calls syscall when invoked)
    api.listDatasets = () => call<Dataset[]>('datasets.list');

  // Conditionally add job operations
  api.submitJob = (input) => call<Job>('jobs.submit', input);
  api.retryJob = (jobId: string) => call<void>('jobs.retry', jobId);
  api.cancelJob = (jobId: string) => call<void>('jobs.cancel', jobId);
  api.runWorkerTick = () => call<void>('jobs.tick');
  api.updateJob = (jobId: string, updater: (job: Job) => Partial<Job>) => {
    call<void>('jobs.update', { jobId, updater });
  };

  // Dataset operations
  api.createDataset = (input) => call<Dataset>('datasets.create', input);

  // Audit logging
  api.logAppAudit = (payload) => {
    call<void>('audit.log', {
      userId: activeUser.id,
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId ?? appId,
      details: payload.details ?? `App ${appId} action: ${payload.action}`,
    });
  };

  // Messaging (IPC)
  api.sendMessage = (toAppId: string, type: string, payload: unknown) => {
    call<void>('messaging.send', {
      id: '',
      fromAppId: appId,
      toAppId,
      type,
      payload,
      timestamp: '',
    });
  };

  api.consumeMessages = () => call<KernelMessage[]>('messaging.consume', appId);

  // Process listing
  api.listProcesses = () => call<OsProcess[]>('processes.list');

  // VFS operations
  api.listVfsPath = (path: string) => call<VfsNode | null>('vfs.list', path);
  api.readVfsFile = (path: string) => call<string | null>('vfs.readFile', path);

  // Snapshot operations
  api.listSnapshots = () => call<KernelSnapshot[]>('snapshots.list');
  api.createSnapshot = (label?: string) => call<KernelSnapshot>('snapshots.create', label);
  api.restoreSnapshot = (id: string) => call<void>('snapshots.restore', id);

  // Metrics
  api.getMetrics = () => call<KernelMetrics>('kernel.metrics');

    return api;
  }, [kernel, appId, jobs, datasets, activeUser, activeWorkspace, activeOrg]);
}
