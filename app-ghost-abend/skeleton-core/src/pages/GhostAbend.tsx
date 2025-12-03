import React, { useEffect, useState } from 'react';
import { Job } from '../types';
import { users } from '../data/mockData';
import { useOsAppApi } from '../core/useOsAppApi';
import { usePermissions } from '../core/ZeroframeContext';
import '../styles/GhostAbend.css';

type FailureSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface FailureAnalysis {
  severity: FailureSeverity;
  explanation: string;
  suggestion: string;
}

function analyzeJobFailure(job: Job, datasetName?: string, datasetProfile?: any): FailureAnalysis {
  const msg = job.lastError?.toLowerCase() ?? '';
  const attemptsRatio = job.attempts / (job.maxAttempts || 1);

  let severity: FailureSeverity = 'LOW';
  if (attemptsRatio >= 0.5 && attemptsRatio < 1) severity = 'MEDIUM';
  if (attemptsRatio >= 1) severity = 'HIGH';

  if (msg.includes('auth') || msg.includes('permission')) {
    severity = 'CRITICAL';
    return {
      severity,
      explanation: datasetName 
        ? `The job failed while processing dataset "${datasetName}" due to a simulated authorization/permission problem.`
        : 'The job failed due to a simulated authorization/permission problem.',
      suggestion: 'Review security policies, dataset access, and role permissions for this workflow.',
    };
  }

  if (msg.includes('timeout')) {
    return {
      severity,
      explanation: datasetName
        ? `The job exceeded its simulated execution time while processing dataset "${datasetName}".`
        : 'The job exceeded its simulated execution time.',
      suggestion: 'Consider splitting the workload or lowering concurrency for this class of job.',
    };
  }

  if (msg.includes('dataset') || msg.includes('missing')) {
    return {
      severity,
      explanation: datasetName
        ? `The job failed while processing dataset "${datasetName}". The dataset or required input appears to be unavailable.`
        : 'The job referenced a dataset or input that appears to be unavailable.',
      suggestion: datasetName
        ? `Verify that dataset "${datasetName}" exists in the correct workspace and has the expected schema.`
        : 'Verify dataset existence and workspace, then re-run with updated references.',
    };
  }

  if (msg.includes('validation') || msg.includes('invalid') || msg.includes('null') || msg.includes('missing')) {
    let explanation = datasetName
      ? `The job encountered data validation errors while processing dataset "${datasetName}". Input data may not match expected format.`
      : 'The job encountered data validation errors. Input data may not match expected format.';
    
    let suggestion = datasetName
      ? `Review the schema for dataset "${datasetName}" and validate input data format. Check for null values or type mismatches.`
      : 'Review the dataset schema and validate input data format. Check for null values or type mismatches.';

    // Enhance with profile data if available
    if (datasetProfile && datasetProfile.columnProfiles) {
      const highNullCols = datasetProfile.columnProfiles.filter(
        (cp: any) => (cp.nullCount ?? 0) > 0.1 * (datasetProfile.rowCount ?? 0)
      );
      if (highNullCols.length > 0) {
        const colNames = highNullCols.map((c: any) => c.columnName).join(', ');
        explanation += ` Profile analysis shows high null counts in columns: ${colNames}.`;
        suggestion += ` Consider cleaning or defaulting missing values in these columns before re-running.`;
      }
    }

    return { severity, explanation, suggestion };
  }

  if (job.attempts >= job.maxAttempts) {
    return {
      severity: 'HIGH',
      explanation: 'The job has exhausted its configured retry budget.',
      suggestion: 'Fix the root cause before increasing retries; examine the job event timeline.',
    };
  }

  return {
    severity,
    explanation: datasetName
      ? `The job encountered a generic simulated failure while processing dataset "${datasetName}".`
      : 'The job encountered a generic simulated failure.',
    suggestion: 'Use the job event timeline and last error to identify the failing step.',
  };
}

const GhostAbend: React.FC = () => {
  const api = useOsAppApi('ghost-abend');
  const { hasPermission } = usePermissions();
  const { jobs, retryJob, updateJob, datasets = [] } = api;

  const [workspaceFilter, setWorkspaceFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [datasetFilter, setDatasetFilter] = useState<string>('ALL');
  const [searchText, setSearchText] = useState('');
  const [rcaNotes, setRcaNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    api.logAppAudit({
      action: 'GHOST_ABEND_VIEWED',
      resourceType: 'SYSTEM_APP',
      details: 'Opened Ghost ABEND failure analysis app',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failedJobs = jobs.filter((job) => job.status === 'FAILED');

  // Get datasets with failures
  const datasetsWithFailures = datasets.filter(ds =>
    failedJobs.some(j => j.datasetId === ds.id)
  );

  // Apply filters
  const filteredJobs = failedJobs.filter(job => {
    // Workspace filter
    if (workspaceFilter !== 'ALL' && job.workspace !== workspaceFilter) {
      return false;
    }

    // Dataset filter
    if (datasetFilter !== 'ALL' && job.datasetId !== datasetFilter) {
      return false;
    }

    // Severity filter
    if (severityFilter !== 'ALL') {
      const dataset = job.datasetId ? datasets.find(d => d.id === job.datasetId) : undefined;
      const analysis = analyzeJobFailure(job, dataset?.name, dataset?.profile);
      if (analysis.severity !== severityFilter) {
        return false;
      }
    }

    // Text search
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesName = job.name.toLowerCase().includes(searchLower);
      const matchesError = job.lastError?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesError) {
        return false;
      }
    }

    return true;
  });

  const getOwnerName = (ownerId: string) => {
    return users.find((u) => u.id === ownerId)?.name || 'Unknown';
  };

  const getSeverityClass = (severity: FailureSeverity) => {
    return `severity-badge severity-${severity.toLowerCase()}`;
  };

  const handleSaveRca = (job: Job) => {
    const note = rcaNotes[job.id] || '';
    if (!note.trim() || !updateJob) return;

    updateJob(job.id, () => ({ rcaNote: note }));
    
    api.logAppAudit({
      action: 'GHOST_ABEND_RCA_SAVED',
      resourceType: 'JOB',
      resourceId: job.id,
      details: `Saved RCA note for job "${job.name}"`,
    });

    // Clear local state
    setRcaNotes(prev => {
      const updated = { ...prev };
      delete updated[job.id];
      return updated;
    });
  };

  const handleSimulateFixAndRetry = (job: Job) => {
    if (!retryJob) return;
    
    retryJob(job.id);
    
    api.logAppAudit({
      action: 'GHOST_ABEND_FIX_RETRY',
      resourceType: 'JOB',
      resourceId: job.id,
      details: `Simulated fix and retried job "${job.name}"`,
    });
  };

  const canManageJobs = hasPermission('MANAGE_JOBS');

  return (
    <div className="ghost-abend">
      <div className="ghost-header">
        <h2>👻 Ghost ABEND</h2>
        <p className="app-tagline">Mainframe-inspired failure analysis system app</p>
      </div>
      
      <div className="app-description">
        <p>
          Ghost ABEND is a parasitic system app that analyzes failed jobs from the Zeroframe OS job engine.
          It provides automated severity assessment, root cause analysis, and suggested fixes for job failures,
          similar to how mainframe operators would diagnose ABEND (Abnormal End) conditions.
        </p>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{failedJobs.length}</div>
          <div className="stat-label">Failed Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{failedJobs.filter(j => j.workspace === 'PROD').length}</div>
          <div className="stat-label">PROD Failures</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {failedJobs.reduce((sum, j) => sum + j.attempts, 0)}
          </div>
          <div className="stat-label">Total Attempts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {failedJobs.filter(j => {
              const dataset = j.datasetId ? datasets.find(d => d.id === j.datasetId) : undefined;
              return analyzeJobFailure(j, dataset?.name, dataset?.profile).severity === 'CRITICAL';
            }).length}
          </div>
          <div className="stat-label">Critical</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Workspace:</label>
          <select value={workspaceFilter} onChange={(e) => setWorkspaceFilter(e.target.value)}>
            <option value="ALL">All Workspaces</option>
            <option value="DEV">DEV</option>
            <option value="UAT">UAT</option>
            <option value="PROD">PROD</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Dataset:</label>
          <select value={datasetFilter} onChange={(e) => setDatasetFilter(e.target.value)}>
            <option value="ALL">All Datasets</option>
            {datasetsWithFailures.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Severity:</label>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="ALL">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Job name or error..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="failed-jobs-section">
        <h3>Failure Analysis ({filteredJobs.length} jobs)</h3>
        {filteredJobs.length === 0 ? (
          <div className="no-failures">
            <div className="no-failures-icon">✅</div>
            <p>
              {failedJobs.length === 0 
                ? 'All clear! No failed jobs to analyze right now.' 
                : 'No jobs match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="failed-jobs-list">
            {filteredJobs.map((job) => {
              const dataset = job.datasetId ? datasets.find(d => d.id === job.datasetId) : undefined;
              const analysis = analyzeJobFailure(job, dataset?.name, dataset?.profile);
              const localRcaNote = rcaNotes[job.id] ?? job.rcaNote ?? '';
              
              return (
                <div key={job.id} className="failed-job-card">
                  <div className="card-header">
                    <h4>{job.name}</h4>
                    <span className={getSeverityClass(analysis.severity)}>
                      {analysis.severity}
                    </span>
                  </div>
                  
                  <div className="job-info">
                    <div className="info-item">
                      <span className="info-label">Workspace:</span>
                      <span className="info-value">{job.workspace}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Owner:</span>
                      <span className="info-value">{getOwnerName(job.ownerId)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Attempts:</span>
                      <span className="info-value">{job.attempts}/{job.maxAttempts}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Type:</span>
                      <span className="info-value">{job.type}</span>
                    </div>
                  </div>

                  {dataset && (
                    <div className="dataset-context">
                      <div className="dataset-label">📊 Dataset Context</div>
                      <div className="dataset-info">
                        <div className="dataset-name">{dataset.name}</div>
                        <div className="dataset-details">
                          {dataset.columns && <span>{dataset.columns.length} columns</span>}
                          {dataset.rowCount && <span>{dataset.rowCount.toLocaleString()} rows</span>}
                          <span>{dataset.workspace}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {job.lastError && (
                    <div className="error-display">
                      <div className="error-label">Last Error:</div>
                      <div className="error-message">{job.lastError}</div>
                    </div>
                  )}

                  <div className="analysis-section">
                    <div className="analysis-block">
                      <div className="analysis-label">🔍 Explanation</div>
                      <div className="analysis-text">{analysis.explanation}</div>
                    </div>
                    
                    <div className="analysis-block">
                      <div className="analysis-label">💡 Suggested Fix</div>
                      <div className="analysis-text">{analysis.suggestion}</div>
                    </div>
                  </div>

                  <div className="rca-section">
                    <div className="rca-label">📝 Root Cause Analysis (RCA) Notes</div>
                    <textarea
                      className="rca-textarea"
                      placeholder="Document your root cause analysis and remediation steps..."
                      value={localRcaNote}
                      onChange={(e) => setRcaNotes(prev => ({ ...prev, [job.id]: e.target.value }))}
                      disabled={!canManageJobs}
                    />
                    {canManageJobs && rcaNotes[job.id] !== undefined && (
                      <button 
                        className="rca-save-btn"
                        onClick={() => handleSaveRca(job)}
                      >
                        Save RCA Note
                      </button>
                    )}
                  </div>

                  <div className="card-footer">
                    <span className="timestamp">
                      Failed at {new Date(job.updatedAt).toLocaleString()}
                    </span>
                    {canManageJobs && (
                      <button 
                        className="retry-btn"
                        onClick={() => handleSimulateFixAndRetry(job)}
                      >
                        🔄 Simulate Fix & Retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GhostAbend;
