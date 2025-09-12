import React, { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { useApp } from '../contexts/AppContext';

import {

  shouldShowSection,

  getFilteredDataElementCount,

  getSectionDetailsForFacility,

  getFacilitySummary

} from '../config/sectionVisibilityConfig';

import { shouldShowDataElementForService } from '../config/facilityServiceFilters';

import CustomSignatureCanvas from '../components/CustomSignatureCanvas';
import { useIncrementalSave } from '../hooks/useIncrementalSave';
import indexedDBService from '../services/indexedDBService';

import './FormPage.css'; // Import FormPage specific styles







// Define service field detection function at module level

const enhancedServiceFieldDetection = (dataElement) => {

  if (!dataElement || !dataElement.displayName) {

    return false;

  }

  

  const fieldName = (dataElement.displayName || dataElement.shortName || '').toLowerCase();

  

  // Check if this is the Facility Service Departments field

  const isFacilityServiceDepartments = fieldName === 'facility service departments' ||

                                      fieldName.includes('facility service department');

  

  // If it's the Facility Service Departments field, we want to handle it specially

  if (isFacilityServiceDepartments) {

    return 'facility_service_departments';

  }

  

  // Check if this is the main Services field

  const isMainServicesField = fieldName === 'services' || fieldName === 'service' || fieldName === 'service sections';

  

  // If it's the main Services field, we want to treat it as a service field

  if (isMainServicesField) {

    return true;

  }

  

  // For other fields, use the standard service field detection logic

  // Exclude fields that are about supplies, even if they contain 'service'

  if (fieldName.includes('supplies') || fieldName.includes('adequate')) {

    return false;

  }

  

  // Exclude fields that are about outreach services, special circumstances, etc.

  if (fieldName.includes('outreach services') || 

      fieldName.includes('special circumstances') ||

      fieldName.includes('applications for')) {

    return false;

  }

  

  // Only identify fields that are specifically about selecting service types/sections

  return (fieldName.includes('service type') || 

          fieldName.includes('service selection') ||

          fieldName.includes('select service') ||

          fieldName.includes('service section') ||

          (fieldName.includes('service') && fieldName.includes('type'))) &&

         !fieldName.includes('outreach') &&

         !fieldName.includes('special');

};



// Detect subsection headers: strictly exactly two trailing dashes "--" (with optional surrounding spaces)
const isSectionHeaderName = (name) => {
  if (!name || typeof name !== 'string') return false;
  return /\s*--\s*$/.test(name) && !/\s*---+\s*$/.test(name);
};

// Strip exactly two trailing dashes for display
const normalizeSectionHeaderName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.replace(/\s*--\s*$/, '').trim();
};

// Form field component for individual data elements

function FormField({ psde, value, onChange, error, dynamicOptions = null, isLoading = false, readOnly = false, getCurrentPosition, formatCoordinatesForDHIS2, staticText, onCommentChange, comments = {} }) {

  const { dataElement } = psde;

  const fieldId = `dataElement_${dataElement.id}`;

  const [showCommentField, setShowCommentField] = useState(false);
  const [commentText, setCommentText] = useState(comments[dataElement.id] || '');

  // Helper function to determine if field is filled
  const isFieldFilled = (fieldValue) => {
    if (fieldValue === null || fieldValue === undefined) return false;
    if (typeof fieldValue === 'string') return fieldValue.trim().length > 0;
    if (typeof fieldValue === 'boolean') return true; // Boolean fields are always considered filled when they have a value
    if (Array.isArray(fieldValue)) return fieldValue.length > 0;
    return fieldValue !== '';
  };

  // Get filled class for styling
  const getFilledClass = () => {
    return isFieldFilled(value) ? 'filled' : '';
  };

  // ALWAYS log when FormField is rendered

  console.log(`🔍 FormField RENDERED: "${dataElement.displayName}"`, {

    fieldId,

    valueType: dataElement.valueType,

    hasOptionSet: !!dataElement.optionSet,

    readOnly,

    value,

    staticText

  });



  // Check if this field is mandatory based on field name or compulsory flag

  const isMandatoryField = () => {

    // All fields are now optional - no mandatory requirements

      return false;

  };



  const renderField = () => {

    

    // ALWAYS log field rendering for debugging

    console.log(`🎨 ALWAYS LOG: Rendering field "${dataElement.displayName}":`, {

      valueType: dataElement.valueType,

      hasOptionSet: !!dataElement.optionSet,

      optionSetOptions: dataElement.optionSet?.options?.length || 0,

      dynamicOptions: dynamicOptions,

      readOnly: readOnly,

      isLoading: isLoading,

      fieldId: fieldId

    });

    

    // If staticText is provided, render a disabled text input showing the text
    if (typeof staticText === 'string') {
      return (
        <input
          id={fieldId}
          value={staticText}
          readOnly
          disabled
          className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}
          style={{ flex: 1 }}
        />
      );
    }

    

    

    // Handle Facility Service Departments field with specific dropdown options

    const serviceFieldType = enhancedServiceFieldDetection(dataElement);

    if (serviceFieldType === 'facility_service_departments') {

      console.log(`🏥 Rendering Facility Service Departments field: "${dataElement.displayName}"`);

      

      // Define the specific options for Facility Service Departments

      const facilityServiceOptions = [

        "ORGANISATION AND MANAGEMENT",

        "SERVICES PROVIDED",

        "PERSONNEL",

        "ENVIRONMENT",

        "RECEPTION WAITING AREA",

        "SCREENING ROOM",

        "CONSULTATION ROOM",

        "PROCEDURE ROOM",

        "SLUICE ROOM",

        "BLEEDING ROOM",

        "INSPECTION OF TOILET FACILITIES",

        "PHARMACY DISPENSARY",

        "SUPPLIES INSPECTION",

        "RECORDS INFORMATION MANAGEMENT",

        "CUSTOMER SATISFACTION",

        "SPECIMEN RECEPTION ROOM",

        "LABORATORY TESTING AREAS CHEMISTRY",

        "LABORATORY TESTING AREAS HAEMATOLOGY",

        "MICROBIOLOGY",

        "HIV SCREENING",

        "INSTRUMENT WASHING STERILISING ROOM",

        "OTHER"

      ];

      

      // Parse current value as JSON array or initialize as empty array
      let selectedValues = [];
      try {
        if (Array.isArray(value)) {
          selectedValues = value;
        } else if (value && typeof value === 'string') {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            selectedValues = parsed;
          } else {
            // Handle legacy single string values by converting to array
            selectedValues = [value];
          }
        }
      } catch (e) {
        console.warn('Failed to parse facility service departments value, treating as legacy single value:', value);
        // If parsing fails, treat as legacy single value
        if (value && typeof value === 'string') {
          selectedValues = [value];
        } else {
          selectedValues = [];
        }
      }

      console.log('🏥 Parsed facility service departments:', {
        originalValue: value,
        parsedValues: selectedValues,
        isArray: Array.isArray(selectedValues)
      });

      const handleFacilityServiceChange = (optionValue, isChecked) => {
        let newSelectedValues = [...selectedValues];

        if (isChecked) {
          // Add to selection if not already present
          if (!newSelectedValues.includes(optionValue)) {
            newSelectedValues.push(optionValue);
          }
        } else {
          // Remove from selection
          newSelectedValues = newSelectedValues.filter(val => val !== optionValue);
        }

        // Convert to JSON string for storage
        const jsonValue = JSON.stringify(newSelectedValues);
        console.log(`🏥 Facility Service Departments updated:`, {
          selected: newSelectedValues,
          jsonValue: jsonValue
        });

        // Update the global facilityType state via FormPage component (use first selected value)
        if (window.updateSelectedFacilityService && newSelectedValues.length > 0) {
          window.updateSelectedFacilityService(newSelectedValues[0]);
        }

        // Update the selected service departments for section filtering
        if (window.updateSelectedServiceDepartments) {
          window.updateSelectedServiceDepartments(newSelectedValues);
        }

        // Create a synthetic event object for compatibility
        const syntheticEvent = {
          target: {
            value: jsonValue,
            id: fieldId
          }
        };

        onChange(syntheticEvent);
      };

      return (
        <div className={`multiselect-container ${readOnly ? 'readonly' : ''}`}>
          <div className="multiselect-header">
            Select {dataElement.displayName} (multiple selections allowed):
          </div>

          {facilityServiceOptions.map((option, index) => {
            const isSelected = selectedValues.includes(option);
            return (
              <div key={index} className={`multiselect-option ${readOnly ? 'readonly' : ''}`}>
                <input
                  type="checkbox"
                  id={`${fieldId}_${index}`}
                  checked={isSelected}
                  onChange={(e) => handleFacilityServiceChange(option, e.target.checked)}
                  disabled={readOnly}
                  className="multiselect-checkbox"
                />
                <label
                  htmlFor={`${fieldId}_${index}`}
                  className={`multiselect-label ${readOnly ? 'readonly' : ''}`}
                >
                  {option}
                </label>
              </div>
            );
          })}

          {selectedValues.length > 0 && (
            <div className="multiselect-summary">
              <strong>Selected ({selectedValues.length}):</strong> {selectedValues.join(', ')}
            </div>
          )}
        </div>
      );

    }

    

    // Handle dynamic service dropdown (overrides static optionSet)

    if (dynamicOptions !== null) {

      const isMandatory = isMandatoryField();

      console.log(`🔄 ALWAYS LOG: Using dynamic service dropdown for "${dataElement.displayName}"`);

      return (

        <select

          id={fieldId}

          value={value || ''}

          onChange={onChange}

          className={`form-select ${error ? 'error' : ''} ${getFilledClass()}`}

          disabled={readOnly || isLoading}

        >

          <option value="">

            {isLoading ? 'Loading service sections...' : 

             `Select ${dataElement.displayName}`}

          </option>

          {dynamicOptions.map((section, index) => {

            // Handle both string and object options

            const optionValue = typeof section === 'object' && section !== null 

              ? (section.id || section.code || JSON.stringify(section))

              : String(section);

              

            const optionText = typeof section === 'object' && section !== null

              ? (section.displayName || section.name || section.id || JSON.stringify(section))

              : String(section);

              

            return (

              <option key={index} value={optionValue}>

                {optionText}

            </option>

            );

          })}

        </select>

      );

    }



    // For Service fields without dynamic options, show error message

    if (serviceFieldType && serviceFieldType !== 'facility_service_departments' && dynamicOptions === null) {

      console.log(`❌ ALWAYS LOG: Service field "${dataElement.displayName}" has no dynamic options available`);

      return (

        <div className="form-field-error">

          <select

            id={fieldId}

            value=""

            disabled={true}

            className="form-select error"

          >

            <option value="">No service options available</option>

          </select>

          <div className="error-message">Service options could not be loaded</div>

        </div>

      );

    }



    // For Service fields, only use dynamic options - no static optionSet fallback

    // For non-Service fields, check if field has optionSet (dropdown), regardless of valueType

    if (!serviceFieldType && dataElement.optionSet && dataElement.optionSet.options) {

      

      console.log(`📋 ALWAYS LOG: Dropdown field "${dataElement.displayName}":`, {

        optionSetId: dataElement.optionSet.id,

        optionsCount: dataElement.optionSet.options.length,

        options: dataElement.optionSet.options.map(opt => ({

          id: opt.id,

          code: opt.code,

          displayName: opt.displayName,

          sortOrder: opt.sortOrder

        }))

      });

      

      return (

        <select

          id={fieldId}

          value={value || ''}

          onChange={onChange}

          className={`form-select ${error ? 'error' : ''} ${getFilledClass()}`}

          disabled={readOnly}

        >

          <option value="">Select an option</option>

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

    

    // Debug: Check if field should have options but doesn't - removed



    // Then handle by valueType

    

    console.log(`🎯 ALWAYS LOG: Field "${dataElement.displayName}" using valueType switch (${dataElement.valueType})`);

    

    switch (dataElement.valueType) {

      case 'TEXT':

        console.log(`🔍 ALWAYS LOG: TEXT field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <input

            type="text"

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            placeholder="Enter text"

            className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

            readOnly={readOnly}

            disabled={readOnly}

          />

        );



      case 'LONG_TEXT':

        console.log(`🔍 ALWAYS LOG: LONG_TEXT field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <textarea

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            placeholder="Enter details"

            className={`form-textarea ${error ? 'error' : ''} ${getFilledClass()}`}

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

        console.log(`🔍 ALWAYS LOG: NUMBER field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <input

            type="number"

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            placeholder="Enter number"

            className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

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

        console.log(`🔍 ALWAYS LOG: DATE field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <input

            type="date"

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

            readOnly={readOnly}

            disabled={readOnly}

          />

        );



      case 'DATETIME':

        console.log(`🔍 ALWAYS LOG: DATETIME field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <input

            type="datetime-local"

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

            readOnly={readOnly}

            disabled={readOnly}

          />

        );



      case 'BOOLEAN':

      case 'TRUE_ONLY':

        console.log(`🔍 ALWAYS LOG: BOOLEAN field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <div className={`checkbox-group boolean-field ${getFilledClass()}`}>

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

        console.log(`🔍 ALWAYS LOG: EMAIL field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <input

            type="email"

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            placeholder="Enter date"

            className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

            readOnly={readOnly}

            disabled={readOnly}

          />

        );



      case 'PHONE_NUMBER':

        console.log(`🔍 ALWAYS LOG: PHONE_NUMBER field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <input

            type="tel"

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            placeholder="Enter time"

            className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

            readOnly={readOnly}

            disabled={readOnly}

          />

        );



      case 'URL':

        console.log(`🔍 ALWAYS LOG: URL field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <input

            type="url"

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            placeholder="Enter percentage"

            className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

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

        

        console.log(`🔍 ALWAYS LOG: COORDINATE field ${fieldId}:`, { 

          value, 

          dataElement: dataElement.displayName,

          valueType: dataElement.valueType,

          fieldId: fieldId

        });

        

        return (

          <div className={`coordinate-field ${getFilledClass()}`}>

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

                className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

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



          </div>

        );



      default:

        // Default to text input

        console.log(`⚠️ ALWAYS LOG: Field "${dataElement.displayName}" using default text input (valueType: ${dataElement.valueType})`);

        return (

          <input

            type="text"

            id={fieldId}

            value={value || ''}

            onChange={onChange}

            placeholder="Enter value"

            className={`form-input ${error ? 'error' : ''} ${getFilledClass()}`}

            readOnly={readOnly}

            disabled={readOnly}

          />

        );

    }

  };



  // Handle comment changes
  const handleCommentChange = (newComment) => {
    setCommentText(newComment);
    if (onCommentChange) {
      onCommentChange(dataElement.id, newComment);
    }
  };

  // Handle comment toggle
  const toggleCommentField = () => {
    setShowCommentField(!showCommentField);
  };

  return (

    <div className="form-field">

      {/* Test indicators removed */}



      <div className="field-header">
        <label htmlFor={fieldId} className="form-label">
          {dataElement.displayName}
        </label>

        {/* Comment Toggle Button */}
        <button
          type="button"
          className={`comment-toggle-btn ${showCommentField ? 'active' : ''} ${commentText ? 'has-comment' : ''}`}
          onClick={toggleCommentField}
          title={commentText ? 'Edit comment' : 'Add comment'}
        >
          {commentText ? '💬' : '💭'}
        </button>
      </div>

      {renderField()}

      {/* Comment Field */}
      {showCommentField && (
        <div className="comment-field-container">
          <textarea
            className="comment-field"
            placeholder="Add your comment or observation..."
            value={commentText}
            onChange={(e) => handleCommentChange(e.target.value)}
            rows={3}
          />
          <div className="comment-actions">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setShowCommentField(false)}
            >
              Save Comment
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setCommentText('');
                handleCommentChange('');
                setShowCommentField(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {error && <div className="field-error">{error}</div>}

    </div>

  );

}



  // Section component for organizing form fields
  function FormSection({ section, formData, onChange, errors, serviceSections, loadingServiceSections, readOnlyFields = {}, getCurrentPosition, formatCoordinatesForDHIS2, facilityClassifications = [], loadingFacilityClassifications = false, inspectionInfoConfirmed = false, setInspectionInfoConfirmed = () => {}, areAllInspectionFieldsComplete = () => false, showDebugPanel = false, getCurrentFacilityClassification = () => null, facilityType = null, onCommentChange, comments = {} }) {
    console.log(`📝 Rendering FormSection: ${section.displayName}, Facility Type: ${facilityType}`);
    console.log(`🔍 SECTION FILTER DEBUG: Section="${section.displayName}", FacilityType="${facilityType}", HasDataElements=${!!section.dataElements}, DataElementsCount=${section.dataElements?.length || 0}`);
    console.log(`🔍 DETAILED SECTION DEBUG:`, {
      sectionId: section.id,
      sectionDisplayName: section.displayName,
      facilityType: facilityType,
      facilityTypeType: typeof facilityType,
      facilityTypeLength: facilityType?.length,
      dataElementsCount: section.dataElements?.length || 0
    });

    // Safety check - if section is undefined, return null
    if (!section) {
      console.warn('🚨 FormSection: section prop is undefined, returning null');
      return null;
    }

    // Pagination state for dataElements

    const [currentPage, setCurrentPage] = useState(0);

    const baseFieldsPerPage = 5;

    

    // Function to check if a field is a comment/remarks field (case-insensitive)

    const isCommentField = (dataElement) => {

      if (!dataElement || !dataElement.displayName) return false;

      const name = dataElement.displayName;

      const commentSuffixRegex = /\s*(Comments?|Remarks?)\s*$/i;

      return commentSuffixRegex.test(name);

    };

    

    // Filter data elements based on selected facility service

    const filterDataElements = (dataElements) => {

      if (!facilityType || !dataElements || !Array.isArray(dataElements)) {

        return dataElements;

      }



      console.log(`🔍 Pre-pagination filtering for section "${section.displayName}" with facility type "${facilityType}"`);



      return dataElements.filter(psde => {

        if (!psde || !psde.dataElement) return false;

        const displayName = psde.dataElement.displayName;
        console.log(`🔎 Filtering Data Element: ${displayName}, Section: ${section.displayName}, Facility Type: ${facilityType}`);
        console.log(`🔍 EXACT VALUES: DataElement="${displayName}", Section="${section.displayName}", FacilityType="${facilityType}"`);

        // Hide specialisation/facility classification fields from users (they're handled by manual selector)
        const isSpecialisationField = /specialisation|facility classification|facility type/i.test(displayName);
        if (isSpecialisationField) {
          console.log(`🚫 Hiding specialisation field from user: ${displayName}`);
          return false; // Hide these fields from users
        }

        // Check if this is a Comments/Remarks data element
        const isComment = /\s*(Comments?|Remarks?)\s*$/i.test(displayName);
        
        if (isComment) {
          // For Comments/Remarks elements, check if the main element would pass the filter
          // Extract main element name by removing comment/remarks suffix
          const mainElementName = displayName.replace(/\s*(Comments?|Remarks?)\s*$/i,'');
          
          console.log(`💬 Comment/Remarks element detected: "${displayName}" -> Main: "${mainElementName}"`);
          
          // Check if the main element passes the filter
          const mainElementPasses = shouldShowDataElementForService(
            mainElementName,
            facilityType
          );
          
          if (!mainElementPasses) {
            console.log(`🔍 Hiding comment/remarks element "${displayName}" because main element doesn't pass filter`);
          }
          
          return mainElementPasses;
        } else {
          // For main elements, use the standard filter
          const shouldShow = shouldShowDataElementForService(
            displayName,
          facilityType
        );

        if (!shouldShow) {
            console.log(`🔍 Pre-pagination filter: Hiding "${displayName}" in section "${section.displayName}"`);
        }

        return shouldShow;
        }

      });

    };

    

    // Get filtered data elements

    // const filteredDataElements = filterDataElements(section.dataElements);



    const [filteredDataElements, setFilteredDataElements] = useState([]);





    useEffect(() => {
      console.log(`🔄 useEffect triggered for section: ${section.displayName}, facilityType: ${facilityType}, dataElements count: ${section.dataElements?.length || 0}`);

      const filterAsync = async () => {

        if (!facilityType || !section.dataElements) {
          console.log(`⚠️ Early return: facilityType="${facilityType}", dataElements=${section.dataElements?.length || 0}`);
          console.log(`🔍 FILTER DEBUG: Section="${section.displayName}" - No filtering applied, showing all ${section.dataElements?.length || 0} elements`);
          setFilteredDataElements(section.dataElements || []);

          return;

        }

        // Exclude certain sections from filtering: show all their fields
        const sectionName = (section.displayName || '');
        const lowerName = sectionName.toLowerCase();
        if (sectionName === 'Inspection Type' || lowerName.includes('document review')) {
          console.log('🔍 FILTER BYPASS: Special section - showing all data elements');
          setFilteredDataElements(section.dataElements || []);
          return;
        }

        console.log(`🔍 FILTER DEBUG: Starting filtering for Section="${section.displayName}", FacilityType="${facilityType}", Elements=${section.dataElements.length}`);

        const results = await Promise.all(

            section.dataElements.map(async (psde) => {

              if (!psde || !psde.dataElement) return false;

              const displayName = psde.dataElement.displayName;
              console.log(`🔎 Async Filtering Data Element: ${displayName}, Section: ${section.displayName}, Facility Type: ${facilityType}`);

              // Hide specialisation/facility classification fields from users (they're handled by manual selector)
              const isSpecialisationField = /specialisation|facility classification|facility type/i.test(displayName);
              if (isSpecialisationField) {
                console.log(`🚫 Async: Hiding specialisation field from user: ${displayName}`);
                return false; // Hide these fields from users
              }

              // Check if this is a Comments/Remarks data element
              const isComment = /\s*(Comments?|Remarks?)\s*$/i.test(displayName);
              
              if (isComment) {
                // For Comments/Remarks elements, check if the main element would pass the filter
                const mainElementName = displayName.replace(/\s*(Comments?|Remarks?)\s*$/i,'');
                
                console.log(`💬 Async: Comment/Remarks element detected: "${displayName}" -> Main: "${mainElementName}"`);
                
                const mainElementPasses = await shouldShowDataElementForService(
                    mainElementName,
                    facilityType
                );
                console.log(`🔎 Async Filter Result for comment/remarks: ${displayName} -> ${mainElementPasses} (based on main element)`);
                return mainElementPasses;
              } else {
                // For main elements, use the standard filter
                const shouldShow = await shouldShowDataElementForService(
                    displayName,
                    facilityType
                );
                console.log(`🔎 Async Filter Result: ${displayName} -> ${shouldShow}`);
              return shouldShow;
              }

            })

        );

        const filtered = section.dataElements.filter((_, idx) => results[idx]);
        console.log(`✅ Filtering complete: ${filtered.length} elements shown out of ${section.dataElements.length} total`);
        setFilteredDataElements(filtered);

      };

      filterAsync();

    }, [section.dataElements, section.displayName, facilityType]);



    // Calculate optimal page boundaries to avoid starting with comment fields

    const calculatePageBoundaries = () => {

      if (!filteredDataElements || filteredDataElements.length === 0) {

        return { pages: [], totalPages: 0 };

      }

      

      // Check if this is one of the sections that should start expanded

         const isInspectionInfoSection = (section.displayName || '').toLowerCase() === 'inspection information';
      
         const isInspectionTypeSection = (section.displayName || '').toLowerCase() === 'inspection type';

      

      // For Inspection Type section, show all fields on one page (no pagination)

      if (isInspectionTypeSection) {

        return { 

          pages: [{ 

            start: 0, 

            end: filteredDataElements.length, 

            size: filteredDataElements.length,

            fields: filteredDataElements 

          }], 

          totalPages: 1 

        };

      }

      

      const pages = [];

      let currentIndex = 0;

      

      while (currentIndex < filteredDataElements.length) {

        let pageSize = baseFieldsPerPage;

        let endIndex = currentIndex + pageSize;

        

        // Check if the next field after this page would be a comment field

        if (endIndex < filteredDataElements.length) {

          const nextField = filteredDataElements[endIndex];

          if (isCommentField(nextField.dataElement)) {

            // Extend this page to include the comment field

            endIndex++;

            pageSize++;

          }

        }

        

        // Ensure we don't exceed total length

        endIndex = Math.min(endIndex, filteredDataElements.length);

        pageSize = endIndex - currentIndex;

        

        pages.push({

          start: currentIndex,

          end: endIndex,

          size: pageSize,

          fields: filteredDataElements.slice(currentIndex, endIndex)

        });

        

        currentIndex = endIndex;

      }

      

      return { pages, totalPages: pages.length };

    };

    

    const { pages, totalPages } = calculatePageBoundaries();

    const currentPageData = pages[currentPage] || { start: 0, end: 0, size: 0, fields: [] };

    const visibleFields = currentPageData.fields;

    const startIndex = currentPageData.start;

    const endIndex = currentPageData.end;

    

    // Auto-scroll to section top helper function
    const scrollToSectionTop = () => {
      // Small delay to ensure page content has updated
      setTimeout(() => {
        const sectionElement = document.querySelector(`[data-section-id="${section.id}"]`);
        if (sectionElement) {
          sectionElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        } else {
          // Fallback: scroll to section header
          const sectionHeader = document.querySelector('.section-header');
          if (sectionHeader) {
            sectionHeader.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            });
          }
        }
      }, 100);
    };

    // Navigation functions

    const goToNextPage = () => {

      if (currentPage < totalPages - 1) {

        setCurrentPage(prev => prev + 1);
        scrollToSectionTop();

      }

    };



    const goToPreviousPage = () => {

      if (currentPage > 0) {

        setCurrentPage(prev => prev - 1);
        scrollToSectionTop();

      }

    };



    const goToPage = (pageNumber) => {

      if (pageNumber >= 0 && pageNumber < totalPages) {

        setCurrentPage(pageNumber);
        scrollToSectionTop();

      }

    };

    

    // Get current page info for display

    const getCurrentPageInfo = () => {

      if (totalPages === 0) return { pageSize: 0, totalFields: 0 };

      return {

        pageSize: currentPageData.size,

        totalFields: section.dataElements?.length || 0

      };

    };



    // IMMEDIATE DEBUGGING - Log everything that comes into this component

    console.log('🚨 FormSection RENDERED with props:', {

      sectionName: section?.displayName,

      sectionId: section?.id,

      dataElementsCount: section?.dataElements?.length || 0,

      dataElements: section?.dataElements,

      formDataKeys: Object.keys(formData || {}),

      errorsKeys: Object.keys(errors || {}),

      readOnlyFieldsKeys: Object.keys(readOnlyFields || {}),

      inspectionInfoConfirmed,

      hasDataElements: !!(section?.dataElements && section.dataElements.length > 0),

      currentPage,

      totalPages,

      visibleFieldsCount: visibleFields.length,

      totalFields: section?.dataElements?.length || 0,

      pageSize: getCurrentPageInfo().pageSize,

      pageBoundaries: pages.map(p => `${p.start}-${p.end}(${p.size})`)

    });



    // Check if this is one of the sections that should start expanded

    const isInspectionInfoSection = (section.displayName || '') === 'Inspection Information';

    const sectionDisplayName = (section.displayName || '');
    const isInspectionTypeSection = sectionDisplayName === 'Inspection Type';

    const isDocumentReviewSection = sectionDisplayName.toLowerCase().includes('document review');
    





    // Function to determine if a field should use dynamic service dropdown

    // (Now defined at component level)

        

                    // All fields are optional - no mandatory count needed

                const mandatoryFieldsCount = 0;



    // Always show sections with data elements

    const hasDataElements = section.dataElements && section.dataElements.length > 0;

    const shouldShow = hasDataElements || isInspectionInfoSection || isInspectionTypeSection || isDocumentReviewSection;

    // Helper to decide visibility consistent with filter logic, including Comments pairing
    const shouldShowForName = (name) => {
      if (isInspectionTypeSection || isDocumentReviewSection) return true; // Exclude from filters
      if (!name) return false;
      // Always show headers regardless of service filter
      if (isSectionHeaderName(name)) return true;
      const lower = name.toLowerCase();
      const isComment = lower.includes('comments') || lower.includes('comment') || lower.includes('remarks');
      if (isComment) {
        const mainElementName = name
          .replace(/\s*Comments?\s*$/i, '')
          .replace(/\s*Remarks?\s*$/i, '')
          .trim();
        return shouldShowDataElementForService(mainElementName, facilityType);
      }
      return shouldShowDataElementForService(name, facilityType);
    };

    // Compute unmatched (hidden) DEs for debug vis
    const unmatchedDEs = (isInspectionTypeSection || isDocumentReviewSection) ? [] : ((section.dataElements || [])
      .filter(psde => psde?.dataElement && !shouldShowForName(psde.dataElement.displayName))
      .map(psde => psde.dataElement.displayName));


    console.log('🚨 FormSection logic check:', {

      hasDataElements,

      isInspectionInfoSection,

      isInspectionTypeSection,

      shouldShow,

      willRender: shouldShow

    });



    if (!shouldShow) {

      console.log('🚨 FormSection NOT SHOWING - returning null');

      return null;

    }



    return (

      <div className="form-section" data-section-id={section.id}>

        {/* Section Debug Panel - collapsed by default */}
        {(
          <details
            open={false}
            style={{ marginBottom: '8px' }}
          >
            <summary style={{ cursor: 'pointer', fontSize: '12px' }}>🔍 Section Debug: {section.displayName}</summary>
        <div style={{
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '4px',
          padding: '8px',
              marginTop: '6px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <strong>Facility Type:</strong> {facilityType || 'null'} |
          <strong>Elements:</strong> {filteredDataElements.length}/{section.dataElements?.length || 0} |
          <strong>Page:</strong> {currentPage + 1}/{Math.ceil(filteredDataElements.length / baseFieldsPerPage)}

          {/* Unmatched (hidden) Data Elements list */}
          {showDebugPanel && unmatchedDEs && unmatchedDEs.length > 0 && (
            <div style={{
              marginTop: '6px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeeba',
              borderRadius: '4px',
              padding: '6px'
            }}>
              <strong style={{ color: '#8a6d3b' }}>Unmatched (hidden) DEs:</strong> {unmatchedDEs.length}
              <div style={{ maxHeight: '90px', overflow: 'auto', marginTop: '4px' }}>
                {unmatchedDEs.slice(0, 12).map((name, idx) => (
                  <div key={`${section.id}-unmatched-${idx}`}>{name}</div>
                ))}
                {unmatchedDEs.length > 12 && (
                  <div>... and {unmatchedDEs.length - 12} more</div>
                )}
              </div>
            </div>
          )}

          {/* DHIS2 DEs returned for Inspection Type section */}
          {showDebugPanel && isInspectionTypeSection && section.dataElements && section.dataElements.length > 0 && (
            <div style={{
              marginTop: '6px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e2e3e5',
              borderRadius: '4px',
              padding: '6px'
            }}>
              <strong>DHIS2 Data Elements (Inspection Type):</strong> {section.dataElements.length}
              <div style={{ maxHeight: '140px', overflow: 'auto', marginTop: '4px' }}>
                {section.dataElements.map((psde, idx) => (
                  <div key={`${section.id}-dhis2-${psde?.dataElement?.id || idx}`}>
                    {psde?.dataElement?.displayName || 'UNKNOWN'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
          </details>
        )}

        <div className={`section-header ${isInspectionInfoSection || isInspectionTypeSection ? 'always-expanded-section' : 'collapsible-section'}`}>

          <h3 className="section-title">

            {section.displayName}

            {/* Visible DE count badge */}
            <span
              className="visible-de-count"
              title={`${filteredDataElements.length} data elements visible in this section`}
              style={{
                fontSize: '0.8em',
                color: '#0c5460',
                marginLeft: '8px',
                backgroundColor: '#d1ecf1',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #bee5eb'
              }}
            >
              📄 {filteredDataElements.length} shown
            </span>

            {/* Display filtered DE count if any */}

            {(() => {

              const currentFacilityClassification = getCurrentFacilityClassification();

              if (currentFacilityClassification) {

                const filteredCount = getFilteredDataElementCount(section.displayName, currentFacilityClassification);

                if (filteredCount > 0) {

                  return (

                    <span 

                      className="filtered-de-count" 

                      title={`${filteredCount} data elements filtered out for ${currentFacilityClassification}`}

                      style={{ 

                        fontSize: '0.8em', 

                        color: '#e74c3c', 

                        marginLeft: '8px',

                        backgroundColor: '#fdf2f2',

                        padding: '2px 6px',

                        borderRadius: '4px',

                        border: '1px solid #fecaca'

                      }}

                    >

                      🚫 {filteredCount} filtered

              </span>

                  );

                }

              }

              return null;

            })()}

            



          </h3>

        </div>

        

        <div className="section-content">

          {section.description && (

            <p className="section-description">{section.description}</p>

          )}



          <div className="section-fields">

            {/* Debug info removed */}



            {/* All debug sections removed */}







            {/* Render data elements with pagination */}

            {section.dataElements && section.dataElements.length > 0 ? (

              <>

                {/* Render visible fields for current page */}

                {visibleFields.map((psde, index) => {

                  // Safety check for psde and dataElement

                  if (!psde || !psde.dataElement) {

                    console.warn('🚨 FormSection: Invalid psde or dataElement:', psde);

                    return null;

                  }

                  

                  // No need to filter here - already filtered before pagination

                  

                  const serviceFieldType = enhancedServiceFieldDetection(psde.dataElement);

                  // Check if this is a dynamic service field (true or string type indicating special handling)

                  const isDynamicServiceField = !!serviceFieldType && serviceFieldType !== 'facility_service_departments';

                  const actualIndex = startIndex + index; // Global index for proper field identification

                  

                  // Log field rendering for debugging

                  if (showDebugPanel) {

                    console.log(`🔍 RENDERING FIELD: "${psde.dataElement.displayName}"`, {

                      sectionName: section.displayName,

                      fieldIndex: actualIndex,

                      totalFields: section.dataElements.length,

                      id: psde.dataElement.id,

                      valueType: psde.dataElement.valueType,

                      currentPage,

                      pageIndex: index

                    });

                  }



                  // Hide specific IDs in Inspection Type section while keeping them assigned

                  const dn = (psde?.dataElement?.displayName || '').toLowerCase();

                  const shouldHideInspectionId = isInspectionTypeSection && (dn.includes('inspection') && dn.includes('id'));



                  // Render subsection header (no input) if name ends with "--"
                  const deName = psde?.dataElement?.displayName || '';
                  if (isSectionHeaderName(deName)) {
                    const headerText = normalizeSectionHeaderName(deName);
                    return (
                      <div key={`header-${psde.dataElement.id}-${actualIndex}`} style={{ fontWeight: 600, margin: '16px 0 8px' }}>
                        {headerText}
                      </div>
                    );
                  }

                  return (

                    <div key={`field-container-${psde.dataElement.id}-${actualIndex}`} style={shouldHideInspectionId ? { display: 'none' } : undefined}>

                      <FormField

                        key={`${psde.dataElement.id}-${actualIndex}`}

                        psde={psde}

                        value={formData[`dataElement_${psde.dataElement.id}`]}

                        onChange={(e) => {

                          console.log(`🔍 onChange called for field: ${psde.dataElement.displayName}`, {

                            fieldId: `dataElement_${psde.dataElement.id}`,

                            value: e.target.value,

                            event: e

                          });

                          onChange(`dataElement_${psde.dataElement.id}`, e.target.value);

                        }}

                        error={errors[`dataElement_${psde.dataElement.id}`]}

                        dynamicOptions={isDynamicServiceField ? serviceSections : null}
                        staticText={(isInspectionTypeSection && psde.dataElement.displayName === 'Source') ? 'MOH' : undefined}

                        isLoading={isDynamicServiceField ? loadingServiceSections : false}

                        readOnly={ (isInspectionTypeSection && psde.dataElement.displayName === 'Source') ? true : !!readOnlyFields[`dataElement_${psde.dataElement.id}`] }

                        getCurrentPosition={getCurrentPosition}

                        formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}

                        onCommentChange={onCommentChange}

                        comments={comments}

                      />

                    </div>

                  );

                }).filter(Boolean)}

                

                {/* Pagination Navigation - Hide for Inspection Type section */}

                {totalPages > 1 && !isInspectionTypeSection && (

                  <div className="pagination-container" style={{

                    display: 'flex',

                    justifyContent: 'space-between',

                    alignItems: 'center',

                    margin: '24px 0',

                    padding: '16px',

                    backgroundColor: '#f8f9fa',

                    borderRadius: '8px',

                    border: '1px solid #dee2e6'

                  }}>

                    {/* Previous Button */}

                    <button

                      type="button"

                      onClick={goToPreviousPage}

                      disabled={currentPage === 0}

                      className="btn btn-outline-secondary"

                      style={{

                        padding: '8px 16px',

                        fontSize: '14px',

                        opacity: currentPage === 0 ? 0.5 : 1,

                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer'

                      }}

                    >

                      ← Previous

                    </button>

                    {/* Page Indicator */}
                    <div className="page-indicator" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: '#495057',
                      fontWeight: '500'
                    }}>
                      <span>Page {currentPage + 1} of {totalPages}</span>

                      {/* Page dots for visual indication */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                          const pageIndex = totalPages <= 5 ? index :
                            currentPage < 3 ? index :
                            currentPage > totalPages - 3 ? totalPages - 5 + index :
                            currentPage - 2 + index;

                          return (
                            <div
                              key={pageIndex}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: pageIndex === currentPage ? '#007bff' : '#dee2e6',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onClick={() => setCurrentPage(pageIndex)}
                              title={`Go to page ${pageIndex + 1}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Next Button */}

                    <button

                      type="button"

                      onClick={goToNextPage}

                      disabled={currentPage === totalPages - 1}

                      className="btn btn-outline-secondary"

                      style={{

                        padding: '8px 16px',

                        fontSize: '14px',

                        opacity: currentPage === totalPages - 1 ? 0.5 : 1,

                        cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer'

                      }}

                    >

                      Next →

                    </button>

                  </div>

                )}

                

                {/* Quick Page Navigation - Fields summary removed */}

                {totalPages > 5 && (

                  <div className="quick-page-nav" style={{

                    textAlign: 'center',

                    margin: '16px 0',

                    padding: '12px',

                    backgroundColor: '#e3f2fd',

                    borderRadius: '6px'

                  }}>

                    <span style={{ fontSize: '12px', color: '#1976d2', marginRight: '12px' }}>

                      Jump to page:

                    </span>

                    {Array.from({ length: Math.min(10, totalPages) }, (_, i) => (

                      <button

                        key={i}

                        type="button"

                        onClick={() => goToPage(i)}

                        className={`btn ${currentPage === i ? 'btn-primary' : 'btn-outline-primary'}`}

                        style={{

                          padding: '4px 8px',

                          margin: '0 2px',

                          fontSize: '11px',

                          minWidth: '32px'

                        }}

                      >

                        {i + 1}

                      </button>

                    ))}

                    {totalPages > 10 && (

                      <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>

                        ... and {totalPages - 10} more

                      </span>

                    )}

                  </div>

                )}

              </>

            ) : (

              <div style={{ 

                backgroundColor: '#fff3cd', 

                border: '1px solid #ffc107', 

                padding: '12px', 

                margin: '8px 0',

                borderRadius: '4px',

                textAlign: 'center'

              }}>

                ⚠️ No data elements configured for this section

              </div>

            )}



            {/* Add bottom spacing after the last data element */}

            <div className="section-bottom-spacing"></div>

            

            {/* Confirmation Button for Inspection Type Section */}

            {isInspectionTypeSection && areAllInspectionFieldsComplete && areAllInspectionFieldsComplete() && (

              <div className="form-section" data-inspection-type="true" style={{

                backgroundColor: '#f8f9fa',

                border: '2px solid #28a745',

                borderRadius: '8px',

                padding: '16px',

                margin: '16px 0',

                textAlign: 'center'

              }}>

                <div style={{ marginBottom: '12px' }}>

                  <h4 style={{ color: '#28a745', margin: '0 0 8px 0' }}>

                    ✅ Inspection Information & Type Complete

                  </h4>

                  <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>

                    Please confirm that all the information above is correct before proceeding

                  </p>

                </div>

                

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>

                  <label style={{ 

                    display: 'flex', 

                    alignItems: 'center', 

                    gap: '8px', 

                    cursor: 'pointer',

                    fontSize: '16px',

                    color: '#333'

                  }}>

                    <input

                      type="checkbox"

                      checked={inspectionInfoConfirmed}

                      onChange={(e) => setInspectionInfoConfirmed(e.target.checked)}

                      style={{ 

                        width: '20px', 

                        height: '20px',

                        cursor: 'pointer'

                      }}

                    />

                    <span>I confirm that all inspection information and type are correct</span>

                  </label>

                </div>

                

                {inspectionInfoConfirmed && (

                  <div style={{ 

                    marginTop: '12px', 

                    padding: '8px 16px', 

                    backgroundColor: '#d4edda', 

                    color: '#155724', 

                    borderRadius: '4px',

                    border: '1px solid #c3e6cb',

                    fontSize: '14px'

                  }}>

                    ✅ Confirmed! You can now proceed with the inspection form.

                  </div>

                )}

              </div>

            )}

          </div>

        </div>

      </div>

    );

  } // End of FormSection component



  // Function to generate DHIS2 standard ID (11 characters alphanumeric)
  const generateDHIS2Id = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // First character must be a letter (DHIS2 requirement)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    result += letters.charAt(Math.floor(Math.random() * letters.length));

    // Remaining 10 characters can be letters or numbers
    for (let i = 1; i < 11; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    console.log('🆔 Generated DHIS2 ID:', result, `(length: ${result.length})`);
    return result;
  };

  // Main FormPage component

  function FormPage() {

    // Enable debug panel to show data element counts
    const showDebugPanel = false;

    

    const { eventId } = useParams();

    const navigate = useNavigate();
    // Ensure we always have an eventId for incremental saving
    useEffect(() => {
      if (!eventId) {
        const generatedId = `draft-${Date.now().toString(36)}`;
        console.log('🆕 No eventId in route; generating draft id:', generatedId);
        navigate(`/form/${generatedId}`, { replace: true });
      }
    }, [eventId, navigate]);

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

    

    // State to track the facility type for filtering (from dataStore)

    const [facilityType, setFacilityType] = useState(null);

    // State to track facility information from dataStore
    const [facilityInfo, setFacilityInfo] = useState(null);
    const [loadingFacilityInfo, setLoadingFacilityInfo] = useState(false);

    // State to track selected facility service departments for section filtering
    const [selectedServiceDepartments, setSelectedServiceDepartments] = useState([]);

    // Manual specialization selection state
    const [manualSpecialization, setManualSpecialization] = useState('');

    // Save status indicator state
    const [saveStatus, setSaveStatus] = useState({
      isVisible: false,
      message: '',
      type: 'success'
    });

    // Debug panel state - using hardcoded constant from above
    // const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [indexedDBData, setIndexedDBData] = useState(null);

    // Available specialization options
    const specializationOptions = [
      'Gynae Clinics',
      'Laboratory',
      'Psychology clinic',
      'Eye (opthalmologyoptometry  optician) Clinics',
      'physiotheraphy',
      'dental clinic',
      'ENT clinic',
      'Rehabilitation Centre',
      'Potrait clinic',
      'Radiology',
      'clinic',
      'Hospital'
    ];

    // State to track loading of service sections
    const [loadingServiceSections, setLoadingServiceSections] = useState(false);

    // Handle manual specialization selection
    const handleSpecializationChange = (selectedSpecialization) => {
      console.log(`🎯 Manual specialization selected: ${selectedSpecialization}`);
      setManualSpecialization(selectedSpecialization);
      setFacilityType(selectedSpecialization); // Update facility type for filtering
    };

    // Function to determine if a section should be shown based on selected service departments
    const shouldShowSectionForServiceDepartments = (sectionName, selectedDepartments) => {
      // If no departments selected, show all sections
      if (!selectedDepartments || selectedDepartments.length === 0) {
        return true;
      }

      // Always show inspection information and inspection type sections
      const sectionLower = sectionName.toLowerCase();
      if (sectionLower.includes('inspection information') || sectionLower.includes('inspection type')) {
        return true;
      }

      // Map service departments to relevant sections
      const departmentSectionMapping = {
        'ORGANISATION AND MANAGEMENT': ['ORGANISATION AND MANAGEMENT', 'MANAGEMENT', 'ORGANIZATION'],
        'SERVICES PROVIDED': ['SERVICES', 'SERVICE', 'PROVIDED'],
        'PERSONNEL': ['PERSONNEL', 'STAFF', 'HUMAN RESOURCES'],
        'ENVIRONMENT': ['ENVIRONMENT', 'ENVIRONMENTAL', 'FACILITY ENVIRONMENT'],
        'RECEPTION WAITING AREA': ['RECEPTION', 'WAITING', 'WAITING AREA'],
        'SCREENING ROOM': ['SCREENING', 'SCREENING ROOM'],
        'CONSULTATION ROOM': ['CONSULTATION', 'CONSULTATION ROOM'],
        'PROCEDURE ROOM': ['PROCEDURE', 'PROCEDURE ROOM'],
        'SLUICE ROOM': ['SLUICE', 'SLUICE ROOM'],
        'BLEEDING ROOM': ['BLEEDING', 'BLEEDING ROOM'],
        'INSPECTION OF TOILET FACILITIES': ['TOILET', 'FACILITIES', 'SANITATION'],
        'PHARMACY DISPENSARY': ['PHARMACY', 'DISPENSARY', 'MEDICATION'],
        'SUPPLIES INSPECTION': ['SUPPLIES', 'INVENTORY', 'EQUIPMENT'],
        'RECORDS INFORMATION MANAGEMENT': ['RECORDS', 'INFORMATION', 'MANAGEMENT', 'DATA'],
        'CUSTOMER SATISFACTION': ['CUSTOMER', 'SATISFACTION', 'PATIENT SATISFACTION'],
        'SPECIMEN RECEPTION ROOM': ['SPECIMEN', 'RECEPTION', 'SAMPLE'],
        'LABORATORY TESTING AREAS CHEMISTRY': ['LABORATORY', 'CHEMISTRY', 'LAB', 'TESTING'],
        'LABORATORY TESTING AREAS HAEMATOLOGY': ['HAEMATOLOGY', 'HEMATOLOGY', 'BLOOD'],
        'MICROBIOLOGY': ['MICROBIOLOGY', 'MICRO', 'BACTERIA'],
        'HIV SCREENING': ['HIV', 'SCREENING', 'TESTING'],
        'INSTRUMENT WASHING STERILISING ROOM': ['INSTRUMENT', 'STERILISING', 'STERILIZATION', 'WASHING'],
        'OTHER': [] // OTHER shows all sections
      };

      // Check if any selected department maps to this section
      for (const department of selectedDepartments) {
        if (department === 'OTHER') {
          return true; // OTHER shows all sections
        }

        const keywords = departmentSectionMapping[department] || [];
        for (const keyword of keywords) {
          if (sectionName.toUpperCase().includes(keyword.toUpperCase())) {
            console.log(`✅ Section "${sectionName}" matches department "${department}" via keyword "${keyword}"`);
            return true;
          }
        }
      }

      console.log(`🚫 Section "${sectionName}" not relevant for selected departments:`, selectedDepartments);
      return false;
    };

    

    // Set up global handler for updating the facilityType state

    useEffect(() => {

      window.updateSelectedFacilityService = (value) => {

        console.log(`🏥 Setting facility type: ${value}`);

        setFacilityType(value);

      };

      // Global function to update selected service departments
      window.updateSelectedServiceDepartments = (departments) => {
        console.log(`🏥 Setting selected service departments:`, departments);
        setSelectedServiceDepartments(departments);
      };

      return () => {
        // Cleanup global functions
        delete window.updateSelectedFacilityService;
        delete window.updateSelectedServiceDepartments;
      };

      

      // Clean up

      return () => {

        delete window.updateSelectedFacilityService;

      };

    }, []);

    // TODO: Monitor formData changes to update selected service departments
    // Temporarily disabled to fix initialization error
    // useEffect(() => {
    //   const facilityServiceDepartmentsField = 'dataElement_jpcDY2i8ZDE';
    //   if (formData && formData[facilityServiceDepartmentsField]) {
    //     try {
    //       const parsedDepartments = JSON.parse(formData[facilityServiceDepartmentsField]);
    //       if (Array.isArray(parsedDepartments)) {
    //         setSelectedServiceDepartments(parsedDepartments);
    //       }
    //     } catch (e) {
    //       console.warn('Failed to parse service departments');
    //     }
    //   }
    // }, [formData]);

    // Function to filter out unwanted sections (including those starting with "Pre")

    const filterUnwantedSections = (sections) => {

      if (!sections || !Array.isArray(sections)) return [];

      

      // Filter out unwanted sections including those starting with "Pre"

      const filtered = sections.filter(section => {
        const displayName = section.displayName || '';
        
        // Check if section starts with "Pre" (case-insensitive)
        if (displayName.toLowerCase().startsWith('pre')) {
          console.log(`🚫 Filtering out section starting with "Pre": "${displayName}"`);
          return false;
        }
        
        // Also filter out these specific sections
        if (displayName === "Final_Inspection_Event" || 
            displayName === "Preliminary-Report" ||
            displayName === "Inspectors Details") {
          console.log(`🚫 Filtering out specific section: "${displayName}"`);
          return false;
        }
        
        return true;
      });

      console.log('🔍 filterUnwantedSections: Filtered sections:', {
        original: sections.length,
        filtered: filtered.length,
        removed: sections.length - filtered.length,
        removedSections: sections
          .filter(s => !filtered.includes(s))
          .map(s => s.displayName)
      });

      return filtered;

    };



    // Function to parse CSV and extract facility classifications

    const parseCSVClassifications = (csvContent) => {

      try {

        // Split CSV content into lines

        const lines = csvContent.split('\n');

        if (lines.length < 2) return [];

        

        // Get the second line (index 1) which contains the actual facility classification names

        // Skip the first line which just has numbers

        const classificationRow = lines[1].split(',');

        

        // Extract facility classifications (skip the first empty column)

        const classifications = classificationRow.slice(1).map(col => col.trim()).filter(col => col.length > 0);

        

        console.log('Parsed facility classifications from CSV:', classifications);

        return classifications;

      } catch (error) {

        console.error('Error parsing CSV:', error);

        return [];

      }

    };



    // Function to load facility classifications from CSV

    const loadFacilityClassifications = async () => {

      setLoadingFacilityClassifications(true);

      try {

        // For now, we'll use the hardcoded CSV content

        // In a real implementation, you might fetch this from an API or file

        const csvContent = `,1,2,3,4,5,6,7,8,9,10,11

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

tax clearance certificate,?,?,?,?,,?,?,?,?,?

Practitioners licence,?,?,?,?,?,?,?,?,?,?,?

Fire clearance,?,?,?,?,?,?,?,?,?,?,?

work permits,?,?,?,?,?,?,?,?,?,?,?

residence permit,?,?,?,,?,?,?,?,?,?

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

Waste management,?,?,?,?,?,?,?,?,?,?,?`;

        

        const classifications = parseCSVClassifications(csvContent);

        setFacilityClassifications(classifications);

      } catch (error) {

        console.error('Error loading facility classifications:', error);

        showToast('Failed to load facility classifications', 'error');

      } finally {

        setLoadingFacilityClassifications(false);

      }

    };



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



    // Function to automatically assign GPS coordinates to all coordinate fields

    const autoAssignGPSCoordinates = async () => {

      if (!navigator.geolocation) {

        console.log('⚠️ Geolocation not supported by browser');

        return;

      }



      if (!configuration?.programStage?.allDataElements) {

        console.log('⚠️ Configuration not ready yet');

        return;

      }



      // Find all coordinate fields

      const coordinateFields = configuration.programStage.allDataElements.filter(psde => {

        const fieldName = (psde.dataElement.displayName || psde.dataElement.shortName || '').toLowerCase();

        return fieldName.includes('coordinates') || fieldName.includes('coordinate') || fieldName.includes('gps') || fieldName.includes('location');

      });



      if (coordinateFields.length === 0) {

        console.log('ℹ️ No coordinate fields found in form');

        return;

      }



      console.log(`🔍 Found ${coordinateFields.length} coordinate field(s) to auto-fill`);



      return new Promise((resolve, reject) => {

        navigator.geolocation.getCurrentPosition(

          (position) => {

            const { latitude, longitude } = position.coords;

            const coordinates = `[${longitude.toFixed(6)},${latitude.toFixed(6)}]`;

            

            console.log(`📍 Auto-capturing GPS coordinates: ${coordinates}`);

            

            // Update all coordinate fields in formData

            const updates = {};

            coordinateFields.forEach(psde => {

              const fieldName = `dataElement_${psde.dataElement.id}`;

              updates[fieldName] = coordinates;

              console.log(`✅ Auto-filled field "${psde.dataElement.displayName}" with coordinates: ${coordinates}`);

            });



            // Update form data with all coordinate values

            setFormData(prev => ({

              ...prev,

              ...updates

            }));



            // Update GPS state for debugging

            setGpsCoordinates({

              latitude: latitude.toFixed(6),

              longitude: longitude.toFixed(6),

              accuracy: position.coords.accuracy ? `${position.coords.accuracy.toFixed(2)}m` : 'Unknown',

              timestamp: new Date(position.timestamp).toLocaleString(),

              fieldId: 'auto-assigned',

              dhis2Format: coordinates

            });



            showToast(`Auto-assigned GPS coordinates to ${coordinateFields.length} field(s): ${coordinates}`, 'success');

            resolve(coordinates);

          },

          (error) => {

            let errorMessage = 'Failed to auto-assign GPS coordinates';

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

            console.error('❌ GPS auto-assignment error:', error);

            showToast(errorMessage, 'error');

            reject(error);

          },

          {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 60000

          }

        );

      });

    };



    // Add debug effect

    useEffect(() => {

      console.log('FormPage - userAssignments received:', userAssignments);

    }, [userAssignments]);



    const [formData, setFormData] = useState({

      orgUnit: '',

      eventDate: (() => {

        // Ensure we always have a valid date

        const today = new Date();

        if (!isNaN(today.getTime())) {

          return today.toISOString().split('T')[0];

        }

        // Fallback to a known good date if current date fails

        return '2025-01-01';

      })(),

    });

    // Get facility information from dataStore when form loads
    useEffect(() => {
      const getFacilityInfoFromDataStore = async () => {
        // Wait for all required dependencies to be available
        if (!formData.orgUnit || !api || !configuration) {
          console.log('⏳ Waiting for form dependencies to load...');
          setFacilityInfo(null);
          return;
        }

        setLoadingFacilityInfo(true);
        setFacilityInfo(null); // Clear previous facility info

        try {
          console.log('🔍 Getting facility information from dataStore for:', formData.orgUnit);

          // First try to get from userAssignments (which may have more complete info)
          let facilityData = null;

          if (userAssignments && userAssignments.length > 0) {
            const userAssignment = userAssignments.find(assignment =>
              assignment.facility && assignment.facility.id === formData.orgUnit
            );

            if (userAssignment && userAssignment.facility) {
              console.log('🔍 DETAILED userAssignment.facility structure:', userAssignment.facility);
              console.log('🔍 All keys in facility object:', Object.keys(userAssignment.facility));
              console.log('🔍 facility.facilityType value:', userAssignment.facility.facilityType);
              console.log('🔍 facility.type value:', userAssignment.facility.type);
              console.log('🔍 facility.facilityType type:', typeof userAssignment.facility.facilityType);

              const extractedType = userAssignment.facility.facilityType || userAssignment.facility.type;
              console.log('🔍 EXTRACTED TYPE:', extractedType);
              console.log('🔍 facilityType exists:', !!userAssignment.facility.facilityType);
              console.log('🔍 type exists:', !!userAssignment.facility.type);

              facilityData = {
                facilityId: userAssignment.facility.id,
                facilityName: userAssignment.facility.displayName || userAssignment.facility.name,
                type: extractedType,
                trackedEntityInstance: userAssignment.facility.trackedEntityInstance
              };
              console.log('✅ Found facility in userAssignments:', facilityData);
              console.log('✅ Final facilityData.type:', facilityData.type);
            }
          }

          // If not found in userAssignments, try inspection dataStore
          if (!facilityData) {
            const inspectionData = await api.getInspectionAssignments();

            if (inspectionData && inspectionData.inspections) {
              const facilityInspection = inspectionData.inspections.find(
                inspection => inspection.facilityId === formData.orgUnit
              );

              if (facilityInspection) {
                console.log('🔍 DETAILED facilityInspection structure:', facilityInspection);
                console.log('🔍 All keys in inspection object:', Object.keys(facilityInspection));
                console.log('🔍 inspection.facilityType value:', facilityInspection.facilityType);
                console.log('🔍 inspection.type value:', facilityInspection.type);
                console.log('🔍 inspection.facilityType type:', typeof facilityInspection.facilityType);

                const extractedType = facilityInspection.facilityType || facilityInspection.type;
                console.log('🔍 EXTRACTED TYPE from dataStore:', extractedType);
                console.log('🔍 facilityType exists:', !!facilityInspection.facilityType);
                console.log('🔍 type exists:', !!facilityInspection.type);

                facilityData = {
                  facilityId: facilityInspection.facilityId,
                  facilityName: facilityInspection.facilityName,
                  type: extractedType,
                  trackedEntityInstance: facilityInspection.trackedEntityInstance
                };
                console.log('✅ Found facility in inspection dataStore:', facilityData);
                console.log('✅ Final facilityData.type:', facilityData.type);
                console.log('🔍 FACILITY INFO DEBUG: This type will be used for section filtering');
              } else {
                console.log('❌ No facility found in inspection dataStore with facilityId:', formData.orgUnit);
                console.log('🔍 Available facilities in dataStore:', inspectionData.inspections?.map(i => ({
                  facilityId: i.facilityId,
                  facilityName: i.facilityName,
                  facilityType: i.facilityType,
                  type: i.type
                })));
              }
            }
          }

          if (facilityData) {
            // Store complete facility information for UI display
            setFacilityInfo(facilityData);

            // Set the facility type to use for filtering
            if (facilityData.type) {
              setFacilityType(facilityData.type);
              console.log('✅ Set facility type for filtering:', facilityData.type);
              console.log('🔍 This should trigger section filtering for:', facilityData.type);
              console.log('🔍 FACILITY TYPE DEBUG: Type set to:', {
                type: facilityData.type,
                typeLength: facilityData.type.length,
                typeType: typeof facilityData.type,
                exactValue: JSON.stringify(facilityData.type)
              });
            } else {
              console.warn('⚠️ No facility type found in facilityData:', facilityData);
            }

            // Store current facility ID for dashboard filtering
            if (facilityData.facilityId) {
              localStorage.setItem('lastSelectedFacility', facilityData.facilityId);
              console.log('🏥 Stored facility ID for dashboard filtering:', facilityData.facilityId);
            }

            // Also update form data if there's a facility classification field
            if (facilityData.type && configuration.programStage?.allDataElements) {
              const facilityClassificationElement = configuration.programStage.allDataElements.find(psde => {
                const fieldName = (psde.dataElement.displayName || '').toLowerCase();
                return fieldName.includes('facility classification') || fieldName.includes('facility type');
              });

              if (facilityClassificationElement) {
                const fieldKey = `dataElement_${facilityClassificationElement.dataElement.id}`;
                setFormData(prev => ({
                  ...prev,
                  [fieldKey]: facilityData.type
                }));
                console.log(`✅ Auto-populated facility type field with: ${facilityData.type}`);
              }
            }
          } else {
            console.log('⚠️ No facility found in dataStore for facility:', formData.orgUnit);
            setFacilityInfo(null);
          }
        } catch (error) {
          console.error('❌ Error getting facility information from dataStore:', error);
          setFacilityInfo(null);
        } finally {
          setLoadingFacilityInfo(false);
        }
      };

      // Add a small delay to ensure all components are initialized
      const timeoutId = setTimeout(getFacilityInfoFromDataStore, 100);

      return () => clearTimeout(timeoutId);
    }, [formData.orgUnit, api, configuration, userAssignments]);

    // Debug logging for facility info state
    useEffect(() => {
      console.log('🔍 DEBUG - Current state:', {
        'formData.orgUnit': formData.orgUnit,
        'facilityInfo': facilityInfo,
        'facilityType': facilityType,
        'loadingFacilityInfo': loadingFacilityInfo,
        'userAssignments length': userAssignments?.length || 0,
        'api available': !!api,
        'configuration available': !!configuration
      });
    }, [formData.orgUnit, facilityInfo, facilityType, loadingFacilityInfo, userAssignments, api, configuration]);

    const [readOnlyFields, setReadOnlyFields] = useState({});

    const [errors, setErrors] = useState({});

    const [fieldComments, setFieldComments] = useState({});

    const [intervieweeSignature, setIntervieweeSignature] = useState(null);

    // Initialize incremental save functionality
    const {
      saveField,
      saveFieldImmediate,
      loadFormData,
      updateSectionMetadata,
      flushPendingSaves
    } = useIncrementalSave(eventId, {
      debounceMs: 300,
      onSaveSuccess: (result) => {
        console.log('💾 Incremental save successful:', result);
        // Show visual save indicator
        setSaveStatus({
          isVisible: true,
          message: `Saved ${result.savedFields} field(s)`,
          type: 'success'
        });
        // Hide after 2 seconds
        setTimeout(() => setSaveStatus(prev => ({ ...prev, isVisible: false })), 2000);
      },
      onSaveError: (error) => {
        console.error('❌ Incremental save failed:', error);
        showToast('Failed to save form data locally', 'error');
        setSaveStatus({
          isVisible: true,
          message: 'Save failed',
          type: 'error'
        });
        setTimeout(() => setSaveStatus(prev => ({ ...prev, isVisible: false })), 3000);
      },
      enableLogging: true
    });

    // Load existing form data from IndexedDB on mount
    useEffect(() => {
      const loadExistingData = async () => {
        if (eventId) {
          try {
            const existingData = await loadFormData();
            if (existingData && existingData.formData) {
              console.log('📖 Loading existing form data from IndexedDB:', existingData);
              setFormData(prev => ({
                ...prev,
                ...existingData.formData
              }));

              // Load comments if they exist
              if (existingData.metadata?.fieldComments) {
                setFieldComments(existingData.metadata.fieldComments);
              }

              showToast('Loaded saved form data', 'success');
            }
          } catch (error) {
            console.error('❌ Failed to load existing form data:', error);
          }
        }
      };

      loadExistingData();
    }, [eventId, loadFormData, showToast]);

    // Handle comment changes for data elements
    const handleCommentChange = (dataElementId, comment) => {
      setFieldComments(prev => {
        const updated = { ...prev };
        if (comment && comment.trim()) {
          updated[dataElementId] = comment.trim();
        } else {
          delete updated[dataElementId];
        }

        // Save comments to the designated Survey Comments data element
        saveCommentsToDataElement(updated);

        // Save comments incrementally to IndexedDB
        if (eventId) {
          saveField(`comment_${dataElementId}`, comment?.trim() || '');
        }

        return updated;
      });
    };

    // Save comments to the Survey Comments data element in JSON format
    const saveCommentsToDataElement = (comments) => {
      // Find the Survey Comments data element
      // We'll look for any data element that might be used for comments
      const surveyCommentsElement = findSurveyCommentsElement();

      if (surveyCommentsElement && Object.keys(comments).length > 0) {
        const commentsJson = JSON.stringify(comments);
        console.log('💬 Saving comments to Survey Comments element:');
        console.log('  📝 Original Object:', comments);
        console.log('  📄 JSON String (with escapes):', commentsJson);
        console.log('  🔍 Element ID:', surveyCommentsElement.id);
        console.log('  ✅ Parsed back test:', JSON.parse(commentsJson));

        // Update form data with the comments JSON
        setFormData(prev => ({
          ...prev,
          [`dataElement_${surveyCommentsElement.id}`]: commentsJson
        }));
      }
    };

    // Find the Survey Comments data element - using specific ID
    const findSurveyCommentsElement = () => {
      if (!configuration?.programStage?.allDataElements) return null;

      // Use the specific data element ID for storing comments
      const COMMENTS_DATA_ELEMENT_ID = "EaIXCub2vjL";

      const commentsElement = configuration.programStage.allDataElements.find(psde => {
        return psde.dataElement.id === COMMENTS_DATA_ELEMENT_ID;
      });

      if (commentsElement) {
        console.log('💬 Found Survey Comments data element:', {
          id: commentsElement.dataElement.id,
          displayName: commentsElement.dataElement.displayName
        });
      } else {
        console.warn('⚠️ Survey Comments data element not found with ID:', COMMENTS_DATA_ELEMENT_ID);
      }

      return commentsElement;
    };

    // Load existing comments when form data changes
    useEffect(() => {
      const surveyCommentsElement = findSurveyCommentsElement();
      if (surveyCommentsElement && formData) {
        const commentsFieldKey = `dataElement_${surveyCommentsElement.id}`;
        const commentsJson = formData[commentsFieldKey];

        if (commentsJson && typeof commentsJson === 'string') {
          try {
            const parsedComments = JSON.parse(commentsJson);
            if (typeof parsedComments === 'object' && parsedComments !== null) {
              setFieldComments(parsedComments);
              console.log('💬 Loaded existing comments:', parsedComments);
            }
          } catch (error) {
            console.warn('Failed to parse existing comments:', error);
          }
        }
      }
    }, [formData, configuration]);

    // Handle signature changes
    const handleSignatureChange = (signatureDataURL) => {
      setIntervieweeSignature(signatureDataURL);
      console.log('📝 Signature captured:', signatureDataURL ? 'Yes' : 'No');

      // Save signature immediately to IndexedDB (critical field)
      if (eventId) {
        saveFieldImmediate('intervieweeSignature', signatureDataURL);
      }
    };

    // Debug panel removed - no longer needed

    const [isDraft, setIsDraft] = useState(false);

    // const [currentUser, setCurrentUser] = useState(null);

    const [serviceSections, setServiceSections] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formStats, setFormStats] = useState({ percentage: 0, filled: 0, total: 0 });

    const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);

    const [gpsCoordinates, setGpsCoordinates] = useState(null);



    // State for organization units (for the dropdown)

    const [organizationUnits, setOrganizationUnits] = useState([]);

    const [loadingOrganizationUnits, setLoadingOrganizationUnits] = useState(false);



    // State for facility classifications (from CSV)

    const [facilityClassifications, setFacilityClassifications] = useState([]);

    const [loadingFacilityClassifications, setLoadingFacilityClassifications] = useState(false);



    // State for inspection information confirmation

    const [inspectionInfoConfirmed, setInspectionInfoConfirmed] = useState(false);

    // Scroll to first section after inspection info confirmation
    useEffect(() => {
      if (inspectionInfoConfirmed) {
        // Small delay to ensure DOM is updated with new sections
        setTimeout(() => {
          // Try to find the confirmation status message first (most reliable)
          const statusMessage = document.querySelector('[data-confirmation-status="true"]');

          if (statusMessage) {
            statusMessage.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            });
            console.log('📍 Scrolled to confirmation status message after inspection confirmation');
          } else {
            // Fallback: try to find the first form section that's not an inspection type section
            const allSections = document.querySelectorAll('.form-section');
            let targetSection = null;

            for (const section of allSections) {
              // Skip inspection type sections and find the first regular section
              if (!section.hasAttribute('data-inspection-type') &&
                  !section.querySelector('input[type="checkbox"]')) {
                targetSection = section;
                break;
              }
            }

            if (targetSection) {
              targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
              });
              console.log('📍 Scrolled to first form section after inspection confirmation');
            } else {
              console.log('📍 No suitable scroll target found after inspection confirmation');
            }
          }
        }, 500); // 500ms delay to ensure sections are fully rendered
      }
    }, [inspectionInfoConfirmed]);

    // State for form submission confirmation

    const [isConfirmed, setIsConfirmed] = useState(false);

    // State for payload dialog
    const [showPayloadDialog, setShowPayloadDialog] = useState(false);
    const [payloadData, setPayloadData] = useState(null);







    // Function to get current facility classification

    const getCurrentFacilityClassification = () => {

      // 1. Prioritize manual specialization selection
      if (manualSpecialization) {
        console.log(`🎯 Using manual specialization: ${manualSpecialization}`);
        return manualSpecialization;
      }

      // 2. Try to get from formData
      if (formData.facilityClassification) {
        console.log(`📋 Using formData classification: ${formData.facilityClassification}`);
        return formData.facilityClassification;
      }

      // 3. Try to get from the DHIS2 field if it exists
      if (configuration?.programStage?.allDataElements) {
        const facilityClassificationElement = configuration.programStage.allDataElements.find(psde => {
          const fieldName = (psde.dataElement.displayName || psde.dataElement.shortName || '').toLowerCase();
          return fieldName.includes('facility classification') || fieldName.includes('facility type');
        });

        if (facilityClassificationElement) {
          const fieldKey = `dataElement_${facilityClassificationElement.dataElement.id}`;
          const dhisValue = formData[fieldKey];
          if (dhisValue) {
            console.log(`🏥 Using DHIS2 field classification: ${dhisValue}`);
            return dhisValue;
          }
        }
      }

      // 4. Fallback to facilityType state
      if (facilityType) {
        console.log(`🔄 Using facilityType fallback: ${facilityType}`);
        return facilityType;
      }

      console.log(`❌ No facility classification found`);
      return null;
    };



    const fetchTrackedEntityInstance = async (facilityId) => {

      try {

        // Use the same program ID as defined in the API service

        const FACILITY_REGISTRY_PROGRAM_ID = 'EE8yeLVo6cN';

        const apiEndpoint = `/api/trackedEntityInstances?ou=${facilityId}&program=${FACILITY_REGISTRY_PROGRAM_ID}&fields=trackedEntityInstance&ouMode=DESCENDANTS`;

        

        // Enhanced debugging for API call

        console.log('🔍 ===== TEI RETRIEVAL DEBUG START =====');

        console.log('🔍 Facility ID:', facilityId);

        console.log('🔍 Program ID:', FACILITY_REGISTRY_PROGRAM_ID);

        console.log('🔍 API Endpoint:', apiEndpoint);

        console.log('🔍 Full URL:', `${window.location.origin}${apiEndpoint}`);

        console.log('🔍 API Call Method: GET');

        console.log('🔍 Expected Response Fields: trackedEntityInstance');

        console.log('🔍 OU Mode: DESCENDANTS');

        console.log('🔍 ===== TEI RETRIEVAL DEBUG END =====');

        

        // Use the API service instead of direct fetch

        console.log('📡 Making API request...');

        const response = await api.request(apiEndpoint);

        

        console.log('📡 ===== TEI API RESPONSE DEBUG =====');

        console.log('📡 Full Response Object:', response);

        console.log('📡 Response Type:', typeof response);

        console.log('📡 Response Keys:', Object.keys(response || {}));

        console.log('📡 Has trackedEntityInstances:', !!response?.trackedEntityInstances);

        console.log('📡 trackedEntityInstances Length:', response?.trackedEntityInstances?.length || 0);

        console.log('📡 ===== TEI API RESPONSE DEBUG END =====');

        

        if (response.trackedEntityInstances && response.trackedEntityInstances.length > 0) {

          const tei = response.trackedEntityInstances[0].trackedEntityInstance;

          console.log('✅ ===== TEI EXTRACTION DEBUG =====');

          console.log('✅ First TEI Object:', response.trackedEntityInstances[0]);

          console.log('✅ Extracted TEI Value:', tei);

          console.log('✅ TEI Type:', typeof tei);

          console.log('✅ TEI Length:', tei?.length || 0);

          console.log('✅ TEI Trimmed:', tei?.trim() || 'N/A');

          console.log('✅ ===== TEI EXTRACTION DEBUG END =====');

          

          if (tei && tei.trim() !== '') {

          setTrackedEntityInstance(tei);

            console.log('🔗 TEI set successfully in state:', tei);

          } else {

            console.log('⚠️ TEI is empty or whitespace - setting to null');

            setTrackedEntityInstance(null);

          }

        } else {

          console.log('⚠️ ===== NO TEI FOUND DEBUG =====');

          console.log('⚠️ Response structure:', {

            hasTrackedEntityInstances: !!response?.trackedEntityInstances,

            trackedEntityInstancesType: typeof response?.trackedEntityInstances,

            trackedEntityInstancesLength: response?.trackedEntityInstances?.length || 0,

            responseKeys: Object.keys(response || {})

          });

          console.log('⚠️ Setting TEI to null');

          console.log('⚠️ ===== NO TEI FOUND DEBUG END =====');

          setTrackedEntityInstance(null);

        }

      } catch (error) {

        console.error('❌ ===== TEI RETRIEVAL ERROR DEBUG =====');

        console.error('❌ Error Type:', error.constructor.name);

        console.error('❌ Error Message:', error.message);

        console.error('❌ Error Stack:', error.stack);

        console.error('❌ Full Error Object:', error);

        console.error('❌ ===== TEI RETRIEVAL ERROR DEBUG END =====');

        setTrackedEntityInstance(null);

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

      try {

        const now = new Date();

        if (isNaN(now.getTime())) {

          console.warn('⚠️ Current date is invalid, using fallback');

          return '2025-01-01';

        }

        

        // Botswana is UTC+2, so add 2 hours to get local time

        const botswanaTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));

        

        if (isNaN(botswanaTime.getTime())) {

          console.warn('⚠️ Botswana time calculation failed, using current date');

          return now.toISOString().split('T')[0];

        }

        

        return botswanaTime.toISOString().split('T')[0];

      } catch (error) {

        console.error('❌ Error in getBotswanaDate:', error);

        return '2025-01-01'; // Fallback date

      }

    };



    // Robust date parsing function to handle different date formats

    const parseDate = (dateString) => {

      if (!dateString) return null;

      

      // Try parsing as ISO string first

      let date = new Date(dateString);

      if (!isNaN(date.getTime())) return date;

      

      // Try parsing as DD/MM/YYYY or MM/DD/YYYY

      const parts = dateString.split(/[\/\-]/);

      if (parts.length === 3) {

        // Try different combinations

        const combinations = [

          [parts[0], parts[1], parts[2]], // DD/MM/YYYY

          [parts[1], parts[0], parts[2]], // MM/DD/YYYY

          [parts[2], parts[0], parts[1]], // YYYY/MM/DD

          [parts[2], parts[1], parts[0]]  // YYYY/DD/MM

        ];

        

        for (const [day, month, year] of combinations) {

          date = new Date(year, month - 1, day);

          if (!isNaN(date.getTime())) return date;

        }

      }

      

      return null;

    };

    

    const today = getBotswanaDate();

    console.log('🌍 Today in Botswana timezone:', today);



    const safeUserAssignments = Array.isArray(userAssignments) ? userAssignments : [];



    //get services

      // 1. Collect and flatten all sections

      const allSections = safeUserAssignments

          .flatMap(a => Array.isArray(a.assignment.sections) ? a.assignment.sections : []);

      // console.log("allSections", allSections);



      // 2. Map to names (handle both string and object)

      const sectionNames = allSections.map(section =>

          typeof section === 'object' && section !== null

              ? section.name

              : section

      );



      // 3. Remove duplicates

      const uniqueServices = Array.from(new Set(sectionNames.filter(Boolean)));

      console.log("uniqueServices", uniqueServices);



    // Get facilities with today's date in inspection period

    const activeFacilities = safeUserAssignments.filter(a => {

      const { startDate, endDate } = a.assignment.inspectionPeriod || {};

      

      if (!startDate || !endDate) {

        return false;

      }

      

      try {

        // Use robust date parsing function

        const start = parseDate(startDate);

        const end = parseDate(endDate);

        const todayDate = parseDate(today);

        

        // Check if dates are valid

        if (!start || !end || !todayDate) {

          return false;

        }

        

        // Reset time to start of day for accurate date comparison

        start.setHours(0, 0, 0, 0);

        end.setHours(23, 59, 59, 999); // End of day

        todayDate.setHours(12, 0, 0, 0); // Middle of day

        

        const isActive = start <= todayDate && todayDate <= end;

        

        return isActive;

      } catch (error) {

        return false;

      }

    }).map(a => ({

      id: a.facility.id,

      name: a.facility.name

    }));



    // Debug logging removed



    const uniqueFacilities = activeFacilities; // Only show facilities with active assignments for today



    // Toggle for debugging: show all facilities vs only active ones

    const [showAllFacilities, setShowAllFacilities] = useState(false);



    

    // Check if we have any active facilities

    const hasActiveFacilities = activeFacilities.length > 0;



    if (showDebugPanel) {

      console.log('�� Facility filtering summary:', {

        totalAssignments: safeUserAssignments.length,

        activeFacilities: activeFacilities.length,

        hasActiveFacilities,

        showAllFacilities

      });

    }



    // Helper function to determine if a field is mandatory

    const isFieldMandatory = (psde) => {

      // All fields are now optional - no mandatory requirements

        return false;

    };





    

    const finalFacilities = showAllFacilities 

      ? safeUserAssignments

          .filter(assignment => assignment.facility && assignment.facility.id)

          .map(assignment => ({

            id: assignment.facility.id,

            name: assignment.facility.name

          }))

      : uniqueFacilities; // Only show active facilities, no fallback



    // Debug logging removed

    // console.log("fac",safeUserAssignments)



      // Get the selected assignment for the chosen facility

    const selectedAssignment = safeUserAssignments.find(a => a.facility.id === (typeof formData.orgUnit === 'string' ? formData.orgUnit : formData.orgUnit?.id));

    // Get service options from the selected assignment

    const serviceOptions = selectedAssignment ? selectedAssignment.assignment.sections : [];

    // Enhanced debug log to check the format of serviceOptions

    console.log('🔍 DEBUG: serviceOptions format:', {

      serviceOptions,

      type: Array.isArray(serviceOptions) ? 'array' : typeof serviceOptions,

      firstItem: serviceOptions[0],

      firstItemType: serviceOptions[0] ? typeof serviceOptions[0] : 'undefined',

      firstItemProperties: serviceOptions[0] ? Object.keys(serviceOptions[0]) : [],

      allItemsAsStrings: serviceOptions.map(item => 

        typeof item === 'object' ? 

          (item.displayName || item.name || item.id || JSON.stringify(item)) : 

          String(item)

      )

    });

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



    // Auto-select first available facility when user assignments load

    useEffect(() => {

      if (safeUserAssignments.length > 0 && !formData.orgUnit && activeFacilities.length > 0) {

        const firstActiveFacility = activeFacilities[0];

        if (firstActiveFacility && firstActiveFacility.id) {

          console.log('🏥 Auto-selecting first available facility:', firstActiveFacility.name);

          setFormData(prev => ({

            ...prev,

            orgUnit: firstActiveFacility.id

          }));

          

          // Also auto-set the event date to today if not set

          if (!formData.eventDate) {

            const today = new Date().toISOString().split('T')[0];

            setFormData(prev => ({

              ...prev,

              eventDate: today

            }));

            console.log('📅 Auto-setting event date to today:', today);

          }

          

          // Trigger facility classification fetch for the auto-selected facility

          setTimeout(() => {

            if (api) {

              console.log('🔍 Auto-triggering facility classification fetch for:', firstActiveFacility.id);

              fetchFacilityClassification(firstActiveFacility.id);

            }

          }, 100); // Small delay to ensure formData is updated

        }

      }

    }, [safeUserAssignments, activeFacilities, formData.orgUnit, formData.eventDate, api]);



    // Auto-assign GPS coordinates when form loads

    useEffect(() => {

      if (configuration && configuration.programStage && configuration.programStage.allDataElements) {

        console.log('�� Form loaded, auto-assigning GPS coordinates...');

        autoAssignGPSCoordinates().catch(error => {

          console.log('⚠️ GPS auto-assignment failed:', error.message);

        });

      }

    }, [configuration]);



    // Filter and set initial sections when configuration loads

    useEffect(() => {

      if (configuration?.programStage?.sections) {

        const filteredSections = filterUnwantedSections(configuration.programStage.sections);

        

                if (showDebugPanel) {

          console.log('🔍 Initial section filtering:', {

            totalSections: configuration.programStage.sections.length,

            filteredSections: filteredSections.length,

            excludedSections: configuration.programStage.sections

              .filter(section => 

                section.displayName === "Final_Inspection_Event" || 

                section.displayName === "Preliminary-Report" ||

                section.displayName === "Inspectors Details" ||

                section.displayName.startsWith("Pre-Inspection:")

              )

              .map(s => s.displayName)

          });

        }

      

        setServiceSections(filteredSections);

        

        // Load facility classifications from CSV

        loadFacilityClassifications();

      }

    }, [configuration, showDebugPanel]);



    // Fetch service sections when facility or user changes

    useEffect(() => {

      // This useEffect is no longer needed as serviceOptions are now directly available

      const fetchServiceSections = async () => {

        const currentUser = user;

        if (showDebugPanel) {

          console.log("🔍 fetchServiceSections called with:", {

            orgUnit: formData.orgUnit,

            user: currentUser?.username,

            configSections: configuration?.programStage?.sections?.length || 0

          });

        }

        

        if (!formData.orgUnit || !currentUser?.username) {

          if (showDebugPanel) {

            console.log('⏳ Waiting for facility selection and user data...');

            console.log('📊 Setting fallback sections:', configuration?.programStage?.sections?.filter((section) => !section.displayName.startsWith("Pre-Inspection:") ).length || 0);

          }

          setServiceSections(filterUnwantedSections(configuration?.programStage?.sections));

          return;

        }



        setLoadingServiceSections(true);

        try {

          const facilityId = typeof formData.orgUnit === 'string' ? formData.orgUnit : formData.orgUnit?.id;

          if (showDebugPanel) {

            console.log(`🔍 Fetching service sections for facility: ${facilityId}, inspector: ${currentUser.username || currentUser.displayName} (using username priority)`);

          }

          const assignedSectionNames = await api.getServiceSectionsForInspector(

            facilityId,

            currentUser.username || currentUser.displayName

          );

          const allProgramSections = configuration?.programStage?.sections || [];

          

          if (showDebugPanel) {

            console.log('📋 All program sections:', allProgramSections.map(s => s.displayName));

            console.log('👥 Assigned sections for inspector:', assignedSectionNames);

          }

          

          // Filter sections based on assigned service sections

          const filteredSections = allProgramSections.filter(section => {

            // Always include sections that don't start with "Pre-Inspection:"

            if (!section.displayName.startsWith("Pre-Inspection:")) {

              if (showDebugPanel) {

                console.log(`✅ Including non-Pre-Inspection section: "${section.displayName}"`);

              }

              return true;

            }

            

            // For Pre-Inspection sections, check if they're in the assigned sections

            const isAssigned = assignedSectionNames.includes(section.displayName);

            if (showDebugPanel) {

              console.log(`🔍 Pre-Inspection section "${section.displayName}": ${isAssigned ? '✅ Assigned' : '❌ Not assigned'}`);

            }

            return isAssigned;

          });

          

          // Apply final filtering to remove unwanted sections

          const finalFilteredSections = filterUnwantedSections(filteredSections);

          

          // ADDITIONAL DEBUGGING: Log what sections we're setting

          console.log('🔍 FINAL DEBUG: Setting serviceSections to:', {

            finalFilteredSections: finalFilteredSections.length,

            sectionNames: finalFilteredSections.map(s => s.displayName),

            hasDataElements: finalFilteredSections.map(s => ({

              name: s.displayName,

              dataElementsCount: s.dataElements?.length || 0

            }))

          });

          

          setServiceSections(finalFilteredSections);

          

          if (showDebugPanel) {

            console.log('✅ Service sections loaded for render:', {

              assignedSections: assignedSectionNames,

              allProgramSections: allProgramSections.length,

              filteredSections: filteredSections.length,

              sections: filteredSections.map(s => s.displayName)

            });

          }

        } catch (error) {

          console.error('❌ Failed to fetch service sections:', error);

          // No fallback - set empty service sections when fetch fails

          setServiceSections([]);

        }

        setLoadingServiceSections(false);

      };



      fetchServiceSections();

    }, [formData.orgUnit, user, configuration, api]);











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

      // Save field incrementally to IndexedDB
      if (eventId) {
        saveField(fieldName, value);
        console.log(`💾 Queued incremental save: ${fieldName} = ${value}`);
      }

      // Clear field error when user starts typing

      if (errors[fieldName]) {

        setErrors(prev => ({

          ...prev,

          [fieldName]: null

        }));

      }



      // Set tracked entity instance from dataStore when facility is selected

      if (fieldName === 'orgUnit' && value) {

        console.log('🏥 ===== FACILITY SELECTION DEBUG START =====');

        console.log('🏥 Selected facility ID:', value);

        console.log('🏥 Total userAssignments available:', userAssignments.length);

        console.log('🏥 All userAssignments:', userAssignments);

        

        // Find the selected facility in userAssignments to get its trackedEntityInstance

        const selectedFacility = userAssignments.find(assignment => 

          assignment.facility.id === value

        );

        

        console.log('🔍 ===== SELECTED FACILITY DEBUG =====');

        console.log('🔍 Selected facility found:', !!selectedFacility);

        console.log('🔍 Selected facility object:', selectedFacility);

        

        if (selectedFacility) {

          console.log('🔍 Facility ID:', selectedFacility.facility.id);

          console.log('🔍 Facility Name:', selectedFacility.facility.name);

          console.log('🔍 Facility trackedEntityInstance:', selectedFacility.facility.trackedEntityInstance);

          console.log('🔍 Facility trackedEntityInstance type:', typeof selectedFacility.facility.trackedEntityInstance);

          console.log('🔍 Facility trackedEntityInstance truthy:', !!selectedFacility.facility.trackedEntityInstance);

          console.log('🔍 Complete facility object:', selectedFacility.facility);

          console.log('🔍 Complete assignment object:', selectedFacility.assignment);

          console.log('🔍 ===== SELECTED FACILITY DEBUG END =====');

          

          if (selectedFacility.facility.trackedEntityInstance) {

            console.log('🔗 Found trackedEntityInstance in dataStore:', selectedFacility.facility.trackedEntityInstance);

            setTrackedEntityInstance(selectedFacility.facility.trackedEntityInstance);

          } else {

            console.log('⚠️ No trackedEntityInstance found in dataStore for facility:', value);

            console.log('🔄 Falling back to API call to fetch TEI');

            fetchTrackedEntityInstance(value);

          }

        } else {

          console.log('❌ Selected facility not found in userAssignments!');

          console.log('❌ Available facility IDs:', userAssignments.map(a => a.facility.id));

          console.log('❌ Looking for facility ID:', value);

          console.log('🔄 Falling back to API call to fetch TEI');

          fetchTrackedEntityInstance(value);

        }

        

        console.log('🏥 ===== FACILITY SELECTION DEBUG END =====');

        

        // Also fetch and set the facility classification

        fetchFacilityClassification(value);

        // Auto-populate inspection date when facility is selected
        if (!formData.eventDate) {
          const today = new Date();
          const todayString = today.toISOString().split('T')[0];
          console.log('📅 Auto-populating inspection date:', todayString);
          
          setFormData(prev => ({
            ...prev,
            eventDate: todayString
          }));
          
          // Save the auto-populated date
          if (eventId) {
            saveField('eventDate', todayString);
            console.log(`💾 Auto-saved inspection date: ${todayString}`);
          }
        }

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

          // Only set Type field if there's a matching option in optionSet - no fallback

          const options = typeElement.dataElement.optionSet?.options || [];

          if (Array.isArray(options) && options.length > 0) {

            const normalized = (v) => (v ?? '').toString().trim().toLowerCase();

            const matched = options.find(opt =>

              normalized(opt.displayName) === normalized(assignmentType) ||

              normalized(opt.code) === normalized(assignmentType) ||

              normalized(opt.id) === normalized(assignmentType)

            );

            

            // Only set value if a matching option is found - no fallback to raw assignmentType

            if (matched) {

              const valueToSet = matched.code || matched.id;

          setFormData(prev => ({

            ...prev,

            [fieldKey]: valueToSet

          }));

            } else {

              console.warn(`⚠️ No matching option found for assignmentType "${assignmentType}" in Type field optionSet. Field will remain empty.`);

            }

          } else {

            console.warn(`⚠️ Type field has no optionSet options. Cannot set value for assignmentType "${assignmentType}".`);

          }

        }

        // Always lock the field regardless of whether a value exists

        setReadOnlyFields(prev => ({ ...prev, [fieldKey]: true }));

      }

    }, [configuration, assignmentType, formData.orgUnit]);

    

    // Service field detection is now handled by the module-level enhancedServiceFieldDetection function

    





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

      // All fields are now optional - no mandatory requirements

      return true;

    };







    const validateForm = () => {

      const newErrors = {};



      // All fields are now optional - no validation required

      setErrors(newErrors);

      return true;

    };



    const handleSave = async (saveDraft = false) => {

      if (!saveDraft && !validateForm()) {

        showToast('Please fix the errors before submitting', 'error');

        return;

      }



      setIsSubmitting(true);



      try {

        // Prepare event data
        // Always ensure we have a proper DHIS2 event ID
        const finalEventId = eventId || generateDHIS2Id();
        console.log('🆔 Event ID for submission:', finalEventId, eventId ? '(existing)' : '(generated)');

        const eventData = {

          event: finalEventId,

          program: program.id,

          programStage: programStage.id,

          orgUnit: formData.orgUnit,

          eventDate: formData.eventDate,

          status: saveDraft ? 'SCHEDULE' : 'COMPLETED',

          dataValues: []

        };



        // Always ensure trackedEntityInstance is included

        console.log('🔍 ===== FORM SUBMISSION TEI DEBUG =====');

        console.log('🔍 Current trackedEntityInstance state:', trackedEntityInstance);

        console.log('🔍 trackedEntityInstance type:', typeof trackedEntityInstance);

        console.log('🔍 trackedEntityInstance truthy check:', !!trackedEntityInstance);



        // Try to get trackedEntityInstance from multiple sources
        let teiToUse = trackedEntityInstance;

        // If trackedEntityInstance is not set, try to get it from facilityInfo
        if (!teiToUse && facilityInfo && facilityInfo.trackedEntityInstance) {
          teiToUse = facilityInfo.trackedEntityInstance;
          console.log('🔗 Using trackedEntityInstance from facilityInfo:', teiToUse);
        }

        // If still no TEI, try to get it from userAssignments
        if (!teiToUse && formData.orgUnit) {
          const userAssignment = userAssignments?.find(assignment =>
            assignment.facility && assignment.facility.id === formData.orgUnit
          );
          if (userAssignment && userAssignment.facility.trackedEntityInstance) {
            teiToUse = userAssignment.facility.trackedEntityInstance;
            console.log('🔗 Using trackedEntityInstance from userAssignments:', teiToUse);
          }
        }

        if (teiToUse) {

          eventData.trackedEntityInstance = teiToUse;

          console.log('🔗 Including trackedEntityInstance in event:', teiToUse);

          console.log('🔗 Event data now contains TEI:', eventData.trackedEntityInstance);

        } else {

          console.log('ℹ️ No trackedEntityInstance available from any source - creating event without TEI link');

          console.log('ℹ️ This will cause "Unknown Organisation" in DHIS2');

          // Show warning to user about missing TEI
          if (!saveDraft) {
            const userConfirmed = window.confirm(
              '⚠️ WARNING: No facility registry link found for this facility.\n\n' +
              'This inspection will be submitted without a facility link, which may cause "Unknown Organisation" in DHIS2.\n\n' +
              'Do you want to continue with the submission?'
            );

            if (!userConfirmed) {
              setIsSubmitting(false);
              return;
            }
          }

        }

        console.log('🔍 ===== FORM SUBMISSION TEI DEBUG END =====');



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



    const handleSubmit = async (e) => {

      e.preventDefault();

      // Flush any pending saves before submission
      await flushPendingSaves();

      // Check if signature is provided
      if (!intervieweeSignature) {
        showToast('Please provide the interviewee signature before submitting the inspection.', 'error');
        return;
      }

      // Create payload data to show in dialog
      // Always ensure we have a proper DHIS2 event ID
      const finalEventId = eventId || generateDHIS2Id();
      console.log('🆔 Event ID for payload:', finalEventId, eventId ? '(existing)' : '(generated)');

      const eventData = {
        event: finalEventId,
        program: program.id,
        programStage: programStage.id,
        orgUnit: formData.orgUnit,
        eventDate: formData.eventDate,
        status: 'COMPLETED',
        dataValues: []
      };

      // Always ensure trackedEntityInstance is included
      let teiToUse = trackedEntityInstance;

      // If trackedEntityInstance is not set, try to get it from facilityInfo
      if (!teiToUse && facilityInfo && facilityInfo.trackedEntityInstance) {
        teiToUse = facilityInfo.trackedEntityInstance;
        console.log('🔗 Using trackedEntityInstance from facilityInfo:', teiToUse);
      }

      // If still no TEI, try to get it from userAssignments
      if (!teiToUse && formData.orgUnit) {
        const userAssignment = userAssignments?.find(assignment =>
          assignment.facility && assignment.facility.id === formData.orgUnit
        );
        if (userAssignment && userAssignment.facility.trackedEntityInstance) {
          teiToUse = userAssignment.facility.trackedEntityInstance;
          console.log('🔗 Using trackedEntityInstance from userAssignments:', teiToUse);
        }
      }

      // Always add trackedEntityInstance to payload (even if null/undefined for debugging)
      eventData.trackedEntityInstance = teiToUse;
      console.log('🔗 Final trackedEntityInstance in payload:', teiToUse);

      // Add data values (skip section headers)
      const isSectionHeaderById = (dataElementId) => {
        try {
          const sections = configuration?.programStage?.sections || [];
          for (const section of sections) {
            const des = section?.dataElements || [];
            for (const psde of des) {
              const de = psde?.dataElement;
              if (de && de.id === dataElementId) {
                return isSectionHeaderName(de.displayName || de.name || '');
              }
            }
          }
        } catch (e) {
          console.warn('Failed to check if data element is header', e);
        }
        return false;
      };

      Object.entries(formData).forEach(([key, value]) => {
        if (!key.startsWith('dataElement_')) return;
        if (value === '') return;
        const dataElementId = key.replace('dataElement_', '');
        if (isSectionHeaderById(dataElementId)) return; // skip headers
        eventData.dataValues.push({
          dataElement: dataElementId,
          value: value.toString()
        });
      });

      // Add signature to payload if provided
      if (intervieweeSignature) {
        const SIGNATURE_DATA_ELEMENT_ID = "FCdfyqKxzx6";
        eventData.dataValues.push({
          dataElement: SIGNATURE_DATA_ELEMENT_ID,
          value: intervieweeSignature
        });
        console.log('📝 Added signature to payload for data element:', SIGNATURE_DATA_ELEMENT_ID);
      }

      // Clean up event data - remove any undefined or null values
      Object.keys(eventData).forEach(key => {
        if (eventData[key] === undefined || eventData[key] === null) {
          delete eventData[key];
        }
      });

      // Show payload dialog
      setPayloadData(eventData);
      setShowPayloadDialog(true);

    };

    // Function to actually submit the inspection (called from dialog)
    const handleActualSubmit = () => {
      setShowPayloadDialog(false);
      handleSave(false);
    };



    const handleSaveDraft = () => {

      handleSave(true);

    };



    // Helper function to get missing mandatory fields details

    const getMissingMandatoryFields = () => {

      // All fields are now optional - no missing mandatory fields

      return {

        count: 0,

        fields: []

      };

    };



    // Get missing mandatory fields details

    const missingMandatoryFields = getMissingMandatoryFields();







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



    // Safe date parsing with validation

    const _today = new Date(formData.eventDate);

    const _start = inspectionPeriod?.startDate ? new Date(inspectionPeriod.startDate) : null;

    const _end = inspectionPeriod?.endDate ? new Date(inspectionPeriod.endDate) : null;



    // Check if dates are valid before using them

    const isTodayValid = !isNaN(_today.getTime());

    const isStartValid = _start && !isNaN(_start.getTime());

    const isEndValid = _end && !isNaN(_end.getTime());



    // TEMPORARILY BYPASS DATE VALIDATION FOR TESTING

    const date_valid = true; // !inspectionPeriod ? true : (isStartValid && isEndValid && _today >= _start && _today <= _end);

    

    // ADDITIONAL DEBUGGING: Log the exact condition values with safe date handling

    console.log("🔍 DATE VALIDATION DEBUG:", {

      date_valid,

      _today: isTodayValid ? _today.toISOString() : 'INVALID_DATE',

      _start: isStartValid ? _start.toISOString() : 'INVALID_DATE',

      _end: isEndValid ? _end.toISOString() : 'INVALID_DATE',

      _today_ge_start: isTodayValid && isStartValid ? _today >= _start : false,

      _today_le_end: isTodayValid && isEndValid ? _today <= _end : false,

      hasInspectionPeriod: !!inspectionPeriod,

      inspectionPeriod: inspectionPeriod,

      dateValidation: {

        isTodayValid,

        isStartValid,

        isEndValid,

        rawEventDate: formData.eventDate,

        rawStartDate: inspectionPeriod?.startDate,

        rawEndDate: inspectionPeriod?.endDate

      }

    });

    

    // ADDITIONAL DEBUGGING: Log the main condition values

    console.log("🔍 MAIN CONDITION DEBUG:", {

      serviceSections: !!serviceSections,

      serviceSectionsLength: serviceSections?.length || 0,

      date_valid,

      conditionResult: !!(serviceSections && date_valid && serviceSections.length > 0)

    });



    // Function to fetch facility classification from dataStore

    const fetchFacilityClassification = async (facilityId) => {

      if (!facilityId || !api) return;

      

      try {

        if (showDebugPanel) {

          console.log('🔍 Fetching facility classification for:', facilityId);

        }

        

        // Try multiple approaches to get facility type/classification

        let classification = null;

        

        // Approach 1: Try to get facility type directly from inspection data

        try {

          // Fetch from inspection dataStore directly - this is the authoritative source

          const inspectionData = await api.getInspectionAssignments();

          const facilityInspection = inspectionData.inspections?.find(

            inspection => inspection.facilityId === facilityId

          );

          

          if (facilityInspection && facilityInspection.type) {

            classification = facilityInspection.type;

              if (showDebugPanel) {

              console.log('✅ Found facility type directly from inspection data:', classification);

            }

          }

        } catch (error) {

          if (showDebugPanel) {

            console.log('⚠️ Inspection data not accessible:', error.message);

          }

        }

        

        // Approach 2: Try to get from inspection assignments data (which we already have)

        if (!classification) {

          try {

            // First check if we already have the facility in our assignments

            const facilityAssignment = safeUserAssignments.find(a => 

              a.facility.id === facilityId

            );

            

            if (facilityAssignment && facilityAssignment.assignment && facilityAssignment.assignment.type) {

              classification = facilityAssignment.assignment.type;

                if (showDebugPanel) {

                console.log('✅ Found facility type from user assignments:', classification);

              }

            } else {

              // If not in our assignments, try to fetch from inspection dataStore

              const inspectionData = await api.getInspectionAssignments();

              const facilityInspection = inspectionData.inspections?.find(

                inspection => inspection.facilityId === facilityId

              );

              

              if (facilityInspection && facilityInspection.type) {

                classification = facilityInspection.type;

                if (showDebugPanel) {

                  console.log('✅ Found facility type via inspection dataStore:', classification);

                }

              }

            }

          } catch (error) {

            if (showDebugPanel) {

              console.log('⚠️ Error accessing inspection data:', error.message);

            }

          }

        }

        

        // Approach 3: Try to get from organization unit metadata

        if (!classification) {

          try {

            const orgUnitResponse = await api.request(`/api/organisationUnits/${facilityId}?fields=id,name,displayName,level,parent,organisationUnitGroups`);

            if (orgUnitResponse && orgUnitResponse.organisationUnitGroups) {

              // Look for organization unit groups that might indicate facility type

              const facilityTypeGroup = orgUnitResponse.organisationUnitGroups.find(group => 

                group.displayName && (

                  group.displayName.toLowerCase().includes('clinic') ||

                  group.displayName.toLowerCase().includes('hospital') ||

                  group.displayName.toLowerCase().includes('laboratory') ||

                  group.displayName.toLowerCase().includes('pharmacy')

                )

              );

              

              if (facilityTypeGroup) {

                classification = facilityTypeGroup.displayName;

                if (showDebugPanel) {

                  console.log('✅ Found facility type via organisation unit groups:', classification);

                }

              }

            }

          } catch (error) {

            if (showDebugPanel) {

              console.log('⚠️ Organisation unit metadata not accessible:', error.message);

            }

          }

        }

        

               // Set the classification if found, otherwise set a default

        const classificationToSet = classification || 'Gynae Clinics'; // Default to first option from CSV

        

        // Find the DHIS2 "Facility Classification" data element and populate it

        if (configuration?.programStage?.allDataElements) {

          const facilityClassificationElement = configuration.programStage.allDataElements.find(psde => {

            const fieldName = (psde.dataElement.displayName || psde.dataElement.shortName || '').toLowerCase();

            return fieldName.includes('facility classification') || fieldName.includes('facility type');

          });

          

          if (facilityClassificationElement) {

            const fieldKey = `dataElement_${facilityClassificationElement.dataElement.id}`;

            setFormData(prev => ({

              ...prev,

              [fieldKey]: classificationToSet

            }));

            

            if (showDebugPanel) {

              console.log(`✅ Auto-populated DHIS2 field "${facilityClassificationElement.dataElement.displayName}" with: ${classificationToSet}`);

            }

            

            showToast(`Facility classification auto-populated: ${classificationToSet}`, 'success');

          } else {

            if (showDebugPanel) {

              console.log('⚠️ No DHIS2 "Facility Classification" field found to populate');

            }

          }

        }

        

        // Also keep the custom field for internal use (if needed elsewhere)

        setFormData(prev => ({

          ...prev,

          facilityClassification: classificationToSet

        }));

        

      } catch (error) {

        if (showDebugPanel) {

          console.log('❌ Error in facility classification lookup:', error);

        }

        

               // Set a default classification if all attempts fail

        const defaultClassification = 'Gynae Clinics';

        

        // Find and populate the DHIS2 "Facility Classification" field with default

        if (configuration?.programStage?.allDataElements) {

          const facilityClassificationElement = configuration.programStage.allDataElements.find(psde => {

            const fieldName = (psde.dataElement.displayName || psde.dataElement.shortName || '').toLowerCase();

            return fieldName.includes('facility classification') || fieldName.includes('facility type');

          });

          

          if (facilityClassificationElement) {

            const fieldKey = `dataElement_${facilityClassificationElement.dataElement.id}`;

            setFormData(prev => ({

              ...prev,

              [fieldKey]: defaultClassification

            }));

            

            if (showDebugPanel) {

              console.log(`✅ Auto-populated DHIS2 field "${facilityClassificationElement.dataElement.displayName}" with default: ${defaultClassification}`);

            }

          }

        }

        

        // Also keep the custom field for internal use

        setFormData(prev => ({

          ...prev,

          facilityClassification: defaultClassification

        }));

        

        showToast(`Facility classification set to default: ${defaultClassification}`, 'info');

      }

    };



    // Function to check if all inspection information fields are complete

    const areAllInspectionFieldsComplete = () => {

      // All fields are now optional - no completion requirements

      return true;

    };

    return (

      <div className="screen">

        <div className="form-container">

          <div className="form-header">

            <h2>Facility Inspection Form</h2>

            

                     {/* Facility Filtering Status Summary */}

             <div style={{ 

              //  backgroundColor: hasActiveFacilities ? '#d4edda' : '#f8d7da', 

              //  border: `1px solid ${hasActiveFacilities ? '#c3e6cb' : '#f5c6cb'}`, 

              //  borderRadius: '4px', 

              //  padding: '8px 12px',

              //  marginBottom: '16px',

              //  fontSize: '12px',

              //  color: hasActiveFacilities ? '#155724' : '#721c24'

             }}>

               <strong></strong> {

                //  hasActiveFacilities 

                //    ? `✅ ${activeFacilities.length} active facilities found for today (${today})`

                //    : `❌ No active facilities found for today (${today}). Please check inspection period dates.`

               }

               {!hasActiveFacilities && (

                 <button

                   type="button"

                   onClick={() => {/* Debug panel is always enabled */}}

                   style={{

                     backgroundColor: 'transparent',

                     color: '#721c24',

                     border: '1px solid #721c24',

                     borderRadius: '4px',

                     padding: '2px 6px',

                     fontSize: '10px',

                     cursor: 'pointer',

                     marginLeft: '8px'

                   }}

                 >

                   🔍 Debug

                 </button>

               )}

             </div>



            <div>

              {/* Removed Facility-Registry heading as requested */}

              <p className="form-subtitle">{configuration?.programStage?.displayName}</p>

              {/* Removed program description as requested */}







            </div>



            <div className="form-actions">
              
            </div>

          </div>



          {/* Debug Panel completely removed */}











                   <form onSubmit={handleSubmit} className="inspection-form">

             {/* UI Debug Panel - Temporary (collapsed) */}
             <details className="ui-debug-panel" open={false} style={{ marginBottom: '20px' }}>
               <summary style={{ cursor: 'pointer', color: '#856404', fontWeight: 600 }}>🐛 UI Debug Panel (Temporary)</summary>
               <div style={{
               backgroundColor: '#fff3cd',
               border: '2px solid #ffeaa7',
               borderRadius: '8px',
               padding: '16px',
                 marginTop: '8px',
               fontFamily: 'monospace'
             }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                 <div>
                   <strong>Facility Type State:</strong>
                   <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                     Value: "{facilityType || 'null'}"<br/>
                     Type: {typeof facilityType}<br/>
                     Length: {facilityType?.length || 0}
                   </div>
                 </div>

                 <div>
                   <strong>Selected Service Departments:</strong>
                   <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                     Count: {selectedServiceDepartments.length}<br/>
                     Values: {JSON.stringify(selectedServiceDepartments)}
                   </div>
                 </div>

                 <div>
                   <strong>Facility Info:</strong>
                   <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                     Name: {facilityInfo?.facilityName || 'Not loaded'}<br/>
                     Type: {facilityInfo?.type || 'Not loaded'}<br/>
                     ID: {facilityInfo?.facilityId || 'Not loaded'}
                   </div>
                 </div>

                 <div>
                   <strong>Tracked Entity Instance (TEI):</strong>
                   <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                     Value: {trackedEntityInstance || facilityInfo?.trackedEntityInstance || 'None'}<br/>
                     Source: {trackedEntityInstance ? 'state' : (facilityInfo?.trackedEntityInstance ? 'facilityInfo' : 'N/A')}
                   </div>
                 </div>

                 <div>
                   <strong>Form Sections:</strong>
                   <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                     Total: {serviceSections?.length || 0}<br/>
                     Loaded: {loadingServiceSections ? 'Loading...' : 'Complete'}
                   </div>
                 </div>
               </div>

               <div style={{ marginTop: '12px' }}>
                 <strong>Available Sections:</strong>
                 <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px', marginTop: '4px', maxHeight: '100px', overflow: 'auto' }}>
                                     {serviceSections?.map((section, index) => {
                   const total = section?.dataElements?.length || 0;
                   const shown = (section?.dataElements || []).filter(psde => {
                     if (!psde?.dataElement) return false;
                     const displayName = psde.dataElement.displayName;
                     
                     // Check if this is a Comments element
                     const isComment = displayName.endsWith(' Comments');
                     
                     if (isComment) {
                       // For Comments, check if main element passes
                       const mainElementName = displayName.replace(/\sComments$/,'');
                       return shouldShowDataElementForService(mainElementName, facilityType);
                     }
                     
                     return shouldShowDataElementForService(displayName, facilityType);
                   }).length;
                   return (
                     <div key={index} style={{ fontSize: '11px', padding: '2px 0' }}>
                       {index + 1}. {section.displayName} (ID: {section.id}) — {shown}/{total} shown
                     </div>
                   );
                 }) || 'No sections loaded'}
                 </div>
               </div>
             </div>
             </details>

             {/* Facility Information Display - Always show */}
             <details className="facility-info-display">
               <summary className="facility-info-header">
                 🏥 Facility Information
               </summary>

               <div className="facility-info-content">
                 {loadingFacilityInfo ? (
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     padding: '20px',
                     color: '#6c757d'
                   }}>
                     <div style={{
                       display: 'inline-block',
                       width: '20px',
                       height: '20px',
                       border: '3px solid #f3f3f3',
                       borderTop: '3px solid #007bff',
                       borderRadius: '50%',
                       animation: 'spin 1s linear infinite',
                       marginRight: '12px'
                     }}></div>
                     <span>Loading facility information...</span>
                   </div>
                 ) : facilityInfo ? (
                   <div className="facility-info-grid">
                     <div className="facility-info-row">
                       <span className="facility-info-label">Facility Name:</span>
                       <span className="facility-info-value facility-name">{facilityInfo.facilityName}</span>
                     </div>

                     <div className="facility-info-row">
                       <span className="facility-info-label">Tracked Entity Instance:</span>
                       <span className="facility-info-value">{trackedEntityInstance || facilityInfo?.trackedEntityInstance || 'None'}</span>
                     </div>

                     {/* Specialisation row is now hidden - users use manual selector instead */}
                   </div>
                 ) : manualSpecialization ? (
                   <div className="facility-info-grid">
                     <div className="facility-info-row">
                       <span className="facility-info-label">Facility Name:</span>
                       <span className="facility-info-value facility-name">
                         {formData.orgUnit ?
                           (configuration?.organisationUnits?.find(ou => ou.id === formData.orgUnit)?.displayName || 'Selected Facility')
                           : 'No facility selected'}
                       </span>
                     </div>

                     <div className="facility-info-row">
                       <span className="facility-info-label">Tracked Entity Instance:</span>
                       <span className="facility-info-value">{trackedEntityInstance || facilityInfo?.trackedEntityInstance || 'None'}</span>
                     </div>

                     {/* Specialisation row is now hidden - users use manual selector instead */}
                   </div>
                 ) : (
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     padding: '20px',
                     color: '#6c757d',
                     fontStyle: 'italic'
                   }}>
                     <div style={{ marginRight: '12px' }}>📋</div>
                     <span>Please select a facility to view information</span>
                   </div>
                 )}
               </div>
             </details>

             {/* Save Status Indicator */}
             {saveStatus.isVisible && (
               <div className={`save-status-indicator ${saveStatus.type}`}>
                 <div className="save-status-content">
                   {saveStatus.type === 'success' ? '💾' : '❌'} {saveStatus.message}
                 </div>
               </div>
             )}

             {/* Manual Specialization Selector */}
             <div className="specialization-selector-section">
               <div className="form-section">
                 <div className="form-field">
                   <label htmlFor="specialization-select" className="form-label">
                     Choose Specialization:
                   </label>
                   <select
                     id="specialization-select"
                     value={manualSpecialization}
                     onChange={(e) => handleSpecializationChange(e.target.value)}
                     className="form-select"
                   >
                     <option value="">Select a specialization...</option>
                     {specializationOptions.map((option, index) => (
                       <option key={index} value={option}>
                         {option}
                       </option>
                     ))}
                   </select>
                 </div>

                 {manualSpecialization && (
                   <div className="specialization-status">
                     <div className="status-indicator success">
                       ✅ Specialization set to: <strong>{manualSpecialization}</strong>
                     </div>
                     <div className="status-note">
                       Form sections and questions will be filtered based on this specialization.
                     </div>
                   </div>
                 )}
               </div>
             </div>

             {/* Form metadata section - only show when not confirmed */}

             {!inspectionInfoConfirmed && (

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

                  {/* All fields are optional note */}

                  <div className="optional-fields-note" style={{ display: 'none' }}>

                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>

                      All fields are optional. You can submit the form with any combination of filled fields.

                    </p>

                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '0' }}>

                      <strong>Note:</strong> Fill in the fields that are relevant to your inspection.

                    </p>

                  </div>

                  {/* Inspection Scheduled Dates */}
                  {inspectionPeriod && (
                    <div className="form-field">
                      <label className="form-label">Inspection Scheduled: Dates:</label>
                      <div>
                        {inspectionPeriod.startDate} to {inspectionPeriod.endDate}
                      </div>
                    </div>
                  )}

                  {/* Debug toggle for facility filtering */}





                  {/* Manual refresh button for troubleshooting */}



                      

                      {/* Facility Classification and Section Visibility Debug Panel */}

                      {showDebugPanel && (

                        <div style={{ 

                          marginTop: '8px',

                          padding: '8px',

                          backgroundColor: '#f8f9fa',

                          border: '1px solid #dee2e6',

                          borderRadius: '4px',

                          fontSize: '11px'

                        }}>

                          <h6 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#495057' }}>

                            🏥 Facility Classification & Section Visibility

                          </h6>

                          

                          {(() => {

                            const currentClassification = getCurrentFacilityClassification();

                            if (currentClassification) {

                              const allSections = serviceSections || [];

                              const visibleSections = allSections.filter(section => 

                                shouldShowSection(section.displayName, currentClassification)

                              );

                              const hiddenSections = allSections.filter(section => 

                                !shouldShowSection(section.displayName, currentClassification)

                              );

                              

                              return (

                                <div>

                                  <div style={{ marginBottom: '4px' }}>

                                    <strong>Type:</strong> {currentClassification}

                  </div>



                                  <div style={{ marginBottom: '4px' }}>

                                    <strong>Visible:</strong> {visibleSections.length} | <strong>Hidden:</strong> {hiddenSections.length}

                                  </div>

                                  

                                  {hiddenSections.length > 0 && (

                                    <div style={{ fontSize: '10px', color: '#dc3545' }}>

                                      <strong>Hidden:</strong> {hiddenSections.map(s => s.displayName).join(', ')}

                                    </div>

                                  )}

                                </div>

                              );

                            }

                            return (

                              <div style={{ color: '#6c757d' }}>

                                No classification set

                              </div>

                            );

                          })()}

                        </div>

                      )}

                  </div>





                  

                                   <div className="form-field">

                     <label htmlFor="orgUnit" className="form-label">

                       Facility/Organisation Unit <span style={{ color: 'red' }}>*</span>

                     </label>


                    {/* Help message for facility selection */}

                    {!formData.orgUnit && (

                      <div style={{

                        backgroundColor: '#fff3cd',

                        border: '1px solid #ffeaa7',

                        borderRadius: '4px',

                        padding: '8px 12px',

                        marginBottom: '8px',

                        fontSize: '14px',

                        color: '#856404'

                      }}>

                        🔓 <strong>Select a facility to unlock the inspection form</strong>

                        <br />

                        Choose a facility from the dropdown below to proceed with the inspection

                      </div>

                    )}


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

                  {/* Inspection Date field - HIDDEN from user but still functional */}
                  <div className="form-field" style={{ display: 'none' }}>

                     <label htmlFor="eventDate" className="form-label">

                       Inspection Date <span style={{ color: 'red' }}>*</span>

                     </label>

                    

                    {/* Help message for date selection */}

                    {!formData.eventDate && (

                      <div style={{

                        backgroundColor: '#fff3cd',

                        border: '1px solid #ffeaa7',

                        borderRadius: '4px',

                        padding: '8px 12px',

                        marginBottom: '8px',

                        fontSize: '14px',

                        color: '#856404'

                      }}>

                        <strong>Select an inspection date</strong>

                        <br />

                        Choose a date within the inspection period to proceed

                      </div>

                    )}

                    

                                     <input

                     type="date"

                     id="eventDate"

                     value={formData.eventDate}

                     onChange={e => handleFieldChange('eventDate', e.target.value)}

                     className={`form-input ${errors.eventDate ? 'error' : ''}`}

                     max={(() => {

                       try {

                         if (inspectionPeriod?.endDate) {

                           const maxDate = new Date(inspectionPeriod.endDate);

                           return !isNaN(maxDate.getTime()) ? maxDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

                         }

                         const today = new Date();

                          return !isNaN(today.getTime()) ? today.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

                       } catch (error) {

                         console.warn('⚠️ Error setting max date:', error);

                         return '2025-12-31';

                       }

                     })()}

                     min={(() => {

                       try {

                         if (inspectionPeriod?.startDate) {

                           const minDate = new Date(inspectionPeriod.startDate);

                            return !isNaN(minDate.getTime()) ? minDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

                         }

                         return '2025-01-01';

                       } catch (error) {

                         console.warn('⚠️ Error setting min date:', error);

                         return '2025-01-01';

                       }

                     })()}

                   />

                  {errors.eventDate && <div className="field-error">{errors.eventDate}</div>}

                </div>

                  

                {/* Removed duplicate Inspection Scheduled: Dates block */}

              </div>

            </div>

          )}



          {/* Program stage sections */}

             { serviceSections && date_valid && serviceSections.length > 0 ? (

               <>

                 {/* Debug info for sections removed */}

               

                                                                       {/* Show only Inspection Information and Inspection Type sections until confirmation */}

                 {!inspectionInfoConfirmed && serviceSections && serviceSections.length > 0 && serviceSections

                   .filter(section => {

                     const sectionName = (section.displayName || '').toLowerCase();

                     return sectionName.includes('inspection information') || sectionName.includes('inspection type');

                   })

                   .filter(section => {

                     // Apply conditional filtering based on facility classification

                     const currentClassification = getCurrentFacilityClassification();

                     const shouldShow = shouldShowSection(section.displayName, currentClassification);



                     if (!shouldShow) {

                       console.log(`🚫 Hiding section "${section.displayName}" for facility type "${currentClassification}"`);

                     }



                     return shouldShow;

                   })
                   .filter(section => {
                     // Apply filtering based on selected service departments
                     const shouldShowForDepartments = shouldShowSectionForServiceDepartments(section.displayName, selectedServiceDepartments);

                     if (!shouldShowForDepartments) {
                       console.log(`🚫 Hiding inspection section "${section.displayName}" - not relevant for selected service departments:`, selectedServiceDepartments);
                     }

                     return shouldShowForDepartments;
                   })

                   .map((section, index) => (

                                         <FormSection

                      key={`${section.id}-${index}-${section.displayName}`}

                      section={section}

                      formData={formData}

                      onChange={handleFieldChange}

                      errors={errors}

                      serviceSections={serviceOptions}

                      loadingServiceSections={loadingServiceSections}

                      readOnlyFields={readOnlyFields}

                      getCurrentPosition={getCurrentPosition}

                      formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}

                      showDebugPanel={showDebugPanel}

                      facilityClassifications={facilityClassifications}

                      loadingFacilityClassifications={loadingFacilityClassifications}

                      inspectionInfoConfirmed={inspectionInfoConfirmed}

                      setInspectionInfoConfirmed={setInspectionInfoConfirmed}

                      areAllInspectionFieldsComplete={areAllInspectionFieldsComplete}

                      getCurrentFacilityClassification={getCurrentFacilityClassification}

                      facilityType={facilityType}

                      onCommentChange={handleCommentChange}

                      comments={fieldComments}

                     />

                   ))}

               

               {/* Show remaining sections only after confirmation */}

               {inspectionInfoConfirmed && (

                 <>

                   {/* Status message */}

                   <div className="form-section" data-confirmation-status="true" style={{

                     backgroundColor: '#d4edda',

                     border: '2px solid #28a745',

                     borderRadius: '8px',

                     padding: '16px',

                     margin: '16px 0',

                     textAlign: 'center'

                   }}>

                     <h4 style={{ color: '#28a745', margin: '0 0 8px 0' }}>

                       ✅ Inspection Information & Type Confirmed

                     </h4>

                     <p style={{ color: '#155724', margin: '0', fontSize: '14px' }}>

                       You can now proceed with the remaining inspection sections

                     </p>

                   </div>

                   

                                       {/* Show all other sections */}

                    {serviceSections && serviceSections.length > 0 && serviceSections

                      .filter(section => {

                        const sectionName = (section.displayName || '').toLowerCase();

                        return !sectionName.includes('inspection type') && !sectionName.includes('inspection information');

                      })

                      .filter(section => {

                        // Apply conditional filtering based on facility classification

                        const currentClassification = getCurrentFacilityClassification();

                        const shouldShow = shouldShowSection(section.displayName, currentClassification);



                        if (!shouldShow) {

                          console.log(`🚫 Hiding section "${section.displayName}" for facility type "${currentClassification}"`);

                        }



                        return shouldShow;

                      })
                      .filter(section => {
                        // Apply filtering based on selected service departments
                        const shouldShowForDepartments = shouldShowSectionForServiceDepartments(section.displayName, selectedServiceDepartments);

                        if (!shouldShowForDepartments) {
                          console.log(`🚫 Hiding section "${section.displayName}" - not relevant for selected service departments:`, selectedServiceDepartments);
                        }

                        return shouldShowForDepartments;
                      })

                      .map((section, index) => (

                        <FormSection

                          key={`${section.id}-${index}-${section.displayName}`}

                          section={section}

                          formData={formData}

                          onChange={handleFieldChange}

                          errors={errors}

                          serviceSections={serviceOptions}

                          loadingServiceSections={loadingServiceSections}

                          readOnlyFields={readOnlyFields}

                          getCurrentPosition={getCurrentPosition}

                          formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}

                          showDebugPanel={showDebugPanel}

                          facilityClassifications={facilityClassifications}

                          loadingFacilityClassifications={loadingFacilityClassifications}

                          inspectionInfoConfirmed={inspectionInfoConfirmed}

                          setInspectionInfoConfirmed={setInspectionInfoConfirmed}

                          areAllInspectionFieldsComplete={areAllInspectionFieldsComplete}

                          getCurrentFacilityClassification={getCurrentFacilityClassification}

                          facilityType={facilityType}

                          onCommentChange={handleCommentChange}

                          comments={fieldComments}

                        />

                      ))}





                 </>

               )}

               

               {/* Show locked sections message when not confirmed */}

               {!inspectionInfoConfirmed && (

                 <div className="form-section" style={{

                   backgroundColor: '#fff3cd',

                   border: '2px solid #ffc107',

                   borderRadius: '8px',

                   padding: '16px',

                   margin: '16px 0',

                   textAlign: 'center'

                 }}>

                   <h4 style={{ color: '#856404', margin: '0 0 8px 0' }}>

                     🔒 Additional Sections Locked

                   </h4>

                   <p style={{ color: '#856404', margin: '0', fontSize: '14px' }}>

                     Complete and confirm the "Inspection Information" and "Inspection Type" sections above to unlock the remaining inspection sections.

                   </p>

                   

                   {/* Show facility classification info */}

                   {(() => {

                     const currentClassification = getCurrentFacilityClassification();

                     if (currentClassification) {

                       const visibleSections = serviceSections?.filter(s => {

                       const sectionName = (s.displayName || '').toLowerCase();

                       return !sectionName.includes('inspection information') && !sectionName.includes('inspection type');

                       }).filter(section => shouldShowSection(section.displayName, currentClassification)) || [];

                       

                       const totalSections = serviceSections?.filter(s => {

                         const sectionName = (s.displayName || '').toLowerCase();

                         return !sectionName.includes('inspection information') && !sectionName.includes('inspection type');

                       }).length || 0;

                       

                       const hiddenSections = totalSections - visibleSections.length;

                       

                       // Get detailed section information including filtered DE counts

                       const sectionDetails = getSectionDetailsForFacility(currentClassification);

                       const facilitySummary = getFacilitySummary(currentClassification);

                       

                       return (

                         <div style={{ 

                           marginTop: '12px', 

                           padding: '8px', 

                           backgroundColor: '#fff', 

                           borderRadius: '4px',

                           fontSize: '12px'

                         }}>

                           <strong>Facility Type:</strong> {currentClassification}<br />

                           <strong>Available Sections:</strong> {visibleSections.length} of {totalSections}

                           {hiddenSections > 0 && (

                             <span style={{ color: '#dc3545' }}>

                               <br /><strong>Hidden Sections:</strong> {hiddenSections} (not applicable for this facility type)

                             </span>

                           )}

                           

                           {/* Show filtered DE summary */}

                           {facilitySummary.totalFilteredDEs > 0 && (

                             <div style={{ 

                               marginTop: '8px', 

                               padding: '6px', 

                               backgroundColor: '#fdf2f2', 

                               borderRadius: '4px',

                               border: '1px solid #fecaca'

                             }}>

                               <strong style={{ color: '#dc3545' }}>🚫 Data Elements Filtered:</strong> {facilitySummary.totalFilteredDEs} total

                               <br />

                               <span style={{ fontSize: '11px', color: '#666' }}>

                                 Across {facilitySummary.sectionsWithFilteredDEs} section(s)

                               </span>

                             </div>

                           )}

                           

                           {/* Show section-by-section filtered DE breakdown */}

                           {Object.keys(sectionDetails).length > 0 && (

                             <div style={{ 

                               marginTop: '8px', 

                               padding: '6px', 

                               backgroundColor: '#f0f9ff', 

                               borderRadius: '4px',

                               border: '1px solid #bae6fd'

                             }}>

                               <strong style={{ color: '#0369a1' }}>Section Details:</strong>

                               {Object.entries(sectionDetails).map(([sectionName, details]) => {

                                 if (details.filteredDECount > 0) {

                                   return (

                                     <div key={sectionName} style={{ fontSize: '11px', marginTop: '4px' }}>

                                       <span style={{ color: '#dc3545' }}>🚫 {sectionName}:</span> {details.filteredDECount} DEs filtered

                                     </div>

                                   );

                                 }

                                 return null;

                               }).filter(Boolean)}

                             </div>

                           )}

                         </div>

                       );

                     }

                     return null;

                   })()}

                 </div>

               )}

             </>

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

                

                {/* Debug info removed */}

              </div>

            </div>

          </div>

        )}

      </form>



      {/* Form footer with actions */}

      <div className="form-footer">

        {/* Signature Capture Section - Only show after inspection info confirmation */}
        {inspectionInfoConfirmed && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <CustomSignatureCanvas
              onSignatureChange={handleSignatureChange}
              existingSignature={intervieweeSignature}
              disabled={false}
            />

          {/* Confirmation Checkbox - show after signature */}
          {intervieweeSignature && (
            <div className="confirmation-checkbox" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '16px',
              background: 'var(--md-surface-variant)',
              borderRadius: '8px',
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              <input
                type="checkbox"
                id="confirmation-checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="confirmation-checkbox" style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'var(--md-on-surface-variant)',
                cursor: 'pointer'
              }}>
                I confirm that I have completed the inspection and reviewed all information
              </label>
            </div>
          )}

          {/* Submit and Save buttons - show after confirmation */}
          {isConfirmed && (
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '16px'
            }}>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={isSubmitting}
                title="Submit inspection form"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="btn btn-secondary"
                disabled={isSubmitting || (!isOnline && !isDraft)}
                title="Save as draft"
              >
                {isSubmitting ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          )}
        </div>
        )}











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

      {/* Payload Dialog */}
      {showPayloadDialog && (
        <div className="payload-dialog-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="payload-dialog" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            margin: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div className="payload-dialog-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #e9ecef',
              paddingBottom: '16px'
            }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>📋 Inspection Payload</h3>
              <button
                onClick={() => setShowPayloadDialog(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>

            <div className="payload-content" style={{
              marginBottom: '24px'
            }}>
              {/* Collapsible payload section */}
              <details style={{ marginBottom: '16px' }}>
                <summary style={{
                  cursor: 'pointer',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#495057',
                  userSelect: 'none'
                }}>
                  <span>📄 This is the data that will be submitted to DHIS2 (click to expand)</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigator.clipboard.writeText(JSON.stringify(payloadData, null, 2));
                      showToast('Payload copied to clipboard!', 'success');
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #007bff',
                      backgroundColor: 'white',
                      color: '#007bff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginLeft: '12px'
                    }}
                    title="Copy payload to clipboard"
                  >
                    📋 Copy
                  </button>
                </summary>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px'
                }}>
                  <pre style={{
                    backgroundColor: 'white',
                    padding: '16px',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    fontSize: '12px',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    overflow: 'auto',
                    maxHeight: '400px',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify(payloadData, null, 2)}
                  </pre>
                </div>
              </details>
            </div>

            <div className="payload-dialog-actions" style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #e9ecef',
              paddingTop: '16px'
            }}>
              <button
                onClick={() => setShowPayloadDialog(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #6c757d',
                  backgroundColor: 'white',
                  color: '#6c757d',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleActualSubmit}
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  </div>

);

}



export { FormPage };