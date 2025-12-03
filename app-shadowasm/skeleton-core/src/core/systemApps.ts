// Zeroframe OS System Apps Registry
// 
// This file is the SKELETON CREW template for building new apps on top of Zeroframe OS.
// 
// To create a new app:
// 1. Implement your screen component in src/pages/
// 2. Add a SystemAppDefinition entry to the SYSTEM_APPS array below
// 3. Use core services (jobs, datasets, audit) via shared hooks or context
// 4. The app will automatically appear on the Desktop and be routable
//
// This demonstrates the "skeleton template" pattern: one reusable OS platform
// that multiple independent applications can be built on top of.

export interface SystemAppDefinition {
  id: string;
  name: string;
  description: string;
  route: string;
  icon?: string;
  category?: 'CORE' | 'SYSTEM' | 'THIRD_PARTY';
}

export const SYSTEM_APPS: SystemAppDefinition[] = [
  {
    id: 'dashboard',
    name: 'System Status Dashboard',
    description: 'High-level view of Zeroframe OS health: jobs, activity, and security posture',
    route: '/dashboard',
    icon: '📊',
    category: 'CORE',
  },
  {
    id: 'docs',
    name: 'Zeroframe Docs & Kiroween',
    description: 'Learn how Zeroframe OS works, how to build apps on top of it, and how it fits Kiroween\'s Skeleton Crew & Resurrection themes.',
    route: '/docs',
    icon: '📖',
    category: 'CORE',
  },
  {
    id: 'jobs',
    name: 'Job & Batch Center',
    description: 'Manage and monitor batch jobs, ETL processes, and simulations',
    route: '/jobs',
    icon: '⚙️',
    category: 'CORE',
  },
  {
    id: 'datasets',
    name: 'Dataset Explorer',
    description: 'Browse and manage datasets across workspaces',
    route: '/datasets',
    icon: '📊',
    category: 'CORE',
  },
  {
    id: 'security',
    name: 'Security & Policies',
    description: 'Manage users, roles, and security policies',
    route: '/security',
    icon: '🔒',
    category: 'CORE',
  },
  {
    id: 'audit',
    name: 'Telemetry & Audit Explorer',
    description: 'View system audit logs and telemetry data',
    route: '/audit',
    icon: '📋',
    category: 'CORE',
  },
  {
    id: 'ghost-abend',
    name: 'Ghost ABEND',
    description: 'Analyze failed jobs and diagnose abend-like failures',
    route: '/apps/ghost-abend',
    icon: '👻',
    category: 'SYSTEM',
  },
  {
    id: 'shadowasm',
    name: 'ShadowASM',
    description: 'High-level assembly playground for Zeroframe OS',
    route: '/apps/shadowasm',
    icon: '🔧',
    category: 'SYSTEM',
  },
  {
    id: 'console',
    name: 'Command Console',
    description: 'Terminal interface for kernel metrics and process management',
    route: '/apps/console',
    icon: '🖥️',
    category: 'CORE',
  },
  {
    id: 'process-manager',
    name: 'Process Manager',
    description: 'View processes as seen by the Zeroframe microkernel',
    route: '/apps/processes',
    icon: '🧠',
    category: 'CORE',
  },
  {
    id: 'data-onboarding',
    name: 'Data Onboarding',
    description: 'Upload CSV or Excel files to create datasets and demo jobs',
    route: '/data-onboarding',
    icon: '📥',
    category: 'CORE',
  },
];

export function getSystemAppById(id: string): SystemAppDefinition | undefined {
  return SYSTEM_APPS.find((app) => app.id === id);
}

export function getSystemAppsByCategory(category: SystemAppDefinition['category']): SystemAppDefinition[] {
  return SYSTEM_APPS.filter((app) => app.category === category);
}
