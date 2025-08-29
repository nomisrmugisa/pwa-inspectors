import React, { useState } from 'react';
import { Navbar, Container, Nav, Button, Badge, Collapse } from 'react-bootstrap';
import { useApp } from '../contexts/AppContext';
import { useLocation, Link } from 'react-router-dom';
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
    const savedState = localStorage.getItem('headerCollapsed');
    return savedState === 'true';
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

  return (
    <Navbar bg="primary" variant="dark" expand="lg" expanded={!isCollapsed} onToggle={toggleCollapse}>
      <Container fluid>
        <Navbar.Brand>
          <div className="moh-logo-section">
            <div className="moh-logo">
              <div className="logo-text">
                <h1 className="moh-title">REPUBLIC OF BOTSWANA</h1>
                <h2 className="ministry-title">Ministry of Health</h2>
                <h3 className="app-subtitle">Facility Inspections</h3>
              </div>
            </div>
          </div>
          {user && (
            <span className="ms-3 text-white">{user.displayName}</span>
          )}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/form">📋 Inspections</Nav.Link>
            <Nav.Link as={Link} to="/csv-demo">🔧 CSV Demo</Nav.Link>
          </Nav>
          <Nav>
            {stats.pendingEvents > 0 && (
              <Badge bg="warning" text="dark" className="align-self-center me-2">
                {stats.pendingEvents} pending
              </Badge>
            )}
            <Button
              variant="light"
              onClick={handleSync}
              disabled={loading || syncInProgress || !isOnline || stats.pendingEvents === 0}
              className="me-2"
            >
              <span className={`sync-icon ${syncInProgress ? 'spinning' : ''}`}>🔄</span>
              <span className="ms-2">{syncInProgress ? 'Syncing...' : 'Sync'}</span>
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              <span>🚪</span>
              <span className="ms-2">Logout</span>
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
      <Collapse in={!isCollapsed}>
        <div className="navbar-collapse">
          <Container fluid className="py-2 bg-dark text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Badge bg={isOnline ? "success" : "danger"} className="me-2">
                  {isOnline ? '🌐 Online' : '📴 Offline'}
                </Badge>
                <Badge bg="info" className="me-1">📋 {stats.totalEvents} total</Badge>
                <Badge bg="success" className="me-1">✅ {stats.syncedEvents} synced</Badge>
                {stats.errorEvents > 0 && (
                  <Badge bg="danger" className="me-1">❌ {stats.errorEvents} errors</Badge>
                )}
              </div>
              {pathname?.startsWith("/form") && (
                <Badge bg="secondary">Inspection Date: {inspectionDate}</Badge>
              )}
            </div>
          </Container>
        </div>
      </Collapse>
    </Navbar>
  );
} 