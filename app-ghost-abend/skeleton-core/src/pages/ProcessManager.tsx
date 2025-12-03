// Process Manager - View OS processes as seen by the Zeroframe microkernel
// Demonstrates the kernel's view of running jobs and services

import { useState, useEffect } from 'react';
import { useOsAppApi } from '../core/useOsAppApi';
import type { ProcessType, ProcessStatus } from '../kernel/types';
import '../styles/ProcessManager.css';

export default function ProcessManager() {
  const api = useOsAppApi('process-manager');
  const [typeFilter, setTypeFilter] = useState<ProcessType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | 'ALL'>('ALL');
  const [processes, setProcesses] = useState<ReturnType<NonNullable<typeof api.listProcesses>>>([]);

  useEffect(() => {
    api.logAppAudit({
      action: 'PROCESS_MANAGER_OPENED',
      resourceType: 'SYSTEM_APP',
      details: 'Process Manager accessed',
    });
    
    // Load processes after mount to avoid setState during render
    if (api.listProcesses) {
      setProcesses(api.listProcesses());
    }
  }, [api]);

  const filteredProcesses = processes.filter(p => {
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  const formatDuration = (startIso: string) => {
    const start = new Date(startIso);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  return (
    <div className="process-manager-page">
      <div className="process-manager-header">
        <h1>🧠 Process Manager</h1>
        <p>View processes as seen by the Zeroframe microkernel</p>
      </div>

      <div className="process-filters">
        <div className="filter-group">
          <label>Type:</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ProcessType | 'ALL')}>
            <option value="ALL">All</option>
            <option value="JOB">Jobs</option>
            <option value="SERVICE">Services</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ProcessStatus | 'ALL')}>
            <option value="ALL">All</option>
            <option value="RUNNING">Running</option>
            <option value="SLEEPING">Sleeping</option>
            <option value="STOPPED">Stopped</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Total: {filteredProcesses.length} processes</label>
        </div>
      </div>

      {filteredProcesses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No processes found matching filters</p>
        </div>
      ) : (
        <div className="process-table-container">
          <table className="process-table">
            <thead>
              <tr>
                <th>PID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Workspace</th>
                <th>CPU %</th>
                <th>Memory</th>
                <th>Uptime</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.map(proc => (
                <tr key={proc.pid}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{proc.pid}</td>
                  <td>{proc.name}</td>
                  <td>
                    <span className={`process-type-badge process-type-${proc.type.toLowerCase()}`}>
                      {proc.type}
                    </span>
                  </td>
                  <td>
                    <span className={`process-status-badge process-status-${proc.status.toLowerCase()}`}>
                      {proc.status}
                    </span>
                  </td>
                  <td>{proc.workspace || '—'}</td>
                  <td>
                    <div className="process-metrics">
                      <div className="metric-bar">
                        <div className="metric-fill" style={{ width: `${proc.cpuUsage}%` }} />
                      </div>
                      <span className="metric-value">{proc.cpuUsage}%</span>
                    </div>
                  </td>
                  <td>{proc.memUsage} MB</td>
                  <td>{formatDuration(proc.startedAt)}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatTimestamp(proc.lastActivityAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
