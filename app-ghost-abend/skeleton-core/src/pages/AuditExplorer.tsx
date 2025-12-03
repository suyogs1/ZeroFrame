import React, { useState, useMemo, useEffect } from 'react';
import { users } from '../data/mockData';
import { useActiveUser, useAuditLog } from '../core/ZeroframeContext';
import '../styles/AuditExplorer.css';

type ResourceTypeFilter = 'JOB' | 'DATASET' | 'SECURITY' | 'SYSTEM_APP' | '';
type DateRangeFilter = 'last24h' | 'last7days' | 'all';

const AuditExplorer: React.FC = () => {
  const user = useActiveUser();
  const { auditEvents, logAuditEvent } = useAuditLog();
  const [userFilter, setUserFilter] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceTypeFilter>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');

  useEffect(() => {
    logAuditEvent({
      userId: user.id,
      action: 'AUDIT_EXPLORER_VIEWED',
      resourceType: 'SYSTEM_APP',
      resourceId: 'audit',
      details: 'Opened Telemetry & Audit Explorer',
    });
  }, [logAuditEvent, user.id]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return auditEvents.filter((event) => {
      if (userFilter && event.userId !== userFilter) return false;
      if (resourceTypeFilter && event.resourceType !== resourceTypeFilter) return false;
      
      if (dateRangeFilter !== 'all') {
        const eventDate = new Date(event.timestamp);
        const hoursDiff = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
        
        if (dateRangeFilter === 'last24h' && hoursDiff > 24) return false;
        if (dateRangeFilter === 'last7days' && hoursDiff > 168) return false;
      }
      
      return true;
    });
  }, [userFilter, resourceTypeFilter, dateRangeFilter]);

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || 'Unknown';
  };

  const summary = useMemo(() => {
    const distinctUsers = new Set(filteredEvents.map((e) => e.userId)).size;
    const actionCounts: Record<string, number> = {};
    
    filteredEvents.forEach((event) => {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    });
    
    const mostCommonAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalEvents: filteredEvents.length,
      distinctUsers,
      mostCommonAction: mostCommonAction ? `${mostCommonAction[0]} (${mostCommonAction[1]})` : 'N/A',
    };
  }, [filteredEvents]);

  return (
    <div className="audit-explorer">
      <h2>Telemetry & Audit Explorer</h2>
      
      <div className="summary-bar">
        <div className="summary-item">
          <span className="summary-label">Total Events:</span>
          <span className="summary-value">{summary.totalEvents}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Distinct Users:</span>
          <span className="summary-value">{summary.distinctUsers}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Most Common Action:</span>
          <span className="summary-value">{summary.mostCommonAction}</span>
        </div>
      </div>
      
      <div className="filter-bar">
        <div className="filter-group">
          <label>User:</label>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">All</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Resource Type:</label>
          <select value={resourceTypeFilter} onChange={(e) => setResourceTypeFilter(e.target.value as ResourceTypeFilter)}>
            <option value="">All</option>
            <option value="JOB">JOB</option>
            <option value="DATASET">DATASET</option>
            <option value="SECURITY">SECURITY</option>
            <option value="SYSTEM_APP">SYSTEM_APP</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date Range:</label>
          <select value={dateRangeFilter} onChange={(e) => setDateRangeFilter(e.target.value as DateRangeFilter)}>
            <option value="last24h">Last 24 hours</option>
            <option value="last7days">Last 7 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource Type</th>
              <th>Resource ID</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
                <td>{getUserName(event.userId)}</td>
                <td>{event.action}</td>
                <td>{event.resourceType}</td>
                <td>{event.resourceId || '—'}</td>
                <td>{event.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditExplorer;
