import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export function Toast({ message, type = 'info', duration = 4000 }) {
  const { hideToast } = useApp();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, hideToast]);

  const getToastClass = () => {
    const baseClass = 'toast';
    switch (type) {
      case 'success':
        return `${baseClass} toast-success`;
      case 'error':
        return `${baseClass} toast-error`;
      case 'warning':
        return `${baseClass} toast-warning`;
      default:
        return `${baseClass} toast-info`;
    }
  };

  return (
    <div className={getToastClass()}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button 
          className="toast-close" 
          onClick={hideToast}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
} 