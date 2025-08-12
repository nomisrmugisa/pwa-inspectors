import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAPI } from '../hooks/useAPI';

// Form field component for individual data elements
function FormField({ psde, value, onChange, error, dynamicOptions = null, isLoading = false, readOnly = false, getCurrentPosition, formatCoordinatesForDHIS2 }) {
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
          className={`form-select ${error ? 'error' : ''}`}
          disabled={readOnly || isLoading}
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
          className={`form-select ${error ? 'error' : ''}`}
          disabled={readOnly}
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
            className={`form-input ${error ? 'error' : ''}`}
          readOnly={readOnly}
          disabled={readOnly}
          />
        );

      case 'LONG_TEXT':
        return (
          <textarea
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            placeholder={`Enter ${dataElement.displayName}`}
            className={`form-textarea ${error ? 'error' : ''}`}
            rows={4}
          readOnly={readOnly}
          disabled={readOnly}
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
            className={`form-input ${error ? 'error' : ''}`}
            step={dataElement.valueType.includes('INTEGER') ? '1' : 'any'}
            min={dataElement.valueType === 'INTEGER_POSITIVE' ? '1' : 
                 dataElement.valueType === 'INTEGER_ZERO_OR_POSITIVE' ? '0' :
                 dataElement.valueType === 'PERCENTAGE' ? '0' : undefined}
            max={dataElement.valueType === 'PERCENTAGE' ? '100' : undefined}
            readOnly={readOnly}
            disabled={readOnly}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            className={`form-input ${error ? 'error' : ''}`}
          readOnly={readOnly}
          disabled={readOnly}
          />
        );

      case 'DATETIME':
        return (
          <input
            type="datetime-local"
            id={fieldId}
            value={value || ''}
            onChange={onChange}
            className={`form-input ${error ? 'error' : ''}`}
          readOnly={readOnly}
          disabled={readOnly}
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
                disabled={readOnly}
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
            className={`form-input ${error ? 'error' : ''}`}
          readOnly={readOnly}
          disabled={readOnly}
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
            className={`form-input ${error ? 'error' : ''}`}
          readOnly={readOnly}
          disabled={readOnly}
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
            className={`form-input ${error ? 'error' : ''}`}
          readOnly={readOnly}
          disabled={readOnly}
          />
        );

      case 'COORDINATE':
        // Debug logging for coordinate fields
        console.log(`🔍 COORDINATE field ${fieldId}:`, { 
          value, 
          dataElement: dataElement.displayName,
          valueType: dataElement.valueType,
          fieldId: fieldId
        });
        
        return (
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="text"
                id={fieldId}
                value={value || ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // If user is typing and it doesn't end with ], allow free input
                  if (!inputValue.endsWith(']')) {
                    onChange(e);
                    return;
                  }
                  
                  // If user finished typing (ends with ]), format it
                  const formatted = formatCoordinatesForDHIS2(inputValue);
                  if (formatted) {
                    onChange({ target: { value: formatted } });
                  } else {
                    onChange(e); // Keep original input if formatting fails
                  }
                }}
                onBlur={(e) => {
                  // When user leaves the field, try to format it
                  const formatted = formatCoordinatesForDHIS2(e.target.value);
                  if (formatted && formatted !== e.target.value) {
                    onChange({ target: { value: formatted } });
                  }
                }}
                placeholder="Enter coordinates (longitude,latitude)"
                className={`form-input ${error ? 'error' : ''}`}
                pattern="^\[-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?),\s*-?([1-8]?\d(\.\d+)?|90(\.0+)?)\]$"
                title="Enter coordinates in DHIS2 format: longitude,latitude (e.g., 25.9231,-24.6282)"
                readOnly={readOnly}
                disabled={readOnly}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                console.log(`📍 GPS button clicked for field: ${fieldId}`);
                getCurrentPosition(fieldId, onChange);
              }}
                disabled={readOnly}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  cursor: readOnly ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="Get current GPS coordinates (DHIS2 compliant format)"
              >
                📍 GPS
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>DHIS2 Format:</strong> Coordinates are automatically formatted as [longitude,latitude] 
              (e.g., [25.9231,-24.6282]) when using GPS button or when leaving the field.
            </div>
          </div>
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
            className={`form-input ${error ? 'error' : ''}`}
            readOnly={readOnly}
            disabled={readOnly}
          />
        );
    }
  };

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="form-label">
        {dataElement.displayName}
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
function FormSection({ section, formData, onChange, errors, serviceSections, loadingServiceSections, readOnlyFields = {}, getCurrentPosition, formatCoordinatesForDHIS2 }) {
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
          {(section.dataElements || []).map(psde => {
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
                readOnly={!!readOnlyFields[`dataElement_${psde.dataElement.id}`]}
                getCurrentPosition={getCurrentPosition}
                formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}
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
    api,
    setEventDate
  } = useApp();

  // Helper function to format coordinates in DHIS2 compliant format
  const formatCoordinatesForDHIS2 = (input) => {
    // Remove any existing brackets and extra spaces
    const cleanInput = input.replace(/[\[\]\s]/g, '');
    
    // Split by comma
    const parts = cleanInput.split(',');
    
    if (parts.length !== 2) {
      return null; // Invalid format
    }
    
    const [first, second] = parts;
    const longitude = parseFloat(first);
    const latitude = parseFloat(second);
    
    // Validate ranges
    if (isNaN(longitude) || isNaN(latitude)) {
      return null;
    }
    
    if (longitude < -180 || longitude > 180) {
      return null; // Invalid longitude
    }
    
    if (latitude < -90 || latitude > 90) {
      return null; // Invalid latitude
    }
    
    // Return in DHIS2 format: [longitude,latitude]
    return `[${longitude.toFixed(6)},${latitude.toFixed(6)}]`;
  };

  // GPS coordinate function
  const getCurrentPosition = (fieldId, onChange) => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser', 'error');
      return;
    }

    showToast('Getting GPS coordinates...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // DHIS2 compliant format: [longitude,latitude] as a string
        const coordinates = `[${longitude.toFixed(6)},${latitude.toFixed(6)}]`;
        
        // Update the form field
        onChange({ target: { value: coordinates } });
        
        // Update GPS state for debugging
        setGpsCoordinates({
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          accuracy: position.coords.accuracy ? `${position.coords.accuracy.toFixed(2)}m` : 'Unknown',
          timestamp: new Date(position.timestamp).toLocaleString(),
          fieldId: fieldId
        });
        
        showToast(`GPS coordinates captured: ${coordinates} (DHIS2 compliant)`, 'success');
        
        console.log('🔍 GPS coordinates captured:', {
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          coordinates: coordinates,
          accuracy: position.coords.accuracy ? `${position.coords.accuracy.toFixed(2)}m` : 'Unknown',
          timestamp: new Date(position.timestamp).toLocaleString(),
          fieldId: fieldId
        });
      },
      (error) => {
        let errorMessage = 'Failed to get GPS coordinates';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'GPS access denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS request timed out.';
            break;
          default:
            errorMessage = `GPS error: ${error.message}`;
        }
        showToast(errorMessage, 'error');
        console.error('GPS error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Add debug effect
  useEffect(() => {
    console.log('FormPage - userAssignments received:', userAssignments);
  }, [userAssignments]);

  const [formData, setFormData] = useState({
    orgUnit: '',
    eventDate: new Date().toISOString().split('T')[0],
  });
  const [readOnlyFields, setReadOnlyFields] = useState({});
  const [errors, setErrors] = useState({});
  const [showDebugPanel, setShowDebugPanel] = useState(false); // Hide debug panel by default
  const [isDraft, setIsDraft] = useState(false);
  // const [currentUser, setCurrentUser] = useState(null);
  const [serviceSections, setServiceSections] = useState(configuration?.programStage?.sections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStats, setFormStats] = useState({ percentage: 0, filled: 0, total: 0 });
  const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
  const [gpsCoordinates, setGpsCoordinates] = useState(null);

  const fetchTrackedEntityInstance = async (facilityId) => {
    try {
      const apiEndpoint = `/api/trackedEntityInstances?ou=${facilityId}&program=EE8yeLVo6cN&fields=trackedEntityInstance&ouMode=DESCENDANTS`;
      const fullUrl = `${import.meta.env.VITE_DHIS2_URL}${apiEndpoint}`;
      
      console.log('🔍 Fetching Tracked Entity Instance for facility:', facilityId);
      console.log('🌐 API Endpoint:', apiEndpoint);
      console.log('🔗 Full URL:', fullUrl);
      console.log('📤 Request Method: GET');
      console.log('📋 Request Headers:', {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(import.meta.env.VITE_DHIS2_USERNAME + ':' + import.meta.env.VITE_DHIS2_PASSWORD)
      });
      console.log('📊 Query Parameters:', {
        ou: facilityId,
        program: 'EE8yeLVo6cN',
        fields: 'trackedEntityInstance',
        ouMode: 'DESCENDANTS'
      });
      
      // Use the API service instead of direct fetch
      const response = await api.request(apiEndpoint);
      
      console.log('📡 TEI API Response Status: Success');
      console.log('📡 TEI API Response Body:', JSON.stringify(response, null, 2));
      console.log('📡 TEI API Response Structure:', {
        hasTrackedEntityInstances: !!response.trackedEntityInstances,
        trackedEntityInstancesCount: response.trackedEntityInstances?.length || 0,
        responseKeys: Object.keys(response)
      });
      
      if (response.trackedEntityInstances && response.trackedEntityInstances.length > 0) {
        const tei = response.trackedEntityInstances[0].trackedEntityInstance;
        if (tei && tei.trim() !== '') {
        setTrackedEntityInstance(tei);
        console.log('✅ Tracked Entity Instance found:', tei);
        } else {
          console.log('⚠️ TEI found but is empty or invalid:', tei);
          setTrackedEntityInstance(null);
        }
      } else {
        console.log('ℹ️ No Tracked Entity Instance found for facility');
        setTrackedEntityInstance(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch Tracked Entity Instance:', error);
      console.log('🔍 Error details:', {
        message: error.message,
        status: error.status,
        response: error.response,
        name: error.name,
        stack: error.stack
      });
      // Don't set to null on error, keep previous value if available
      if (!trackedEntityInstance) {
        setTrackedEntityInstance(null);
      }
    }
  };

  useEffect(() => {
    setEventDate(formData.eventDate);
  }, [formData.eventDate]);


  // Build unique facilities from userAssignments
  // const safeUserAssignments = Array.isArray(userAssignments) ? userAssignments : [];
  // const uniqueFacilities = [
  //   ...new Set(
  //     safeUserAssignments
  //       .map(a => typeof a.facility === 'string' ? a.facility.trim() : '')
  //       .filter(facility => facility)
  //   )
  // ];
  
  // Get today's date in Botswana timezone (UTC+2)
  const getBotswanaDate = () => {
    const now = new Date();
    // Botswana is UTC+2, so add 2 hours to get local time
    const botswanaTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    return botswanaTime.toISOString().split('T')[0];
  };
  
  const today = getBotswanaDate();
  console.log('🌍 Today in Botswana timezone:', today);

  const safeUserAssignments = Array.isArray(userAssignments) ? userAssignments : [];

  // Get facilities with today's date in inspection period
  const activeFacilities = safeUserAssignments.filter(a => {
    const { startDate, endDate } = a.assignment.inspectionPeriod || {};
    
    if (!startDate || !endDate) {
      console.log(`⚠️ Assignment for ${a.facility.name} missing inspection period dates`);
      return false;
    }
    
    // Convert assignment dates to Date objects for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);
    const todayDate = new Date(today);
    
    // Reset time to start of day for accurate date comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999); // End of day
    todayDate.setHours(12, 0, 0, 0); // Middle of day
    
    const isActive = start <= todayDate && todayDate <= end;
    
    console.log(`🔍 Facility: ${a.facility.name}, Period: ${startDate} to ${endDate}, Today: ${today}, Active: ${isActive}`);
    
    return isActive;
  }).map(a => ({
    id: a.facility.id,
    name: a.facility.name
  }));

  console.log('✅ Active facilities for today:', activeFacilities);
  console.log('📅 All assignments:', safeUserAssignments.map(a => ({
    facility: a.facility.name,
    period: a.assignment.inspectionPeriod
  })));

  const uniqueFacilities = activeFacilities; // Only show facilities with active assignments for today

  // Toggle for debugging: show all facilities vs only active ones
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  
  const finalFacilities = showAllFacilities 
    ? safeUserAssignments
        .filter(assignment => assignment.facility && assignment.facility.id)
        .map(assignment => ({
          id: assignment.facility.id,
          name: assignment.facility.name
        }))
    : uniqueFacilities;

  // Get the selected assignment for the chosen facility
  const selectedAssignment = safeUserAssignments.find(a => a.facility.id === (typeof formData.orgUnit === 'string' ? formData.orgUnit : formData.orgUnit?.id));
  // Get service options from the selected assignment
  const serviceOptions = selectedAssignment ? selectedAssignment.assignment.sections : [];
  const assignmentType = selectedAssignment ? selectedAssignment.assignment.type : null;
  const assignmentInspectionId = selectedAssignment ? selectedAssignment.assignment.inspectionId : null;
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

  // Initialize organization unit to empty string when app loads
  useEffect(() => {
    if (configuration && !formData.orgUnit) {
      setFormData(prev => ({
        ...prev,
        orgUnit: ''
      }));
    }
  }, [configuration, formData.orgUnit]);

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
        const facilityId = typeof formData.orgUnit === 'string' ? formData.orgUnit : formData.orgUnit?.id;
        console.log(`🔍 Fetching service sections for facility: ${facilityId}, inspector: ${currentUser.displayName || currentUser.username}`);
        const assignedSectionNames = await api.getServiceSectionsForInspector(
          facilityId,
          currentUser.displayName || currentUser.username
        );
        const allProgramSections = configuration?.programStage?.sections || [];
        if (Array.isArray(assignedSectionNames) && assignedSectionNames.length > 0 && allProgramSections.length > 0) {
          const normalize = (v) => (v ?? '')
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
          const filtered = allProgramSections.filter((s) => {
            const sName = normalize(s.displayName);
            return assignedSectionNames.some((n) => {
              const aName = normalize(n);
              return aName === sName || aName.includes(sName) || sName.includes(aName);
            });
          });
          // If nothing matched (label mismatches), fall back to all non pre-inspection sections
          if (filtered.length > 0) {
            setServiceSections(filtered);
          } else {
            setServiceSections(allProgramSections.filter((s) => !s.displayName?.startsWith('Pre-Inspection:')));
          }
        } else {
          // Fallback: show all non pre-inspection sections
          setServiceSections(allProgramSections.filter((s) => !s.displayName?.startsWith('Pre-Inspection:')));
        }
        console.log('✅ Service sections loaded for render:', {
          assigned: assignedSectionNames,
          allProgramSections: allProgramSections.map(s => s.displayName),
          final: (Array.isArray(assignedSectionNames) && assignedSectionNames.length > 0 && allProgramSections.length > 0)
            ? allProgramSections.filter((s) => {
                const norm = (v) => (v ?? '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                const sName = norm(s.displayName);
                return assignedSectionNames.some((n) => {
                  const aName = norm(n);
                  return aName === sName || aName.includes(sName) || sName.includes(aName);
                });
              }).map(s => s.displayName)
            : allProgramSections.filter(s => !s.displayName?.startsWith('Pre-Inspection:')).map(s => s.displayName)
        });
      } catch (error) {
        console.error('❌ Failed to fetch service sections:', error);
        setServiceSections([]);
      } finally {
        // setLoadingServiceSections(false);
      }
    };

    fetchServiceSections();
  }, [formData.orgUnit, api, user]); // Removed currentUser?.username from dependency array



  // Function to determine if a field should use dynamic service dropdown
  const isServiceField = (dataElement) => {
    // Check if field name/displayName contains 'service' (case-insensitive)
    const fieldName = (dataElement.displayName || dataElement.shortName || '').toLowerCase();
    return fieldName.includes('service') || fieldName.includes('section');
  };

  // Move this block after all hooks to avoid conditional hook call error
  // if (!configuration) { ... }

  // Calculate form completion percentage and stats
  const calculateFormStats = () => {
    if (!configuration) return { percentage: 0, filled: 0, total: 0 };

    // Use currently rendered sections when available; fallback to configuration
    const sectionsSource = Array.isArray(serviceSections) && serviceSections.length > 0
      ? serviceSections
      : configuration?.programStage?.sections || [];

    const normalize = (value) => (value || '').toString().trim().toLowerCase();
    const isPreInspection = (section) => normalize(section?.displayName).startsWith('pre-inspection');
    const isDocumentReview = (section) => normalize(section?.displayName).includes('document review');

    const hasAnyDataInSection = (section) => {
      if (!section?.dataElements) return false;
      return section.dataElements.some((psde) => {
        const fieldName = `dataElement_${psde.dataElement.id}`;
        const value = formData[fieldName];
        return value !== undefined && value !== null && value.toString().trim() !== '';
      });
    };

    const documentReviewSections = sectionsSource.filter((s) => isDocumentReview(s));
    const nonPreNonDocSections = sectionsSource.filter((s) => !isPreInspection(s) && !isDocumentReview(s));

    // If any data has been entered in Document Review section(s), only count those.
    // Otherwise, count the rest of the sections excluding pre-inspection ones.
    const useDocumentReviewOnly = documentReviewSections.some((s) => hasAnyDataInSection(s));
    const countedSections = useDocumentReviewOnly ? documentReviewSections : nonPreNonDocSections;

    let totalFields = 0;
    let filledFields = 0;

    // Always include the two basic fields
    totalFields += 2; // orgUnit and eventDate
    if (formData.orgUnit) filledFields++;
    if (formData.eventDate) filledFields++;

    countedSections.forEach((section) => {
      (section.dataElements || []).forEach((psde) => {
        totalFields += 1;
        const fieldName = `dataElement_${psde.dataElement.id}`;
        const value = formData[fieldName];
        if (value !== undefined && value !== null && value.toString().trim() !== '') {
          filledFields += 1;
        }
      });
    });

    const percentage = totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100);
    return { percentage, filled: filledFields, total: totalFields };
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
      console.log('🏥 Facility selected, fetching TEI for:', value);
      fetchTrackedEntityInstance(value);
    }
  };

  // Set Type from assignment and lock field when facility/orgUnit changes
  useEffect(() => {
    if (!configuration) return;
    const typeElement = configuration.programStage.allDataElements?.find(psde => {
      const name = (psde.dataElement.displayName || psde.dataElement.shortName || '').toLowerCase();
      return name === 'type' || name.includes('facility type') || name.includes('inspection type');
    });

    if (typeElement) {
      const fieldKey = `dataElement_${typeElement.dataElement.id}`;
      if (assignmentType) {
        // If the Type field uses an optionSet, map the assignment type to the option value
        let valueToSet = assignmentType;
        const options = typeElement.dataElement.optionSet?.options || [];
        if (Array.isArray(options) && options.length > 0) {
          const normalized = (v) => (v ?? '').toString().trim().toLowerCase();
          const matched = options.find(opt =>
            normalized(opt.displayName) === normalized(assignmentType) ||
            normalized(opt.code) === normalized(assignmentType) ||
            normalized(opt.id) === normalized(assignmentType)
          );
          if (matched) {
            valueToSet = matched.code || matched.id;
          }
        }
        setFormData(prev => ({
          ...prev,
          [fieldKey]: valueToSet
        }));
      }
      // Always lock the field regardless of whether a value exists
      setReadOnlyFields(prev => ({ ...prev, [fieldKey]: true }));
    }
  }, [configuration, assignmentType, formData.orgUnit]);

  // Set Inspection-id from assignment and lock field when facility/orgUnit changes
  useEffect(() => {
    if (!configuration) return;
    const idElement = configuration.programStage.allDataElements?.find(psde => {
      const display = (psde.dataElement.displayName || '').toLowerCase();
      const short = (psde.dataElement.shortName || '').toLowerCase();
      return (
        display === 'inspection-id' || short === 'inspection-id' ||
        display === 'inspection id' || short === 'inspection id' ||
        display.includes('inspection-id') || short.includes('inspection-id') ||
        display.includes('inspection id') || short.includes('inspection id')
      );
    });

    if (idElement) {
      const fieldKey = `dataElement_${idElement.dataElement.id}`;
      // If the field has an optionSet, there's usually no optionSet for IDs; set raw string value
      if (assignmentInspectionId !== null && assignmentInspectionId !== undefined && assignmentInspectionId !== '') {
        setFormData(prev => ({
          ...prev,
          [fieldKey]: assignmentInspectionId
        }));
      }
      // Always lock the field regardless of whether a value exists
      setReadOnlyFields(prev => ({ ...prev, [fieldKey]: true }));
    }
  }, [configuration, assignmentInspectionId, formData.orgUnit]);

  // Check if mandatory fields are filled
  const areAllMandatoryFieldsFilled = () => {
    // Facility and Inspection Date are mandatory
    return formData.orgUnit && formData.eventDate;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate mandatory fields
    if (!formData.orgUnit) {
      newErrors.orgUnit = 'Facility selection is required';
    }
    if (!formData.eventDate) {
      newErrors.eventDate = 'Inspection date is required';
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

      // Only include trackedEntityInstance if it exists
      if (trackedEntityInstance) {
        eventData.trackedEntityInstance = trackedEntityInstance;
        console.log('🔗 Including trackedEntityInstance in event:', trackedEntityInstance);
      } else {
        console.log('ℹ️ No trackedEntityInstance available - creating event without TEI link');
      }

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

      // Clean up event data - remove any undefined or null values
      Object.keys(eventData).forEach(key => {
        if (eventData[key] === undefined || eventData[key] === null) {
          delete eventData[key];
        }
      });

      console.log('📝 Final event data for submission:', eventData);

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

  const _today = new Date(formData.eventDate);
  const _start = new Date(inspectionPeriod?.startDate);
  const _end = new Date(inspectionPeriod?.endDate);

  const date_valid = !inspectionPeriod ? true : (_today >= _start && _today <= _end);
  console.log("valid", date_valid, _today >= _start, _today <= _end);

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

        {/* Debug Panel */}
        <div className="debug-panel" style={{
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>🔍 Debug Information</h3>
            <button
              type="button"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {showDebugPanel ? 'Hide' : 'Show'} Debug
            </button>
          </div>
          
          {showDebugPanel && (
            <>
              {/* Current Form State */}
              <div style={{ marginBottom: '12px' }}>
                <strong>Current Form State:</strong>
                <div style={{ marginLeft: '16px' }}>
                  <div>🏥 Selected Facility: {formData.orgUnit || 'None'}</div>
                  {formData.orgUnit && (
                    <div>🔍 Facility Name: {
                      finalFacilities.find(f => f.id === formData.orgUnit)?.name || 'Unknown'
                    }</div>
                  )}
                   <div>📅 Inspection Date: {formData.eventDate || 'None'}</div>
                  <div>📝 Form Data Keys: {Object.keys(formData).join(', ') || 'None'}</div>
                   <div>✅ Form Valid: {Object.keys(errors).length === 0 ? 'Yes' : 'No'}</div>
                   {Object.keys(errors).length > 0 && (
                     <div>❌ Errors: {Object.keys(errors).map(key => `${key}: ${errors[key]}`).join(', ')}</div>
                   )}
                </div>
              </div>
              
                               {/* TEI Debug Information */}
                <div style={{ marginBottom: '12px' }}>
                  <strong>TEI (Tracked Entity Instance) Debug:</strong>
                  <div style={{ marginLeft: '16px' }}>
                    <div>🔗 Current TEI: {trackedEntityInstance || 'None'}</div>
                    <div>🏥 Facility ID: {formData.orgUnit || 'None'}</div>
                    <div>📊 Program ID: EE8yeLVo6cN</div>
                    <div>🌐 API Endpoint: /api/trackedEntityInstances</div>
                    {formData.orgUnit && (
                      <div>🔗 Full URL: {import.meta.env.VITE_DHIS2_URL}/api/trackedEntityInstances?ou={formData.orgUnit}&program=EE8yeLVo6cN&fields=trackedEntityInstance&ouMode=DESCENDANTS</div>
                    )}
                    
                    {/* TEI API Response */}
                    <div style={{ marginTop: '8px' }}>
                      <strong>📡 Last API Response:</strong>
                      <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                        {trackedEntityInstance ? (
                          <div style={{ 
                            backgroundColor: '#e8f5e8', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: '1px solid #4caf50',
                            fontSize: '11px'
                          }}>
                            <div>✅ TEI Found: {trackedEntityInstance}</div>
                            <div>📊 Response Status: Success</div>
                            <div>🔍 Response Structure: Has trackedEntityInstances array</div>
                          </div>
                        ) : formData.orgUnit ? (
                          <div style={{ 
                            backgroundColor: '#fff3cd', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: '1px solid #ffc107',
                            fontSize: '11px'
                          }}>
                            <div>ℹ️ No TEI found for this facility</div>
                            <div>📊 Response Status: Success (but empty)</div>
                            <div>🔍 Response Structure: Empty trackedEntityInstances array</div>
                          </div>
                        ) : (
                    <div style={{
                            backgroundColor: '#f8d7da', 
                      padding: '8px',
                      borderRadius: '4px',
                            border: '1px solid #dc3545',
                            fontSize: '11px'
                          }}>
                            <div>⏳ No facility selected yet</div>
                            <div>📊 Response Status: Not requested</div>
                    </div>
                  )}
                      </div>
                    </div>
                </div>
              </div>
            </>
          )}
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
                {/* Mandatory fields note */}
                <div className="form-field" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                  <div style={{ fontSize: '14px', color: '#495057', fontWeight: '500' }}>
                    <span style={{ color: 'red', marginRight: '5px' }}>*</span>
                    Fields marked with an asterisk (*) are mandatory and must be filled before submitting the form.
                  </div>
                </div>
                
                {/* Debug toggle for facility filtering */}
                <div className="form-field" style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showAllFacilities}
                      onChange={(e) => setShowAllFacilities(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {showAllFacilities ? '🔍 Show all assigned facilities' : '✅ Show only active facilities for today'}
                    </span>
                  </label>
                  {showAllFacilities && (
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                      Debug mode: Showing all facilities regardless of inspection period
                    </div>
                  )}
                </div>
                
                                 <div className="form-field">
                   <label htmlFor="orgUnit" className="form-label">
                     Facility/Organisation Unit <span style={{ color: 'red' }}>*</span>
                   </label>
                  <select
                    id="orgUnit"
                    value={formData.orgUnit}
                    onChange={e => handleFieldChange('orgUnit', e.target.value)}
                    className={`form-select ${errors.orgUnit ? 'error' : ''}`}
                  >
                    <option value="">Select Facility</option>
                    {finalFacilities.length > 0 ? finalFacilities.map(facility => (
                      <option key={facility.id} value={facility.id}>{facility.name}</option>
                    )) : <option value="" disabled>No facilities assigned</option>}
                  </select>
                  {errors.orgUnit && <div className="field-error">{errors.orgUnit}</div>}
                </div>
                                 <div className="form-field">
                   <label htmlFor="eventDate" className="form-label">
                     Inspection Date <span style={{ color: 'red' }}>*</span>
                   </label>
                  <input
                    type="date"
                    id="eventDate"
                    value={formData.eventDate}
                    onChange={e => handleFieldChange('eventDate', e.target.value)}
                    className={`form-input ${errors.eventDate ? 'error' : ''}`}
                    max={inspectionPeriod ? inspectionPeriod?.endDate : new Date().toISOString().split('T')[0] }
                    min={ inspectionPeriod ? new Date(inspectionPeriod.startDate).toISOString().split('T')[0] : "" }
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
          { serviceSections && date_valid && serviceSections.length > 0 ? (
            serviceSections.map(section => (
              <FormSection
                key={section.id}
                section={section}
                formData={formData}
                onChange={handleFieldChange}
                errors={errors}
                serviceSections={serviceOptions}
                loadingServiceSections={false}
                readOnlyFields={readOnlyFields}
                getCurrentPosition={getCurrentPosition}
                formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}
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
            disabled={isSubmitting || !areAllMandatoryFieldsFilled()}
            className="btn btn-secondary"
          >
            <span>💾</span>
            <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!isOnline && !isDraft) || !areAllMandatoryFieldsFilled()}
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