import React from 'react';
import { useApp } from '../contexts/AppContext';

export function Header() {
  const { 
    isOnline, 
    logout, 
    syncEvents, 
    loading, 
    syncInProgress,
    stats,
    user,
    inspectionDate
  } = useApp();

  const handleSync = () => {
    syncEvents();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">
            🏥 Facility Inspections
          </h1>
          {user && (
            <span className="user-info">{user.displayName}</span>
          )}
        </div>
        
        <div className="header-actions">
          <div className="sync-info">
            {stats.pendingEvents > 0 && (
              <span className="pending-count">
                {stats.pendingEvents} pending
              </span>
            )}
          </div>
          
          <button 
            className="btn btn-secondary sync-btn" 
            onClick={handleSync}
            disabled={loading || syncInProgress || !isOnline || stats.pendingEvents === 0}
            title={`Sync ${stats.pendingEvents} pending inspections`}
          >
            <span className={`sync-icon ${syncInProgress ? 'spinning' : ''}`}>
              🔄
            </span>
            <span className="btn-text">
              {syncInProgress ? 'Syncing...' : 'Sync'}
            </span>
          </button>
          
          <button 
            className="btn btn-secondary logout-btn" 
            onClick={handleLogout}
            title="Logout"
          >
            🚪 Logout
          </button>
        </div>
      </div>
      
      <div className="header-status">
        <div className="connection-status">
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🌐 Online' : '📴 Offline'}
          </span>
        </div>
        <div className="header-row">
          <div className="stats-summary">
            <span className="stat-item">
              📋 {stats.totalEvents} total
            </span>
            <span className="stat-item">
              ✅ {stats.syncedEvents} synced
            </span>
            {stats.errorEvents > 0 && (
              <span className="stat-item error">
                ❌ {stats.errorEvents} errors
              </span>
            )}
          </div>
          <div className='inspect-date'>
            <span className="stat-item">
              Inspection Date: { inspectionDate }
            </span>
          </div>
        </div>
      </div>
    </header>
  );
} 