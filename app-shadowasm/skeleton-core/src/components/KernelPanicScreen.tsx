// Kernel Panic Screen - Critical error display with reboot option
import React from 'react';
import { useZeroframe } from '../core/ZeroframeContext';
import '../styles/KernelPanicScreen.css';

export const KernelPanicScreen: React.FC = () => {
  const { rebootKernel } = useZeroframe();

  return (
    <div className="panic-screen">
      <div className="panic-panel">
        <div className="panic-header">
          <h1>💀 KERNEL PANIC</h1>
          <p className="panic-subtitle">Zeroframe OS has encountered a critical error</p>
        </div>
        
        <div className="panic-content">
          <div className="panic-message">
            <p>The microkernel has detected an unrecoverable error and must halt.</p>
            <p>This could be caused by:</p>
            <ul>
              <li>Invalid syscall invocation</li>
              <li>Corrupted kernel state</li>
              <li>Resource exhaustion</li>
              <li>Manual panic trigger from console</li>
            </ul>
          </div>

          <div className="panic-technical">
            <p className="panic-code">PANIC: kernel/dispatcher.c:42</p>
            <p className="panic-code">Error: Unrecoverable system state</p>
            <p className="panic-code">Halting all processes...</p>
          </div>

          <div className="panic-actions">
            <button className="panic-reboot-btn" onClick={rebootKernel}>
              🔄 Reboot OS
            </button>
            <p className="panic-hint">All unsaved state will be lost</p>
          </div>
        </div>
      </div>
    </div>
  );
};
