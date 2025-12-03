import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dataset, DatasetType, Workspace } from '../types';
import { useActiveUser, useAuditLog, usePermissions, useZeroframe } from '../core/ZeroframeContext';
import { formatProfileStat, getNullPercentage } from '../core/datasetProfiling';
import '../styles/DatasetExplorer.css';

const DatasetExplorer: React.FC = () => {
  const user = useActiveUser();
  const { logAuditEvent } = useAuditLog();
  const { hasPermission } = usePermissions();
  const { jobs, datasets, activeOrg } = useZeroframe();
  const navigate = useNavigate();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const canManageDatasets = hasPermission('MANAGE_DATASETS');
  
  // Filter by active org
  const allDatasets = useMemo(() => datasets.filter(d => d.orgId === activeOrg.id), [datasets, activeOrg]);
  const allJobs = useMemo(() => jobs.filter(j => j.orgId === activeOrg.id), [jobs, activeOrg]);

  useEffect(() => {
    logAuditEvent({
      userId: user.id,
      action: 'DATASET_EXPLORER_VIEWED',
      resourceType: 'SYSTEM_APP',
      resourceId: 'datasets',
      details: 'Opened Dataset Explorer',
    });
  }, [logAuditEvent, user.id]);
  const [typeFilter, setTypeFilter] = useState<DatasetType | ''>('');
  const [workspaceFilter, setWorkspaceFilter] = useState<Workspace | ''>('');
  const [searchText, setSearchText] = useState<string>('');

  const filteredDatasets = useMemo(() => {
    return allDatasets.filter((dataset) => {
      if (typeFilter && dataset.type !== typeFilter) return false;
      if (workspaceFilter && dataset.workspace !== workspaceFilter) return false;
      if (searchText && !dataset.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [allDatasets, typeFilter, workspaceFilter, searchText]);

  return (
    <div className="dataset-explorer">
      <h2>Dataset Explorer</h2>
      
      <div className="filter-bar">
        <div className="filter-group">
          <label>Type:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as DatasetType | '')}>
            <option value="">All</option>
            <option value="FILE">FILE</option>
            <option value="TABLE">TABLE</option>
            <option value="STREAM">STREAM</option>
          </select>
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
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {allDatasets.length === 0 ? (
        <div className="empty-state-datasets">
          <div className="empty-icon">📂</div>
          <h3>No datasets found</h3>
          <p>Use Data Onboarding to create one from your own files.</p>
          <button className="empty-action-button" onClick={() => navigate('/data-onboarding')}>
            Go to Data Onboarding →
          </button>
        </div>
      ) : (
        <div className="dataset-content">
          <div className="dataset-table-container">
            <table className="dataset-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Workspace</th>
                  <th>Record Count</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredDatasets.map((dataset) => (
                <tr
                  key={dataset.id}
                  onClick={() => {
                    setSelectedDataset(dataset);
                    logAuditEvent({
                      userId: user.id,
                      action: 'DATASET_VIEWED',
                      resourceType: 'DATASET',
                      resourceId: dataset.id,
                      details: `Viewed dataset ${dataset.name}`,
                    });
                  }}
                  className={selectedDataset?.id === dataset.id ? 'selected' : ''}
                >
                  <td>{dataset.name}</td>
                  <td>{dataset.type}</td>
                  <td>{dataset.workspace}</td>
                  <td>{dataset.recordCount?.toLocaleString() || 'N/A'}</td>
                  <td>{dataset.lastUpdated ? new Date(dataset.lastUpdated).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedDataset && (
          <div className="dataset-detail-panel">
            <h3>Dataset Details</h3>
            <div className="detail-section">
              <div className="detail-row">
                <span className="detail-label">ID:</span>
                <span>{selectedDataset.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span>{selectedDataset.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span>{selectedDataset.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Workspace:</span>
                <span>{selectedDataset.workspace}</span>
              </div>
              {selectedDataset.recordCount && (
                <div className="detail-row">
                  <span className="detail-label">Record Count:</span>
                  <span>{selectedDataset.recordCount.toLocaleString()}</span>
                </div>
              )}
              {selectedDataset.lastUpdated && (
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span>{new Date(selectedDataset.lastUpdated).toLocaleString()}</span>
                </div>
              )}
              {selectedDataset.description && (
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span>{selectedDataset.description}</span>
                </div>
              )}
            </div>
            
            {/* Profile Section */}
            {selectedDataset.profile && (
              <div className="detail-section">
                <h4>📊 Dataset Profile</h4>
                <div className="profile-summary">
                  <div className="profile-stat">
                    <span className="stat-label">Profiled At:</span>
                    <span className="stat-value">
                      {selectedDataset.profile.lastProfiledAt 
                        ? new Date(selectedDataset.profile.lastProfiledAt).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-label">Rows:</span>
                    <span className="stat-value">{selectedDataset.profile.rowCount?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
                
                <h5>Column Statistics</h5>
                <table className="profile-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Distinct</th>
                      <th>Nulls</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDataset.profile.columnProfiles.map((col, idx) => (
                      <tr key={idx}>
                        <td className="col-name">{col.columnName}</td>
                        <td className="col-type">{col.type}</td>
                        <td>{formatProfileStat(col, 'distinctCount')}</td>
                        <td>
                          {col.nullCount !== undefined 
                            ? `${col.nullCount} (${getNullPercentage(col, selectedDataset.profile!.rowCount || 0).toFixed(1)}%)`
                            : 'N/A'}
                        </td>
                        <td className="col-stat">{formatProfileStat(col, 'minValue')}</td>
                        <td className="col-stat">{formatProfileStat(col, 'maxValue')}</td>
                        <td className="col-stat">{col.type === 'number' ? formatProfileStat(col, 'avg') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Lineage Section */}
            {selectedDataset.lineageJobIds && selectedDataset.lineageJobIds.length > 0 && (
              <div className="detail-section">
                <h4>🔗 Data Lineage</h4>
                <p className="lineage-description">
                  Jobs that have processed this dataset ({selectedDataset.lineageJobIds.length} total):
                </p>
                <table className="lineage-table">
                  <thead>
                    <tr>
                      <th>Job Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDataset.lineageJobIds.map(jobId => {
                      const job = allJobs.find(j => j.id === jobId);
                      if (!job) return null;
                      return (
                        <tr key={job.id}>
                          <td>{job.name}</td>
                          <td>{job.type}</td>
                          <td>
                            <span className={`status-badge status-${job.status.toLowerCase()}`}>
                              {job.status}
                            </span>
                          </td>
                          <td>{new Date(job.updatedAt).toLocaleString()}</td>
                          <td>
                            <button 
                              className="btn-link"
                              onClick={() => navigate('/jobs')}
                              title="View in Job Center"
                            >
                              View Job
                            </button>
                            {job.status === 'FAILED' && (
                              <button 
                                className="btn-link"
                                onClick={() => navigate('/apps/ghost-abend')}
                                title="Analyze in Ghost ABEND"
                              >
                                Analyze
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="detail-section">
              <h4>Preview</h4>
              <div className="preview-placeholder">
                <p>Dataset preview will be implemented later. For now, this is a conceptual placeholder.</p>
              </div>
            </div>
            
            {canManageDatasets && (
              <div className="action-buttons">
                <button className="btn-primary">Create Dataset</button>
                <button className="btn-secondary">Edit Dataset</button>
              </div>
            )}
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default DatasetExplorer;
