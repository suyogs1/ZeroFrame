// Boot Screen - OS boot sequence with animated logs
import React, { useState, useEffect } from 'react';
import { useZeroframe } from '../core/ZeroframeContext';
import '../styles/BootScreen.css';

const BOOT_LOGS = [
  '[ OK ] Initializing Zeroframe microkernel...',
  '[ OK ] Loading syscall dispatcher...',
  '[ OK ] Mounting workspaces DEV/UAT/PROD...',
  '[ OK ] Initializing Virtual File System...',
  '[ OK ] Starting Worker Daemon...',
  '[ OK ] Starting Ghost ABEND Service...',
  '[ OK ] Starting ShadowASM Service...',
  '[ OK ] Starting Command Console...',
  '[ OK ] Loading system apps...',
  '[ OK ] Initializing audit subsystem...',
  '[ READY ] Zeroframe OS Kiroween Edition',
];

export const BootScreen: React.FC = () => {
  const { completeBoot } = useZeroframe();
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < BOOT_LOGS.length) {
        setVisibleLogs(prev => [...prev, BOOT_LOGS[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          completeBoot();
        }, 500);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [completeBoot]);

  return (
    <div className="boot-screen">
      <div className="boot-panel">
        <div className="boot-header">
          <h1>🎃 ZEROFRAME OS</h1>
          <p className="boot-subtitle">Kiroween Edition - Microkernel Architecture</p>
        </div>
        <div className="boot-logs">
          {visibleLogs.map((log, i) => (
            <div key={i} className="boot-log-line">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
