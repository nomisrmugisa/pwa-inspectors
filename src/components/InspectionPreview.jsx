import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import './InspectionPreview.css';

export function InspectionPreview({ event, onClose }) {
  const { configuration, userAssignments } = useApp();
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (event && configuration) {
      generatePreviewData();
    }
  }, [event, configuration]);

  const generatePreviewData = () => {
    setLoading(true);
    
    try {
      // Get facility information
      const facility = userAssignments?.find(a => a.facility.id === event.orgUnit);
      const facilityName = facility?.facility.displayName || facility?.facility.name || 'Unknown Facility';
      
      // Group data values by sections
      const sectionData = {};
      const dataValueMap = {};
      
      // Create a map of data values for quick lookup
      if (event.dataValues) {
        event.dataValues.forEach(dv => {
          dataValueMap[dv.dataElement] = dv.value;
        });
      }

      // Process sections from configuration
      if (configuration.programStage?.sections) {
        configuration.programStage.sections.forEach(section => {
          const sectionName = section.displayName || section.name;
          const sectionFields = [];
          
          if (section.dataElements) {
            section.dataElements.forEach(psde => {
              const dataElementId = psde.dataElement.id;
              const value = dataValueMap[dataElementId];
              
              if (value !== undefined && value !== null && value.toString().trim() !== '') {
                sectionFields.push({
                  id: dataElementId,
                  name: psde.dataElement.displayName || psde.dataElement.displayFormName,
                  value: formatValue(value, psde.dataElement.valueType, psde.dataElement.optionSet),
                  valueType: psde.dataElement.valueType,
                  rawValue: value
                });
              }
            });
          }
          
          if (sectionFields.length > 0) {
            sectionData[sectionName] = {
              name: sectionName,
              fields: sectionFields,
              fieldCount: sectionFields.length
            };
          }
        });
      }

      // Set the first section with data as active
      const sectionsWithData = Object.keys(sectionData);
      if (sectionsWithData.length > 0 && !activeSection) {
        setActiveSection(sectionsWithData[0]);
      }

      setPreviewData({
        event: {
          id: event.event,
          date: event.eventDate,
          status: event.status || event.syncStatus,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt
        },
        facility: {
          name: facilityName,
          id: event.orgUnit,
          type: facility?.assignment?.type || 'Unknown'
        },
        sections: sectionData,
        totalFields: Object.values(sectionData).reduce((sum, section) => sum + section.fieldCount, 0),
        sectionsWithData: sectionsWithData.length
      });
      
    } catch (error) {
      console.error('Error generating preview data:', error);
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value, valueType, optionSet) => {
    if (!value) return 'No data';
    
    try {
      switch (valueType) {
        case 'BOOLEAN':
        case 'TRUE_ONLY':
          return value === 'true' || value === true ? 'Yes' : 'No';
          
        case 'DATE':
          return new Date(value).toLocaleDateString();
          
        case 'DATETIME':
          return new Date(value).toLocaleString();
          
        case 'PERCENTAGE':
          return `${value}%`;
          
        case 'INTEGER':
        case 'INTEGER_POSITIVE':
        case 'INTEGER_NEGATIVE':
        case 'INTEGER_ZERO_OR_POSITIVE':
        case 'NUMBER':
          return Number(value).toLocaleString();
          
        default:
          // Handle JSON arrays (like facility service departments)
          if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                return parsed.length > 0 ? parsed.join(', ') : 'None selected';
              }
              return JSON.stringify(parsed, null, 2);
            } catch (e) {
              return value;
            }
          }
          
          // Handle option sets
          if (optionSet && optionSet.options) {
            const option = optionSet.options.find(opt => opt.code === value || opt.id === value);
            return option ? option.displayName : value;
          }
          
          return value;
      }
    } catch (error) {
      console.error('Error formatting value:', error);
      return value;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'synced':
        return '#28a745';
      case 'SCHEDULE':
      case 'draft':
        return '#ffc107';
      case 'error':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'synced':
        return 'Synced';
      case 'SCHEDULE':
        return 'Draft';
      case 'draft':
        return 'Draft';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="inspection-preview-overlay">
        <div className="inspection-preview-modal">
          <div className="preview-loading">
            <div className="spinner"></div>
            <p>Generating inspection preview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!previewData || Object.keys(previewData.sections).length === 0) {
    return (
      <div className="inspection-preview-overlay">
        <div className="inspection-preview-modal">
          <div className="preview-header">
            <h2>Inspection Preview</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="preview-empty">
            <div className="empty-icon">📋</div>
            <h3>No Data Available</h3>
            <p>This inspection doesn't contain any saved data to preview.</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inspection-preview-overlay">
      <div className="inspection-preview-modal">
        {/* Header */}
        <div className="preview-header">
          <div className="header-info">
            <h2>Inspection Preview</h2>
            <div className="header-meta">
              <span className="facility-name">{previewData.facility.name}</span>
              <span className="inspection-date">{new Date(previewData.event.date).toLocaleDateString()}</span>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(previewData.event.status) }}
              >
                {getStatusText(previewData.event.status)}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Summary Stats */}
        <div className="preview-summary">
          <div className="summary-stat">
            <span className="stat-number">{previewData.sectionsWithData}</span>
            <span className="stat-label">Sections with Data</span>
          </div>
          <div className="summary-stat">
            <span className="stat-number">{previewData.totalFields}</span>
            <span className="stat-label">Fields Completed</span>
          </div>
          <div className="summary-stat">
            <span className="stat-number">{previewData.facility.type}</span>
            <span className="stat-label">Facility Type</span>
          </div>
        </div>

        {/* Content */}
        <div className="preview-content">
          {/* Section Navigation */}
          <div className="section-nav">
            <h3>Sections</h3>
            <div className="section-list">
              {Object.keys(previewData.sections).map(sectionName => (
                <button
                  key={sectionName}
                  className={`section-nav-item ${activeSection === sectionName ? 'active' : ''}`}
                  onClick={() => setActiveSection(sectionName)}
                >
                  <span className="section-name">{sectionName}</span>
                  <span className="field-count">{previewData.sections[sectionName].fieldCount} fields</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section Data */}
          <div className="section-data">
            {activeSection && previewData.sections[activeSection] && (
              <div className="active-section">
                <div className="section-header">
                  <h3>{previewData.sections[activeSection].name}</h3>
                  <span className="field-count-badge">
                    {previewData.sections[activeSection].fieldCount} fields
                  </span>
                </div>
                
                <div className="fields-list">
                  {previewData.sections[activeSection].fields.map(field => (
                    <div key={field.id} className="field-item">
                      <div className="field-question">
                        {field.name}
                      </div>
                      <div className="field-answer">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="preview-footer">
          <div className="footer-info">
            <span>Created: {formatDateTime(previewData.event.createdAt)}</span>
            {previewData.event.updatedAt && previewData.event.updatedAt !== previewData.event.createdAt && (
              <span>Updated: {formatDateTime(previewData.event.updatedAt)}</span>
            )}
          </div>
          <div className="footer-actions">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
