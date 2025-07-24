import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAPI } from '../hooks/useAPI';

// Form field component for individual data elements
function FormField({ psde, value, onChange, error, dynamicOptions = null, isLoading = false }) {
  const { dataElement } = psde;
  const fieldId = `dataElement_${dataElement.id}`;

  const renderField = () => {
    // Handle dynamic service dropdown (overrides static optionSet)
    if (dynamicOptions !== null) {
      return (
        <select
          id={fieldId}
          value={value || ''}
          onChange={onChange}
          required={psde.compulsory}
          className={`form-select ${error ? 'error' : ''}`}
          disabled={isLoading}
        >
          <option value="">
            {isLoading ? 'Loading service sections...' : `Select ${dataElement.displayName}`}
          </option>
          {dynamicOptions.map((section, index) => (
            <option key={index} value={section}>
              {section}
            </option>
          ))}
        </select>
      );
    }

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
              {/* Removed the 'True' or 'Yes' label next to the checkbox */}
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
function FormSection({ section, formData, onChange, errors, serviceSections, loadingServiceSections }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to determine if a field should use dynamic service dropdown
  const isServiceField = (dataElement) => {
    // Check if field name/displayName contains 'service' (case-insensitive)
    const fieldName = (dataElement.displayName || dataElement.shortName || '').toLowerCase();
    return fieldName.includes('service') || fieldName.includes('section');
  };

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
          {section.dataElements.map(psde => {
            const isDynamicServiceField = isServiceField(psde.dataElement);
            return (
              <FormField
                key={psde.dataElement.id}
                psde={psde}
                value={formData[`dataElement_${psde.dataElement.id}`]}
                onChange={(e) => onChange(`dataElement_${psde.dataElement.id}`, e.target.value)}
                error={errors[`dataElement_${psde.dataElement.id}`]}
                dynamicOptions={isDynamicServiceField ? serviceSections : null}
                isLoading={isDynamicServiceField ? loadingServiceSections : false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main FormPage component
function FormPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  // const api = useAPI();
  const {
    configuration,
    saveEvent,
    showToast,
    loading,
    isOnline,
    userAssignments,
    user,
    api
  } = useApp();

  // Add debug effect
  useEffect(() => {
    console.log('FormPage - userAssignments received:', userAssignments);
  }, [userAssignments]);

  const [formData, setFormData] = useState({
    orgUnit: '',
    eventDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});
  const [isDraft, setIsDraft] = useState(false);
  // const [currentUser, setCurrentUser] = useState(null);
  const [serviceSections, setServiceSections] = useState(configuration?.programStage?.sections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStats, setFormStats] = useState({ percentage: 0, filled: 0, total: 0 });
  const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);

  const fetchTrackedEntityInstance = async (facilityId) => {
    const username = "admin";
    const password = "5Am53808053@";
    try {
      const response = await fetch(
          `https://qimsdev.5am.co.bw/qims/api/trackedEntityInstances?ou=${facilityId}&program=EE8yeLVo6cN&fields=trackedEntityInstance&ouMode=DESCENDANTS`,
          {
            headers: {
              'Authorization': 'Basic ' + btoa(`${username}:${password}`)
            }
          }
      );
      const data = await response.json();
      if (data.trackedEntityInstances && data.trackedEntityInstances.length > 0) {
        const tei = data.trackedEntityInstances[0].trackedEntityInstance;
        setTrackedEntityInstance(tei);
        console.log('Tracked Entity Instance found:', tei);
      } else {
        console.log('No Tracked Entity Instance found for facility');
        setTrackedEntityInstance(null);
      }
    } catch (error) {
      console.error('Failed to fetch Tracked Entity Instance:', error);
      setTrackedEntityInstance(null);
    }
  };


  // Build unique facilities from userAssignments
  // const safeUserAssignments = Array.isArray(userAssignments) ? userAssignments : [];
  // const uniqueFacilities = [
  //   ...new Set(
  //     safeUserAssignments
  //       .map(a => typeof a.facility === 'string' ? a.facility.trim() : '')
  //       .filter(facility => facility)
  //   )
  // ];
  const today = new Date().toISOString().split('T')[0];

  const safeUserAssignments = Array.isArray(userAssignments) ? userAssignments : [];

// get facilities with today's date in inspection period
  const activeFacilities = safeUserAssignments.filter(a => {
    const { startDate, endDate } = a.assignment.inspectionPeriod || {};
    return startDate && endDate && startDate <= today && today <= endDate;
  }).map(a => ({
    id: a.facility.id,
    name: a.facility.name
  }));

  // console.log('Active facilities:', activeFacilities);

  const uniqueFacilities = activeFacilities; //use when you want to filter by today's date

 // use to show all facilities

  // const uniqueFacilities =  safeUserAssignments
  //     .filter(assignment => assignment.facility && assignment.facility.id)
  //     .map(assignment => ({
  //       id: assignment.facility.id,
  //       name: assignment.facility.name
  //     }));

  // console.log('safeUserAssignments:', safeUserAssignments);
  // console.log('Facilities:', uniqueFacilities);

  // Get the selected assignment for the chosen facility
  const selectedAssignment = safeUserAssignments.find(a => a.facility.id === formData.orgUnit);
  // Get service options from the selected assignment
  const serviceOptions = selectedAssignment ? selectedAssignment.assignment.sections : [];
  // Get inspection period from the selected assignment
  const inspectionPeriod = selectedAssignment && selectedAssignment.assignment
    ? selectedAssignment.assignment.inspectionPeriod
    : null;

  // Load existing event if editing
  useEffect(() => {
    if (eventId && configuration) {
      // TODO: Load existing event data
      // This would fetch from storage and populate formData
    }
  }, [eventId, configuration]);

  // Fetch current user on mount
  // done in initialize app of context
  // useEffect(() => {
  //   const fetchCurrentUser = async () => {
  //     try {
  //       const user = await api.getMe();
  //       // console.log('👤 Current user for service sections:', user);
  //       // setCurrentUser(user); // This line is removed as per the new_code
  //     } catch (error) {
  //       console.error('❌ Failed to fetch current user:', error);
  //     }
  //   };

  //   if (api) {
  //     fetchCurrentUser();
  //   }
  // }, [api]);

  // Pre-select first organization unit if available
  useEffect(() => {
    if (configuration && uniqueFacilities.length > 0 && !formData.orgUnit) {
      setFormData(prev => ({
        ...prev,
        orgUnit: uniqueFacilities[0]
      }));
    }
  }, [configuration, uniqueFacilities, formData.orgUnit]);

  // Fetch service sections when facility or user changes
  useEffect(() => {
    // This useEffect is no longer needed as serviceOptions are now directly available
    const fetchServiceSections = async () => {
      const currentUser = user;
      console.log("fetch serv sec", formData.orgUnit, currentUser)
      if (!formData.orgUnit || !currentUser?.username) {
        console.log('⏳ Waiting for facility selection and user data...');
        setServiceSections(configuration?.programStage?.sections.filter((section) => !section.displayName.startsWith("Pre-Inspection:") ));
        return;
      }

      // setLoadingServiceSections(true);
      try {
        console.log(`🔍 Fetching service sections for facility: ${formData.orgUnit.id}, user: ${currentUser.username}`);
        const sections = await api.getServiceSectionsForInspector(formData.orgUnit.id, currentUser.username);
        if (sections.length > 0)
          setServiceSections(sections);
        console.log('✅ Service sections loaded:', sections);
      } catch (error) {
        console.error('❌ Failed to fetch service sections:', error);
        setServiceSections([]);
      } finally {
        // setLoadingServiceSections(false);
      }
    };

    fetchServiceSections();
  }, [formData.orgUnit, api, user]); // Removed currentUser?.username from dependency array

  // Move this block after all hooks to avoid conditional hook call error
  // if (!configuration) { ... }

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

    // Fetch tracked entity instance when facility is selected
    if (fieldName === 'orgUnit' && value) {
      fetchTrackedEntityInstance(value);
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
        trackedEntityInstance: trackedEntityInstance,
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

  // Log Inspection Scheduled: Dates for debugging
  if (inspectionPeriod) {
    console.log('Inspection Scheduled: Dates:', inspectionPeriod.startDate, 'to', inspectionPeriod.endDate);
  }

  // Place the configuration check here, after all hooks
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

  return (
    <div className="screen">
      <div className="form-container">
        <div className="form-header">
          <div>
            {/* Removed Facility-Registry heading as requested */}
            <p className="form-subtitle">{configuration?.programStage?.displayName}</p>
            {/* Removed program description as requested */}

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
                    onChange={e => handleFieldChange('orgUnit', e.target.value)}
                    required
                    className={`form-select ${errors.orgUnit ? 'error' : ''}`}
                  >
                    <option value="">Select Facility</option>
                    {uniqueFacilities.length > 0 ? uniqueFacilities.map(facility => (
                      <option key={facility.id} value={facility.id}>{facility.name}</option>
                    )) : <option value="" disabled>No facilities assigned</option>}
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
                    onChange={e => handleFieldChange('eventDate', e.target.value)}
                    required
                    className={`form-input ${errors.eventDate ? 'error' : ''}`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.eventDate && <div className="field-error">{errors.eventDate}</div>}
                </div>
                {inspectionPeriod && (
                  <div className="form-field">
                    <label className="form-label">Inspection Scheduled: Dates:</label>
                    <div>
                      {inspectionPeriod.startDate} to {inspectionPeriod.endDate}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Program stage sections */}
          { serviceSections && serviceSections.length > 0 ? (
            serviceSections.map(section => (
              <FormSection
                key={section.id}
                section={section}
                formData={formData}
                onChange={handleFieldChange}
                errors={errors}
                serviceSections={serviceOptions}
                loadingServiceSections={false}
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
                    <p>⚠️ The Inspections program stage doesn&#39;t have any data elements configured.</p>
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