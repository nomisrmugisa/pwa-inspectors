import React, { useEffect, useState } from 'react';
import { useCSVConfig } from '../hooks/useCSVConfig';
import { DynamicFormRenderer } from '../components/DynamicFormRenderer';
import './CSVDemoPage.css';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import BarChartIcon from '@mui/icons-material/BarChart';
import LoadingIcon from '@mui/icons-material/HourglassEmpty';

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

  const [csvContent, setCsvContent] = useState('');
  const [selectedFacilityType, setSelectedFacilityType] = useState('');

  // Load DHIS2 data on component mount
  useEffect(() => {
    console.log('🔄 CSVDemoPage: Loading DHIS2 data...');
    loadDHIS2Data();

    // Load CSV content
    fetch('/checklist for facilities.csv')
      .then(response => response.text())
      .then(content => {
        setCsvContent(content);
        console.log('📄 CSV content loaded:', content.length, 'characters');
      })
      .catch(error => {
        console.error('❌ Failed to load CSV:', error);
        // Fallback to hardcoded CSV content
        const FALLBACK_CSV = `Section,Obstetrics & Gynaecology,Laboratory,Psychology,Eye (Opthalmology /Optometry),Physiotherapy,Dental,Dental Laboratory,Ear Nose & Throat,Rehabilitation Centre,Radiology,General Practice,Paediatric,Nursing  Home,Emergency Medical Services
SECTION A-ORGANISATION AND MANAGEMENT,?,?,?,?,?,?,?,?,?,?,?,?,?,?
Does the clinic have an organisational structure,?,?,?,?,?,?,?,?,?,?,?,?,?,?
Is the director a medically trained person,?,?,?,?,?,?,?,?,?,?,?,?,?,?
SECTION B-STATUTORY REQUIREMENTS,?,?,?,?,?,?,?,?,?,?,?,?,?,?
Does the facility have statutory requirements,?,?,?,?,?,?,?,?,?,?,?,?,?,?
Business registration,?,?,?,?,?,?,?,?,?,?,?,?,?,?
Work permits,?,?,?,?,?,?,?,?,?,?,?,?,?,?
Lease agreement,?,?,?,?,?,?,?,?,?,?,?,?,?,?
Fire clearance,?,?,?,?,?,?,?,?,?,?,?,?,?,?
work permits,?,?,?,?,?,?,?,?,?,?,?,?,?,?
contracts for staff,?,?,?,?,?,?,?,?,?,?,?,?,?,?`;
        setCsvContent(FALLBACK_CSV);
      });
  }, [loadDHIS2Data]);

  return (
    <div className="csv-demo-page">
      <div className="page-header">
        <h1>DHIS2 Program Stage Data Viewer</h1>
        <p>
          <strong>DISABLED CSV FILTERING</strong> - Showing ALL sections and Data Elements directly from DHIS2 API
        </p>

        {/* Quick Status Summary */}
        <div className="status-summary">
          <div className="status-badge dhis2-status-badge">
            <span className="status-icon">
              <InfoIcon style={{ fontSize: '20px' }} />
            </span>
            <span className="status-text">
              DHIS2: {dhis2DataElements.length > 0 ? (
                <>
                  <CheckCircleIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Connected
                </>
              ) : dhis2Loading ? (
                <>
                  <LoadingIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Loading...
                </>
              ) : (
                <>
                  <WarningIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Loading...
                </>
              )}
            </span>
          </div>
          <div className="status-badge data-status">
            <span className="status-icon">
              <BarChartIcon style={{ fontSize: '20px' }} />
            </span>
            <span className="status-text">
              Data: {dhis2DataElements.length > 0 ? `${dhis2DataElements.length} Elements` : (
                <>
                  <LoadingIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Loading...
                </>
              )}
            </span>
          </div>
          <div className="status-badge api-status">
            <span className="status-icon">
              <LinkIcon style={{ fontSize: '20px' }} />
            </span>
            <span className="status-text">
              API: {dhis2Loading ? (
                <>
                  <LoadingIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Fetching...
                </>
              ) : (
                <>
                  <CheckCircleIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Ready
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* DHIS2 Connection Status */}
      <div className="dhis2-status">
        <h3>DHIS2 Connection Status</h3>
        <div className="dhis2-status-grid">
          <div className="status-item">
            <span className="status-label">Connection:</span>
            <span className={`status-value ${dhis2DataElements.length > 0 ? 'success' : 'warning'}`}>
              {dhis2DataElements.length > 0 ? (
                <>
                  <CheckCircleIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Connected
                </>
              ) : (
                <>
                  <WarningIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Loading...
                </>
              )}
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
              {dhis2Loading ? (
                <>
                  <LoadingIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Fetching...
                </>
              ) : (
                <>
                  <CheckCircleIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Ready
                </>
              )}
            </span>
          </div>
        </div>

        {dhis2Error && (
          <div className="dhis2-error">
            <p>
              <WarningIcon style={{ fontSize: '16px', marginRight: '4px' }} />
              DHIS2 Error: {dhis2Error}
            </p>
            <button onClick={refreshDHIS2Data} className="retry-button">
              <RefreshIcon style={{ fontSize: '16px', marginRight: '4px' }} />
              Retry DHIS2 Connection
            </button>
          </div>
        )}

        {dhis2Loading && (
          <div className="dhis2-loading">
            <div className="spinner"></div>
            <p>
              <LoadingIcon style={{ fontSize: '16px', marginRight: '4px' }} />
              Loading DHIS2 Data Elements...
            </p>
          </div>
        )}

        {dhis2DataElements.length === 0 && !dhis2Loading && !dhis2Error && (
          <div className="dhis2-info">
            <p>
              <InfoIcon style={{ fontSize: '16px', marginRight: '4px' }} />
              No DHIS2 connection configured. Using mock data for demonstration.
            </p>
            <p>To connect to DHIS2, ensure your Vite proxy is configured and DHIS2 is accessible.</p>
            <button onClick={loadDHIS2Data} className="connect-button">
              <LinkIcon style={{ fontSize: '16px', marginRight: '4px' }} />
              Try Connect to DHIS2
            </button>
          </div>
        )}

        {/* Always show refresh button when connected */}
        {dhis2DataElements.length > 0 && (
          <div className="dhis2-actions">
            <button onClick={refreshDHIS2Data} className="refresh-button">
              <RefreshIcon style={{ fontSize: '16px', marginRight: '4px' }} />
              Refresh DHIS2 Data
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
          <h3>
            <BarChartIcon style={{ marginRight: '8px', fontSize: '24px', verticalAlign: 'middle' }} />
            Raw DHIS2 Data Elements (No CSV Filtering)
          </h3>
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

      {/* CSV Form Demo */}
      {csvContent && (
        <div className="csv-form-demo">
          <h3>📄 CSV Form Demo</h3>
          <p>
            This section demonstrates the DynamicFormRenderer with a CSV configuration.
            It will render a form based on the structure of the CSV file.
          </p>

          {/* Facility Type Selector */}
          <div className="facility-type-selector">
            <label htmlFor="facilityType">Select Facility Type:</label>
            <select
              id="facilityType"
              value={selectedFacilityType}
              onChange={(e) => setSelectedFacilityType(e.target.value)}
            >
              <option value="">Choose a facility type...</option>
              <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Psychology">Psychology</option>
              <option value="Eye (Opthalmology /Optometry)">Eye Clinics</option>
              <option value="Physiotherapy">Physiotherapy</option>
              <option value="Dental">Dental Clinic</option>
              <option value="Dental Laboratory">Dental Laboratory</option>
              <option value="Ear, Nose & Throat">Ear, Nose & Throat</option>
              <option value="Rehabilitation Centre">Rehabilitation Centre</option>
              <option value="Radiology">Radiology</option>
              <option value="General Practice">General Practice</option>
              <option value="Paediatric">Paediatric</option>
              <option value="Nursing  Home">Nursing Home</option>
              <option value="Emergency Medical Services">Emergency Medical Services</option>
              <option value="Hospital">Hospital</option>
            </select>
          </div>

          {selectedFacilityType && (
            <DynamicFormRenderer
              csvContent={csvContent}
              facilityType={selectedFacilityType}
              dhis2DataElements={dhis2DataElements}
              showDebugPanel={true}
            />
          )}
        </div>
      )}

      {/* DISABLED: CSV Filtering - Now showing raw DHIS2 data only */}
    </div>
  );
}
