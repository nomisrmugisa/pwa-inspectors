import React, { useEffect } from 'react';
import { useCSVConfig } from '../hooks/useCSVConfig';
import './CSVDemoPage.css';

/**
 * DHIS2 Program Stage Data Viewer
 * Shows ALL sections and Data Elements directly from DHIS2 API (no CSV filtering)
 */
export function CSVDemoPage() {
  const {
    // DHIS2 integration functions
    loadDHIS2Data,
    refreshDHIS2Data,
    dhis2DataElements,
    dhis2Loading,
    dhis2Error
  } = useCSVConfig();

  // Load DHIS2 data on component mount
  useEffect(() => {
    console.log('🔄 CSVDemoPage: Loading DHIS2 data...');
    loadDHIS2Data();
  }, [loadDHIS2Data]);

  return (
    <div className="csv-demo-page">
      <div className="page-header">
        <h1>🏥 DHIS2 Program Stage Data Viewer</h1>
        <p>
          <strong>DISABLED CSV FILTERING</strong> - Showing ALL sections and Data Elements directly from DHIS2 API
        </p>
        
        {/* Quick Status Summary */}
        <div className="status-summary">
          <div className="status-badge dhis2-status-badge">
            <span className="status-icon">🏥</span>
            <span className="status-text">
              DHIS2: {dhis2DataElements.length > 0 ? '✅ Connected' : dhis2Loading ? '🔄 Loading...' : '⚠️ Loading...'}
            </span>
          </div>
          <div className="status-badge data-status">
            <span className="status-icon">📊</span>
            <span className="status-text">
              Data: {dhis2DataElements.length > 0 ? `${dhis2DataElements.length} Elements` : '⏳ Loading...'}
            </span>
          </div>
          <div className="status-badge api-status">
            <span className="status-icon">🔗</span>
            <span className="status-text">
              API: {dhis2Loading ? '🔄 Fetching...' : '✅ Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* DHIS2 Connection Status */}
      <div className="dhis2-status">
        <h3>🏥 DHIS2 Connection Status</h3>
        <div className="dhis2-status-grid">
          <div className="status-item">
            <span className="status-label">Connection:</span>
            <span className={`status-value ${dhis2DataElements.length > 0 ? 'success' : 'warning'}`}>
              {dhis2DataElements.length > 0 ? '✅ Connected' : '⚠️ Loading...'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Data Source:</span>
            <span className="status-value">
              {dhis2DataElements.length > 0 ? 'Real DHIS2' : 'Loading...'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Elements Loaded:</span>
            <span className="status-value">
              {dhis2DataElements.length > 0 ? dhis2DataElements.length : '0'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">API Status:</span>
            <span className="status-value">
              {dhis2Loading ? '🔄 Fetching...' : '✅ Ready'}
            </span>
          </div>
        </div>
        
        {dhis2Error && (
          <div className="dhis2-error">
            <p>⚠️ DHIS2 Error: {dhis2Error}</p>
            <button onClick={refreshDHIS2Data} className="retry-button">
              🔄 Retry DHIS2 Connection
            </button>
          </div>
        )}
        
        {dhis2Loading && (
          <div className="dhis2-loading">
            <div className="spinner"></div>
            <p>🔄 Loading DHIS2 Data Elements...</p>
          </div>
        )}
        
        {dhis2DataElements.length === 0 && !dhis2Loading && !dhis2Error && (
          <div className="dhis2-info">
            <p>ℹ️ No DHIS2 connection configured. Using mock data for demonstration.</p>
            <p>To connect to DHIS2, ensure your Vite proxy is configured and DHIS2 is accessible.</p>
            <button onClick={loadDHIS2Data} className="connect-button">
              🔗 Try Connect to DHIS2
            </button>
          </div>
        )}
        
        {/* Always show refresh button when connected */}
        {dhis2DataElements.length > 0 && (
          <div className="dhis2-actions">
            <button onClick={refreshDHIS2Data} className="refresh-button">
              🔄 Refresh DHIS2 Data
            </button>
            <p className="dhis2-actions-help">
              Click to refresh Data Elements from DHIS2 (useful if data has changed)
            </p>
          </div>
        )}
      </div>

      {/* DHIS2 Raw Data Viewer (No CSV Filtering) */}
      {dhis2DataElements.length > 0 && (
        <div className="dhis2-raw-data">
          <h3>📊 Raw DHIS2 Data Elements (No CSV Filtering)</h3>
          <p className="raw-data-description">
            Showing ALL Data Elements returned directly from DHIS2 API endpoint: <code>/api/programStages/Eupjm3J0dt2</code>
          </p>
          
          <div className="data-elements-grid">
            {dhis2DataElements.map((element, index) => (
              <div key={element.id || index} className="data-element-card">
                <div className="element-header">
                  <span className="element-id">{element.id}</span>
                  <span className={`element-type ${element.valueType?.toLowerCase()}`}>
                    {element.valueType || 'UNKNOWN'}
                  </span>
                </div>
                <div className="element-name">{element.displayName || element.name || 'Unnamed Element'}</div>
                <div className="element-details">
                  <span className="detail-item">
                    <strong>Short Name:</strong> {element.shortName || 'N/A'}
                  </span>
                  <span className="detail-item">
                    <strong>Compulsory:</strong> {element.compulsory ? 'Yes' : 'No'}
                  </span>
                  {element.sectionName && (
                    <span className="detail-item">
                      <strong>Section:</strong> {element.sectionName}
                    </span>
                  )}
                  {element.optionSet && (
                    <span className="detail-item">
                      <strong>Option Set:</strong> {element.optionSet.displayName || element.optionSet.id}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISABLED: CSV Filtering - Now showing raw DHIS2 data only */}
    </div>
  );
}
