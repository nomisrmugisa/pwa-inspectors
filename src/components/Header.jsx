import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLocation, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Header.css';

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
  
  // State to track if header is collapsed, initialized from localStorage if available
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Always default to collapsed on initial load.
    // The localStorage will still be used to persist the state if the user toggles it during the session.
    return true;
  });
  
  // Function to toggle header collapse state
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    console.log('Toggle collapse:', { current: isCollapsed, new: newState });
    setIsCollapsed(newState);
    // Save state to localStorage
    localStorage.setItem('headerCollapsed', newState.toString());
  };

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
    <header className={`app-header ${isCollapsed ? 'collapsed' : ''}`} style={{ color: '#ffffff' }}>
      <div className="header-content" style={{ color: '#ffffff' }}>
        {/* Logo and Collapse/Expand Button */}
        <div className="header-left-controls">
          <img 
            src={logo} 
            alt="Ministry of Health Logo" 
            className="header-logo"
            style={{ 
              height: '40px', 
              width: 'auto', 
              marginRight: '12px',
              objectFit: 'contain'
            }}
          />
          <div className="collapse-button-container">
            <button 
              className="btn btn-secondary collapse-btn" 
              onClick={toggleCollapse}
              title={isCollapsed ? "Expand header" : "Collapse header"}
              style={{ color: '#ffffff' }}
            >
              <span style={{ color: '#ffffff' }}>
                {isCollapsed ? '🔽' : '🔼'}
              </span>
            </button>
          </div>
        </div>
        
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

            <Link to="/home" className="nav-link" style={{ color: '#ffffff', textDecoration: 'none', marginRight: '20px' }}>
              📊 Dashboard
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
