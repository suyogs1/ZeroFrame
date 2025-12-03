import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZeroframe, useAuditLog } from '../core/ZeroframeContext';
import { users } from '../data/mockData';
import type { JobStatus } from '../types';
import '../styles/DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const { jobs, activeWorkspace, activeUser, datasets: allDatasets, activeOrg } = useZeroframe();
  const { auditEvents } = useAuditLog();
  const navigate = useNavigate();
  
  // Filter datasets by active org
  const datasets = useMemo(() => allDatasets.filter(d => d.orgId === activeOrg.id), [allDatasets, activeOrg]);

  // Calculate job statistics
  const jobStats = useMemo(() => {
    const all = jobs.length;
    const byStatus: Record<JobStatus, number> = {
      PENDING: 0,
      RUNNING: 0,
      COMPLETED: 0,
      FAILED: 0,
      RETRYING: 0,
      CANCELLED: 0,
    };

    jobs.forEach(job => {
      byStatus[job.status]++;
    });

    return { all, byStatus };
  }, [jobs]);

  // Calculate workspace-specific stats
  const workspaceStats = useMemo(() => {
    const workspaceJobs = jobs.filter(j => j.workspace === activeWorkspace);
    const failed = workspaceJobs.filter(j => j.status === 'FAILED').length;
    return {
      total: workspaceJobs.length,
      failed,
    };
  }, [jobs, activeWorkspace]);

  // Calculate security posture
  const securityStats = useMemo(() => {
    const roleCount: Record<string, number> = {};
    users.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });
    return roleCount;
  }, []);

  // Recent activity (last 24 hours)
  const recentActivity = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return auditEvents.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= oneDayAgo;
    }).length;
  }, [auditEvents]);

  // Latest audit events
  const latestEvents = useMemo(() => {
    return auditEvents.slice(0, 10);
  }, [auditEvents]);

  // Check if system has any data
  const hasData = jobs.length > 0 || datasets.length > 0;

  return (
    <div className="dashboard-page">
      <h1>System Status Dashboard</h1>
      <p className="dashboard-subtitle">
        High-level view of Zeroframe OS health: jobs, activity, and security posture
      </p>

      {!hasData && (
        <div className="zero-data-banner">
          <div className="banner-icon">📥</div>
          <div className="banner-content">
            <h3>No data yet</h3>
            <p>Upload CSV or Excel in Data Onboarding to start using Zeroframe OS.</p>
            <button className="banner-button" onClick={() => navigate('/data-onboarding')}>
              Go to Data Onboarding →
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-icon">⚙️</div>
          <div className="card-content">
            <h3>Total Jobs</h3>
            <div className="card-value">{jobStats.all}</div>
            <div className="card-breakdown">
              <span className="status-badge status-running">{jobStats.byStatus.RUNNING} running</span>
              <span className="status-badge status-completed">{jobStats.byStatus.COMPLETED} completed</span>
              <span className="status-badge status-failed">{jobStats.byStatus.FAILED} failed</span>
              <span className="status-badge status-pending">{jobStats.byStatus.PENDING} pending</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📁</div>
          <div className="card-content">
            <h3>Workspace: {activeWorkspace}</h3>
            <div className="card-value">{workspaceStats.total} jobs</div>
            <div className="card-breakdown">
              {workspaceStats.failed > 0 ? (
                <span className="status-badge status-failed">{workspaceStats.failed} failed</span>
              ) : (
                <span className="status-badge status-success">All healthy</span>
              )}
            </div>
            <p className="card-hint">Switch workspace in the top bar</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🔒</div>
          <div className="card-content">
            <h3>Security Posture</h3>
            <div className="card-value">{users.length} users</div>
            <div className="card-breakdown">
              {Object.entries(securityStats).map(([role, count]) => (
                <span key={role} className="status-badge status-info">
                  {count} {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Recent Activity</h3>
            <div className="card-value">{recentActivity}</div>
            <div className="card-breakdown">
              <span className="status-badge status-info">Last 24 hours</span>
            </div>
            <p className="card-hint">Logged as {activeUser.name}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Job Status Overview</h2>
        <div className="job-status-chart">
          {Object.entries(jobStats.byStatus).map(([status, count]) => {
            if (count === 0) return null;
            const percentage = (count / jobStats.all) * 100;
            return (
              <div key={status} className="status-bar-item">
                <div className="status-bar-label">
                  <span className={`status-indicator status-${status.toLowerCase()}`}></span>
                  <span>{status}</span>
                  <span className="status-count">{count}</span>
                </div>
                <div className="status-bar-track">
                  <div
                    className={`status-bar-fill status-fill-${status.toLowerCase()}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        {jobStats.byStatus.FAILED > 0 && (
          <div className="dashboard-alert">
            <span className="alert-icon">⚠️</span>
            <span>
              {jobStats.byStatus.FAILED} failed job{jobStats.byStatus.FAILED > 1 ? 's' : ''} detected.{' '}
              <button className="link-button" onClick={() => navigate('/apps/ghost-abend')}>
                Analyze in Ghost ABEND
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Events Timeline</h2>
          <button className="link-button" onClick={() => navigate('/audit')}>
            View all →
          </button>
        </div>
        {latestEvents.length === 0 ? (
          <div className="empty-state">
            <p>No audit events found</p>
          </div>
        ) : (
          <div className="events-timeline">
            {latestEvents.map(event => {
              const user = users.find(u => u.id === event.userId);
              return (
                <div key={event.id} className="timeline-event">
                  <div className="event-timestamp">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                  <div className="event-details">
                    <span className="event-user">{user?.name || 'Unknown'}</span>
                    <span className="event-action">{event.action}</span>
                    <span className="event-resource">{event.resourceType}</span>
                  </div>
                  {event.details && (
                    <div className="event-description">{event.details}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
