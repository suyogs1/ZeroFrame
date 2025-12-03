import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import '../styles/Layout.css';

const Layout: React.FC = () => {
  return (
    <div className="layout">
      <TopBar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
