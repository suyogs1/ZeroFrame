import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ZeroframeProvider, useZeroframe } from './core/ZeroframeContext';
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

const AppContent: React.FC = () => {
  const { hasBooted, kernelPanic } = useZeroframe();

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
          <Route index element={<Desktop />} />
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
        </Route>
      </Routes>
      <ToastContainer />
      <DemoModeOverlay />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ZeroframeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ZeroframeProvider>
  );
};

export default App;
