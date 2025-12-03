import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useZeroframe, useDemoMode } from '../core/ZeroframeContext';
import { users } from '../data/mockData';
import { Workspace } from '../types';
import { HACKATHON_CONFIG } from '../core/hackathonConfig';
import '../styles/TopBar.css';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { activeUser, setActiveUser, activeWorkspace, setActiveWorkspace, orgs, activeOrg, setActiveOrg } = useZeroframe();
  const { demoState, enableDemoMode } = useDemoMode();

  const workspaces: Workspace[] = ['DEV', 'UAT', 'PROD'];

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <h1 
          className="app-title" 
          onClick={() => navigate('/?desktop=true')}
          style={{ cursor: 'pointer' }}
          title="Back to Desktop"
        >
          Zeroframe OS
          <span className="kiroween-badge">{HACKATHON_CONFIG.name}</span>
        </h1>
      </div>
      <div className="top-bar-right">
        {!demoState.enabled && (
          <button
            className="demo-mode-btn"
            onClick={enableDemoMode}
            title="Start guided demo"
          >
            🎬 Demo Mode
          </button>
        )}
        <div className="selector">
          <label>Organization:</label>
          <select
            value={activeOrg.id}
            onChange={(e) => setActiveOrg(e.target.value)}
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div className="selector">
          <label>Workspace:</label>
          <select
            value={activeWorkspace}
            onChange={(e) => setActiveWorkspace(e.target.value as Workspace)}
          >
            {workspaces.map((ws) => (
              <option key={ws} value={ws}>
                {ws}
              </option>
            ))}
          </select>
        </div>
        <div className="selector">
          <label>User:</label>
          <select
            value={activeUser.id}
            onChange={(e) => setActiveUser(e.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <span className="role-badge">{activeUser.role}</span>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
