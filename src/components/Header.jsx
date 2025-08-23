import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useLocation, Link } from 'react-router-dom';

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

  const { pathname } = useLocation();

  const handleSync = () => {
    syncEvents();
  };

  const handleLogout = () => {
    logout();
  };

  // Inline styles to ensure white text
  const whiteTextStyle = { color: '#ffffff', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' };
  const buttonTextStyle = { color: '#ffffff' };
 
  return (
    <header className="app-header" style={{ color: '#ffffff' }}>
      <div className="header-content" style={{ color: '#ffffff' }}>
        <div className="header-left" style={{ color: '#ffffff' }}>
          <div className="moh-logo-section" style={{ color: '#ffffff' }}>
            <div className="moh-logo" style={{ color: '#ffffff' }}>
              <div className="logo-text" style={{ color: '#ffffff' }}>
                <h1 className="moh-title" style={whiteTextStyle}>REPUBLIC OF BOTSWANA</h1>
                <h2 className="ministry-title" style={whiteTextStyle}>Ministry of Health</h2>
                <h3 className="app-subtitle" style={whiteTextStyle}>Facility Inspections</h3>
              </div>
            </div>
          </div>
          {user && (
            <span className="user-info" style={{ color: '#ffffff' }}>{user.displayName}</span>
          )}
        </div>
        
        <div className="header-actions" style={{ color: '#ffffff' }}>
          <div className="nav-links" style={{ color: '#ffffff' }}>
            <Link to="/form" className="nav-link" style={{ color: '#ffffff', textDecoration: 'none', marginRight: '20px' }}>
              📋 Inspections
            </Link>
            <Link to="/csv-demo" className="nav-link" style={{ color: '#ffffff', textDecoration: 'none', marginRight: '20px' }}>
              🔧 CSV Demo
            </Link>
          </div>
          
          <div className="sync-info" style={{ color: '#ffffff' }}>
            {stats.pendingEvents > 0 && (
              <span className="pending-count" style={{ color: '#ffffff' }}>
                {stats.pendingEvents} pending
              </span>
            )}
          </div>
          
          <button 
            className="btn btn-secondary sync-btn" 
            onClick={handleSync}
            disabled={loading || syncInProgress || !isOnline || stats.pendingEvents === 0}
            title={`Sync ${stats.pendingEvents} pending inspections`}
            style={{ color: '#ffffff' }}
          >
            <span className={`sync-icon ${syncInProgress ? 'spinning' : ''}`} style={{ color: '#ffffff' }}>
              🔄
            </span>
            <span className="btn-text" style={{ color: '#ffffff' }}>
              {syncInProgress ? 'Syncing...' : 'Sync'}
            </span>
          </button>
          
          <button 
            className="btn btn-secondary logout-btn" 
            onClick={handleLogout}
            title="Logout"
            style={{ color: '#ffffff' }}
          >
            <span style={{ color: '#ffffff' }}>🚪</span>
            <span style={{ color: '#ffffff' }}> Logout</span>
          </button>
        </div>
      </div>
      
      <div className="header-status" style={{ color: '#ffffff' }}>
        <div className="connection-status" style={{ color: '#ffffff' }}>
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`} style={{ color: '#ffffff' }}>
            {isOnline ? '🌐 Online' : '📴 Offline'}
          </span>
        </div>
        <div className="header-row" style={{ color: '#ffffff' }}>
          <div className="stats-summary" style={{ color: '#ffffff' }}>
            <span className="stat-item" style={{ color: '#ffffff' }}>
              📋 {stats.totalEvents} total
            </span>
            <span className="stat-item" style={{ color: '#ffffff' }}>
              ✅ {stats.syncedEvents} synced
            </span>
            {stats.errorEvents > 0 && (
              <span className="stat-item error" style={{ color: '#ffffff' }}>
                ❌ {stats.errorEvents} errors
              </span>
            )}
          </div>
          {pathname?.startsWith("/form") && (
          <div className='inspect-date' style={{ color: '#ffffff' }}>
            <span className="stat-item" style={{ color: '#ffffff' }}>
              Inspection Date: { inspectionDate }
            </span>
          </div>
          )}
        </div>
      </div>
    </header>
  );
} 