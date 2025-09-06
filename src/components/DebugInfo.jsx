import React, { useState, useEffect } from 'react';
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

  const [teiDebugInfo, setTeiDebugInfo] = useState({
    lastCall: null,
    lastResponse: null,
    lastError: null,
    currentTei: null
  });

  // Collapsed by default; remember user preference
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('debugInfoOpen');
      return saved ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  // Listen for TEI-related console logs to capture debug info
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog.apply(console, args);
      
      // Capture TEI API call info
      const message = args.join(' ');
      if (message.includes('🔍 Fetching Tracked Entity Instance for facility:')) {
        const facilityId = args[1];
        setTeiDebugInfo(prev => ({
          ...prev,
          lastCall: {
            facilityId,
            timestamp: new Date().toISOString(),
            endpoint: '/api/trackedEntityInstances'
          }
        }));
      }
      
      if (message.includes('📡 TEI API Response Body:')) {
        try {
          const response = args[1];
          setTeiDebugInfo(prev => ({
            ...prev,
            lastResponse: {
              data: response,
              timestamp: new Date().toISOString()
            }
          }));
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      if (message.includes('✅ Tracked Entity Instance found:')) {
        const tei = args[1];
        setTeiDebugInfo(prev => ({
          ...prev,
          currentTei: tei
        }));
      }
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      
      // Capture TEI errors
      const message = args.join(' ');
      if (message.includes('❌ Failed to fetch Tracked Entity Instance:')) {
        const error = args[1];
        setTeiDebugInfo(prev => ({
          ...prev,
          lastError: {
            message: error.message,
            timestamp: new Date().toISOString()
          }
        }));
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // Only show debug info in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="debug-info">
      <details
        open={isOpen}
        onToggle={(e) => {
          const open = e.currentTarget.open;
          setIsOpen(open);
          try { localStorage.setItem('debugInfoOpen', String(open)); } catch {}
        }}
      >
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

          <div className="debug-section">
            <h4>TEI (Tracked Entity Instance) Debug</h4>
            <p>Current TEI: {teiDebugInfo.currentTei || 'None'}</p>
            
            {teiDebugInfo.lastCall && (
              <div>
                <h5>Last API Call:</h5>
                <p>Facility ID: {teiDebugInfo.lastCall.facilityId}</p>
                <p>Endpoint: {teiDebugInfo.lastCall.endpoint}</p>
                <p>Timestamp: {new Date(teiDebugInfo.lastCall.timestamp).toLocaleString()}</p>
                <p>Full URL: {import.meta.env.VITE_DHIS2_URL}/api/{teiDebugInfo.lastCall.endpoint}?ou={teiDebugInfo.lastCall.facilityId}&program=EE8yeLVo6cN&fields=trackedEntityInstance&ouMode=DESCENDANTS</p>
              </div>
            )}
            
            {teiDebugInfo.lastResponse && (
              <div>
                <h5>Last API Response:</h5>
                <p>Timestamp: {new Date(teiDebugInfo.lastResponse.timestamp).toLocaleString()}</p>
                <details>
                  <summary>Response Data</summary>
                  <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(teiDebugInfo.lastResponse.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            {teiDebugInfo.lastError && (
              <div>
                <h5>Last Error:</h5>
                <p>Message: {teiDebugInfo.lastError.message}</p>
                <p>Timestamp: {new Date(teiDebugInfo.lastError.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
} 