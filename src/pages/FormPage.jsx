import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAPI } from '../hooks/useAPI';

// Form field component for individual data elements
function FormField({ psde, value, onChange, error }) {
  const { dataElement } = psde;
  const fieldId = `dataElement_${dataElement.id}`;

  const renderField = () => {
    // First check if field has optionSet (dropdown), regardless of valueType
    if (dataElement.optionSet && dataElement.optionSet.options) {
      return (
        <select
          id={fieldId}
          value={value || ''}
          onChange={onChange}
          required={psde.compulsory}
          className={`form-select ${error ? 'error' : ''}`}
        >
          <option value="">Select {dataElement.displayName}</option>
          {dataElement.optionSet.options
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map(option => (
              <option key={option.id} value={option.code || option.id}>
                {option.displayName}
              </option>
            ))}
        </select>
      );
    }

    // Then handle by valueType
    switch (dataElement.valueType) {
      case 'TEXT':
        return (
          <input
            type="text"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder={`Enter ${dataElement.displayName}`}
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
          />
        );

      case 'LONG_TEXT':
        return (
          <textarea
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder={`Enter ${dataElement.displayName}`}
            required={psde.compulsory}
            className={`form-textarea ${error ? 'error' : ''}`}
            rows={4}
          />
        );

      case 'INTEGER':
      case 'INTEGER_POSITIVE':
      case 'INTEGER_NEGATIVE':
      case 'INTEGER_ZERO_OR_POSITIVE':
      case 'NUMBER':
      case 'PERCENTAGE':
        return (
          <input
            type="number"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder={`Enter ${dataElement.displayName}`}
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
            step={dataElement.valueType.includes('INTEGER') ? '1' : 'any'}
            min={dataElement.valueType === 'INTEGER_POSITIVE' ? '1' : 
                 dataElement.valueType === 'INTEGER_ZERO_OR_POSITIVE' ? '0' :
                 dataElement.valueType === 'PERCENTAGE' ? '0' : undefined}
            max={dataElement.valueType === 'PERCENTAGE' ? '100' : undefined}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
          />
        );

      case 'DATETIME':
        return (
          <input
            type="datetime-local"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
          />
        );

      case 'BOOLEAN':
      case 'TRUE_ONLY':
        return (
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                id={fieldId}
                checked={value === 'true' || value === true}
                onChange={(e) => onChange({ target: { value: e.target.checked ? 'true' : 'false' } })}
                className="form-checkbox"
              />
              <span className="checkbox-text">
                {dataElement.valueType === 'TRUE_ONLY' ? 'Yes' : 'True'}
              </span>
            </label>
          </div>
        );

      case 'EMAIL':
        return (
          <input
            type="email"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder={`Enter ${dataElement.displayName}`}
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
          />
        );

      case 'PHONE_NUMBER':
        return (
          <input
            type="tel"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder={`Enter ${dataElement.displayName}`}
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
          />
        );

      case 'URL':
        return (
          <input
            type="url"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder={`Enter ${dataElement.displayName}`}
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
          />
        );

      case 'COORDINATE':
        return (
          <input
            type="text"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder="Enter coordinates (latitude,longitude)"
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
            pattern="^-?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$"
            title="Enter coordinates in format: latitude,longitude (e.g., -24.6282,25.9231)"
          />
        );

      default:
        // Default to text input
        return (
          <input
            type="text"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder={`Enter ${dataElement.displayName}`}
            required={psde.compulsory}
            className={`form-input ${error ? 'error' : ''}`}
          />
        );
    }
  };

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="form-label">
        {dataElement.displayName}
        {psde.compulsory && <span className="required">*</span>}
        {dataElement.description && (
          <span className="field-description">{dataElement.description}</span>
        )}
      </label>
      {renderField()}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

// Section component for organizing form fields
function FormSection({ section, formData, onChange, errors }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="form-section">
      <button 
        type="button"
        className="section-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="section-title">{section.displayName}</h3>
        <span className={`section-toggle ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </button>
      
      <div className={`section-content ${!isExpanded ? 'collapsed' : ''}`}>
        {section.description && (
          <p className="section-description">{section.description}</p>
        )}

        <div className="section-fields">
          {section.dataElements.map(psde => (
            <FormField
              key={psde.dataElement.id}
              psde={psde}
              value={formData[`dataElement_${psde.dataElement.id}`]}
              onChange={(e) => onChange(`dataElement_${psde.dataElement.id}`, e.target.value)}
              error={errors[`dataElement_${psde.dataElement.id}`]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Main FormPage component
function FormPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { 
    configuration, 
    saveEvent, 
    showToast, 
    loading, 
    isOnline 
  } = useApp();

  const [formData, setFormData] = useState({
    orgUnit: '',
    eventDate: new Date().toISOString().split('T')[0], // Today's date
  });
  const [errors, setErrors] = useState({});
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStats, setFormStats] = useState({ percentage: 0, filled: 0, total: 0 });

  // Load existing event if editing
  useEffect(() => {
    if (eventId && configuration) {
      // TODO: Load existing event data
      // This would fetch from storage and populate formData
    }
  }, [eventId, configuration]);

  // Pre-select first organization unit if available
  useEffect(() => {
    if (configuration && configuration.organisationUnits.length > 0 && !formData.orgUnit) {
      setFormData(prev => ({
        ...prev,
        orgUnit: configuration.organisationUnits[0].id
      }));
    }
  }, [configuration, formData.orgUnit]);

  if (!configuration) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading Facility-Registry inspection forms...</p>
        </div>
      </div>
    );
  }

  const { program, programStage, organisationUnits } = configuration;

  // Calculate form completion percentage and stats
  const calculateFormStats = () => {
    if (!programStage.allDataElements) return { percentage: 0, filled: 0, total: 0 };
    
    const totalFields = programStage.allDataElements.length + 2; // +2 for orgUnit and eventDate
    let filledFields = 0;
    
    // Check basic fields
    if (formData.orgUnit) filledFields++;
    if (formData.eventDate) filledFields++;
    
    // Check data element fields
    programStage.allDataElements.forEach(psde => {
      const fieldName = `dataElement_${psde.dataElement.id}`;
      const value = formData[fieldName];
      if (value && value.toString().trim() !== '') {
        filledFields++;
      }
    });
    
    return {
      percentage: Math.round((filledFields / totalFields) * 100),
      filled: filledFields,
      total: totalFields
    };
  };

  // Update form stats when form data changes
  useEffect(() => {
    if (configuration) {
      const stats = calculateFormStats();
      setFormStats(stats);
    }
  }, [formData, configuration]);

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.orgUnit) {
      newErrors.orgUnit = 'Organisation unit is required';
    }
    
    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }

    // Validate data elements using configuration
    if (programStage.allDataElements) {
      programStage.allDataElements.forEach(psde => {
        const fieldName = `dataElement_${psde.dataElement.id}`;
        const value = formData[fieldName];
        
        if (psde.compulsory && (!value || value.toString().trim() === '')) {
          newErrors[fieldName] = `${psde.dataElement.displayName} is required`;
        }
        
        // TODO: Add value type validation here
        // You could use the API validation functions
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (saveDraft = false) => {
    if (!saveDraft && !validateForm()) {
      showToast('Please fix the errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare event data
      const eventData = {
        event: eventId || undefined, // Will be generated if new
        program: program.id,
        programStage: programStage.id,
        orgUnit: formData.orgUnit,
        eventDate: formData.eventDate,
        status: saveDraft ? 'SCHEDULE' : 'COMPLETED',
        dataValues: []
      };

      // Add data values
      Object.entries(formData).forEach(([key, value]) => {
        if (key.startsWith('dataElement_') && value !== '') {
          const dataElementId = key.replace('dataElement_', '');
          eventData.dataValues.push({
            dataElement: dataElementId,
            value: value.toString()
          });
        }
      });

      const savedEvent = await saveEvent(eventData, saveDraft);
      setIsDraft(saveDraft);
      
      if (!saveDraft && !eventId) {
        // Navigate to home after successful save of new event
        navigate('/home');
      }
      
    } catch (error) {
      console.error('Failed to save event:', error);
      showToast(`Failed to save: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave(false);
  };

  const handleSaveDraft = () => {
    handleSave(true);
  };

  return (
    <div className="screen">
      <div className="form-container">
        <div className="form-header">
          <div>
            <h2>{program.displayName}</h2>
            <p className="form-subtitle">{programStage.displayName}</p>
            {program.description && (
              <p className="form-description">{program.description}</p>
            )}
            
            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-info">
                <span className="progress-label">
                  Form Completion ({formStats.filled}/{formStats.total} fields)
                </span>
                <span className="progress-percentage">{formStats.percentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${formStats.percentage}%` }}
                  data-progress={
                    formStats.percentage === 100 ? 'complete' :
                    formStats.percentage >= 75 ? 'high' :
                    formStats.percentage >= 50 ? 'medium' : 'low'
                  }
                ></div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="btn btn-secondary"
            >
              <span>📊</span>
              <span className="btn-text">Dashboard</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="inspection-form">
          {/* Form metadata section */}
          <div className="form-section">
            <button 
              type="button"
              className="section-header"
              style={{ cursor: 'default' }}
            >
              <h3 className="section-title">Inspection Information</h3>
            </button>
            
            <div className="section-content">
              <div className="section-fields">
                <div className="form-field">
                  <label htmlFor="orgUnit" className="form-label">
                    Facility/Organisation Unit <span className="required">*</span>
                  </label>
                  <select
                    id="orgUnit"
                    value={formData.orgUnit}
                    onChange={(e) => handleFieldChange('orgUnit', e.target.value)}
                    required
                    className={`form-select ${errors.orgUnit ? 'error' : ''}`}
                  >
                    <option value="">Select Facility</option>
                    {organisationUnits.map(orgUnit => (
                      <option key={orgUnit.id} value={orgUnit.id}>
                        {orgUnit.displayName}
                      </option>
                    ))}
                  </select>
                  {errors.orgUnit && <div className="field-error">{errors.orgUnit}</div>}
                </div>

                <div className="form-field">
                  <label htmlFor="eventDate" className="form-label">
                    Inspection Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    value={formData.eventDate}
                    onChange={(e) => handleFieldChange('eventDate', e.target.value)}
                    required
                    className={`form-input ${errors.eventDate ? 'error' : ''}`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.eventDate && <div className="field-error">{errors.eventDate}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Program stage sections */}
          {programStage.sections && programStage.sections.length > 0 ? (
            programStage.sections.map(section => (
              <FormSection
                key={section.id}
                section={section}
                formData={formData}
                onChange={handleFieldChange}
                errors={errors}
              />
            ))
          ) : (
            <div className="form-section">
              <button 
                type="button"
                className="section-header"
                style={{ cursor: 'default' }}
              >
                <h3 className="section-title">Configuration Issue</h3>
              </button>
              <div className="section-content">
                <div className="section-fields">
                  <div className="error-message">
                    <p>⚠️ The Inspections program stage doesn't have any data elements configured.</p>
                    <p>Please contact your DHIS2 administrator to configure the inspection form fields.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Form footer with actions */}
        <div className="form-footer">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            <span>💾</span>
            <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!isOnline && !isDraft)}
            className="btn btn-primary"
          >
            <span>📤</span>
            <span>{isSubmitting ? 'Submitting...' : 'Submit Inspection'}</span>
          </button>
          
          {!isOnline && (
            <div className="offline-notice" style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '8px',
              background: 'var(--md-surface-variant)',
              borderRadius: '8px',
              color: 'var(--md-on-surface-variant)',
              fontSize: '0.875rem'
            }}>
              📴 Offline - Inspection will sync when connected
            </div>
          )}
          
          {isDraft && (
            <div className="draft-notice" style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '8px',
              background: 'var(--md-surface-variant)',
              borderRadius: '8px',
              color: 'var(--md-on-surface-variant)',
              fontSize: '0.875rem'
            }}>
              💾 Inspection draft saved locally
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { FormPage }; 