import React from 'react';
import { useApp } from '../contexts/AppContext';

export function DebugInfo() {
  const { 
    isAuthenticated, 
    user, 
    configuration, 
    isOnline, 
    pendingEvents, 
    stats,
    lastSyncTime 
  } = useApp();

  // Only show debug info in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="debug-info">
      <details>
        <summary>Debug Info</summary>
        <div className="debug-content">
          <div className="debug-section">
            <h4>Authentication</h4>
            <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            {user && <p>User: {user.displayName} ({user.username})</p>}
          </div>

          <div className="debug-section">
            <h4>Configuration</h4>
            <p>Loaded: {configuration ? 'Yes' : 'No'}</p>
            {configuration && (
              <>
                <p>Program: {configuration.program?.displayName}</p>
                <p>Stage: {configuration.programStage?.displayName}</p>
                <p>Org Units: {configuration.organisationUnits?.length || 0}</p>
              </>
            )}
          </div>

          <div className="debug-section">
            <h4>Network & Sync</h4>
            <p>Online: {isOnline ? 'Yes' : 'No'}</p>
            <p>Pending Events: {pendingEvents?.length || 0}</p>
            <p>Last Sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}</p>
          </div>

          <div className="debug-section">
            <h4>Statistics</h4>
            <p>Total Events: {stats?.totalEvents || 0}</p>
            <p>Synced Events: {stats?.syncedEvents || 0}</p>
            <p>Error Events: {stats?.errorEvents || 0}</p>
          </div>
        </div>
      </details>
    </div>
  );
} 