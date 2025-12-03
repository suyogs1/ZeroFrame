import React, { useEffect } from 'react';
import { users } from '../data/mockData';
import { useActiveUser, useAuditLog, usePermissions } from '../core/ZeroframeContext';
import '../styles/Security.css';

const Security: React.FC = () => {
  const activeUser = useActiveUser();
  const { logAuditEvent } = useAuditLog();
  const { hasPermission } = usePermissions();

  const canManageSecurity = hasPermission('MANAGE_SECURITY');

  useEffect(() => {
    logAuditEvent({
      userId: activeUser.id,
      action: 'SECURITY_CENTER_VIEWED',
      resourceType: 'SECURITY',
      details: 'Opened Security & Policies',
    });
  }, [logAuditEvent, activeUser.id]);

  const roleDescriptions = {
    DEV: 'Can submit and view their own jobs (later).',
    OPERATOR: 'Can manage jobs across workspaces (later).',
    AUDITOR: 'Can view logs and audit events (later).',
    ADMIN: 'Can change security and system-wide settings (later).',
  };

  const permissionsMatrix = [
    { action: 'Submit Job', DEV: true, OPERATOR: true, AUDITOR: false, ADMIN: true },
    { action: 'View All Jobs', DEV: false, OPERATOR: true, AUDITOR: true, ADMIN: true },
    { action: 'Cancel Job', DEV: false, OPERATOR: true, AUDITOR: false, ADMIN: true },
    { action: 'Manage Security', DEV: false, OPERATOR: false, AUDITOR: false, ADMIN: true },
    { action: 'View Audit Log', DEV: false, OPERATOR: false, AUDITOR: true, ADMIN: true },
    { action: 'Manage Datasets', DEV: false, OPERATOR: true, AUDITOR: false, ADMIN: true },
    { action: 'Access System Apps', DEV: true, OPERATOR: true, AUDITOR: true, ADMIN: true },
  ];

  return (
    <div className="security">
      <h2>Security & Policies</h2>
      
      <div className="current-user-banner">
        <p>
          <strong>Active User:</strong> {activeUser.name} ({activeUser.role})
        </p>
        {!canManageSecurity && (
          <p className="read-only-notice">
            You have read-only access to security configuration.
          </p>
        )}
      </div>
      
      <div className="security-section">
        <h3>Users</h3>
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={user.id === activeUser.id ? 'active-user' : ''}>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>{user.id === activeUser.id ? '🟢 Active' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="security-section">
        <h3>Role Descriptions</h3>
        <div className="role-descriptions">
          {Object.entries(roleDescriptions).map(([role, description]) => (
            <div key={role} className="role-card">
              <h4>{role}</h4>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="security-section">
        <h3>Permissions Matrix</h3>
        <p className="matrix-note">Permissions are enforced throughout the system based on your role.</p>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Action</th>
              <th className={activeUser.role === 'DEV' ? 'highlight-column' : ''}>DEV</th>
              <th className={activeUser.role === 'OPERATOR' ? 'highlight-column' : ''}>OPERATOR</th>
              <th className={activeUser.role === 'AUDITOR' ? 'highlight-column' : ''}>AUDITOR</th>
              <th className={activeUser.role === 'ADMIN' ? 'highlight-column' : ''}>ADMIN</th>
            </tr>
          </thead>
          <tbody>
            {permissionsMatrix.map((row, idx) => (
              <tr key={idx}>
                <td>{row.action}</td>
                <td className={`permission-cell ${activeUser.role === 'DEV' ? 'highlight-column' : ''}`}>{row.DEV ? '✓' : '—'}</td>
                <td className={`permission-cell ${activeUser.role === 'OPERATOR' ? 'highlight-column' : ''}`}>{row.OPERATOR ? '✓' : '—'}</td>
                <td className={`permission-cell ${activeUser.role === 'AUDITOR' ? 'highlight-column' : ''}`}>{row.AUDITOR ? '✓' : '—'}</td>
                <td className={`permission-cell ${activeUser.role === 'ADMIN' ? 'highlight-column' : ''}`}>{row.ADMIN ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Security;
