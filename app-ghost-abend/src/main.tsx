import React from 'react';
import ReactDOM from 'react-dom/client';
import { ZeroframeProvider } from '@skeleton-core';
import { BrowserRouter } from 'react-router-dom';
import GhostAbendApp from './App';
import '@skeleton-core/styles/theme.css';
import '@skeleton-core/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ZeroframeProvider>
      <BrowserRouter>
        <GhostAbendApp />
      </BrowserRouter>
    </ZeroframeProvider>
  </React.StrictMode>
);
