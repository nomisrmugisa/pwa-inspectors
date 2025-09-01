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
        setCsvContent(`,1,2,3,4,5,6,7,8,9,10,11
,Gynae Clinics,laboratory,Psychology clinic,Eye (opthalmologyoptometry  optician) Clinics,physiotheraphy,dental clinic,ENT clinic,Rehabilitation Centre,Potrait clinic,Radiology,clinic
SECTION A-ORGANISATION AND MANAGEMENT,,,,,,,,,,,
Does the clinic have an organisational structure,?,?,?,?,?,?,?,?,?,?,?
Is the director a medically trained person?,?,?,?,?,?,?,?,?,?,?,?
SECTION B-STATUTORY REQUIREMENTS,,,,,,,,,,,
Does the facility have statutory requirements?,,,,,,,,,,,
Business registration,?,?,?,?,?,?,?,?,?,?,?
Work permits,?,?,?,?,?,?,?,?,?,?,?
Lease agreement,?,?,?,?,?,?,,?,?,?,?
Trading license,?,?,?,?,?,?,?,?,?,?,?
Permission to operate/set up,?,?,?,,,,,,,,
Occupancy certificate,?,?,?,?,?,?,?,?,?,?,?
Patient charter in English & Setswana,?,?,?,?,?,?,?,?,?,?,?
"Copies of relevant statutory instruments e.g. Public Health Act 2013, Botswana Health Professions Act,2001",?,?,?,?,?,?,?,?,?,?,?
Is there an indemnity insurance?,?,?,?,?,?,?,?,?,?,?
Have personnel been cleared by police?,?,?,?,?,?,?,?,?,?,?,?
contracts for staff,?,?,?,?,?,?,?,?,?,?,?
letter of permission to set up/operate,?,?,?,?,?,?,?,?,?,?,?
waste collection carrier licence,?,?,?,?,?,?,?,?,?,?,?
police clearance for employees,?,?,?,?,?,?,?,?,?,?,?
confidentiality clause,?,?,?,?,?,?,?,?,?,?,?
proof of change of land use,?,?,?,?,?,?,?,,,,
tax clearance certificate,?,?,?,?,?,,?,?,?,?,?
Practitioners licence,?,?,?,?,?,?,?,?,?,?,?
Fire clearance,?,?,?,?,?,?,?,?,?,?,?
work permits,?,?,?,?,?,?,?,?,?,?,?
residence permit,?,?,?,?,?,,?,?,?,?,?
contracts for staff,?,?,?,?,?,?,?,?,?,?,?
,,,,,,,,,,,
,,,,,,,,,,,
SECTION C-POLICIES AND PROCEDURES,,,,,,,,,,,
Does the clinic have policies and procedures for the following?,,,,,,,,,,,
referral systems,?,?,?,?,?,?,?,?,?,?,?
assessment of patients,?,?,?,?,?,?,?,?,?,?,?
treatment protocols,?,?,?,?,?,?,?,?,?,?,?
testing and treatment techniques,?,?,?,?,?,?,?,?,?,?,?
"high risk patients and procedures, and",?,?,?,?,?,?,?,?,?,?,?
the confidentiality of patient information,?,?,?,?,?,?,?,?,?,?,?
incident reporting,?,?,?,?,?,?,?,?,?,?,?
Induction and orientation,?,?,?,?,?,?,?,?,?,?,?
patient consent,?,?,?,?,?,?,?,?,?,?,?
Linen management,?,?,?,?,?,?,?,?,?,?,?
Equipment maintenance plan/program,?,?,?,?,?,?,?,?,?,?,?
Testing and commissioning certificates,?,?,?,?,?,?,?,?,?,?,?
Infection prevention and control,?,?,?,?,?,?,?,?,?,?,?
Management of patient records and retention times,?,?,?,?,?,?,?,?,?,?,?
Management of information ,?,?,?,?,?,?,?,?,?,?,?
Risk management ,?,?,?,?,?,?,?,?,?,?,?
Management of supplies,?,?,?,?,?,?,?,?,?,?,?
Patient observation,?,?,?,?,?,?,?,?,?,?,?
Management of medication,?,?,?,?,?,?,?,?,?,?,?
Post exposure prophylaxis,?,?,?,?,?,?,?,?,?,?,?
Complaints procedure,?,?,?,?,?,?,?,?,?,?,?
Outreach services,?,?,?,?,?,?,?,?,?,?,?
Waste management,?,?,?,?,?,?,?,?,?,?,?`);
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
              <option value="Gynae Clinics">Gynae Clinics</option>
              <option value="laboratory">Laboratory</option>
              <option value="Psychology clinic">Psychology Clinic</option>
              <option value="Eye (opthalmologyoptometry  optician) Clinics">Eye Clinics</option>
              <option value="physiotheraphy">Physiotherapy</option>
              <option value="dental clinic">Dental Clinic</option>
              <option value="ENT clinic">ENT Clinic</option>
              <option value="Rehabilitation Centre">Rehabilitation Centre</option>
              <option value="Potrait clinic">Potrait Clinic</option>
              <option value="Radiology">Radiology</option>
              <option value="clinic">General Clinic</option>
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
