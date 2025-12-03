// Capability registry and helper functions for the microkernel

import type { AppCapabilityDescriptor, SyscallName } from './types';

// App capability registry - defines which syscalls each app can use
export const APP_CAPABILITIES: AppCapabilityDescriptor[] = [
  {
    appId: 'jobs',
    allowedSyscalls: [
      'jobs.list',
      'jobs.submit',
      'jobs.tick',
      'jobs.retry',
      'jobs.cancel',
      'audit.log',
      'audit.list',
      'security.whoami',
      'security.workspace',
    ],
  },
  {
    appId: 'dashboard',
    allowedSyscalls: [
      'jobs.list',
      'audit.list',
      'security.whoami',
      'security.workspace',
      'datasets.list',
    ],
  },
  {
    appId: 'ghost-abend',
    allowedSyscalls: [
      'jobs.list',
      'jobs.retry',
      'jobs.update',
      'datasets.list',
      'audit.log',
      'audit.list',
      'security.whoami',
      'security.workspace',
      'messaging.send',
      'messaging.consume',
    ],
  },
  {
    appId: 'shadowasm',
    allowedSyscalls: [
      'jobs.list',
      'jobs.submit',
      'datasets.list',
      'audit.log',
      'security.whoami',
      'security.workspace',
      'messaging.send',
      'messaging.consume',
    ],
  },
  {
    appId: 'audit',
    allowedSyscalls: [
      'audit.list',
      'security.whoami',
      'security.workspace',
    ],
  },
  {
    appId: 'datasets',
    allowedSyscalls: [
      'datasets.list',
      'audit.log',
      'security.whoami',
      'security.workspace',
    ],
  },
  {
    appId: 'security',
    allowedSyscalls: [
      'audit.list',
      'audit.log',
      'security.whoami',
      'security.workspace',
    ],
  },
  {
    appId: 'console',
    allowedSyscalls: [
      'jobs.list',
      'jobs.submit',
      'jobs.retry',
      'jobs.cancel',
      'jobs.tick',
      'datasets.list',
      'audit.list',
      'audit.log',
      'security.whoami',
      'security.workspace',
      'messaging.send',
      'messaging.consume',
      'processes.list',
      'kernel.metrics',
      'vfs.list',
      'vfs.readFile',
      'snapshots.list',
      'snapshots.create',
      'snapshots.restore',
    ],
  },
  {
    appId: 'process-manager',
    allowedSyscalls: [
      'processes.list',
      'audit.log',
      'security.whoami',
      'security.workspace',
      'kernel.metrics',
    ],
  },
  {
    appId: 'docs',
    allowedSyscalls: [
      'audit.log',
      'security.whoami',
      'security.workspace',
    ],
  },
  {
    appId: 'desktop',
    allowedSyscalls: [
      'audit.log',
      'security.whoami',
      'security.workspace',
    ],
  },
  {
    appId: 'data-onboarding',
    allowedSyscalls: [
      'datasets.list',
      'datasets.create',
      'jobs.submit',
      'jobs.list',
      'jobs.tick',
      'audit.log',
      'security.whoami',
      'security.workspace',
    ],
  },
];

// Check if an app has permission to use a specific syscall
export function appHasSyscall(appId: string, syscall: SyscallName): boolean {
  const cap = APP_CAPABILITIES.find(c => c.appId === appId);
  if (!cap) return false;
  return cap.allowedSyscalls.includes(syscall);
}
