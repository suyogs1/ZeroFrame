import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SYSTEM_APPS } from '../core/systemApps';
import { SystemApp } from '../types';
import '../styles/Desktop.css';

interface DesktopProps {
  appFilter?: (app: SystemApp) => boolean;
  primaryAppId?: string;
}

const Desktop: React.FC<DesktopProps> = ({ appFilter, primaryAppId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Filter apps if filter provided
  const visibleApps = appFilter ? SYSTEM_APPS.filter(appFilter) : SYSTEM_APPS;

  // Auto-navigate to primary app on mount (only if we're on the root path and haven't navigated yet)
  const hasNavigated = React.useRef(false);
  
  React.useEffect(() => {
    // Only auto-navigate if:
    // 1. primaryAppId is set
    // 2. We haven't navigated yet
    // 3. We're on the root path (not coming back from another page)
    // 4. There's no query param indicating user wants to stay on desktop
    const isRootPath = location.pathname === '/';
    const wantsDesktop = location.search.includes('desktop=true');
    
    if (primaryAppId && !hasNavigated.current && isRootPath && !wantsDesktop) {
      const primaryApp = SYSTEM_APPS.find(app => app.id === primaryAppId);
      if (primaryApp) {
        hasNavigated.current = true;
        // Small delay to ensure everything is mounted
        const timer = setTimeout(() => {
          navigate(primaryApp.route);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [primaryAppId, navigate, location]);

  return (
    <div className="desktop">
      <h2 className="desktop-title">System Applications</h2>
      <div className="app-grid">
        {visibleApps.map((app) => (
          <div
            key={app.id}
            className="app-card"
            onClick={() => navigate(app.route)}
          >
            <div className="app-icon">{app.icon}</div>
            <h3 className="app-name">{app.name}</h3>
            <p className="app-description">{app.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Desktop;
