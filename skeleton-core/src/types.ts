// Core data models for Zeroframe OS

// Multi-tenant organization model
export type OrgPlanId = 'FREE' | 'TEAM' | 'ENTERPRISE';

export interface OrgPlan {
  id: OrgPlanId;
  name: string;
  description: string;
  // Feature toggles and soft limits (no pricing yet)
  maxJobsPerDay?: number;
  maxSnapshots?: number;
  maxDatasets?: number;
  enableScheduler?: boolean;
  enableWorkflows?: boolean;
  enableAdvancedApps?: boolean; // Ghost ABEND, ShadowASM
}

export interface Org {
  id: string;
  name: string;
  planId: OrgPlanId;
  createdAt: string;
  isActive: boolean;
}

export type OrgRole = 'ORG_ADMIN' | 'ORG_OPERATOR' | 'ORG_DEVELOPER' | 'ORG_AUDITOR';

export interface OrgUser {
  id: string; // link to User.id
  orgId: string;
  orgRole: OrgRole;
}

// User model (workspace/technical role)
export type Role = 'DEV' | 'OPERATOR' | 'AUDITOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type Workspace = 'DEV' | 'UAT' | 'PROD';

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'CANCELLED';

export type JobEventType =
  | 'JOB_CREATED'
  | 'JOB_SUBMITTED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED'
  | 'JOB_RETRY_SCHEDULED'
  | 'JOB_CANCELLED'
  | 'JOB_STATUS_CHANGED';

export interface JobEvent {
  id: string;
  timestamp: string;
  type: JobEventType;
  message: string;
  previousStatus?: JobStatus;
  newStatus?: JobStatus;
  actorUserId?: string;
}

export interface Job {
  id: string;
  orgId: string; // Multi-tenant: org isolation
  name: string;
  ownerId: string;
  workspace: Workspace;
  type: 'BATCH' | 'REPORT' | 'ETL' | 'SIMULATION';
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  maxAttempts: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  description?: string;
  tags?: string[];
  scriptSummary?: string;
  events: JobEvent[];
  lastError?: string;
  rcaNote?: string; // Root Cause Analysis note (added by Ghost ABEND)
  datasetId?: string; // Optional link to a Dataset (primary/input)
  // Lineage: input/output datasets
  inputDatasetIds?: string[];
  outputDatasetIds?: string[];
}

export type DatasetType = 'FILE' | 'TABLE' | 'STREAM';

export type DatasetColumnType = 'string' | 'number' | 'boolean' | 'date';

export interface DatasetColumn {
  name: string;
  type: DatasetColumnType;
  nullable: boolean;
  sampleValues: string[];
}

export interface ColumnProfile {
  columnName: string;
  type: DatasetColumnType;
  distinctCount?: number;
  nullCount?: number;
  minValue?: string;   // store as string for display
  maxValue?: string;
  avg?: number;        // for numeric columns
  exampleValues?: string[];
}

export interface DatasetProfile {
  lastProfiledAt?: string;
  rowCount?: number;
  columnProfiles: ColumnProfile[];
}

export interface Dataset {
  id: string;
  orgId: string; // Multi-tenant: org isolation
  name: string;
  type: DatasetType;
  workspace: Workspace;
  description?: string;
  recordCount?: number;
  lastUpdated?: string;
  // Zero-data onboarding fields
  source?: 'upload' | 'system' | 'synthetic';
  columns?: DatasetColumn[];
  rowCount?: number;
  sampleRows?: Record<string, unknown>[];
  // Profiling and lineage
  profile?: DatasetProfile;
  lineageJobIds?: string[]; // Jobs that touched this dataset
}

export interface AuditEvent {
  id: string;
  orgId: string; // Multi-tenant: org isolation
  timestamp: string;
  userId: string;
  action: string;
  resourceType: 'JOB' | 'DATASET' | 'SECURITY' | 'SYSTEM_APP' | 'CUSTOM';
  resourceId?: string;
  details?: string;
}

export interface SystemApp {
  id: string;
  name: string;
  description: string;
  route: string;
  icon?: string;
}
