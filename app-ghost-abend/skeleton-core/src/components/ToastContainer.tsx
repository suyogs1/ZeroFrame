import React from 'react';
import { useToast } from '../core/ZeroframeContext';
import '../styles/ToastContainer.css';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <div className="toast-header">
              <span className="toast-icon">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <span className="toast-title">{toast.title}</span>
              <button
                className="toast-close"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            {toast.description && (
              <div className="toast-description">{toast.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
