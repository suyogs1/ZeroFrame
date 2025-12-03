// Central permission model for Zeroframe OS
// Defines role-based access control for all system operations

import type { Role, User } from '../types';

export type PermissionAction =
  | 'VIEW_JOBS'
  | 'SUBMIT_JOB'
  | 'MANAGE_JOBS'          // retry, cancel, etc.
  | 'VIEW_DATASETS'
  | 'MANAGE_DATASETS'
  | 'VIEW_SECURITY'
  | 'MANAGE_SECURITY'
  | 'VIEW_AUDIT'
  | 'MANAGE_APPS';

export const ROLE_PERMISSIONS: Record<Role, PermissionAction[]> = {
  DEV: [
    'VIEW_JOBS',
    'SUBMIT_JOB',
    'VIEW_DATASETS',
  ],
  OPERATOR: [
    'VIEW_JOBS',
    'SUBMIT_JOB',
    'MANAGE_JOBS',
    'VIEW_DATASETS',
  ],
  AUDITOR: [
    'VIEW_JOBS',
    'VIEW_DATASETS',
    'VIEW_SECURITY',
    'VIEW_AUDIT',
  ],
  ADMIN: [
    'VIEW_JOBS',
    'SUBMIT_JOB',
    'MANAGE_JOBS',
    'VIEW_DATASETS',
    'MANAGE_DATASETS',
    'VIEW_SECURITY',
    'MANAGE_SECURITY',
    'VIEW_AUDIT',
    'MANAGE_APPS',
  ],
};

export function hasPermission(user: User | null | undefined, action: PermissionAction): boolean {
  if (!user) return false;
  const perms = ROLE_PERMISSIONS[user.role] ?? [];
  return perms.includes(action);
}
