import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { useApp } from '../contexts/AppContext';

import {
  shouldShowSection,
  getFilteredDataElementCount,
  getSectionDetailsForFacility,
  getFacilitySummary,
  getVisibleSectionsForFacility,
  CANONICAL_FACILITY_TYPES,
  normalizeFacilityClassification,
} from '../config/sectionVisibilityConfig';

import facilityServiceFilters, { shouldShowDataElementForService } from '../config/facilityServiceFilters';
import { getDepartmentsForSpecialization, getDepartmentStats } from '../config/facilityServiceDepartments';

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

    fieldName.includes('facility service department') ||
    dataElement.id === 'manual_facility_service_departments' ||
    dataElement.displayName === 'Facility Service Departments';

  // Debug logging for field detection - ALWAYS LOG for this field
  if (fieldName.includes('service') || fieldName.includes('department') ||
    dataElement.displayName === 'Facility Service Departments' ||
    dataElement.id === 'manual_facility_service_departments') {
  }

  // ALWAYS log for manual_facility_service_departments ID
  if (dataElement.id === 'manual_facility_service_departments') {
  }

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

/**
 * Detect data elements that should be treated as "bold" and start on a new page
 *
 * This function identifies data elements that should:
 * 1. Be displayed with bold formatting
 * 2. Start on a new page in the pagination system
 *
 * Patterns detected:
 * - Section headers ending with "--"
 * - ALL CAPS text (likely headers)
 * - Numbered sections (e.g., "1. Introduction", "2.1 Staff")
 * - Common header keywords (SECTION, PART, CHAPTER, etc.)
 *
 * @param {Object} dataElement - The DHIS2 data element object
 * @returns {boolean} - Whether this data element should be treated as bold/header
 */
const isBoldDataElement = (dataElement) => {
  if (!dataElement || !dataElement.displayName) return false;

  const name = dataElement.displayName;

  // 1. Section headers (ending with "--") are always bold
  if (isSectionHeaderName(name)) return true;

  // 2. Data elements that are all caps (likely headers/important sections)
  if (name === name.toUpperCase() && name.length > 3) return true;

  // 3. Data elements that start with numbers followed by a period (e.g., "1. Introduction", "2.1 Staff")
  if (/^\d+(\.\d+)*\.\s/.test(name)) return true;

  // 4. Data elements that contain common header patterns
  const headerPatterns = [
    /^(SECTION|Section)\s+[A-Z0-9]/i,
    /^(PART|Part)\s+[A-Z0-9]/i,
    /^(CHAPTER|Chapter)\s+[A-Z0-9]/i,
    /^(AREA|Area)\s+[A-Z0-9]/i,
    /^(DOMAIN|Domain)\s+[A-Z0-9]/i,
    /^(CATEGORY|Category)\s+[A-Z0-9]/i,
    /^\d+\.\s*(INTRODUCTION|BACKGROUND|OVERVIEW|SUMMARY)/i,
    /^(INTRODUCTION|BACKGROUND|OVERVIEW|SUMMARY)$/i
  ];

  return headerPatterns.some(pattern => pattern.test(name));
};

// Form field component for individual data elements

function FormField({ psde, value, onChange, error, dynamicOptions = null, isLoading = false, readOnly = false, getCurrentPosition, formatCoordinatesForDHIS2, staticText, onCommentChange, comments = {}, manualSpecialization = null, facilityType = null, getCurrentFacilityClassification = null }) {

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

  // FormField rendered

  // Check if this field is mandatory based on field name or compulsory flag

  const isMandatoryField = () => {

    // All fields are now optional - no mandatory requirements

    return false;

  };

  const renderField = () => {

    // Initialize selectOptions at the top to fix hoisting issue
    let selectOptions = null;

    // Field rendering

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
      // Allow re-rendering when options change - removed duplicate prevention
      // that was blocking field updates when department options are loaded

      // Check if we have a facility type selected
      const currentFacilityType = window.__currentFacilityType || 'Unknown';

      // Check if specialization is selected - required before allowing department selection
      // Check both the prop and the global variable for robustness
      const globalSpecialization = window.__manualSpecialization || window.__currentSpecialization;
      const effectiveSpecialization = manualSpecialization || globalSpecialization;
      const hasSpecializationSelected = effectiveSpecialization && effectiveSpecialization.trim() !== '';

      // DEBUG: Log the specialization check
      console.log('🔍 SPECIALIZATION CHECK:', {
        manualSpecialization,
        globalSpecialization,
        effectiveSpecialization,
        hasSpecializationSelected,
        manualSpecializationType: typeof manualSpecialization,
        manualSpecializationValue: JSON.stringify(manualSpecialization),
        timestamp: new Date().toISOString()
      });

      // ALWAYS log for facility service departments field
      if (serviceFieldType === 'facility_service_departments') {
        console.log(`🚨 FACILITY SERVICE DEPARTMENTS VALIDATION:`, {
          dataElementName: dataElement.displayName,
          manualSpecialization,
          hasSpecializationSelected,
          currentFacilityType,
          serviceFieldType,
          manualSpecializationLength: manualSpecialization ? manualSpecialization.length : 0,
          manualSpecializationTrimmed: manualSpecialization ? manualSpecialization.trim() : 'null'
        });
      }

      // Force reload options if they're empty and we have a facility type
      if (selectOptions && selectOptions.length === 0 && currentFacilityType !== 'Unknown') {
        // Trigger a re-render by updating the timestamp
        if (window.forceFormRerender) {
          window.forceFormRerender();
        }
      }

      // Use dynamicOptions provided from parent (list of visible section names)

      const facilityServiceOptions = Array.isArray(dynamicOptions) ? dynamicOptions : [];

      // Extract selected values (array) from the form value (which might be a JSON string or array)

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

      // Get departments for the current specialization using hardcoded mapping
      // Try multiple sources to get the current specialization
      const rawSpecialization =
        window.__currentSpecialization ||
        window.__currentFacilityType ||
        window.__manualSpecialization ||
        (typeof getCurrentFacilityClassification === 'function'
          ? getCurrentFacilityClassification()
          : null) ||
        'Unknown';

      const currentSpecialization =
        normalizeFacilityClassification(rawSpecialization) || rawSpecialization;

      console.log('🔍 Specialization lookup sources:', {
        windowCurrentSpecialization: window.__currentSpecialization,
        windowCurrentFacilityType: window.__currentFacilityType,
        windowManualSpecialization: window.__manualSpecialization,
        getCurrentFacilityClassification:
          typeof getCurrentFacilityClassification === 'function'
            ? getCurrentFacilityClassification()
            : 'function not available',
        rawSpecialization,
        finalSpecialization: currentSpecialization
      });

      // Store the current specialization in global state for debugging and consistency
      if (currentSpecialization && currentSpecialization !== 'Unknown') {
        window.__currentSpecialization = currentSpecialization;
      }

      const hardcodedDepartments = getDepartmentsForSpecialization(currentSpecialization);
      const departmentStats = getDepartmentStats(currentSpecialization);

      // OVERRIDE the global department options with our hardcoded departments
      // This ensures that any dynamic calculation gets overridden
      if (hardcodedDepartments.length > 0) {
        window.__departmentOptionsForSection = hardcodedDepartments;
      }
      // ALWAYS use hardcoded departments as the primary source
      // Override any dynamic calculation with our hardcoded mapping
      selectOptions = hardcodedDepartments;
      // Only fallback to dynamic if hardcoded list is completely empty
      if (selectOptions && selectOptions.length === 0) {
        selectOptions = facilityServiceOptions && facilityServiceOptions.length > 0
          ? facilityServiceOptions
          : (window.__departmentOptionsForSection && window.__departmentOptionsForSection.length > 0
            ? window.__departmentOptionsForSection
            : []);
      }

      // Ensure we always have options - if hardcoded list is empty, show a message
      if (selectOptions && selectOptions.length === 0) {
      }

      const handleSelectChange = (e) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        const jsonValue = JSON.stringify(selected);
        if (window.updateSelectedServiceDepartments) {
          window.updateSelectedServiceDepartments(selected);
        }
        const syntheticEvent = { target: { value: jsonValue, id: fieldId } };
        onChange(syntheticEvent);
      };

      return (
        <div key={`facility-service-departments-${currentFacilityType}`} className={`form-field multiselect-field ${readOnly ? 'readonly' : ''} ${!hasSpecializationSelected ? 'disabled' : ''}`}>
          {/* Hide label for Facility Service Departments to avoid duplication with section title */}
          {serviceFieldType !== 'facility_service_departments' &&
            <label htmlFor={fieldId} className="form-label">{dataElement.displayName}</label>
          }

          {/* Show warning when specialization is not selected */}
          {(() => {
            return !hasSpecializationSelected;
          })() && (
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '12px',
                fontSize: '14px',
                color: '#856404'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span>
                  <span><strong>Please select a specialization first</strong> before choosing facility service departments.</span>
                </div>
              </div>
            )}

          {/* Material UI Card for Facility Service Departments */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            padding: '16px',
            marginBottom: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
              color: '#1976d2',
              fontWeight: '500'
            }}>
              <span style={{ marginRight: '8px' }}>🏥</span>
              <span>Facility Service Departments</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '12px',
                color: '#666',
                backgroundColor: '#e3f2fd',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {selectOptions ? selectOptions.length : 0} available
              </span>
            </div>

            {/* Show current specialization and department stats */}
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '8px',
              fontStyle: 'italic',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Specialization: <strong>{currentSpecialization}</strong></span>
            </div>

            {/* Custom checkbox-based multiselect for easy selection */}
            <div
              style={{
                width: '100%',
                minHeight: '120px',
                maxHeight: '200px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                overflowY: 'auto',
                padding: '4px'
              }}
            >
              {selectOptions && selectOptions.length > 0 ? selectOptions.map((name, idx) => {
                const isSelected = selectedValues.includes(name);
                return (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 8px',
                      cursor: (readOnly || !hasSpecializationSelected) ? 'not-allowed' : 'pointer',
                      borderRadius: '3px',
                      margin: '1px 0',
                      backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                      border: isSelected ? '1px solid #2196f3' : '1px solid transparent',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      opacity: !hasSpecializationSelected ? 0.5 : 1,
                      color: !hasSpecializationSelected ? '#999' : 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      if (!readOnly && !isSelected && hasSpecializationSelected) {
                        e.target.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!readOnly && !isSelected && hasSpecializationSelected) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (readOnly || !hasSpecializationSelected) return;

                        const newSelectedValues = e.target.checked
                          ? [...selectedValues, name]
                          : selectedValues.filter(v => v !== name);

                        const jsonValue = JSON.stringify(newSelectedValues);
                        if (window.updateSelectedServiceDepartments) {
                          window.updateSelectedServiceDepartments(newSelectedValues);
                        }
                        const syntheticEvent = { target: { value: jsonValue, id: fieldId } };
                        onChange(syntheticEvent);
                      }}
                      disabled={readOnly || !hasSpecializationSelected}
                      style={{
                        marginRight: '8px',
                        cursor: (readOnly || !hasSpecializationSelected) ? 'not-allowed' : 'pointer',
                        opacity: !hasSpecializationSelected ? 0.5 : 1
                      }}
                    />
                    <span style={{ flex: 1 }}>{name}</span>
                  </label>
                );
              }) : (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  No departments available for {currentSpecialization}
                </div>
              )}
            </div>

            {/* Help text for multiple selection */}
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Departments filtered by selected specialization
            </div>

            {/* Selected values display */}
            {selectedValues.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#e8f5e8',
                borderRadius: '4px',
                border: '1px solid #c3e6c3'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#2e7d32',
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>
                  Selected ({selectedValues.length}):
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  {selectedValues.map((val, idx) => (
                    <span key={idx} style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );

    }

    // Handle dynamic service dropdown (overrides static optionSet)

    if (dynamicOptions !== null) {

      const isMandatory = isMandatoryField();

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

    switch (dataElement.valueType) {

      case 'TEXT':

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
        break;
      case 'TRUE_ONLY':

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
        <label htmlFor={fieldId} className={`form-label ${isBoldDataElement(dataElement) ? 'bold-label' : ''}`}>
          {dataElement.displayName}
          <span style={{ fontSize: '0.75em', color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
            (ID: {dataElement.id})
          </span>
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
function FormSection({ section, formData, onChange, errors, serviceSections, loadingServiceSections, readOnlyFields = {}, getCurrentPosition, formatCoordinatesForDHIS2, facilityClassifications = [], loadingFacilityClassifications = false, inspectionInfoConfirmed = false, setInspectionInfoConfirmed = () => { }, areAllInspectionFieldsComplete = () => false, showDebugPanel = false, getCurrentFacilityClassification = () => null, facilityType = null, manualSpecialization = null, onCommentChange, comments = {}, selectedServiceDepartments = [] }) {
  // FormSection rendering

  // Safety check - if section is undefined, return null
  if (!section) {
    console.warn('🚨 FormSection: section prop is undefined, returning null');
    return null;
  }

  // Inspection Type section check will be done later in the function

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

    return dataElements.filter(psde => {

      if (!psde || !psde.dataElement) return false;

      const displayName = psde.dataElement.displayName;

      // Hide specialisation/facility classification fields from users (they're handled by manual selector)
      const isSpecialisationField = /specialisation|facility classification|facility type/i.test(displayName);
      if (isSpecialisationField) {
        return false; // Hide these fields from users
      }

      // Check if this is a Comments/Remarks data element
      const isComment = /\s*(Comments?|Remarks?)\s*$/i.test(displayName);

      if (isComment) {
        // For Comments/Remarks elements, check if the main element would pass the filter
        // Extract main element name by removing comment/remarks suffix
        const mainElementName = displayName.replace(/\s*(Comments?|Remarks?)\s*$/i, '');

        // Check if the main element passes the filter
        const mainElementPasses = shouldShowDataElementForService(
          mainElementName,
          facilityType,
          section.displayName
        );

        if (!mainElementPasses) {
        }

        return mainElementPasses;
      } else {
        // For main elements, use the standard filter
        const shouldShow = shouldShowDataElementForService(
          displayName,
          facilityType,
          section.displayName
        );

        if (!shouldShow) {
        }

        return shouldShow;
      }

    });

  };

  // Get filtered data elements

  // const filteredDataElements = filterDataElements(section.dataElements);

  const [filteredDataElements, setFilteredDataElements] = useState([]);

  useEffect(() => {

    const filterAsync = async () => {

      if (!facilityType || !section.dataElements) {
        setFilteredDataElements(section.dataElements || []);

        return;

      }

      // Exclude certain sections from filtering: show all their fields
      const sectionName = (section.displayName || '');
      const lowerName = sectionName.toLowerCase();
      if (sectionName === 'Inspection Type' || lowerName.includes('document review')) {
        setFilteredDataElements(section.dataElements || []);
        return;
      }



      const results = await Promise.all(

        section.dataElements.map(async (psde, idx) => {

          if (!psde || !psde.dataElement) return false;

          const displayName = psde.dataElement.displayName;

          // Hide specialisation/facility classification fields from users (they're handled by manual selector)
          const isSpecialisationField = /specialisation|facility classification|facility type/i.test(displayName);
          if (isSpecialisationField) {
            return false; // Hide these fields from users
          }

          // Check if this is a Comments/Remarks data element
          const isComment = /\s*(Comments?|Remarks?)\s*$/i.test(displayName);

          if (isComment) {
            // For Comments/Remarks elements, check if the main element would pass the filter
            const mainElementName = displayName.replace(/\s*(Comments?|Remarks?)\s*$/i, '');

            const mainElementPasses = await shouldShowDataElementForService(
              mainElementName,
              facilityType,
              sectionName
            );

            // DEBUG: Log comment field filtering for ENT
            // if (isENT && isRelevantSection) {
            //   console.log(`  [${idx}] Comment field "${displayName}" → main: "${mainElementName}" → ${mainElementPasses ? '✅ PASS' : '❌ FAIL'}`);
            // }

            return mainElementPasses;
          } else {
            // For main elements, use the standard filter
            const shouldShow = await shouldShowDataElementForService(
              displayName,
              facilityType,
              sectionName
            );

            // DEBUG: Log main field filtering for ENT
            // if (isENT && isRelevantSection) {
            //   console.log(`  [${idx}] Main field "${displayName}" → ${shouldShow ? '✅ PASS' : '❌ FAIL'}`);
            // }

            return shouldShow;
          }

        })

      );

      // Apply the filter, but never let it make a section completely empty.
      // If no data elements pass the filter for this section + facility type,
      // fall back to showing all the section's data elements so inspectors
      // can still capture data while we align DHIS2 names with the CSV.
      let filtered = section.dataElements.filter((_, idx) => results[idx]);

      // if (isENT && isRelevantSection) {
      //   console.log(`📊 Filter result for "${sectionName}": ${filtered.length} of ${section.dataElements.length} elements passed`);
      // }

      // Removed fallback to showing all elements when filter returns zero
      // If section is not properly configured, it should remain empty

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

      // Check for bold data elements that should start on a new page
      // Look ahead to see if there's a bold element within the current page
      let foundBoldElement = false;
      for (let i = currentIndex + 1; i < Math.min(endIndex, filteredDataElements.length); i++) {
        const element = filteredDataElements[i];
        if (isBoldDataElement(element.dataElement)) {
          // Found a bold element - end the current page before it
          endIndex = i;
          pageSize = endIndex - currentIndex;
          foundBoldElement = true;
          break;
        }
      }

      // If we didn't find a bold element, apply the original comment field logic
      if (!foundBoldElement) {
        // Check if the next field after this page would be a comment field
        if (endIndex < filteredDataElements.length) {
          const nextField = filteredDataElements[endIndex];
          if (isCommentField(nextField.dataElement)) {
            // Extend this page to include the comment field
            endIndex++;
            pageSize++;
          }
        }
      }

      // Ensure we don't exceed total length

      endIndex = Math.min(endIndex, filteredDataElements.length);

      pageSize = endIndex - currentIndex;

      // Don't create empty pages
      if (pageSize > 0) {
        pages.push({
          start: currentIndex,
          end: endIndex,
          size: pageSize,
          fields: filteredDataElements.slice(currentIndex, endIndex)
        });
      }

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
  if (!shouldShow) {

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

            {/* Expected Data Elements from Configuration */}
            {showDebugPanel && !isInspectionTypeSection && !isDocumentReviewSection && (() => {
              console.log('🔍 Debug Panel Render:', {
                facilityType,
                sectionName: section.displayName,
                hasConfig: !!facilityServiceFilters[facilityType]
              });

              const config = facilityServiceFilters[facilityType];
              if (!config) return <div style={{ color: 'red' }}>No config for {facilityType}</div>;

              const sectionConfigEntry = Object.entries(config).find(([key]) => {
                const keyNorm = key.toLowerCase().replace(/s\s/g, ' ').trim();
                const sectionNorm = section.displayName.toLowerCase().replace(/s\s/g, ' ').trim();
                const match = keyNorm.includes(sectionNorm) || sectionNorm.includes(keyNorm);
                // console.log(`  Checking "${key}" vs "${section.displayName}" -> ${match}`);
                return match;
              });

              const sectionConfig = sectionConfigEntry ? sectionConfigEntry[1] : null;
              const expectedQuestions = sectionConfig ? sectionConfig.showOnly : [];

              console.log('  Found Config:', {
                matchedSection: sectionConfigEntry ? sectionConfigEntry[0] : 'NONE',
                questionCount: expectedQuestions.length
              });

              return (
                <div style={{
                  marginTop: '6px',
                  backgroundColor: '#e2e3e5',
                  border: '1px solid #d6d8db',
                  borderRadius: '4px',
                  padding: '6px'
                }}>
                  <strong>Expected Configured Elements ({expectedQuestions.length}):</strong>
                  <div style={{ maxHeight: '140px', overflow: 'auto', marginTop: '4px' }}>
                    {expectedQuestions.length > 0 ? (
                      expectedQuestions.map((q, idx) => (
                        <div key={`${section.id}-expected-${idx}`} style={{
                          fontSize: '10px',
                          borderBottom: '1px solid #eee',
                          padding: '2px 0',
                          color: filteredDataElements.some(psde => psde.dataElement.displayName === q) ? '#28a745' : '#dc3545'
                        }}>
                          {filteredDataElements.some(psde => psde.dataElement.displayName === q) ? '✓ ' : '✗ '}
                          {q}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#dc3545' }}>
                        No configuration found for section "{section.displayName}"
                        (Facility: {facilityType})
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
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
              color: '#003875', // Botswana blue text
              marginLeft: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)', // White background with slight transparency
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.7)' // Light white border
            }}
          >
            📄 {filteredDataElements.length} shown
          </span>

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

              {/* Department options are now calculated in useEffect */}

              {visibleFields.map((psde, index) => {

                // Safety check for psde and dataElement

                if (!psde || !psde.dataElement) {

                  console.warn('🚨 FormSection: Invalid psde or dataElement:', psde);

                  return null;

                }

                // Only allow Facility Service Departments field in Inspection Type section
                if (psde.dataElement.displayName && psde.dataElement.displayName.toLowerCase().includes('facility service department')) {
                  if (!section.displayName.toLowerCase().includes('inspection type')) {
                    return null;
                  }
                }

                // Debug: Log all data elements in Inspection Type section
                if (section.displayName.toLowerCase().includes('inspection type')) {

                  // Check if this is the Facility Service Departments field
                  const serviceFieldType = enhancedServiceFieldDetection(psde.dataElement);
                  if (psde.dataElement.displayName === 'Facility Service Departments' || serviceFieldType === 'facility_service_departments') {
                  }
                }

                // No need to filter here - already filtered before pagination

                const serviceFieldType = enhancedServiceFieldDetection(psde.dataElement);

                // Check if this is a dynamic service field (true or string type indicating special handling)

                const isDynamicServiceField = !!serviceFieldType && serviceFieldType !== 'facility_service_departments';

                const actualIndex = startIndex + index; // Global index for proper field identification

                // Log field rendering for debugging

                if (showDebugPanel) {
                }

                // Hide specific IDs in Inspection Type section while keeping them assigned

                const dn = (psde?.dataElement?.displayName || '').toLowerCase();

                const shouldHideInspectionId = isInspectionTypeSection && (dn.includes('inspection') && dn.includes('id'));

                // Render subsection header (no input) if name ends with "--"
                const deName = psde?.dataElement?.displayName || '';
                if (isSectionHeaderName(deName)) {
                  const headerText = normalizeSectionHeaderName(deName);
                  console.log(`🎯 Rendering subsection header: "${headerText}" (original: "${deName}", ID: ${psde.dataElement.id})`);
                  return (
                    <div key={`header-${psde.dataElement.id}-${actualIndex}`} style={{
                      fontWeight: 700,
                      fontSize: '16px',
                      margin: '24px 0 12px',
                      padding: '8px 0',
                      borderBottom: '2px solid #e0e0e0',
                      color: '#333'
                    }}>
                      {headerText}
                    </div>
                  );
                }

                // Check if this is a bold data element (but not a section header)
                const isBold = isBoldDataElement(psde.dataElement);
                const shouldRenderAsBold = isBold && !isSectionHeaderName(deName);

                // Add page break indicator for bold elements that start a new page
                const isFirstFieldOnPage = actualIndex === startIndex;
                const showPageBreakIndicator = shouldRenderAsBold && !isFirstFieldOnPage;

                return (
                  <div key={`field-container-${psde.dataElement.id}-${actualIndex}`} style={shouldHideInspectionId ? { display: 'none' } : undefined}>
                    {/* Page break indicator for bold elements */}
                    {showPageBreakIndicator && (
                      <div style={{
                        margin: '20px 0 10px',
                        padding: '8px 12px',
                        backgroundColor: '#e3f2fd',
                        border: '1px solid #bbdefb',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#1976d2',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        📄 New Page Section
                      </div>
                    )}

                    <div>

                      <FormField

                        key={`${psde.dataElement.id}-${actualIndex}-${manualSpecialization || 'no-spec'}`}

                        psde={psde}

                        value={formData[`dataElement_${psde.dataElement.id}`]}

                        onChange={(e) => {
                          onChange(`dataElement_${psde.dataElement.id}`, e.target.value);

                        }}

                        error={errors[`dataElement_${psde.dataElement.id}`]}

                        dynamicOptions={

                          serviceFieldType === 'facility_service_departments'

                            ? (window.__departmentOptionsForSection || [])

                            : (isDynamicServiceField ? serviceSections : null)

                        }
                        staticText={(isInspectionTypeSection && psde.dataElement.displayName === 'Source') ? 'MOH' : undefined}

                        isLoading={isDynamicServiceField ? loadingServiceSections : false}

                        readOnly={(isInspectionTypeSection && psde.dataElement.displayName === 'Source') ? true : !!readOnlyFields[`dataElement_${psde.dataElement.id}`]}

                        getCurrentPosition={getCurrentPosition}

                        formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}

                        onCommentChange={onCommentChange}

                        getCurrentFacilityClassification={getCurrentFacilityClassification}

                        manualSpecialization={manualSpecialization}

                        facilityType={facilityType}

                        comments={comments}

                      />

                    </div>
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

                    onChange={(e) => setInspectionInfoConfirmed && setInspectionInfoConfirmed(e.target.checked)}

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

          {/* Show message when confirmation is disabled due to missing facility service departments */}
          {isInspectionTypeSection && areAllInspectionFieldsComplete && !areAllInspectionFieldsComplete() && (() => {
            // Determine what's missing
            const hasFacility = formData.orgUnit && formData.orgUnit.trim() !== '';
            const hasDepartments = selectedServiceDepartments && selectedServiceDepartments.length > 0;

            let warningMessage = 'Please complete the following before proceeding:';
            const missingItems = [];

            if (!hasFacility) {
              missingItems.push('Select a <strong>Facility</strong>');
            }
            if (!hasDepartments) {
              missingItems.push('Select at least one <strong>Facility Service Department</strong>');
            }

            return (
              <div className="form-section" data-inspection-type="disabled" style={{
                backgroundColor: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                padding: '16px',
                margin: '16px 0',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ color: '#856404', margin: '0 0 8px 0' }}>
                    ⚠️ Confirmation Required
                  </h4>
                  <p style={{ color: '#856404', margin: '0 0 8px 0', fontSize: '14px' }}>
                    {warningMessage}
                  </p>
                  <ul style={{
                    color: '#856404',
                    textAlign: 'left',
                    margin: '0 auto',
                    display: 'inline-block',
                    paddingLeft: '20px'
                  }}>
                    {missingItems.map((item, index) => (
                      <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ul>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: 0.6
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'not-allowed',
                    fontSize: '16px',
                    color: '#856404'
                  }}>
                    <input
                      type="checkbox"
                      checked={false}
                      disabled={true}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'not-allowed'
                      }}
                    />
                    <span>I confirm that all inspection information and type are correct</span>
                  </label>
                </div>
              </div>
            );
          })()}

        </div>

      </div>

    </div>

  );

} // End of FormSection component

// Function to generate DHIS2 standard ID (11 characters alphanumeric)
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

  return result;
};

const DEPARTMENT_SECTION_MAPPING = {
  // Management and Organization
  'ORGANISATION AND MANAGEMENT': ['ORGANISATION AND MANAGEMENT'],
  'STATUTORY REQUIREMENTS': ['STATUTORY REQUIREMENTS'],
  'POLICIES AND PROCEDURES': ['POLICIES AND PROCEDURES'],

  // Services and Personnel
  'SERVICES PROVIDED': ['SERVICES PROVIDED'],
  'PERSONNEL': ['PERSONNEL'],

  // Environment and Infrastructure
  'ENVIRONMENT': ['ENVIRONMENT'],
  'SAFETY AND WASTE MANAGEMENT': ['SAFETY AND WASTE MANAGEMENT'],

  // Patient Areas
  // Patient Areas
  'RECEPTION AREA': ['RECEPTION AREA'],
  'PATIENT WAITING AREA': ['PATIENT WAITING AREA'],
  'FACILITY-RECEPTION/WAITING AREA': ['FACILITY-RECEPTION/WAITING AREA'],
  'FACILITY - RECEPTION/WAITING AREA': ['FACILITY-RECEPTION/WAITING AREA'],
  'FACILITY- RECEPTION/WAITING AREA': ['FACILITY-RECEPTION/WAITING AREA'],
  'FACILITY-RECEPTION/ WAITING AREA': ['FACILITY-RECEPTION/WAITING AREA'],
  'FACILITY-ENVIRONMENT': ['FACILITY-ENVIRONMENT'],
  'FACILITY-ENVIONMENT': ['FACILITY-ENVIONMENT'],
  'FACILITY-EVIRONMENT': ['FACILITY-EVIRONMENT'],
  'FACILITY-PROCEDURE ROOM': ['FACILITY-PROCEDURE ROOM'],
  'FACILITY - PROCEDURE ROOM': ['FACILITY-PROCEDURE ROOM'],
  'FACILITY- PROCEDURE ROOM': ['FACILITY-PROCEDURE ROOM'],

  // Clinical Rooms - General
  'SCREENING ROOM': ['SCREENING ROOM'],
  'FACILITY SCREENING ROOM': ['FACILITY SCREENING ROOM'],
  'FACILITY- SCREENING ROOM': ['FACILITY- SCREENING ROOM'],
  'FACILITY-SCREENING ROOM': ['FACILITY-SCREENING ROOM'],
  'FACILITY - SCREENING ROOM': ['FACILITY - SCREENING ROOM'],
  'CONSULTATION ROOM': ['CONSULTATION ROOM'],
  'FACILITY CONSULTATION/TREATMENT ROOM': ['FACILITY CONSULTATION/TREATMENT ROOM'],
  'FACILITY- CONSULTATION/TREATMENT ROOM': ['FACILITY- CONSULTATION/TREATMENT ROOM'],
  'FACILITY-CONSULTATION/TREATMENT ROOM': ['FACILITY-CONSULTATION/TREATMENT ROOM'],
  'FACILITY-CONSULTATION/ TREATMENT ROOM': ['FACILITY-CONSULTATION/ TREATMENT ROOM'],
  'FACILITY - CONSULTATION/TREATMENT ROOM': ['FACILITY - CONSULTATION/TREATMENT ROOM'],
  'PROCEDURE ROOM': ['PROCEDURE ROOM'],

  // Clinical Rooms - Specialized
  'GYNAECOLOGY EXAMINATION ROOM': ['GYNAECOLOGY EXAMINATION ROOM'],
  'ENT EXAMINATION ROOM': ['ENT EXAMINATION ROOM'],
  'OPHTHALMOLOGY EXAMINATION ROOM': ['OPHTHALMOLOGY EXAMINATION ROOM'],
  'DENTAL CHAIR AREA': ['DENTAL CHAIR AREA'],
  'X-RAY ROOM': ['X-RAY ROOM'],
  'RADIOLOGY READING ROOM': ['RADIOLOGY READING ROOM'],

  // Support Rooms
  'BLEEDING ROOM': ['BLEEDING ROOM'],
  'SLUICE ROOM': ['SLUICE ROOM'],
  'TOILET FACILITITES': ['TOILET FACILITITES'],
  'TOILET FACILITIES': ['TOILET FACILITIES'],

  // Laboratory Areas
  'LABORATORY WORK AREA': ['LABORATORY WORK AREA'],

  // Pharmacy and Supplies
  'PHARMACY/ DISPENSARY': ['PHARMACY/ DISPENSARY'],
  'PHARMACY/DISPENSARY': ['PHARMACY/DISPENSARY'],
  'SUPPLIES': ['SUPPLIES'],

  // Information Management
  'RECORDS/ INFORMATION MANAGEMENT': ['RECORDS/ INFORMATION MANAGEMENT'],
  'MEDICAL RECORDS ROOM': ['MEDICAL RECORDS ROOM'],

  // Therapy Areas
  'PHYSIOTHERAPY TREATMENT AREA': ['PHYSIOTHERAPY TREATMENT AREA'],
  'PSYCHOLOGY CONSULTATION ROOM': ['PSYCHOLOGY CONSULTATION ROOM'],
  'REHABILITATION THERAPY AREA': ['REHABILITATION THERAPY AREA'],

  // Emergency and Critical Care
  'EMERGENCY ROOM': ['EMERGENCY ROOM'],
  'OPERATING THEATRE': ['OPERATING THEATRE'],
  'INTENSIVE CARE UNIT': ['INTENSIVE CARE UNIT'],

  // Wards
  'MATERNITY WARD': ['MATERNITY WARD'],
  'PEDIATRIC WARD': ['PEDIATRIC WARD'],
  'ISOLATION ROOM': ['ISOLATION ROOM'],

  // Storage and Administrative
  'WASTE STORAGE AREA': ['WASTE STORAGE AREA'],
  'CLEANING STORAGE AREA': ['CLEANING STORAGE AREA'],
  'STAFF REST ROOM': ['STAFF REST ROOM'],
  'ADMINISTRATIVE OFFICE': ['ADMINISTRATIVE OFFICE'],

  // Quality and Satisfaction
  'CUSTOMER SATISFACTION': ['CUSTOMER SATISFACTION'],

  // Special
  'HIV SCREENING': ['HIV SCREENING'],
  'TENS': ['TENS'],

  // Catch-all
  'OTHER': [] // OTHER shows all sections
};

const DepartmentDebugInfo = ({ selectedDepartments, onClose }) => {
  const mapping = DEPARTMENT_SECTION_MAPPING;
  const availableOptions = window.__departmentOptionsForSection || [];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '2px solid #ff4444',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      zIndex: 10001,
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '10px', background: '#ff4444', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>🐞 Department Debugger</strong>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ padding: '10px' }}>
        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
          This panel shows the exact raw values from DHIS2 to help diagnose matching issues.
        </div>
        <h4>Selected Departments ({selectedDepartments.length})</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {selectedDepartments.map((dept, i) => {
            const mapped = mapping[dept];
            return (
              <li key={i} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: mapped ? '#f0fff4' : '#fff5f5' }}>
                <div style={{ fontWeight: 'bold', color: '#333', wordBreak: 'break-all' }}>"{dept}"</div>
                <div style={{ fontSize: '12px', color: mapped ? 'green' : 'red', marginTop: '4px' }}>
                  {mapped ? `✅ Mapped to: ${mapped.join(', ')}` : '❌ NO MAPPING FOUND'}
                </div>
                <div style={{ fontSize: '10px', color: '#999', marginTop: '4px', fontFamily: 'monospace' }}>
                  Char codes: {dept.split('').map(c => c.charCodeAt(0)).join(', ')}
                </div>
              </li>
            );
          })}
        </ul>
        <hr style={{ margin: '15px 0', borderTop: '1px solid #eee' }} />
        <h4>Available Options ({availableOptions.length})</h4>
        <details>
          <summary style={{ cursor: 'pointer', color: '#007bff' }}>Show All Options</summary>
          <pre style={{ fontSize: '10px', whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginTop: '5px' }}>
            {JSON.stringify(availableOptions, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

// Main FormPage component

function FormPage() {

  // Debug panel now managed by state below

  // Removed cleanup for facility service departments rendered flag (no longer needed)

  // State for inspection information confirmation (moved to top to fix hoisting issue)
  const [inspectionInfoConfirmed, setInspectionInfoConfirmed] = useState(false);

  const [showDebug, setShowDebug] = useState(false);
  const { eventId } = useParams();

  const navigate = useNavigate();
  // Ensure we always have an eventId for incremental saving
  // If no eventId, check for most recent draft first before generating new one
  useEffect(() => {
    const initializeEventId = async () => {
      if (!eventId) {
        try {
          // Check for most recent draft form data
          const mostRecent = await indexedDBService.getMostRecentFormData();

          if (mostRecent && mostRecent.eventId) {
            console.log('📋 Found most recent draft, restoring eventId:', mostRecent.eventId);
            // Navigate to existing draft instead of creating new one
            navigate(`/form/${mostRecent.eventId}`, { replace: true });
          } else {
            // No existing draft found, generate new eventId
            const generatedId = generateDHIS2Id();
            console.log('🆕 No existing draft found, generating new eventId:', generatedId);
            navigate(`/form/${generatedId}`, { replace: true });
          }
        } catch (error) {
          console.error('❌ Error checking for existing drafts:', error);
          // On error, generate new eventId as fallback
          const generatedId = generateDHIS2Id();
          navigate(`/form/${generatedId}`, { replace: true });
        }
      }
    };

    initializeEventId();
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

  // Set global facility type for use in field rendering
  useEffect(() => {
    window.__currentFacilityType = facilityType;
  }, [facilityType]);

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

  // State to force re-renders when specialization changes
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(Date.now());

  // Flag to prevent clearing service departments during IndexedDB loading
  const [isLoadingFromIndexedDB, setIsLoadingFromIndexedDB] = useState(false);

  // Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [indexedDBData, setIndexedDBData] = useState(null);

  // Function to refresh IndexedDB data for debug panel
  const refreshIndexedDBData = async () => {
    if (eventId) {
      try {
        const data = await loadFormData();
        setIndexedDBData(data);
      } catch (error) {
        console.error('Failed to load IndexedDB data:', error);
        setIndexedDBData({ error: error.message });
      }
    }
  };

  // Available specialization options - aligned to canonical CSV facility types
  const specializationOptions = CANONICAL_FACILITY_TYPES;

  // State to track loading of service sections
  const [loadingServiceSections, setLoadingServiceSections] = useState(false);

  // Handle manual specialization selection
  const handleSpecializationChange = (selectedSpecialization) => {

    // Enhanced debugging
    setManualSpecialization(selectedSpecialization);
    setFacilityType(selectedSpecialization); // Update facility type for filtering

    // Update the form data for the specialization dataElement (qfmVD6tCOHu)
    const specializationFieldName = 'dataElement_qfmVD6tCOHu';

    // Also update the formData to ensure consistency
    setFormData(prev => ({
      ...prev,
      facilityClassification: selectedSpecialization,
      [specializationFieldName]: selectedSpecialization
    }));

    // Save the specialization field incrementally to IndexedDB
    if (eventId) {
      saveField(specializationFieldName, selectedSpecialization);
    }

    // Clear any previously selected departments when specialization changes
    // This ensures departments are only from the newly selected specialization
    // But don't clear if we're loading from IndexedDB
    if (!isLoadingFromIndexedDB) {
      setSelectedServiceDepartments([]);
    }

    // Clear the global department options to force recalculation
    window.__departmentOptionsForSection = null;

    // Force re-render by updating a timestamp
    setLastUpdateTimestamp(Date.now());

    // Force re-render of the Facility Service Departments field
    if (window.forceFormRerender) {
      window.forceFormRerender();
    }

    // Use hardcoded departments instead of dynamic calculation

    // Get hardcoded departments for the selected specialization
    const hardcodedDepartments = getDepartmentsForSpecialization(selectedSpecialization);
    const departmentStats = getDepartmentStats(selectedSpecialization);
    // Set the global department options to our hardcoded list
    window.__departmentOptionsForSection = hardcodedDepartments;

    // Also store the specialization in global state
    window.__currentSpecialization = selectedSpecialization;
    window.__manualSpecialization = selectedSpecialization;

    // OVERRIDE any dynamic calculation by intercepting the global department options
    // This ensures our hardcoded departments are always used
    const originalDepartmentOptions = window.__departmentOptionsForSection;
    window.__departmentOptionsForSection = hardcodedDepartments;

    // Also override any other global variables that might be used
    window.__hardcodedDepartments = hardcodedDepartments;
    window.__currentSpecialization = selectedSpecialization;

    // Set up a global interceptor to ensure our hardcoded departments are always used
    // This will override any dynamic calculation that happens after this point
    const interceptor = () => {
      if (window.__hardcodedDepartments && window.__hardcodedDepartments.length > 0) {
        window.__departmentOptionsForSection = window.__hardcodedDepartments;
        return window.__hardcodedDepartments;
      }
      return window.__departmentOptionsForSection;
    };

    // Override the global department options getter
    window.getDepartmentOptions = interceptor;

    // REMOVED: The periodic guard was causing performance issues and constant re-renders
    // Instead, we'll rely on the one-time setup and proper state management

    // Legacy dynamic calculation (commented out - using hardcoded instead)
    /*
    if (configuration?.programStage?.sections) {
      const filteredSections = configuration.programStage.sections.filter(section => {
        return shouldShowSection(section.displayName, selectedSpecialization);
      });
      
      console.log(`🔍 Immediately filtering sections for ${selectedSpecialization}:`, {
        total: configuration.programStage.sections.length,
        filtered: filteredSections.length,
        sections: filteredSections.map(s => s.displayName)
      });
              .replace(/\sComments?\s*$/i, '')
              .replace(/\sRemarks?\s*$/i, '')
              .trim();
            return shouldShowDataElementForService(main2, selectedSpecialization);
          }
          return shouldShowDataElementForService(displayName2, selectedSpecialization);
        }).length;
        
        if (shown > 0) {
          names.push(s.displayName);
          seenNames.add(s.displayName);
        }
      }
      
      const departmentOptions = names;
      window.__departmentOptionsForSection = departmentOptions;
    }
    */
    // Log what sections should be visible now
    const visibleSections = getVisibleSectionsForFacility(selectedSpecialization);
  };

  // Function to determine if a section should be shown based on selected service departments
  const shouldShowSectionForServiceDepartments = (sectionName, selectedDepartments) => {
    const safeName = (sectionName || '').toString();
    const sectionLower = safeName.toLowerCase();

    // Always show core inspection sections regardless of department selection
    if (sectionLower.includes('inspection information') || sectionLower.includes('inspection type')) {
      return true;
    }

    // If no departments have been selected yet, hide all other sections.
    // This keeps the progress bar and main form from showing every department
    // section as soon as a category is chosen; sections only appear once at
    // least one Facility Service Department has been ticked.
    if (!selectedDepartments || selectedDepartments.length === 0) {
      return false;
    }

    // Enhanced mapping of service departments to relevant sections
    const departmentSectionMapping = DEPARTMENT_SECTION_MAPPING;

    // Check if any selected department maps to this section

    // Check if any selected department maps to this section
    // Check if any selected department maps to this section
    for (const department of selectedDepartments) {
      if (department === 'OTHER') {
        return true; // OTHER shows all sections
      }
      const keywords = departmentSectionMapping[department] || [];

      // Debug logging for specific sections/departments
      // Log ALL sections to see what we are dealing with
      console.log(`🔍 Checking section "${sectionName}" (lower: "${sectionLower}") against department "${department}"`);

      if (sectionLower.includes('organisation') || sectionLower.includes('personnel')) {
        console.log(`🔍 MATCH CHECK: "${sectionName}" against "${department}"`, {
          keywords,
          match: keywords.some(k => sectionLower.includes(k.toLowerCase()))
        });
      }

      if (keywords.some(k => {
        const keywordLower = k.toLowerCase();
        // Exact match: section name must equal the keyword
        return sectionLower === keywordLower;
      })) {
        return true;
      }
    }

    // Debug logging for hidden sections
    if (selectedDepartments.length > 0) {
      console.log(`🚫 Hiding section "${sectionName}" - no match in selected departments:`, selectedDepartments);
    }

    return false;
  };

  // Set up global handler for updating the facilityType state
  useEffect(() => {
    window.updateSelectedFacilityService = (value) => {
      const normalized = normalizeFacilityClassification(value);
      setFacilityType(normalized || value);
    };

    // Global function to update selected service departments
    window.updateSelectedServiceDepartments = (departments) => {
      setSelectedServiceDepartments(departments);
    };

    return () => {
      // Cleanup global functions
      delete window.updateSelectedFacilityService;
      delete window.updateSelectedServiceDepartments;
    };
  }, []);

  // Function to filter out unwanted sections (including those starting with "Pre")
  const filterUnwantedSections = (sections) => {
    if (!sections || !Array.isArray(sections)) return [];

    // Filter out unwanted sections including those starting with "Pre"
    const filtered = sections.filter(section => {
      const displayName = section.displayName || '';

      // Check if section starts with "Pre" (case-insensitive)
      if (displayName.toLowerCase().startsWith('pre')) {
        return false;
      }

      // Also filter out these specific sections
      if (displayName === "Final_Inspection_Event" ||
        displayName === "Preliminary-Report" ||
        displayName === "Inspectors Details") {
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

      const rawClassifications = parseCSVClassifications(csvContent);

      // Normalize and de-duplicate against canonical facility types from CSV
      const normalizedClassifications = Array.from(
        new Set(
          rawClassifications
            .map((name) => normalizeFacilityClassification(name))
            .filter(Boolean)
        )
      );

      setFacilityClassifications(normalizedClassifications);

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

      return;

    }

    if (!configuration?.programStage?.allDataElements) {

      return;

    }

    // Find all coordinate fields

    const coordinateFields = configuration.programStage.allDataElements.filter(psde => {

      const fieldName = (psde.dataElement.displayName || psde.dataElement.shortName || '').toLowerCase();

      return fieldName.includes('coordinates') || fieldName.includes('coordinate') || fieldName.includes('gps') || fieldName.includes('location');

    });

    if (coordinateFields.length === 0) {

      return;

    }

    return new Promise((resolve, reject) => {

      navigator.geolocation.getCurrentPosition(

        (position) => {

          const { latitude, longitude } = position.coords;

          const coordinates = `[${longitude.toFixed(6)},${latitude.toFixed(6)}]`;

          // Update all coordinate fields in formData

          const updates = {};

          coordinateFields.forEach(psde => {

            const fieldName = `dataElement_${psde.dataElement.id}`;

            updates[fieldName] = coordinates;

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

  // Cache for facility info to prevent repeated API calls
  const facilityInfoCache = useMemo(() => new Map(), []);

  // Global cache for inspection assignments to prevent repeated API calls
  const inspectionAssignmentsCache = useMemo(() => {
    let cache = null;
    let lastFetch = 0;
    const CACHE_DURATION = 30000; // 30 seconds

    return {
      async get() {
        const now = Date.now();
        if (cache && (now - lastFetch) < CACHE_DURATION) {
          return cache;
        }

        cache = await api.getInspectionAssignments();
        lastFetch = now;
        return cache;
      },
      clear() {
        cache = null;
        lastFetch = 0;
      }
    };
  }, [api]);

  // Get facility information from dataStore when form loads
  useEffect(() => {
    const getFacilityInfoFromDataStore = async () => {
      // Wait for all required dependencies to be available
      if (!formData.orgUnit || !api || !configuration) {
        setFacilityInfo(null);
        return;
      }

      // Check cache first
      if (facilityInfoCache.has(formData.orgUnit)) {
        setFacilityInfo(facilityInfoCache.get(formData.orgUnit));
        setLoadingFacilityInfo(false);
        return;
      }

      setLoadingFacilityInfo(true);
      setFacilityInfo(null); // Clear previous facility info

      try {

        // First try to get from userAssignments (which may have more complete info)
        let facilityData = null;

        // Get current userAssignments from context to avoid dependency issues
        const currentUserAssignments = userAssignments;
        if (currentUserAssignments && currentUserAssignments.length > 0) {
          const userAssignment = currentUserAssignments.find(assignment =>
            assignment.facility && assignment.facility.id === formData.orgUnit
          );

          if (userAssignment && userAssignment.facility) {

            const extractedType = userAssignment.facility.facilityType || userAssignment.facility.type;

            facilityData = {
              facilityId: userAssignment.facility.id,
              facilityName: userAssignment.facility.displayName || userAssignment.facility.name,
              type: extractedType,
              trackedEntityInstance: userAssignment.facility.trackedEntityInstance
            };
          }
        }

        // If not found in userAssignments, try inspection dataStore
        if (!facilityData) {
          const inspectionData = await inspectionAssignmentsCache.get();

          if (inspectionData && inspectionData.inspections) {
            const facilityInspection = inspectionData.inspections.find(
              inspection => inspection.facilityId === formData.orgUnit
            );

            if (facilityInspection) {

              const extractedType = facilityInspection.facilityType || facilityInspection.type;

              facilityData = {
                facilityId: facilityInspection.facilityId,
                facilityName: facilityInspection.facilityName,
                type: extractedType,
                trackedEntityInstance: facilityInspection.trackedEntityInstance
              };
            } else {
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
          // Cache the result
          facilityInfoCache.set(formData.orgUnit, facilityData);

          // Set the facility type to use for filtering
          if (facilityData.type) {
            const normalizedType = normalizeFacilityClassification(facilityData.type);
            setFacilityType(normalizedType || facilityData.type);
            console.log('🔍 FACILITY TYPE DEBUG: Type set to:', {
              type: facilityData.type,
              normalizedType,
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
          }

          // REMOVED: Auto-populating facility type field to prevent circular dependency
          // This was causing the useEffect to trigger repeatedly because it modifies formData
          // which is a dependency of this same useEffect, creating an infinite loop
          // The facility type should be set through other means (manual selection, IndexedDB loading, etc.)
        } else {
          setFacilityInfo(null);
          // Cache the null result to prevent repeated calls
          facilityInfoCache.set(formData.orgUnit, null);
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
  }, [formData.orgUnit, api, configuration]); // Only re-run when orgUnit, api, or configuration changes

  // Debug logging for facility info state
  useEffect(() => {
  }, [formData.orgUnit, facilityInfo, facilityType, loadingFacilityInfo, userAssignments, api, configuration]);

  // Update sections when specialization changes
  useEffect(() => {
    if (facilityType || manualSpecialization) {
      const currentClassification = getCurrentFacilityClassification();

      // Force re-filtering of sections by updating the serviceSections state
      if (configuration?.programStage?.sections) {
        const filteredSections = configuration.programStage.sections.filter(section => {
          // Normalize section name by removing "SECTION X-" prefix if present
          const normalizedSectionName = section.displayName.replace(/^SECTION\s+[A-Z]\s*-\s*/i, '');
          return shouldShowSection(normalizedSectionName, currentClassification);
        });

        console.log(`🔍 Filtered sections for ${currentClassification}:`, {
          total: configuration.programStage.sections.length,
          filtered: filteredSections.length,
          sections: filteredSections.map(s => s.displayName)
        });

        // Update the service sections
        setServiceSections(filteredSections);
      }
    }
  }, [facilityType, manualSpecialization, lastUpdateTimestamp, configuration]);

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

            // Set loading flag to prevent clearing service departments
            setIsLoadingFromIndexedDB(true);
            setFormData(prev => ({
              ...prev,
              ...existingData.formData
            }));

            // Load comments if they exist
            if (existingData.metadata?.fieldComments) {
              setFieldComments(existingData.metadata.fieldComments);
            }

            // Load specialization and service departments together to prevent multiple updates
            const specializationFieldName = 'dataElement_qfmVD6tCOHu';
            const savedSpecialization = existingData.formData[specializationFieldName] ||
              existingData.formData.facilityClassification;

            const serviceDepartmentsFieldName = 'dataElement_facility_service_departments';
            const savedServiceDepartments = existingData.formData[serviceDepartmentsFieldName];

            let parsedDepartments = [];
            if (savedServiceDepartments) {
              try {
                parsedDepartments = typeof savedServiceDepartments === 'string'
                  ? JSON.parse(savedServiceDepartments)
                  : savedServiceDepartments;

                if (!Array.isArray(parsedDepartments)) {
                  parsedDepartments = [];
                }
              } catch (error) {
                console.warn('Failed to parse saved service departments:', error);
                parsedDepartments = [];
              }
            }

            // Batch all updates together to prevent multiple re-renders
            if (savedSpecialization || parsedDepartments.length > 0) {
              // Update specialization if available
              if (savedSpecialization) {
                const normalizedSaved =
                  normalizeFacilityClassification(savedSpecialization) || savedSpecialization;
                setManualSpecialization(normalizedSaved);
                setFacilityType(normalizedSaved);

                // Update global state for consistency
                window.__currentSpecialization = normalizedSaved;
                window.__manualSpecialization = normalizedSaved;
              }

              // Update service departments if available
              if (parsedDepartments.length > 0) {
                setSelectedServiceDepartments(parsedDepartments);

                // Update global state for consistency
                window.__selectedServiceDepartments = parsedDepartments;
              }

              // Single timestamp update for both changes
              setLastUpdateTimestamp(Date.now());
            }

            // Clear loading flag after all updates are complete
            setTimeout(() => {
              setIsLoadingFromIndexedDB(false);
            }, 200); // Small delay to ensure all state updates are processed

            showToast('Loaded saved form data', 'success');

            // Log what was loaded for debugging
            console.log('📋 Form data loading summary:', {
              totalFields: Object.keys(existingData.formData).length,
              hasSpecialization: !!savedSpecialization,
              specialization: savedSpecialization,
              hasServiceDepartments: !!savedServiceDepartments,
              serviceDepartments: savedServiceDepartments
            });
          }
        } catch (error) {
          console.error('❌ Failed to load existing form data:', error);
        }
      }
    };

    loadExistingData();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Update form data with the comments JSON
      setFormData(prev => ({
        ...prev,
        [`dataElement_${surveyCommentsElement.dataElement.id}`]: commentsJson
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
    } else {
      console.warn('⚠️ Survey Comments data element not found with ID:', COMMENTS_DATA_ELEMENT_ID);
    }

    return commentsElement;
  };

  // Load existing comments when form data changes
  useEffect(() => {
    const surveyCommentsElement = findSurveyCommentsElement();
    if (surveyCommentsElement && formData) {
      const commentsFieldKey = `dataElement_${surveyCommentsElement.dataElement.id}`;
      const commentsJson = formData[commentsFieldKey];

      if (commentsJson && typeof commentsJson === 'string') {
        try {
          const parsedComments = JSON.parse(commentsJson);
          if (typeof parsedComments === 'object' && parsedComments !== null) {
            setFieldComments(parsedComments);
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

    // Save signature immediately to IndexedDB (critical field)
    if (eventId) {
      saveFieldImmediate('intervieweeSignature', signatureDataURL);
    }
  };

  // Debug panel removed - no longer needed

  const [isDraft, setIsDraft] = useState(false);

  // Controls whether the Floating Progress bar is collapsed
  const [isProgressCollapsed, setIsProgressCollapsed] = useState(false);

  // const [currentUser, setCurrentUser] = useState(null);

  const [serviceSections, setServiceSections] = useState([]);

  // Initialize department options immediately when component loads
  // This ensures hardcoded departments are available before any FormField renders
  const initializeDepartmentOptions = () => {
    const baseClassification = manualSpecialization || facilityType || 'Obstetrics & Gynaecology';
    const currentSpecialization =
      normalizeFacilityClassification(baseClassification) || 'Obstetrics & Gynaecology';
    const hardcodedDepartments = getDepartmentsForSpecialization(currentSpecialization);

    console.log(
      `🚀 IMMEDIATE INIT: Setting department options for "${currentSpecialization}":`,
      {
        count: hardcodedDepartments.length,
        departments: hardcodedDepartments.slice(0, 3) // Show first 3 for debugging
      }
    );

    if (hardcodedDepartments.length > 0) {
      window.__departmentOptionsForSection = hardcodedDepartments;
    }
  };

  // Call immediately on every render to ensure departments are always available
  initializeDepartmentOptions();

  // Calculate department options when serviceSections or facilityType changes
  useEffect(() => {
    try {
      if (facilityType) {

        // First, try to get hardcoded departments for the current specialization
        const baseClassification = manualSpecialization || facilityType || 'Obstetrics & Gynaecology';
        const currentSpecialization =
          normalizeFacilityClassification(baseClassification) || 'Obstetrics & Gynaecology';
        const hardcodedDepartments = getDepartmentsForSpecialization(currentSpecialization);

        console.log(`🎯 Checking hardcoded departments for "${currentSpecialization}":`, {
          count: hardcodedDepartments.length,
          departments: hardcodedDepartments.slice(0, 5) // Show first 5 for debugging
        });

        if (hardcodedDepartments.length > 0) {
          // Use hardcoded departments
          window.__departmentOptionsForSection = hardcodedDepartments;
          return;
        }

        // Fallback to dynamic calculation only if no hardcoded departments are available
        if (serviceSections && Array.isArray(serviceSections)) {

          const names = [];
          const seenNames = new Set(); // Track seen names to prevent duplicates

          for (const s of serviceSections) {
            const total = s?.dataElements?.length || 0;
            if (total === 0) continue;

            // Only include sections that should be visible for the current facility type
            // Normalize section name by removing "SECTION X-" prefix if present
            const normalizedSectionName = s.displayName.replace(/^SECTION\s+[A-Z]\s*-\s*/i, '');
            const shouldShowThisSection = shouldShowSection(
              normalizedSectionName,
              currentSpecialization
            );
            if (!shouldShowThisSection) {
              continue;
            }

            // Skip if we've already processed a section with this display name
            if (seenNames.has(s.displayName)) {
              continue;
            }

            const shown = (s.dataElements || []).filter((psde2) => {
              if (!psde2?.dataElement) return false;
              const displayName2 = psde2.dataElement.displayName;
              const isComment2 = /\s(Comments?|Remarks?)$/i.test(displayName2);
              if (isComment2) {
                const main2 = displayName2
                  .replace(/\sComments?\s*$/i, '')
                  .replace(/\sRemarks?\s*$/i, '')
                  .trim();
                return shouldShowDataElementForService(main2, currentSpecialization);
              }
              return shouldShowDataElementForService(displayName2, currentSpecialization);
            }).length;

            if (shown > 0) {
              names.push(s.displayName);
              seenNames.add(s.displayName); // Mark as seen
            }
          }

          // No need for additional deduplication since we prevented duplicates above
          const departmentOptions = names;

          window.__departmentOptionsForSection = departmentOptions;
        } else {
          window.__departmentOptionsForSection = [];
        }
      }
    } catch (error) {
      console.error('Error calculating department options:', error);
      window.__departmentOptionsForSection = [];
    }
  }, [facilityType, serviceSections, manualSpecialization]);

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

  // State for inspection information confirmation (moved to top of FormPage function)

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
          } else {
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
      return normalizeFacilityClassification(manualSpecialization);
    }

    // 2. Try to get from formData
    if (formData.facilityClassification) {
      return normalizeFacilityClassification(formData.facilityClassification);
    }

    // 3. Try to get from the DHIS2 field if it exists
    if (configuration?.programStage?.allDataElements) {
      const facilityClassificationElement = configuration.programStage.allDataElements.find((psde) => {
        const fieldName = (psde.dataElement.displayName || psde.dataElement.shortName || '').toLowerCase();
        return fieldName.includes('facility classification') || fieldName.includes('facility type');
      });

      if (facilityClassificationElement) {
        const fieldKey = `dataElement_${facilityClassificationElement.dataElement.id}`;
        const dhisValue = formData[fieldKey];
        if (dhisValue) {
          return normalizeFacilityClassification(dhisValue);
        }
      }
    }

    // 4. Fallback to facilityType state
    if (facilityType) {
      return normalizeFacilityClassification(facilityType);
    }

    return null;
  };

  const fetchTrackedEntityInstance = async (facilityId) => {

    try {

      // Use the same program ID as defined in the API service

      const FACILITY_REGISTRY_PROGRAM_ID = 'EE8yeLVo6cN';

      const apiEndpoint = `/api/trackedEntityInstances?ou=${facilityId}&program=${FACILITY_REGISTRY_PROGRAM_ID}&fields=trackedEntityInstance&ouMode=DESCENDANTS`;

      // Enhanced debugging for API call

      // Use the API service instead of direct fetch

      const response = await api.request(apiEndpoint);

      if (response.trackedEntityInstances && response.trackedEntityInstances.length > 0) {

        const tei = response.trackedEntityInstances[0].trackedEntityInstance;

        if (tei && tei.trim() !== '') {

          setTrackedEntityInstance(tei);

        } else {

          setTrackedEntityInstance(null);

        }

      } else {

        console.log('⚠️ Response structure:', {

          hasTrackedEntityInstances: !!response?.trackedEntityInstances,

          trackedEntityInstancesType: typeof response?.trackedEntityInstances,

          trackedEntityInstancesLength: response?.trackedEntityInstances?.length || 0,

          responseKeys: Object.keys(response || {})

        });

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

        }

        // Trigger facility classification fetch for the auto-selected facility

        setTimeout(() => {

          if (api) {

            fetchFacilityClassification(firstActiveFacility.id);

          }

        }, 100); // Small delay to ensure formData is updated

      }

    }

  }, [safeUserAssignments, activeFacilities, api]); // Removed formData.orgUnit to prevent circular dependency

  // Auto-assign GPS coordinates when form loads

  useEffect(() => {

    if (configuration && configuration.programStage && configuration.programStage.allDataElements) {

      autoAssignGPSCoordinates().catch(error => {

      });

    }

  }, [configuration]);

  // Filter and set initial sections when configuration loads

  useEffect(() => {

    if (configuration?.programStage?.sections) {

      const filteredSections = filterUnwantedSections(configuration.programStage.sections);

      // Debug: Log all data elements to find Facility Service Departments
      configuration.programStage.sections.forEach(section => {
        if (section.dataElements) {
          section.dataElements.forEach(psde => {
            if (psde.dataElement) {
              if (psde.dataElement.displayName.toLowerCase().includes('service') ||
                psde.dataElement.displayName.toLowerCase().includes('department')) {
              }
            }
          });
        }
      });

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
      }

      if (!formData.orgUnit || !currentUser?.username) {

        if (showDebugPanel) {

        }

        setServiceSections(filterUnwantedSections(configuration?.programStage?.sections));

        return;

      }

      setLoadingServiceSections(true);

      try {

        const facilityId = typeof formData.orgUnit === 'string' ? formData.orgUnit : formData.orgUnit?.id;

        if (showDebugPanel) {

        }

        const assignedSectionNames = await api.getServiceSectionsForInspector(

          facilityId,

          currentUser.username || currentUser.displayName

        );

        const allProgramSections = configuration?.programStage?.sections || [];

        if (showDebugPanel) {

        }

        // Filter sections based on assigned service sections

        const filteredSections = allProgramSections.filter(section => {
          // Always include Inspection Type section
          if (section.displayName && section.displayName.toLowerCase() === "inspection type") {
            if (showDebugPanel) {
            }
            return true;
          }

          // Always include sections that don't start with "Pre-Inspection:"

          if (!section.displayName.startsWith("Pre-Inspection:")) {

            if (showDebugPanel) {

            }

            return true;

          }

          // For Pre-Inspection sections, check if they're in the assigned sections

          const isAssigned = assignedSectionNames.includes(section.displayName);

          if (showDebugPanel) {

          }

          return isAssigned;

        });

        // Apply final filtering to remove unwanted sections

        let finalFilteredSections = filterUnwantedSections(filteredSections);

        // Ensure Inspection Type section is always included
        const inspectionTypeSection = allProgramSections.find(
          section => section.displayName && section.displayName.toLowerCase() === "inspection type"
        );

        if (inspectionTypeSection && !finalFilteredSections.some(s => s.displayName && s.displayName.toLowerCase() === "inspection type")) {
          finalFilteredSections = [inspectionTypeSection, ...finalFilteredSections];
        }

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

  }, [formData.orgUnit, user?.username, configuration?.program?.id]);

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

      // Find the selected facility in userAssignments to get its trackedEntityInstance

      const selectedFacility = userAssignments.find(assignment =>

        assignment.facility.id === value

      );

      if (selectedFacility) {

        if (selectedFacility.facility.trackedEntityInstance) {

          setTrackedEntityInstance(selectedFacility.facility.trackedEntityInstance);

        } else {

          fetchTrackedEntityInstance(value);

        }

      } else {

        fetchTrackedEntityInstance(value);

      }

      // Also fetch and set the facility classification

      fetchFacilityClassification(value);

      // Auto-populate inspection date when facility is selected
      if (!formData.eventDate) {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        setFormData(prev => ({
          ...prev,
          eventDate: todayString
        }));

        // Save the auto-populated date
        if (eventId) {
          saveField('eventDate', todayString);
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

      // Try to get trackedEntityInstance from multiple sources
      let teiToUse = trackedEntityInstance;

      // If trackedEntityInstance is not set, try to get it from facilityInfo
      if (!teiToUse && facilityInfo && facilityInfo.trackedEntityInstance) {
        teiToUse = facilityInfo.trackedEntityInstance;
      }

      // If still no TEI, try to get it from userAssignments
      if (!teiToUse && formData.orgUnit) {
        const userAssignment = userAssignments?.find(assignment =>
          assignment.facility && assignment.facility.id === formData.orgUnit
        );
        if (userAssignment && userAssignment.facility.trackedEntityInstance) {
          teiToUse = userAssignment.facility.trackedEntityInstance;
        }
      }

      if (teiToUse) {

        eventData.trackedEntityInstance = teiToUse;

      } else {

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

      const savedEvent = await saveEvent(eventData, saveDraft);

      setIsDraft(saveDraft);

      // Always navigate to dashboard after successful save (both draft and final)
      navigate('/home');

    } catch (error) {

      console.error('Failed to save event:', error);

      showToast(`Failed to save: ${error.message}`, 'error');

      // Always navigate to dashboard even on failure (both draft and final)
      navigate('/home');

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
    }

    // If still no TEI, try to get it from userAssignments
    if (!teiToUse && formData.orgUnit) {
      const userAssignment = userAssignments?.find(assignment =>
        assignment.facility && assignment.facility.id === formData.orgUnit
      );
      if (userAssignment && userAssignment.facility.trackedEntityInstance) {
        teiToUse = userAssignment.facility.trackedEntityInstance;
      }
    }

    // Always add trackedEntityInstance to payload (even if null/undefined for debugging)
    eventData.trackedEntityInstance = teiToUse;

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

  // Cache for facility classification to prevent repeated API calls
  const classificationCache = useMemo(() => new Map(), []);

  // Function to fetch facility classification from dataStore
  const fetchFacilityClassification = async (facilityId) => {

    if (!facilityId || !api) return;

    // Check cache first
    if (classificationCache.has(facilityId)) {
      const cachedClassification = classificationCache.get(facilityId);
      if (cachedClassification) {
        const normalizedCached = normalizeFacilityClassification(cachedClassification);
        setFacilityType(normalizedCached || cachedClassification);
      }
      return;
    }

    try {

      if (showDebugPanel) {

      }

      // Try multiple approaches to get facility type/classification

      let classification = null;

      // Approach 1: Try to get facility type directly from inspection data

      try {

        // Fetch from inspection dataStore directly - this is the authoritative source

        const inspectionData = await inspectionAssignmentsCache.get();

        const facilityInspection = inspectionData.inspections?.find(

          inspection => inspection.facilityId === facilityId

        );

        if (facilityInspection && facilityInspection.type) {

          classification = facilityInspection.type;

          if (showDebugPanel) {

          }

        }

      } catch (error) {

        if (showDebugPanel) {

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

            }

          } else {

            // If not in our assignments, try to fetch from inspection dataStore

            const inspectionData = await inspectionAssignmentsCache.get();

            const facilityInspection = inspectionData.inspections?.find(

              inspection => inspection.facilityId === facilityId

            );

            if (facilityInspection && facilityInspection.type) {

              classification = facilityInspection.type;

              if (showDebugPanel) {

              }

            }

          }

        } catch (error) {

          if (showDebugPanel) {

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

              }

            }

          }

        } catch (error) {

          if (showDebugPanel) {

          }

        }

      }

      // Set the classification if found, otherwise set a default

      const classificationToSetRaw = classification || 'Obstetrics & Gynaecology'; // Default to first canonical option from CSV
      const classificationToSet =
        normalizeFacilityClassification(classificationToSetRaw) || classificationToSetRaw;

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

          }

          showToast(`Facility classification auto-populated: ${classificationToSet}`, 'success');

        } else {

          if (showDebugPanel) {

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

      }

      // Set a default classification if all attempts fail

      const defaultClassificationRaw = 'Obstetrics & Gynaecology';
      const defaultClassification =
        normalizeFacilityClassification(defaultClassificationRaw) || defaultClassificationRaw;

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

    // Cache the result (either found classification or default)
    const finalClassificationRaw =
      (typeof classification !== 'undefined' && classification) || 'Obstetrics & Gynaecology';
    const finalClassification =
      normalizeFacilityClassification(finalClassificationRaw) || finalClassificationRaw;
    classificationCache.set(facilityId, finalClassification);
    setFacilityType(finalClassification);

  };

  // Function to check if all inspection information fields are complete

  const areAllInspectionFieldsComplete = () => {
    // Always return true to allow the checkbox to be clickable regardless of field status
    return true;
  };

  // Function to get section completion status for progress tracking
  const getSectionStatus = (section) => {
    if (!section?.dataElements) return { completed: false, total: 0, filled: 0, percentage: 0 };

    let total = 0;
    let filled = 0;

    // Get current facility type for filtering
    const currentFacilityType = manualSpecialization || facilityType;

    section.dataElements.forEach((psde) => {
      if (!psde?.dataElement) return;

      // Apply the same filtering logic used in FormSection rendering
      // Only count data elements that should be visible for this facility type
      if (currentFacilityType) {
        // Check if this data element should be shown for the current facility type
        if (!shouldShowDataElementForService(psde.dataElement.displayName, currentFacilityType)) {
          return; // Skip this data element - it shouldn't be counted
        }
      }

      total++;
      const fieldName = `dataElement_${psde.dataElement.id}`;
      const value = formData[fieldName];

      // Check if field is filled (same logic as isFieldFilled helper)
      if (value !== null && value !== undefined) {
        if (typeof value === 'string' && value.trim().length > 0) filled++;
        else if (typeof value === 'boolean') filled++; // Boolean fields are always considered filled
        else if (Array.isArray(value) && value.length > 0) filled++;
        else if (value !== '') filled++;
      }
    });

    const percentage = total === 0 ? 0 : Math.round((filled / total) * 100);
    const completed = total > 0 && filled === total;

    return { completed, total, filled, percentage };
  };

  // Memoized function to get visible sections - keeps progress bar in sync
  // with facility classification + selected facility service departments.
  const getVisibleSections = useCallback(() => {
    if (!serviceSections || serviceSections.length === 0) return [];

    const currentClassification =
      typeof getCurrentFacilityClassification === 'function'
        ? getCurrentFacilityClassification()
        : null;

    const filteredByConfig = serviceSections.filter((section) => {
      const name = section.displayName || '';

      // Apply filtering based on selected service departments
      const shouldShowByDepartments = shouldShowSectionForServiceDepartments(
        name,
        selectedServiceDepartments
      );

      return shouldShowByDepartments;
    });

    // If we still have no sections, keep the progress bar empty so that
    // sections only appear once there is at least one applicable section for
    // the current facility type + selected departments.
    if (filteredByConfig.length === 0) {
      return [];
    }

    return filteredByConfig;
  }, [
    serviceSections,
    selectedServiceDepartments,
    getCurrentFacilityClassification
  ]);

  // Floating Progress Component
  const FloatingProgress = () => {
    // Use parent state so collapse/expand persists across re-renders
    const isCollapsed = isProgressCollapsed;

    // Calculate visible sections using the shared helper
    const visibleSections = getVisibleSections();

    // Don't show progress bar if essential data isn't loaded yet
    if (!serviceSections || serviceSections.length === 0 || visibleSections.length === 0) {
      return null;
    }

    const overallStats = visibleSections.reduce((acc, section) => {
      const status = getSectionStatus(section);
      acc.total += status.total;
      acc.filled += status.filled;
      acc.completed += status.completed ? 1 : 0;
      return acc;
    }, { total: 0, filled: 0, completed: 0 });

    const overallPercentage = overallStats.total === 0 ? 0 : Math.round((overallStats.filled / overallStats.total) * 100);

    return (
      <div style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: '#fff',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        minWidth: isCollapsed ? '50px' : '200px',
        maxWidth: isCollapsed ? '50px' : '220px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div
          style={{
            padding: '8px 12px',
            borderBottom: isCollapsed ? 'none' : '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px 10px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => setIsProgressCollapsed(prev => !prev)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isCollapsed && (
              <>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Progress
                </span>
                <span style={{
                  fontSize: '12px',
                  color: '#666',
                  backgroundColor: overallPercentage === 100 ? '#d4edda' : '#fff3cd',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  border: `1px solid ${overallPercentage === 100 ? '#c3e6cb' : '#ffeaa7'}`
                }}>
                  {overallPercentage}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDebug(!showDebug);
                  }}
                  title="Toggle Debug Info"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0 4px'
                  }}
                >
                  🐞
                </button>
              </>
            )}
          </div>
          <span style={{
            fontSize: '16px',
            color: '#666',
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.3s ease'
          }}>
            {isCollapsed ? '📋' : '▼'}
          </span>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div
            style={{
              padding: '8px 0',
              maxHeight: '60vh',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            {visibleSections.map((section, index) => {
              const status = getSectionStatus(section);
              const isComplete = status.completed;
              const hasData = status.filled > 0;

              return (
                <div key={section.id || index} style={{
                  padding: '6px 12px',
                  borderBottom: index < visibleSections.length - 1 ? '1px solid #f0f0f0' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  onClick={() => {
                    // Scroll to section
                    const sectionElement = document.querySelector(`[data-section-id="${section.id}"]`);
                    if (sectionElement) {
                      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {isComplete ? '✅' : hasData ? '🔄' : '⭕'}
                    </span>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: isComplete ? '#28a745' : hasData ? '#ffc107' : '#6c757d',
                      flex: 1,
                      lineHeight: '1.2'
                    }}>
                      {section.displayName}
                    </span>
                  </div>
                  <div style={{ marginLeft: '24px', fontSize: '11px', color: '#666' }}>
                    {status.filled}/{status.total} fields ({status.percentage}%)
                  </div>
                </div>
              );
            })}

            {/* Overall Summary */}
            <div style={{
              margin: '8px 12px 6px',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                Overall Progress
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {overallStats.completed}/{visibleSections.length} sections complete
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {overallStats.filled}/{overallStats.total} total fields
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (

    <div className="screen">
      {/* Floating Progress Component */}
      {/* <FloatingProgress /> */}

      <div className="form-container">

        <div className="form-header">

          <h2>Facility Checklist</h2>

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

                onClick={() => {/* Debug panel is always enabled */ }}

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

          {/* Debug Panel Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowDebugPanel(!showDebugPanel);
              if (!showDebugPanel) refreshIndexedDBData();
            }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              zIndex: 1000,
              padding: '8px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {showDebugPanel ? 'Hide' : 'Show'} Saved Data
          </button>

          {/* IndexedDB Debug Panel */}
          {showDebugPanel && (
            <div style={{
              position: 'fixed',
              bottom: '60px',
              left: '20px',
              width: '400px',
              maxHeight: '300px',
              backgroundColor: 'white',
              border: '2px solid #007bff',
              borderRadius: '8px',
              padding: '16px',
              zIndex: 1000,
              overflow: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#007bff' }}>📊 Saved Data</h4>
                <button
                  onClick={refreshIndexedDBData}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>

              {indexedDBData ? (
                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                  <div><strong>Event ID:</strong> {indexedDBData.eventId}</div>
                  <div><strong>Last Updated:</strong> {indexedDBData.lastUpdated}</div>
                  <div><strong>Fields Count:</strong> {Object.keys(indexedDBData.formData || {}).length}</div>
                  <div><strong>Is Draft:</strong> {indexedDBData.metadata?.isDraft ? 'Yes' : 'No'}</div>

                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Form Data</summary>
                    <pre style={{
                      backgroundColor: '#f8f9fa',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      maxHeight: '150px',
                      overflow: 'auto',
                      marginTop: '4px'
                    }}>
                      {JSON.stringify(indexedDBData.formData, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div style={{ color: '#666', fontSize: '12px' }}>
                  No data loaded. Click Refresh to load current data.
                </div>
              )}
            </div>
          )}

          {/* Manual Specialization Selector */}
          <div className="specialization-selector-section">
            <div className="form-section">
              <div className="form-field">

                <label htmlFor="specialization-select" className="form-label">
                  Choose Category:
                </label>
                <select
                  id="specialization-select"
                  value={manualSpecialization || ''}
                  onChange={(e) => handleSpecializationChange(e.target.value)}
                  className="form-select"
                  disabled={inspectionInfoConfirmed}
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

                className="section-header always-expanded-section"

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
                        {(() => {
                          try {
                            const startDate = new Date(inspectionPeriod.startDate);
                            const endDate = new Date(inspectionPeriod.endDate);

                            const formatDate = (date) => {
                              if (isNaN(date.getTime())) return 'Invalid Date';
                              return date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            };

                            return `${formatDate(startDate)} to ${formatDate(endDate)}`;
                          } catch (error) {
                            return `${inspectionPeriod.startDate} to ${inspectionPeriod.endDate}`;
                          }
                        })()}
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

          {serviceSections && date_valid && serviceSections.length > 0 ? (

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

                  }

                  return shouldShow;

                })
                .filter(section => {
                  // Apply filtering based on selected service departments
                  const shouldShowForDepartments = shouldShowSectionForServiceDepartments(section.displayName, selectedServiceDepartments);

                  if (!shouldShowForDepartments) {
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

                    facilityType={manualSpecialization || facilityType}

                    onCommentChange={handleCommentChange}

                    comments={fieldComments}

                    selectedServiceDepartments={selectedServiceDepartments}

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

                      }

                      return shouldShow;

                    })
                    .filter(section => {
                      // Apply filtering based on selected service departments
                      const shouldShowForDepartments = shouldShowSectionForServiceDepartments(section.displayName, selectedServiceDepartments);

                      if (!shouldShowForDepartments) {
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

                        facilityType={manualSpecialization || facilityType}

                        onCommentChange={handleCommentChange}

                        comments={fieldComments}

                        selectedServiceDepartments={selectedServiceDepartments}

                      />

                    ))}

                </>

              )}

            </>

          ) : (

            <div className="form-section">

              <button

                type="button"

                className="section-header always-expanded-section"

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

        {showDebug && (
          <DepartmentDebugInfo
            selectedDepartments={selectedServiceDepartments}
            onClose={() => setShowDebug(false)}
          />
        )}

      </div>

    </div>

  );

}

export { FormPage };
