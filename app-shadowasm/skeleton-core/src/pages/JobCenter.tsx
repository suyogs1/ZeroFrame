import React, { useState, useMemo, useEffect } from 'react';
import { Job, JobStatus, Workspace } from '../types';
import { users } from '../data/mockData';
import { useZeroframe, useActiveUser, usePermissions } from '../core/ZeroframeContext';
import '../styles/JobCenter.css';

// Helper to get dataset names from job
const getDatasetNames = (job: Job, datasets: any[]): string[] => {
  const ids = job.inputDatasetIds && job.inputDatasetIds.length > 0
    ? job.inputDatasetIds
    : job.datasetId
    ? [job.datasetId]
    : [];
  return ids
    .map(id => datasets.find(d => d.id === id))
    .filter(Boolean)
    .map(d => d!.name);
};

const JobCenter: React.FC = () => {
  const user = useActiveUser();
  const { jobs, datasets: allDatasets, submitJob, runWorkerTick, retryJob, cancelJob, logAuditEvent, activeWorkspace, activeOrg } = useZeroframe();
  const { hasPermission } = usePermissions();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const canSubmit = hasPermission('SUBMIT_JOB');
  const canManageJobs = hasPermission('MANAGE_JOBS');
  
  // Filter datasets by active org
  const datasets = useMemo(() => allDatasets.filter(d => d.orgId === activeOrg.id), [allDatasets, activeOrg]);

  useEffect(() => {
    logAuditEvent({
      userId: user.id,
      action: 'JOB_CENTER_VIEWED',
      resourceType: 'SYSTEM_APP',
      resourceId: 'jobs',
      details: 'Opened Job & Batch Center',
    });
  }, [logAuditEvent, user.id]);

  const [statusFilter, setStatusFilter] = useState<JobStatus[]>([]);
  const [workspaceFilter, setWorkspaceFilter] = useState<Workspace | ''>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter.length > 0 && !statusFilter.includes(job.status)) return false;
      if (workspaceFilter && job.workspace !== workspaceFilter) return false;
      if (ownerFilter && job.ownerId !== ownerFilter) return false;
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesName = job.name.toLowerCase().includes(search);
        const matchesTags = job.tags?.some((tag) => tag.toLowerCase().includes(search));
        if (!matchesName && !matchesTags) return false;
      }
      return true;
    });
  }, [jobs, statusFilter, workspaceFilter, ownerFilter, searchText]);

  const toggleStatus = (status: JobStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const getOwnerName = (ownerId: string) => {
    return users.find((u) => u.id === ownerId)?.name || 'Unknown';
  };

  const getStatusClass = (status: JobStatus) => {
    return `status-pill status-${status.toLowerCase()}`;
  };

  const getRiskLevel = (job: Job) => {
    if (job.attempts === 0) return 'LOW';
    if (job.attempts === 1) return 'MEDIUM';
    return 'HIGH';
  };

  const getRiskClass = (risk: string) => {
    return `risk-badge risk-${risk.toLowerCase()}`;
  };

  return (
    <div className="job-center">
      <div className="job-center-header">
        <h2>Job & Batch Center</h2>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            disabled={!canSubmit}
            title={!canSubmit ? 'Your role cannot submit jobs' : 'Submit a new job'}
            onClick={() => setShowSubmitModal(true)}
          >
            Submit New Job
          </button>
          {canManageJobs && (
            <button 
              className="btn-secondary"
              onClick={runWorkerTick}
              title="Simulate one worker tick to process next pending job"
            >
              ⚙️ Run Worker Tick
            </button>
          )}
        </div>
      </div>
      
      <div className="filter-bar">
        <div className="filter-group">
          <label>Status:</label>
          <div className="checkbox-group">
            {(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED'] as JobStatus[]).map((status) => (
              <label key={status} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={statusFilter.includes(status)}
                  onChange={() => toggleStatus(status)}
                />
                {status}
              </label>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <label>Workspace:</label>
          <select value={workspaceFilter} onChange={(e) => setWorkspaceFilter(e.target.value as Workspace | '')}>
            <option value="">All</option>
            <option value="DEV">DEV</option>
            <option value="UAT">UAT</option>
            <option value="PROD">PROD</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Owner:</label>
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="">All</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by name or tags..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="job-content">
        <div className="job-table-container">
          <table className="job-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Workspace</th>
                <th>Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Owner</th>
                <th>Datasets</th>
                <th>Created At</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <p>No jobs match your filters. Try adjusting your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const datasetNames = getDatasetNames(job, datasets);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        logAuditEvent({
                          userId: user.id,
                          action: 'JOB_VIEWED',
                          resourceType: 'JOB',
                          resourceId: job.id,
                          details: `Viewed job ${job.name}`,
                        });
                      }}
                      className={selectedJob?.id === job.id ? 'selected' : ''}
                    >
                      <td>{job.name}</td>
                      <td>{job.workspace}</td>
                      <td>{job.type}</td>
                      <td>
                        <span className={getStatusClass(job.status)}>{job.status}</span>
                      </td>
                      <td>{job.priority}</td>
                      <td>{getOwnerName(job.ownerId)}</td>
                      <td className="datasets-cell">
                        {datasetNames.length > 0 ? datasetNames.join(', ') : '-'}
                      </td>
                      <td>{new Date(job.createdAt).toLocaleString()}</td>
                      <td>{job.attempts}/{job.maxAttempts}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {selectedJob && (
          <div className="job-detail-panel">
            <h3>Job Details</h3>
            <div className="detail-section">
              <div className="detail-row">
                <span className="detail-label">ID:</span>
                <span>{selectedJob.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span>{selectedJob.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={getStatusClass(selectedJob.status)}>{selectedJob.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Workspace:</span>
                <span>{selectedJob.workspace}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span>{selectedJob.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Priority:</span>
                <span>{selectedJob.priority}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Owner:</span>
                <span>{getOwnerName(selectedJob.ownerId)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Attempts:</span>
                <span>{selectedJob.attempts}/{selectedJob.maxAttempts}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Risk Level:</span>
                <span className={getRiskClass(getRiskLevel(selectedJob))}>{getRiskLevel(selectedJob)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created:</span>
                <span>{new Date(selectedJob.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Updated:</span>
                <span>{new Date(selectedJob.updatedAt).toLocaleString()}</span>
              </div>
              {selectedJob.lastError && (
                <div className="detail-row">
                  <span className="detail-label">Last Error:</span>
                  <span className="error-text">{selectedJob.lastError}</span>
                </div>
              )}
              {selectedJob.description && (
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span>{selectedJob.description}</span>
                </div>
              )}
              {selectedJob.tags && selectedJob.tags.length > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Tags:</span>
                  <span>{selectedJob.tags.join(', ')}</span>
                </div>
              )}
              {selectedJob.scriptSummary && (
                <div className="detail-row">
                  <span className="detail-label">Script Summary:</span>
                  <span>{selectedJob.scriptSummary}</span>
                </div>
              )}
            </div>
            
            <div className="detail-section">
              <h4>Execution Timeline</h4>
              <div className="timeline">
                {selectedJob.events.map((event) => (
                  <div key={event.id} className="timeline-event">
                    <div className="timeline-timestamp">{new Date(event.timestamp).toLocaleString()}</div>
                    <div className="timeline-type">{event.type}</div>
                    <div className="timeline-message">{event.message}</div>
                    {event.actorUserId && (
                      <div className="timeline-actor">by {getOwnerName(event.actorUserId)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="action-buttons">
              {canManageJobs && selectedJob.status === 'FAILED' && (
                <button 
                  className="btn-secondary"
                  onClick={() => retryJob(selectedJob.id)}
                >
                  Retry Job
                </button>
              )}
              {canManageJobs && ['PENDING', 'RUNNING', 'RETRYING'].includes(selectedJob.status) && (
                <button 
                  className="btn-danger"
                  onClick={() => cancelJob(selectedJob.id)}
                >
                  Cancel Job
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showSubmitModal && (
        <SubmitJobModal
          onClose={() => setShowSubmitModal(false)}
          onSubmit={submitJob}
          defaultWorkspace={activeWorkspace}
        />
      )}
    </div>
  );
};

const SubmitJobModal: React.FC<{
  onClose: () => void;
  onSubmit: (input: any) => void;
  defaultWorkspace: Workspace;
}> = ({ onClose, onSubmit, defaultWorkspace }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'BATCH' as Job['type'],
    workspace: defaultWorkspace,
    priority: 'NORMAL' as Job['priority'],
    description: '',
    scriptSummary: '',
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Submit New Job</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Job Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., MONTHLY_REPORT_DEC"
            />
          </div>
          <div className="form-group">
            <label>Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Job['type'] })}
            >
              <option value="BATCH">BATCH</option>
              <option value="REPORT">REPORT</option>
              <option value="ETL">ETL</option>
              <option value="SIMULATION">SIMULATION</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Job['priority'] })}
            >
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div className="form-group">
            <label>Workspace</label>
            <select
              value={formData.workspace}
              onChange={(e) => setFormData({ ...formData, workspace: e.target.value as Workspace })}
            >
              <option value="DEV">DEV</option>
              <option value="UAT">UAT</option>
              <option value="PROD">PROD</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the job"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Script Summary</label>
            <input
              type="text"
              value={formData.scriptSummary}
              onChange={(e) => setFormData({ ...formData, scriptSummary: e.target.value })}
              placeholder="e.g., Processes monthly sales data"
            />
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., monthly, sales, report"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Submit Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobCenter;
