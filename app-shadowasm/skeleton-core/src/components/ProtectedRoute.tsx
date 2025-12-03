import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useZeroframe } from '../core/ZeroframeContext';
import type { PermissionAction } from '../core/permissions';
import '../styles/ProtectedRoute.css';

interface ProtectedRouteProps {
  requiredPermission?: PermissionAction;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPermission, children }) => {
  const { hasPermission, activeUser } = useZeroframe();
  const navigate = useNavigate();

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <div className="access-denied-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>You do not have permission to view this area.</p>
          <p className="access-denied-details">
            Your current role is <strong>{activeUser.role}</strong>.
          </p>
          <p className="access-denied-help">
            Contact an administrator if you believe this is an error.
          </p>
          <button className="btn-back" onClick={() => navigate('/')}>
            Return to Desktop
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
