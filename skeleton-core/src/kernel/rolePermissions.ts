// Zeroframe OS Kernel Role Permission Mapping
// Maps syscalls to role-based permissions

import type { User } from '../types';
import type { SyscallName } from './types';
import { hasPermission } from '../core/permissions';

/**
 * Check if a user's role allows them to call a specific syscall.
 * This provides role-based access control at the kernel level.
 */
export function isRoleAllowedToCall(user: User, syscall: SyscallName): boolean {
  switch (syscall) {
    case 'jobs.list':
      return hasPermission(user, 'VIEW_JOBS');
    
    case 'jobs.submit':
      return hasPermission(user, 'SUBMIT_JOB');
    
    case 'jobs.retry':
    case 'jobs.cancel':
    case 'jobs.tick':
    case 'jobs.update':
      return hasPermission(user, 'MANAGE_JOBS');
    
    case 'datasets.list':
      return hasPermission(user, 'VIEW_DATASETS');
    
    case 'datasets.create':
      // Dataset creation allowed for developers and admins
      return hasPermission(user, 'MANAGE_DATASETS') || hasPermission(user, 'SUBMIT_JOB');
    
    case 'audit.list':
      return hasPermission(user, 'VIEW_AUDIT');
    
    case 'audit.log':
      // Audit logging is allowed for all roles (apps log their own actions)
      return true;
    
    case 'security.whoami':
    case 'security.workspace':
      // Identity queries are always allowed
      return true;
    
    case 'messaging.send':
    case 'messaging.consume':
      // IPC is allowed for apps with capability (no extra role check)
      return true;
    
    case 'processes.list':
      // Process listing requires job or audit viewing permissions
      return hasPermission(user, 'VIEW_JOBS') || hasPermission(user, 'VIEW_AUDIT');
    
    case 'kernel.metrics':
      // Kernel metrics available to operators and auditors
      return hasPermission(user, 'MANAGE_JOBS') || hasPermission(user, 'VIEW_AUDIT');
    
    case 'vfs.list':
    case 'vfs.readFile':
      // VFS read operations allowed for all roles
      return true;
    
    case 'snapshots.list':
      // Snapshot listing allowed for operators and admins
      return hasPermission(user, 'MANAGE_JOBS') || hasPermission(user, 'MANAGE_SECURITY');
    
    case 'snapshots.create':
    case 'snapshots.restore':
      // Snapshot create/restore restricted to operators and admins
      return hasPermission(user, 'MANAGE_JOBS') || hasPermission(user, 'MANAGE_SECURITY');
    
    default:
      // Unknown syscall - deny by default
      return false;
  }
}
