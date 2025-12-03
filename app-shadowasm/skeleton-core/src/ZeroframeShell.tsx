import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useZeroframe } from './core/ZeroframeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import { DemoModeOverlay } from './components/DemoModeOverlay';
import { BootScreen } from './components/BootScreen';
import { KernelPanicScreen } from './components/KernelPanicScreen';
import Desktop from './pages/Desktop';
import { DashboardPage } from './pages/DashboardPage';
import DocsPage from './pages/DocsPage';
import JobCenter from './pages/JobCenter';
import DatasetExplorer from './pages/DatasetExplorer';
import Security from './pages/Security';
import AuditExplorer from './pages/AuditExplorer';
import GhostAbend from './pages/GhostAbend';
import ShadowASM from './pages/ShadowASM';
import Console from './pages/Console';
import ProcessManager from './pages/ProcessManager';
import DataOnboarding from './pages/DataOnboarding';
import { SystemApp } from './types';

export interface ZeroframeShellProps {
  /** Optional title for the window/document */
  title?: string;
  /** Optional filter to hide certain system apps */
  appFilter?: (app: SystemApp) => boolean;
  /** Optional primary app to focus on */
  primaryAppId?: string;
  /** Optional custom routes to add */
  customRoutes?: React.ReactNode;
}

const ShellContent: React.FC<ZeroframeShellProps> = ({ 
  title = 'Zeroframe OS',
  appFilter,
  primaryAppId,
  customRoutes
}) => {
  const { hasBooted, kernelPanic } = useZeroframe();

  // Update document title
  React.useEffect(() => {
    document.title = title;
  }, [title]);

  // Show kernel panic screen if panic occurred
  if (kernelPanic) {
    return <KernelPanicScreen />;
  }

  // Show boot screen if not yet booted
  if (!hasBooted) {
    return <BootScreen />;
  }

  // Normal app rendering after boot
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Desktop appFilter={appFilter} primaryAppId={primaryAppId} />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="jobs" element={
            <ProtectedRoute requiredPermission="VIEW_JOBS">
              <JobCenter />
            </ProtectedRoute>
          } />
          <Route path="datasets" element={
            <ProtectedRoute requiredPermission="VIEW_DATASETS">
              <DatasetExplorer />
            </ProtectedRoute>
          } />
          <Route path="security" element={
            <ProtectedRoute requiredPermission="VIEW_SECURITY">
              <Security />
            </ProtectedRoute>
          } />
          <Route path="audit" element={
            <ProtectedRoute requiredPermission="VIEW_AUDIT">
              <AuditExplorer />
            </ProtectedRoute>
          } />
          <Route path="apps/ghost-abend" element={<GhostAbend />} />
          <Route path="apps/shadowasm" element={<ShadowASM />} />
          <Route path="apps/console" element={<Console />} />
          <Route path="apps/processes" element={<ProcessManager />} />
          <Route path="data-onboarding" element={<DataOnboarding />} />
          {customRoutes}
        </Route>
      </Routes>
      <ToastContainer />
      <DemoModeOverlay />
    </>
  );
};

/**
 * ZeroframeShell - The reusable OS shell component
 * 
 * This component provides the complete Zeroframe OS experience
 * and can be customized per-app with filters and primary app focus.
 */
export const ZeroframeShell: React.FC<ZeroframeShellProps> = (props) => {
  return <ShellContent {...props} />;
};

export default ZeroframeShell;
