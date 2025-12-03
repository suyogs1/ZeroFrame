// Zeroframe governance backbone: user, workspace, audit, and permissions
// This context is the single source of truth for active user, workspace, and audit events
// Now includes microkernel architecture with syscall layer and capabilities

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { User, Workspace, AuditEvent, Job, JobStatus, JobEvent, Dataset, Org, OrgPlan, OrgUser } from '../types';
import type { PermissionAction } from './permissions';
import { hasPermission as checkPermission } from './permissions';
import { users, auditEvents as initialAuditEvents, jobs as initialJobs, datasets as initialDatasets, orgs as initialOrgs, orgPlans as initialOrgPlans, orgUsers as initialOrgUsers } from '../data/mockData';
import type { Kernel, KernelMessage, KernelMetrics, SyscallName, OsProcess, ProcessStatus, SyscallHandler, SyscallContext, KernelDispatcher, KernelSnapshot, VfsNode, KernelDatasetsApi } from '../kernel/types';
import { APP_CAPABILITIES, appHasSyscall } from '../kernel/capabilities';
import { makeKernelError } from '../kernel/errors';
import { isRoleAllowedToCall } from '../kernel/rolePermissions';
import { computeDatasetProfile } from './datasetProfiling';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
}

export type DemoStepId =
  | 'intro'
  | 'switch-user-roles'
  | 'submit-job'
  | 'run-worker'
  | 'analyze-failure'
  | 'shadowasm-sim'
  | 'audit-review'
  | 'wrap-up';

export interface DemoState {
  enabled: boolean;
  currentStep: DemoStepId;
}

export interface ZeroframeContextValue {
  activeUser: User;
  setActiveUser: (userId: string) => void;
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
  auditEvents: AuditEvent[];
  logAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp' | 'orgId'> & { timestamp?: string; orgId?: string }) => void;
  hasPermission: (action: PermissionAction) => boolean;
  jobs: Job[];
  datasets: Dataset[];
  submitJob: (input: {
    name: string;
    type: Job['type'];
    workspace?: Workspace;
    description?: string;
    priority?: Job['priority'];
    scriptSummary?: string;
    tags?: string[];
    datasetId?: string;
  }) => void;
  runWorkerTick: () => void;
  retryJob: (jobId: string) => void;
  cancelJob: (jobId: string) => void;
  updateJob: (jobId: string, updater: (job: Job) => Partial<Job>) => void;
  toasts: ToastMessage[];
  showToast: (msg: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  demoState: DemoState;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  nextDemoStep: () => void;
  previousDemoStep: () => void;
  // Microkernel interface
  kernel: Kernel;
  // Boot and panic
  hasBooted: boolean;
  completeBoot: () => void;
  kernelPanic: boolean;
  triggerKernelPanic: (reason?: string) => void;
  rebootKernel: () => void;
  // Multi-tenant org context
  orgs: Org[];
  plans: OrgPlan[];
  activeOrg: Org;
  activeOrgPlan: OrgPlan;
  orgUsers: OrgUser[];
  setActiveOrg: (orgId: string) => void;
}

const ZeroframeContext = createContext<ZeroframeContextValue | undefined>(undefined);

const DEMO_STEPS: DemoStepId[] = [
  'intro',
  'switch-user-roles',
  'submit-job',
  'run-worker',
  'analyze-failure',
  'shadowasm-sim',
  'audit-review',
  'wrap-up',
];

export const ZeroframeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Multi-tenant org state
  const [orgs] = useState<Org[]>(initialOrgs);
  const [plans] = useState<OrgPlan[]>(initialOrgPlans);
  const [orgUsers] = useState<OrgUser[]>(initialOrgUsers);
  const [activeOrgId, setActiveOrgId] = useState<string>('org-acme');
  
  const [activeUser, setActiveUserState] = useState<User>(users[0]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>('DEV');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAuditEvents);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [datasets, setDatasets] = useState<Dataset[]>(initialDatasets);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [messages, setMessages] = useState<KernelMessage[]>([]); // IPC message bus
  const [snapshots, setSnapshots] = useState<KernelSnapshot[]>([]);
  const [demoState, setDemoState] = useState<DemoState>({
    enabled: false,
    currentStep: 'intro',
  });
  const [kernelMetrics, setKernelMetrics] = useState<KernelMetrics>({
    bootTime: new Date().toISOString(),
    lastSyscallTime: undefined,
    totalSyscalls: 0,
    syscallsByName: {} as Record<SyscallName, number>,
  });
  const [hasBooted] = useState(true); // Boot screen disabled - app loads directly
  const [kernelPanic, setKernelPanic] = useState(false);
  
  // Suppress unused warning - messages is used in kernel.sys.messaging
  void messages;

  // Derived org context
  const activeOrg = useMemo(() => orgs.find(o => o.id === activeOrgId) ?? orgs[0], [orgs, activeOrgId]);
  const activeOrgPlan = useMemo(() => plans.find(p => p.id === activeOrg.planId) ?? plans[0], [plans, activeOrg]);

  const logAuditEvent = useCallback((event: Omit<AuditEvent, 'id' | 'timestamp' | 'orgId'> & { timestamp?: string; orgId?: string }) => {
    const newEvent: AuditEvent = {
      id: `a${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orgId: event.orgId || activeOrg.id,
      timestamp: event.timestamp || new Date().toISOString(),
      userId: event.userId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      details: event.details,
    };
    setAuditEvents(prev => [newEvent, ...prev]);
  }, [activeOrg]);

  const setActiveUser = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setActiveUserState(user);
      logAuditEvent({
        userId: user.id,
        action: 'USER_SWITCHED',
        resourceType: 'SECURITY',
        details: `Switched active user to ${user.name} (${user.role})`,
      });
    }
  }, [logAuditEvent]);

  const setActiveWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    logAuditEvent({
      userId: activeUser.id,
      action: 'WORKSPACE_SWITCHED',
      resourceType: 'SYSTEM_APP',
      details: `Switched workspace to ${workspace}`,
    });
  }, [activeUser.id, logAuditEvent]);

  const setActiveOrg = useCallback((orgId: string) => {
    setActiveOrgId(orgId);
    logAuditEvent({
      userId: activeUser.id,
      action: 'ORG_SWITCHED',
      resourceType: 'SYSTEM_APP',
      resourceId: 'org-switcher',
      details: `Switched active org to ${orgId}`,
    });
  }, [activeUser.id, logAuditEvent]);

  const hasPermission = useCallback((action: PermissionAction) => {
    return checkPermission(activeUser, action);
  }, [activeUser]);

  // Toast system
  const showToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const toast: ToastMessage = { id, ...msg };
    setToasts(prev => [...prev, toast]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Job engine helpers
  const appendJobEvent = useCallback((job: Job, event: Omit<JobEvent, 'id' | 'timestamp'> & { timestamp?: string }): Job => {
    const newEvent: JobEvent = {
      id: `${job.id}-evt-${job.events.length + 1}-${Date.now()}`,
      timestamp: event.timestamp ?? new Date().toISOString(),
      ...event,
    };
    return {
      ...job,
      events: [...job.events, newEvent],
    };
  }, []);

  const updateJobStatus = useCallback((job: Job, newStatus: JobStatus, options?: { actorUserId?: string; message?: string; lastError?: string }): Job => {
    const updated: Job = {
      ...job,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      lastError: options?.lastError ?? job.lastError,
    };
    const message = options?.message ?? `Status changed from ${job.status} to ${newStatus}`;
    return appendJobEvent(updated, {
      type: 'JOB_STATUS_CHANGED',
      previousStatus: job.status,
      newStatus,
      message,
      actorUserId: options?.actorUserId,
    });
  }, [appendJobEvent]);

  // Submit a new job
  const submitJob = useCallback((input: {
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
  }) => {
    const now = new Date().toISOString();
    const jobId = `j${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle lineage: if inputDatasetIds not provided, use datasetId
    const inputDatasetIds = input.inputDatasetIds ?? (input.datasetId ? [input.datasetId] : []);
    
    const newJob: Job = {
      id: jobId,
      orgId: activeOrg.id,
      name: input.name,
      ownerId: activeUser.id,
      workspace: input.workspace || activeWorkspace,
      type: input.type,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      attempts: 0,
      maxAttempts: 3,
      priority: input.priority || 'NORMAL',
      description: input.description,
      tags: input.tags,
      scriptSummary: input.scriptSummary,
      datasetId: input.datasetId,
      inputDatasetIds,
      outputDatasetIds: input.outputDatasetIds ?? [],
      events: [
        {
          id: `${jobId}-e1`,
          timestamp: now,
          type: 'JOB_CREATED',
          message: 'Job created',
          actorUserId: activeUser.id,
        },
        {
          id: `${jobId}-e2`,
          timestamp: now,
          type: 'JOB_SUBMITTED',
          message: 'Job submitted to queue',
          actorUserId: activeUser.id,
        },
      ],
    };

    setJobs(prev => [newJob, ...prev]);
    
    logAuditEvent({
      userId: activeUser.id,
      action: 'JOB_SUBMITTED',
      resourceType: 'JOB',
      resourceId: newJob.id,
      details: `Submitted job "${newJob.name}" (${newJob.type}) in workspace ${newJob.workspace}${newJob.datasetId ? ` for dataset ${newJob.datasetId}` : ''}`,
    });

    showToast({
      type: 'success',
      title: 'Job submitted',
      description: `Job "${newJob.name}" submitted in workspace ${newJob.workspace}`,
    });
  }, [activeUser, activeWorkspace, activeOrg, logAuditEvent, showToast]);

  // Run one worker tick
  const runWorkerTick = useCallback(() => {
    setJobs(prevJobs => {
      // Find next job to process (PENDING or RETRYING)
      const priorityOrder = { HIGH: 3, NORMAL: 2, LOW: 1 };
      const eligibleJobs = prevJobs
        .filter(j => j.status === 'PENDING' || j.status === 'RETRYING')
        .sort((a, b) => {
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

      if (eligibleJobs.length === 0) {
        console.log('Worker tick: No jobs to process');
        return prevJobs;
      }

      const jobToProcess = eligibleJobs[0];
      console.log(`Worker tick: Processing job ${jobToProcess.id} (${jobToProcess.name})`);

      // Transition to RUNNING
      let updatedJob = updateJobStatus(jobToProcess, 'RUNNING', {
        message: 'Worker picked job for execution',
      });

      // Update jobs array with RUNNING status
      const jobsWithRunning = prevJobs.map(j => j.id === updatedJob.id ? updatedJob : j);

      // Schedule completion/failure after a delay
      setTimeout(() => {
        setJobs(currentJobs => {
          const currentJob = currentJobs.find(j => j.id === updatedJob.id);
          if (!currentJob || currentJob.status !== 'RUNNING') {
            return currentJobs;
          }

          // Determine success or failure
          const nameOrTags = `${currentJob.name} ${currentJob.tags?.join(' ') || ''}`.toLowerCase();
          const shouldFail = nameOrTags.includes('fail') || Math.random() > 0.8;

          if (!shouldFail) {
            // Success
            const completedJob = appendJobEvent(
              { ...currentJob, status: 'COMPLETED', updatedAt: new Date().toISOString() },
              {
                type: 'JOB_COMPLETED',
                message: 'Job completed successfully',
                previousStatus: 'RUNNING',
                newStatus: 'COMPLETED',
              }
            );

            logAuditEvent({
              userId: currentJob.ownerId,
              action: 'JOB_COMPLETED',
              resourceType: 'JOB',
              resourceId: currentJob.id,
              details: `Job "${currentJob.name}" completed successfully`,
            });

            showToast({
              type: 'success',
              title: 'Job completed',
              description: `Job "${currentJob.name}" completed successfully`,
            });

            // Update dataset lineage
            const { inputDatasetIds = [], outputDatasetIds = [] } = completedJob;
            const allDatasetIds = [...inputDatasetIds, ...outputDatasetIds];
            if (allDatasetIds.length > 0) {
              setDatasets(prevDatasets =>
                prevDatasets.map(ds =>
                  allDatasetIds.includes(ds.id) && ds.orgId === completedJob.orgId
                    ? {
                        ...ds,
                        lineageJobIds: Array.from(
                          new Set([...(ds.lineageJobIds ?? []), completedJob.id])
                        ),
                      }
                    : ds
                )
              );
            }

            // If this is a profile job, recompute profile
            if (completedJob.type === 'REPORT' && completedJob.tags?.includes('profile') && completedJob.datasetId) {
              setDatasets(prevDatasets =>
                prevDatasets.map(ds => {
                  if (ds.id !== completedJob.datasetId || ds.orgId !== completedJob.orgId) return ds;
                  const profile = computeDatasetProfile(ds);
                  return profile ? { ...ds, profile } : ds;
                })
              );
            }

            return currentJobs.map(j => j.id === completedJob.id ? completedJob : j);
          } else {
            // Failure
            const newAttempts = currentJob.attempts + 1;
            const errorMessages = [
              'Timeout: Job execution exceeded time limit',
              'Permission denied: Unable to access required resource',
              'Authentication failed: Invalid credentials',
              'Data validation error: Invalid input format',
            ];
            const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

            if (newAttempts < currentJob.maxAttempts) {
              // Retry
              let failedJob: Job = {
                ...currentJob,
                status: 'RETRYING',
                attempts: newAttempts,
                updatedAt: new Date().toISOString(),
                lastError: errorMessage,
              };
              failedJob = appendJobEvent(failedJob, {
                type: 'JOB_FAILED',
                message: `Job failed: ${errorMessage}`,
                previousStatus: 'RUNNING',
                newStatus: 'RETRYING',
              });
              failedJob = appendJobEvent(failedJob, {
                type: 'JOB_RETRY_SCHEDULED',
                message: `Retry scheduled (attempt ${newAttempts + 1}/${currentJob.maxAttempts})`,
              });

              logAuditEvent({
                userId: currentJob.ownerId,
                action: 'JOB_RETRYING',
                resourceType: 'JOB',
                resourceId: currentJob.id,
                details: `Job "${currentJob.name}" failed, retrying (attempt ${newAttempts + 1}/${currentJob.maxAttempts})`,
              });

              return currentJobs.map(j => j.id === failedJob.id ? failedJob : j);
            } else {
              // Permanent failure
              let failedJob: Job = {
                ...currentJob,
                status: 'FAILED',
                attempts: newAttempts,
                updatedAt: new Date().toISOString(),
                lastError: errorMessage,
              };
              failedJob = appendJobEvent(failedJob, {
                type: 'JOB_FAILED',
                message: 'Job failed permanently: Max attempts reached',
                previousStatus: 'RUNNING',
                newStatus: 'FAILED',
              });

              logAuditEvent({
                userId: currentJob.ownerId,
                action: 'JOB_FAILED',
                resourceType: 'JOB',
                resourceId: currentJob.id,
                details: `Job "${currentJob.name}" failed permanently after ${newAttempts} attempts`,
              });

              showToast({
                type: 'error',
                title: 'Job failed',
                description: `Job "${currentJob.name}" failed. Analyze in Ghost ABEND.`,
              });

              return currentJobs.map(j => j.id === failedJob.id ? failedJob : j);
            }
          }
        });
      }, 2000); // 2 second simulated execution time

      return jobsWithRunning;
    });
  }, [updateJobStatus, appendJobEvent, logAuditEvent]);

  // Retry a failed job
  const retryJob = useCallback((jobId: string) => {
    if (!checkPermission(activeUser, 'MANAGE_JOBS')) {
      console.warn('User does not have permission to retry jobs');
      return;
    }

    setJobs(prevJobs => {
      const job = prevJobs.find(j => j.id === jobId && j.orgId === activeOrg.id);
      if (!job || job.status !== 'FAILED') {
        return prevJobs;
      }

      let retriedJob: Job = {
        ...job,
        status: 'PENDING',
        updatedAt: new Date().toISOString(),
        lastError: undefined,
      };
      retriedJob = appendJobEvent(retriedJob, {
        type: 'JOB_RETRY_SCHEDULED',
        message: 'Job manually retried by user',
        actorUserId: activeUser.id,
      });

      logAuditEvent({
        userId: activeUser.id,
        action: 'JOB_RETRY_REQUESTED',
        resourceType: 'JOB',
        resourceId: jobId,
        details: `Manually retried job "${job.name}"`,
      });

      return prevJobs.map(j => j.id === retriedJob.id ? retriedJob : j);
    });
  }, [activeUser, activeOrg, appendJobEvent, logAuditEvent]);

  // Cancel a job
  const cancelJob = useCallback((jobId: string) => {
    if (!checkPermission(activeUser, 'MANAGE_JOBS')) {
      console.warn('User does not have permission to cancel jobs');
      return;
    }

    setJobs(prevJobs => {
      const job = prevJobs.find(j => j.id === jobId && j.orgId === activeOrg.id);
      if (!job || ['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
        return prevJobs;
      }

      const cancelledJob = updateJobStatus(job, 'CANCELLED', {
        message: `Job cancelled by ${activeUser.name}`,
        actorUserId: activeUser.id,
      });

      logAuditEvent({
        userId: activeUser.id,
        action: 'JOB_CANCELLED',
        resourceType: 'JOB',
        resourceId: jobId,
        details: `Cancelled job "${job.name}"`,
      });

      showToast({
        type: 'warning',
        title: 'Job cancelled',
        description: `Job "${job.name}" cancelled`,
      });

      return prevJobs.map(j => j.id === cancelledJob.id ? cancelledJob : j);
    });
  }, [activeUser, activeOrg, updateJobStatus, logAuditEvent, showToast]);

  // Update a job with partial changes (for system apps like Ghost ABEND)
  const updateJob = useCallback((jobId: string, updater: (job: Job) => Partial<Job>) => {
    setJobs(prevJobs => {
      const job = prevJobs.find(j => j.id === jobId && j.orgId === activeOrg.id);
      if (!job) {
        return prevJobs;
      }

      const updates = updater(job);
      const updatedJob: Job = {
        ...job,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return prevJobs.map(j => j.id === updatedJob.id ? updatedJob : j);
    });
  }, []);

  // Record syscall for metrics
  const recordSyscall = useCallback((name: SyscallName) => {
    setKernelMetrics(prev => {
      const currentCount = prev.syscallsByName[name] ?? 0;
      return {
        ...prev,
        lastSyscallTime: new Date().toISOString(),
        totalSyscalls: prev.totalSyscalls + 1,
        syscallsByName: {
          ...prev.syscallsByName,
          [name]: currentCount + 1,
        },
      };
    });
  }, []);

  // Derive processes from jobs and services
  const deriveProcesses = useCallback((): OsProcess[] => {
    // Job processes (filtered by active org)
    const jobProcs: OsProcess[] = jobs.filter(j => j.orgId === activeOrg.id).map(job => {
      let status: ProcessStatus = 'STOPPED';
      if (job.status === 'RUNNING') status = 'RUNNING';
      else if (job.status === 'PENDING' || job.status === 'RETRYING') status = 'SLEEPING';
      
      const cpuUsage = status === 'RUNNING' ? Math.min(90, 10 + job.attempts * 10) : 0;
      const memUsage = 32 + job.attempts * 8;
      const lastEvent = job.events[job.events.length - 1];
      
      return {
        pid: `job-${job.id}`,
        name: job.name,
        type: 'JOB',
        status,
        workspace: job.workspace,
        relatedJobId: job.id,
        cpuUsage,
        memUsage,
        startedAt: job.createdAt,
        lastActivityAt: lastEvent?.timestamp ?? job.updatedAt ?? job.createdAt,
      };
    });
    
    // Service processes
    const serviceProcs: OsProcess[] = [
      {
        pid: 'svc-worker',
        name: 'Worker Daemon',
        type: 'SERVICE',
        status: 'RUNNING',
        workspace: undefined,
        relatedAppId: 'jobs',
        cpuUsage: 5,
        memUsage: 64,
        startedAt: kernelMetrics.bootTime,
        lastActivityAt: kernelMetrics.lastSyscallTime ?? kernelMetrics.bootTime,
      },
      {
        pid: 'svc-ghost-abend',
        name: 'Ghost ABEND Service',
        type: 'SERVICE',
        status: 'RUNNING',
        relatedAppId: 'ghost-abend',
        cpuUsage: 3,
        memUsage: 48,
        startedAt: kernelMetrics.bootTime,
        lastActivityAt: kernelMetrics.lastSyscallTime ?? kernelMetrics.bootTime,
      },
      {
        pid: 'svc-shadowasm',
        name: 'ShadowASM Service',
        type: 'SERVICE',
        status: 'RUNNING',
        relatedAppId: 'shadowasm',
        cpuUsage: 2,
        memUsage: 40,
        startedAt: kernelMetrics.bootTime,
        lastActivityAt: kernelMetrics.lastSyscallTime ?? kernelMetrics.bootTime,
      },
      {
        pid: 'svc-console',
        name: 'Command Console',
        type: 'SERVICE',
        status: 'RUNNING',
        relatedAppId: 'console',
        cpuUsage: 1,
        memUsage: 32,
        startedAt: kernelMetrics.bootTime,
        lastActivityAt: kernelMetrics.lastSyscallTime ?? kernelMetrics.bootTime,
      },
    ];
    
    return [...serviceProcs, ...jobProcs];
  }, [jobs, kernelMetrics, activeOrg]);

  // Demo Mode
  const enableDemoMode = useCallback(() => {
    setDemoState({ enabled: true, currentStep: 'intro' });
    logAuditEvent({
      userId: activeUser.id,
      action: 'DEMO_MODE_ENABLED',
      resourceType: 'SYSTEM_APP',
      details: 'Demo Mode activated',
    });
  }, [activeUser.id, logAuditEvent]);

  const disableDemoMode = useCallback(() => {
    setDemoState({ enabled: false, currentStep: 'intro' });
    logAuditEvent({
      userId: activeUser.id,
      action: 'DEMO_MODE_DISABLED',
      resourceType: 'SYSTEM_APP',
      details: 'Demo Mode deactivated',
    });
  }, [activeUser.id, logAuditEvent]);

  const nextDemoStep = useCallback(() => {
    setDemoState(prev => {
      const currentIndex = DEMO_STEPS.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, DEMO_STEPS.length - 1);
      return { ...prev, currentStep: DEMO_STEPS[nextIndex] };
    });
  }, []);

  const previousDemoStep = useCallback(() => {
    setDemoState(prev => {
      const currentIndex = DEMO_STEPS.indexOf(prev.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { ...prev, currentStep: DEMO_STEPS[prevIndex] };
    });
  }, []);

  // Boot and panic
  const completeBoot = useCallback(() => {
    // No-op: boot screen deprecated, kept for API compatibility
  }, []);

  const triggerKernelPanic = useCallback((reason?: string) => {
    console.error('KERNEL PANIC', reason);
    setKernelPanic(true);
    // Log audit event if kernel still responsive
    try {
      logAuditEvent({
        userId: activeUser.id,
        action: 'KERNEL_PANIC',
        resourceType: 'SYSTEM_APP',
        resourceId: 'kernel',
        details: reason ?? 'Kernel panic triggered',
      });
    } catch (e) {
      console.error('Failed to log panic audit event', e);
    }
  }, [activeUser.id, logAuditEvent]);

  const rebootKernel = useCallback(() => {
    // Reset metrics
    setKernelMetrics({
      bootTime: new Date().toISOString(),
      lastSyscallTime: undefined,
      totalSyscalls: 0,
      syscallsByName: {} as Record<SyscallName, number>,
    });
    // Clear panic (boot screen disabled, so no setHasBooted)
    setKernelPanic(false);
  }, []);

  // VFS implementation
  const resolveVfsNode = useCallback((path: string): VfsNode | null => {
    // Root directories
    if (path === '/' || path === '') {
      return {
        path: '/',
        type: 'DIR',
        children: ['/DEV', '/UAT', '/PROD', '/dev'],
      };
    }

    if (path === '/DEV' || path === '/UAT' || path === '/PROD') {
      return {
        path,
        type: 'DIR',
        children: [`${path}/datasets`],
      };
    }

    if (path === '/dev') {
      return {
        path: '/dev',
        type: 'DIR',
        children: ['/dev/time', '/dev/random', '/dev/null', '/dev/logger'],
      };
    }

    if (path === '/dev/time') {
      return {
        path,
        type: 'DEVICE',
        content: new Date().toISOString(),
      };
    }

    if (path === '/dev/random') {
      return {
        path,
        type: 'DEVICE',
        content: String(Math.floor(Math.random() * 100000)),
      };
    }

    if (path === '/dev/null') {
      return {
        path,
        type: 'DEVICE',
        content: '',
      };
    }

    if (path === '/dev/logger') {
      return {
        path,
        type: 'DEVICE',
        content: 'Write-only device (simulated logger).',
      };
    }

    // Dataset mount: /DEV/datasets/<name> (filtered by active org)
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 2 && parts[1] === 'datasets') {
      const ws = parts[0] as Workspace;
      return {
        path,
        type: 'DIR',
        children: datasets.filter(d => d.workspace === ws && d.orgId === activeOrg.id).map(d => `/${ws}/datasets/${d.name}`),
      };
    }

    if (parts.length === 3 && parts[1] === 'datasets') {
      const ws = parts[0] as Workspace;
      const name = parts[2];
      const ds = datasets.find(d => d.workspace === ws && d.name === name && d.orgId === activeOrg.id);
      if (!ds) return null;
      return {
        path,
        type: 'FILE',
        content: `Dataset ${name} (${ds.type}) in workspace ${ws}. Records: ${ds.recordCount ?? 0}`,
      };
    }

    return null;
  }, [datasets, activeOrg]);

  // Microkernel implementation - syscall layer on top of existing operations
  const kernel: Kernel = useMemo(() => {
    // Internal syscall handlers - these are the actual implementations
    const syscallHandlers: Record<SyscallName, SyscallHandler> = {
      'jobs.list': () => jobs.filter(j => j.orgId === activeOrg.id),
      'jobs.submit': (_ctx, args) => {
        const input = args as Parameters<typeof submitJob>[0] & { inputDatasetIds?: string[]; outputDatasetIds?: string[] };
        const now = new Date().toISOString();
        const jobId = `j${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Handle lineage: if inputDatasetIds not provided, use datasetId
        const inputDatasetIds = input.inputDatasetIds ?? (input.datasetId ? [input.datasetId] : []);
        
        const newJob: Job = {
          id: jobId,
          orgId: activeOrg.id,
          name: input.name,
          ownerId: activeUser.id,
          workspace: input.workspace || activeWorkspace,
          type: input.type,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
          attempts: 0,
          maxAttempts: 3,
          priority: input.priority || 'NORMAL',
          description: input.description,
          tags: input.tags,
          scriptSummary: input.scriptSummary,
          datasetId: input.datasetId,
          inputDatasetIds,
          outputDatasetIds: input.outputDatasetIds ?? [],
          events: [
            {
              id: `${jobId}-e1`,
              timestamp: now,
              type: 'JOB_CREATED',
              message: 'Job created',
              actorUserId: activeUser.id,
            },
            {
              id: `${jobId}-e2`,
              timestamp: now,
              type: 'JOB_SUBMITTED',
              message: 'Job submitted to queue',
              actorUserId: activeUser.id,
            },
          ],
        };

        setJobs(prev => [newJob, ...prev]);
        
        logAuditEvent({
          userId: activeUser.id,
          action: 'JOB_SUBMITTED',
          resourceType: 'JOB',
          resourceId: newJob.id,
          details: `Submitted job "${newJob.name}" (${newJob.type}) in workspace ${newJob.workspace}${newJob.datasetId ? ` for dataset ${newJob.datasetId}` : ''}`,
        });

        showToast({
          type: 'success',
          title: 'Job submitted',
          description: `Job "${newJob.name}" submitted in workspace ${newJob.workspace}`,
        });

        return newJob;
      },
      'jobs.retry': (_ctx, args) => {
        retryJob(args as string);
      },
      'jobs.cancel': (_ctx, args) => {
        cancelJob(args as string);
      },
      'jobs.tick': () => {
        runWorkerTick();
      },
      'jobs.update': (_ctx, args) => {
        const { jobId, updater } = args as { jobId: string; updater: (job: Job) => Partial<Job> };
        updateJob(jobId, updater);
      },
      'datasets.list': () => datasets.filter(d => d.orgId === activeOrg.id),
      'datasets.create': (_ctx, args) => {
        const input = args as Parameters<KernelDatasetsApi['createDataset']>[0];
        const now = new Date().toISOString();
        const dataset: Dataset = {
          id: `ds-${Date.now()}-${datasets.length + 1}`,
          orgId: activeOrg.id,
          workspace: input.workspace,
          name: input.name,
          type: 'FILE',
          description: input.description,
          source: input.source ?? 'upload',
          columns: input.columns,
          rowCount: input.rowCount,
          sampleRows: input.sampleRows,
          recordCount: input.rowCount,
          lastUpdated: now,
          lineageJobIds: [],
        };
        
        // Compute initial profile from sample rows
        const profile = computeDatasetProfile(dataset);
        if (profile) {
          dataset.profile = profile;
        }
        
        setDatasets(prev => [...prev, dataset]);
        logAuditEvent({
          userId: activeUser.id,
          action: 'DATASET_CREATED',
          resourceType: 'DATASET',
          resourceId: dataset.id,
          details: `Dataset "${dataset.name}" created via upload in workspace ${dataset.workspace}`,
        });
        return dataset;
      },
      'audit.list': () => auditEvents.filter(e => e.orgId === activeOrg.id),
      'audit.log': (_ctx, args) => {
        logAuditEvent(args as Parameters<typeof logAuditEvent>[0]);
      },
      'security.whoami': () => activeUser,
      'security.workspace': () => activeWorkspace,
      'messaging.send': (_ctx, args) => {
        const msg = args as KernelMessage;
        setMessages(prev => [...prev, {
          ...msg,
          orgId: activeOrg.id,
          id: msg.id || `msg-${Date.now()}-${prev.length + 1}`,
          timestamp: msg.timestamp || new Date().toISOString(),
          consumed: false,
        }]);
      },
      'messaging.consume': (_ctx, args) => {
        const appId = args as string;
        let consumed: KernelMessage[] = [];
        setMessages(prev => {
          const updated = prev.map(m => {
            if (!m.consumed && m.toAppId === appId && m.orgId === activeOrg.id) {
              consumed.push({ ...m, consumed: true });
              return { ...m, consumed: true };
            }
            return m;
          });
          return updated;
        });
        return consumed;
      },
      'processes.list': () => deriveProcesses(),
      'kernel.metrics': () => kernelMetrics,
      'snapshots.list': () => snapshots.filter(s => s.orgId === activeOrg.id),
      'snapshots.create': (_ctx, args) => {
        const label = args as string | undefined;
        const snap: KernelSnapshot = {
          id: `snap-${Date.now()}-${snapshots.length + 1}`,
          orgId: activeOrg.id,
          label: label ?? `Snapshot ${snapshots.length + 1}`,
          createdAt: new Date().toISOString(),
          state: {
            jobs: jobs.filter(j => j.orgId === activeOrg.id),
            datasets: datasets.filter(d => d.orgId === activeOrg.id),
            auditEvents: auditEvents.filter(e => e.orgId === activeOrg.id),
            activeUserId: activeUser.id,
            activeWorkspace,
            metrics: kernelMetrics,
          },
        };
        setSnapshots(prev => [...prev, snap]);
        return snap;
      },
      'snapshots.restore': (_ctx, args) => {
        const id = args as string;
        const snap = snapshots.find(s => s.id === id && s.orgId === activeOrg.id);
        if (!snap) return;
        const { state } = snap;
        setJobs(state.jobs);
        setAuditEvents(state.auditEvents);
        setActiveUserState(users.find(u => u.id === state.activeUserId) || users[0]);
        setActiveWorkspaceState(state.activeWorkspace);
        setKernelMetrics(state.metrics);
      },
      'vfs.list': (_ctx, args) => resolveVfsNode((args as string) || '/'),
      'vfs.readFile': (_ctx, args) => {
        const path = args as string;
        const node = resolveVfsNode(path);
        if (!node) return null;
        if (node.type === 'DIR') {
          return (node.children ?? []).join('\n');
        }
        return node.content ?? '';
      },
    };

    // Central dispatcher - all syscalls go through here
    const dispatcher: KernelDispatcher = {
      invoke: (appId: string, syscall: SyscallName, args?: unknown) => {
        const ctx: SyscallContext = {
          kernel: null as any, // Will be set after kernel construction
          activeUser,
          appId,
        };

        // 1. Capability check
        if (!appHasSyscall(appId, syscall)) {
          const error = makeKernelError({
            code: 'FORBIDDEN_SYSCALL',
            message: `App ${appId} is not allowed to call ${syscall}`,
            syscall,
            appId,
          });

          // Audit this attempt
          logAuditEvent({
            userId: activeUser.id,
            action: 'FORBIDDEN_SYSCALL',
            resourceType: 'SYSTEM_APP',
            resourceId: appId,
            details: `Forbidden syscall: ${syscall}`,
          });

          console.warn(`[KERNEL] Forbidden syscall: ${appId} -> ${syscall}`);
          return { ok: false, error };
        }

        // 2. Role-based permission check
        if (!isRoleAllowedToCall(activeUser, syscall)) {
          const error = makeKernelError({
            code: 'FORBIDDEN_ROLE',
            message: `User role ${activeUser.role} not allowed to call ${syscall}`,
            syscall,
            appId,
          });

          console.warn(`[KERNEL] Role forbidden: ${activeUser.role} -> ${syscall}`);
          return { ok: false, error };
        }

        // 3. Record metrics
        recordSyscall(syscall);

        // 4. Dispatch to handler
        const handler = syscallHandlers[syscall];
        if (!handler) {
          const error = makeKernelError({
            code: 'INVALID_ARGUMENT',
            message: `No handler for syscall ${syscall}`,
            syscall,
            appId,
          });
          return { ok: false, error };
        }

        try {
          const value = handler(ctx, args);
          return { ok: true, value };
        } catch (e) {
          console.error('[KERNEL] Syscall error:', syscall, e);
          const error = makeKernelError({
            code: 'INTERNAL_ERROR',
            message: e instanceof Error ? e.message : 'Unknown error',
            syscall,
            appId,
            details: e,
          });

          // Log kernel crash
          logAuditEvent({
            userId: activeUser.id,
            action: 'KERNEL_SYSCALL_ERROR',
            resourceType: 'SYSTEM_APP',
            resourceId: appId,
            details: `Syscall ${syscall} failed: ${error.message}`,
          });

          return { ok: false, error };
        }
      },
    };

    return {
      sys: {
        jobs: {
          listJobs: () => {
            recordSyscall('jobs.list');
            return jobs;
          },
        submitJob: (input) => {
          recordSyscall('jobs.submit');
          const now = new Date().toISOString();
          const jobId = `j${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const newJob: Job = {
            id: jobId,
            orgId: activeOrg.id,
            name: input.name,
            ownerId: activeUser.id,
            workspace: input.workspace || activeWorkspace,
            type: input.type,
            status: 'PENDING',
            createdAt: now,
            updatedAt: now,
            attempts: 0,
            maxAttempts: 3,
            priority: input.priority || 'NORMAL',
            description: input.description,
            tags: input.tags,
            scriptSummary: input.scriptSummary,
            datasetId: input.datasetId,
            events: [
              {
                id: `${jobId}-e1`,
                timestamp: now,
                type: 'JOB_CREATED',
                message: 'Job created',
                actorUserId: activeUser.id,
              },
              {
                id: `${jobId}-e2`,
                timestamp: now,
                type: 'JOB_SUBMITTED',
                message: 'Job submitted to queue',
                actorUserId: activeUser.id,
              },
            ],
          };

          setJobs(prev => [newJob, ...prev]);
          
          logAuditEvent({
            userId: activeUser.id,
            action: 'JOB_SUBMITTED',
            resourceType: 'JOB',
            resourceId: newJob.id,
            details: `Submitted job "${newJob.name}" (${newJob.type}) in workspace ${newJob.workspace}${newJob.datasetId ? ` for dataset ${newJob.datasetId}` : ''}`,
          });

          showToast({
            type: 'success',
            title: 'Job submitted',
            description: `Job "${newJob.name}" submitted in workspace ${newJob.workspace}`,
          });

          return newJob;
        },
        runWorkerTick: () => {
          recordSyscall('jobs.tick');
          runWorkerTick();
        },
        retryJob: (jobId: string) => {
          recordSyscall('jobs.retry');
          retryJob(jobId);
        },
        cancelJob: (jobId: string) => {
          recordSyscall('jobs.cancel');
          cancelJob(jobId);
        },
        updateJob: (jobId: string, updater: (job: Job) => Partial<Job>) => {
          recordSyscall('jobs.update');
          updateJob(jobId, updater);
        },
      },
      datasets: {
        listDatasets: () => {
          recordSyscall('datasets.list');
          return datasets.filter(d => d.orgId === activeOrg.id);
        },
        createDataset: (input) => {
          recordSyscall('datasets.create');
          const now = new Date().toISOString();
          const dataset: Dataset = {
            id: `ds-${Date.now()}-${datasets.length + 1}`,
            orgId: activeOrg.id,
            workspace: input.workspace,
            name: input.name,
            type: 'FILE',
            description: input.description,
            source: input.source ?? 'upload',
            columns: input.columns,
            rowCount: input.rowCount,
            sampleRows: input.sampleRows,
            recordCount: input.rowCount,
            lastUpdated: now,
          };
          setDatasets(prev => [...prev, dataset]);
          logAuditEvent({
            userId: activeUser.id,
            action: 'DATASET_CREATED',
            resourceType: 'DATASET',
            resourceId: dataset.id,
            details: `Dataset "${dataset.name}" created via upload in workspace ${dataset.workspace}`,
          });
          showToast({
            type: 'success',
            title: 'Dataset created',
            description: `Dataset "${dataset.name}" created in workspace ${dataset.workspace}`,
          });
          return dataset;
        },
      },
      audit: {
        listEvents: () => {
          recordSyscall('audit.list');
          return auditEvents;
        },
        logEvent: (input) => {
          recordSyscall('audit.log');
          logAuditEvent(input);
        },
      },
      security: {
        whoAmI: () => {
          recordSyscall('security.whoami');
          return activeUser;
        },
        currentWorkspace: () => {
          recordSyscall('security.workspace');
          return activeWorkspace;
        },
        currentOrg: () => {
          recordSyscall('security.whoami');
          return activeOrg;
        },
        currentOrgPlan: () => {
          recordSyscall('security.whoami');
          return activeOrgPlan;
        },
        currentOrgRole: () => {
          recordSyscall('security.whoami');
          const orgUser = orgUsers.find(ou => ou.id === activeUser.id && ou.orgId === activeOrg.id);
          return orgUser?.orgRole ?? null;
        },
      },
      messaging: {
        sendMessage: (msg: KernelMessage) => {
          recordSyscall('messaging.send');
          setMessages(prev => [...prev, {
            ...msg,
            id: msg.id || `msg-${Date.now()}-${prev.length + 1}`,
            timestamp: msg.timestamp || new Date().toISOString(),
            consumed: false,
          }]);
        },
        consumeMessagesForApp: (appId: string) => {
          recordSyscall('messaging.consume');
          let consumed: KernelMessage[] = [];
          setMessages(prev => {
            const updated = prev.map(m => {
              if (!m.consumed && m.toAppId === appId) {
                consumed.push({ ...m, consumed: true });
                return { ...m, consumed: true };
              }
              return m;
            });
            return updated;
          });
          return consumed;
        },
      },
      processes: {
        listProcesses: () => {
          recordSyscall('processes.list');
          return deriveProcesses();
        },
      },
      snapshots: {
        listSnapshots: () => {
          recordSyscall('snapshots.list');
          return snapshots;
        },
        createSnapshot: (label?: string) => {
          recordSyscall('snapshots.create');
          const snap: KernelSnapshot = {
            id: `snap-${Date.now()}-${snapshots.length + 1}`,
            orgId: activeOrg.id,
            label: label ?? `Snapshot ${snapshots.length + 1}`,
            createdAt: new Date().toISOString(),
            state: {
              jobs: jobs.filter(j => j.orgId === activeOrg.id),
              datasets: datasets.filter(d => d.orgId === activeOrg.id),
              auditEvents: auditEvents.filter(e => e.orgId === activeOrg.id),
              activeUserId: activeUser.id,
              activeWorkspace,
              metrics: kernelMetrics,
            },
          };
          setSnapshots(prev => [...prev, snap]);
          return snap;
        },
        restoreSnapshot: (id: string) => {
          recordSyscall('snapshots.restore');
          const snap = snapshots.find(s => s.id === id);
          if (!snap) return;
          const { state } = snap;
          setJobs(state.jobs);
          setAuditEvents(state.auditEvents);
          setActiveUserState(users.find(u => u.id === state.activeUserId) || users[0]);
          setActiveWorkspaceState(state.activeWorkspace);
          setKernelMetrics(state.metrics);
        },
      },
      vfs: {
        listPath: (path: string) => {
          recordSyscall('vfs.list');
          return resolveVfsNode(path);
        },
        readFile: (path: string) => {
          recordSyscall('vfs.readFile');
          const node = resolveVfsNode(path);
          if (!node) return null;
          if (node.type === 'DIR') {
            return (node.children ?? []).join('\n');
          }
          return node.content ?? '';
        },
      },
    },
    capabilities: APP_CAPABILITIES,
    metrics: kernelMetrics,
    dispatcher,
  };
  }, [activeUser, activeWorkspace, activeOrg, activeOrgPlan, orgUsers, runWorkerTick, retryJob, cancelJob, updateJob, logAuditEvent, showToast, recordSyscall, deriveProcesses, resolveVfsNode]);

  return (
    <ZeroframeContext.Provider
      value={{
        activeUser,
        setActiveUser,
        activeWorkspace,
        setActiveWorkspace,
        auditEvents,
        logAuditEvent,
        hasPermission,
        jobs,
        datasets,
        submitJob,
        runWorkerTick,
        retryJob,
        cancelJob,
        updateJob,
        toasts,
        showToast,
        dismissToast,
        demoState,
        enableDemoMode,
        disableDemoMode,
        nextDemoStep,
        previousDemoStep,
        kernel,
        hasBooted,
        completeBoot,
        kernelPanic,
        triggerKernelPanic,
        rebootKernel,
        orgs,
        plans,
        activeOrg,
        activeOrgPlan,
        orgUsers,
        setActiveOrg,
      }}
    >
      {children}
    </ZeroframeContext.Provider>
  );
};

export function useZeroframe() {
  const ctx = useContext(ZeroframeContext);
  if (!ctx) {
    throw new Error('useZeroframe must be used within ZeroframeProvider');
  }
  return ctx;
}

export function useActiveUser() {
  const { activeUser } = useZeroframe();
  return activeUser;
}

export function useWorkspace() {
  const { activeWorkspace } = useZeroframe();
  return activeWorkspace;
}

export function usePermissions() {
  const { hasPermission } = useZeroframe();
  return { hasPermission };
}

export function useAuditLog() {
  const { auditEvents, logAuditEvent } = useZeroframe();
  return { auditEvents, logAuditEvent };
}

export function useToast() {
  const { toasts, showToast, dismissToast } = useZeroframe();
  return { toasts, showToast, dismissToast };
}

export function useDemoMode() {
  const { demoState, enableDemoMode, disableDemoMode, nextDemoStep, previousDemoStep } = useZeroframe();
  return { demoState, enableDemoMode, disableDemoMode, nextDemoStep, previousDemoStep };
}
