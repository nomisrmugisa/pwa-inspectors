import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAPI } from '../hooks/useAPI';

// Form field component for individual data elements
function FormField({ psde, value, onChange, error, dynamicOptions = null, isLoading = false, readOnly = false, getCurrentPosition, formatCoordinatesForDHIS2, showDebugPanel = false }) {
  const { dataElement } = psde;
  const fieldId = `dataElement_${dataElement.id}`;
  
  // ALWAYS log when FormField is rendered
  console.log(`🔍 FormField RENDERED: "${dataElement.displayName}"`, {
    fieldId,
    valueType: dataElement.valueType,
    hasOptionSet: !!dataElement.optionSet,
    readOnly,
    value
  });

  // Check if this field is mandatory based on field name or compulsory flag
  const isMandatoryField = () => {
    const fieldName = (dataElement.displayName || dataElement.shortName || '').toLowerCase();
    const isCompulsory = psde.compulsory || false;
    
    // Specific fields that should be mandatory
    const mandatoryFieldNames = ['type', 'service', 'services', 'coordinates'];
    
    // Fields that should NOT be mandatory (exclusions) - using more flexible matching
    const excludedFieldPatterns = [
      'counseling service',
      'independent counseling',
      'patients can access',
      'out-reach services',
      'outreach services',
      'adequate supplies',
      'supplies for services'
    ];
    
    // Check if this field should be excluded from mandatory requirements
    const isExcluded = excludedFieldPatterns.some(pattern => 
      fieldName.includes(pattern.toLowerCase())
    );
    
    // Specific debugging for counseling service field
    if (fieldName.includes('counseling') || fieldName.includes('independent')) {
      // Only log in debug mode
      if (showDebugPanel) {
        console.log(`🔍 Counseling field detected: "${dataElement.displayName}"`);
        console.log(`   Field name: "${fieldName}", Excluded: ${isExcluded}, Mandatory: ${!isExcluded}`);
      }
    }
    
    // If field is excluded, it's not mandatory regardless of other conditions
    if (isExcluded) {
      // Only log in debug mode
      if (showDebugPanel) {
        console.log(`🚫 Field excluded from mandatory: "${dataElement.displayName}"`);
        console.log(`   Field name: "${fieldName}", Excluded: true`);
      }
      return false;
    }
    
    const isMandatory = isCompulsory || mandatoryFieldNames.some(name => fieldName.includes(name));
    
    // Debug logging for service fields (only in debug mode)
    if (fieldName.includes('service') && showDebugPanel) {
      console.log(`🔍 Service field detected: "${dataElement.displayName}" - Mandatory: ${isMandatory}`);
      console.log(`   Field name: "${fieldName}", Compulsory: ${isCompulsory}`);
    }
    
    return isMandatory;
  };

  const renderField = () => {
    // Debug logging for field rendering
    if (showDebugPanel) {
      console.log(`🎨 Rendering field "${dataElement.displayName}":`, {
        valueType: dataElement.valueType,
        hasOptionSet: !!dataElement.optionSet,
        optionSetOptions: dataElement.optionSet?.options?.length || 0,
        dynamicOptions: dynamicOptions,
        readOnly: readOnly,
        isLoading: isLoading
      });
    }
    
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
    
    // Handle dynamic service dropdown (overrides static optionSet)
    if (dynamicOptions !== null) {
      const isMandatory = isMandatoryField();
      if (showDebugPanel) {
        console.log(`🔄 Using dynamic service dropdown for "${dataElement.displayName}"`);
      }
      console.log(`🔄 ALWAYS LOG: Using dynamic service dropdown for "${dataElement.displayName}"`);
      return (
        <select
          id={fieldId}
          value={value || ''}
          onChange={onChange}
          className={`form-select ${error ? 'error' : ''} ${isMandatory ? 'mandatory-service-field' : ''}`}
          disabled={readOnly || isLoading}
          required={isMandatory}
        >
          <option value="">
            {isLoading ? 'Loading service sections...' : 
             isMandatory ? `Select ${dataElement.displayName} *` : 
             `Select ${dataElement.displayName}`}
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
      if (showDebugPanel) {
        console.log(`📋 Dropdown field "${dataElement.displayName}":`, {
          optionSetId: dataElement.optionSet.id,
          optionsCount: dataElement.optionSet.options.length,
          options: dataElement.optionSet.options.map(opt => ({
            id: opt.id,
            code: opt.code,
            displayName: opt.displayName,
            sortOrder: opt.sortOrder
          }))
        });
      }
      
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
    
    // Debug: Check if field should have options but doesn't
    if (showDebugPanel && (dataElement.displayName || '').toLowerCase().includes('equipped') || 
        (dataElement.displayName || '').toLowerCase().includes('gloves') || 
        (dataElement.displayName || '').toLowerCase().includes('sharps')) {
      console.log(`⚠️ Field "${dataElement.displayName}" might be missing options:`, {
        hasOptionSet: !!dataElement.optionSet,
        optionSet: dataElement.optionSet,
        valueType: dataElement.valueType,
        dataElement: dataElement
      });
    }

    // Then handle by valueType
    if (showDebugPanel) {
      console.log(`🎯 Field "${dataElement.displayName}" using valueType switch (${dataElement.valueType})`);
    }
    
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
            placeholder={`Enter ${dataElement.displayName}`}
            className={`form-input ${error ? 'error' : ''}`}
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
            className={`form-input ${error ? 'error' : ''}`}
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
            className={`form-input ${error ? 'error' : ''}`}
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
            placeholder={`Enter ${dataElement.displayName}`}
            className={`form-input ${error ? 'error' : ''}`}
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
            placeholder={`Enter ${dataElement.displayName}`}
            className={`form-input ${error ? 'error' : ''}`}
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
        
        console.log(`🔍 ALWAYS LOG: COORDINATE field ${fieldId}:`, { 
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

          </div>
        );

      default:
        // Default to text input
        if (showDebugPanel) {
          console.log(`⚠️ Field "${dataElement.displayName}" using default text input (valueType: ${dataElement.valueType})`);
        }
        console.log(`⚠️ ALWAYS LOG: Field "${dataElement.displayName}" using default text input (valueType: ${dataElement.valueType})`);
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
      {/* TEST: Very visible indicator that FormField is rendering */}
      <div style={{
        backgroundColor: '#ff0000',
        border: '3px solid #cc0000',
        padding: '10px',
        margin: '10px 0',
        borderRadius: '8px',
        fontSize: '16px',
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: 9999,
        position: 'relative'
      }}>
        🚨 FORM FIELD IS RENDERING: {dataElement.displayName}
      </div>
      
      {/* TEST: Visible indicator that FormField is rendering */}
      <div style={{
        backgroundColor: '#ff9800',
        border: '1px solid #f57c00',
        padding: '2px 6px',
        margin: '2px 0',
        borderRadius: '3px',
        fontSize: '8px',
        color: 'white',
        fontWeight: 'bold'
      }}>
        🎯 FormField RENDERED
      </div>
      
      <label htmlFor={fieldId} className="form-label">
        {dataElement.displayName}
        {isMandatoryField() && <span style={{ color: 'red' }}> *</span>}
      </label>
      {renderField()}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

  // Section component for organizing form fields
  function FormSection({ section, formData, onChange, errors, serviceSections, loadingServiceSections, readOnlyFields = {}, getCurrentPosition, formatCoordinatesForDHIS2, showDebugPanel, isFieldMandatory, facilityClassifications = [], loadingFacilityClassifications = false, inspectionInfoConfirmed = false, setInspectionInfoConfirmed = () => {}, areAllInspectionFieldsComplete = () => false }) {
    // IMMEDIATE DEBUGGING - Log everything that comes into this component
    console.log('🚨 FormSection RENDERED with props:', {
      sectionName: section?.displayName,
      sectionId: section?.id,
      dataElementsCount: section?.dataElements?.length || 0,
      dataElements: section?.dataElements,
      formDataKeys: Object.keys(formData || {}),
      errorsKeys: Object.keys(errors || {}),
      readOnlyFieldsKeys: Object.keys(readOnlyFields || {}),
      showDebugPanel,
      inspectionInfoConfirmed,
      hasDataElements: !!(section?.dataElements && section.dataElements.length > 0)
    });

    // Check if this is one of the sections that should start expanded
    const isInspectionInfoSection = (section.displayName || '').toLowerCase().includes('inspection information');
    const isInspectionTypeSection = (section.displayName || '').toLowerCase().includes('inspection type');
    
    // Start expanded for important sections, collapsed for others
    const [isExpanded, setIsExpanded] = useState(isInspectionInfoSection || isInspectionTypeSection);

    // Function to determine if a field should use dynamic service dropdown
    const isServiceField = (dataElement) => {
      const fieldName = (dataElement.displayName || dataElement.shortName || '').toLowerCase();
      
      // Exclude fields that are about supplies, even if they contain 'service'
      if (fieldName.includes('supplies') || fieldName.includes('adequate')) {
        return false;
      }
      
      return fieldName.includes('service') || fieldName.includes('section');
    };
        
    // Count mandatory fields in this section
    const mandatoryFieldsCount = (section.dataElements || []).filter(psde => isFieldMandatory(psde)).length;

    // Always show sections with data elements
    const hasDataElements = section.dataElements && section.dataElements.length > 0;
    const shouldShow = hasDataElements || isInspectionInfoSection || isInspectionTypeSection;

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
      <div className="form-section">
        <button 
          type="button"
          className={`section-header ${isInspectionInfoSection || isInspectionTypeSection ? 'always-expanded-section' : 'collapsible-section'}`}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <h3 className="section-title">
            {section.displayName}
            {mandatoryFieldsCount > 0 && (
              <span className="mandatory-indicator" title={`${mandatoryFieldsCount} mandatory field(s) in this section`}>
                {' '}({mandatoryFieldsCount} required)
              </span>
            )}
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
              {isExpanded ? '(Click to collapse)' : '(Click to expand)'}
            </span>
          </h3>
          <span className={`section-toggle ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        
        <div className={`section-content ${!isExpanded ? 'collapsed' : ''}`}>
          {section.description && (
            <p className="section-description">{section.description}</p>
          )}

          <div className="section-fields">
            {/* Debug info */}
            {showDebugPanel && (
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                border: '1px solid #4caf50', 
                padding: '8px', 
                margin: '8px 0',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                🔍 DEBUG: Section "{section.displayName}" has {section.dataElements?.length || 0} data elements
              </div>
            )}

            {/* DEBUG: Show raw data elements info */}
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107', 
              padding: '8px', 
              margin: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              🔍 RAW DATA: section.dataElements = {JSON.stringify(section.dataElements?.slice(0, 2), null, 2)}
              {section.dataElements && section.dataElements.length > 2 && (
                <span style={{ color: '#666' }}>... and {section.dataElements.length - 2} more</span>
              )}
            </div>

            {/* DEBUG: Show formData for this section */}
            <div style={{ 
              backgroundColor: '#e1f5fe', 
              border: '1px solid #03a9f4', 
              padding: '8px', 
              margin: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              🔍 FORMDATA: Current values for this section:
              {section.dataElements?.map(psde => {
                const fieldId = `dataElement_${psde.dataElement.id}`;
                const value = formData[fieldId];
                return (
                  <div key={fieldId} style={{ margin: '2px 0', padding: '2px 4px', backgroundColor: '#fff', borderRadius: '2px' }}>
                    {fieldId}: {value !== undefined ? `"${value}"` : 'undefined'}
                  </div>
                );
              })}
            </div>

            {/* DEBUG: Show errors for this section */}
            <div style={{ 
              backgroundColor: '#ffebee', 
              border: '1px solid #f44336', 
              padding: '8px', 
              margin: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              🔍 ERRORS: Current errors for this section:
              {section.dataElements?.map(psde => {
                const fieldId = `dataElement_${psde.dataElement.id}`;
                const error = errors[fieldId];
                return (
                  <div key={fieldId} style={{ margin: '2px 0', padding: '2px 4px', backgroundColor: '#fff', borderRadius: '2px' }}>
                    {fieldId}: {error || 'no error'}
                  </div>
                );
              })}
            </div>

            {/* DEBUG: Show readOnlyFields for this section */}
            <div style={{ 
              backgroundColor: '#f3e5f5', 
              border: '1px solid #9c27b0', 
              padding: '8px', 
              margin: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              🔍 READONLY: Current readOnly status for this section:
              {section.dataElements?.map(psde => {
                const fieldId = `dataElement_${psde.dataElement.id}`;
                const readOnly = readOnlyFields[fieldId];
                return (
                  <div key={fieldId} style={{ margin: '2px 0', padding: '2px 4px', backgroundColor: '#fff', borderRadius: '2px' }}>
                    {fieldId}: {readOnly ? 'READONLY' : 'EDITABLE'}
                  </div>
                );
              })}
            </div>

            {/* DEBUG: Show service sections info */}
            <div style={{ 
              backgroundColor: '#e8f5e8', 
              border: '1px solid #4caf50', 
              padding: '8px', 
              margin: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              🔍 SERVICE SECTIONS: 
              loadingServiceSections: {loadingServiceSections ? 'true' : 'false'}, 
              serviceSections count: {serviceSections?.length || 0}
              {serviceSections && serviceSections.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  First few: {serviceSections.slice(0, 3).join(', ')}
                  {serviceSections.length > 3 && `... and ${serviceSections.length - 3} more`}
                </div>
              )}
            </div>

            {/* DEBUG: Show which fields are service fields */}
            <div style={{ 
              backgroundColor: '#fff8e1', 
              border: '1px solid #ffc107', 
              padding: '8px', 
              margin: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              🔍 SERVICE FIELD DETECTION:
              {section.dataElements?.map(psde => {
                const isDynamicServiceField = isServiceField(psde.dataElement);
                return (
                  <div key={psde.dataElement.id} style={{ margin: '2px 0', padding: '2px 4px', backgroundColor: '#fff', borderRadius: '2px' }}>
                    {psde.dataElement.displayName}: {isDynamicServiceField ? 'SERVICE FIELD' : 'regular field'}
                  </div>
                );
              })}
            </div>

            {/* DEBUG: Show which fields are mandatory fields */}
            <div style={{ 
              backgroundColor: '#ffebee', 
              border: '1px solid #f44336', 
              padding: '8px', 
              margin: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              🔍 MANDATORY FIELD DETECTION:
              {section.dataElements?.map(psde => {
                const isMandatory = isFieldMandatory(psde);
                return (
                  <div key={psde.dataElement.id} style={{ margin: '2px 0', padding: '2px 4px', backgroundColor: '#fff', borderRadius: '2px' }}>
                    {psde.dataElement.displayName}: {isMandatory ? 'MANDATORY' : 'optional'} (compulsory: {psde.compulsory ? 'true' : 'false'})
                  </div>
                );
              })}
            </div>

            {/* Render all data elements */}
            {section.dataElements && section.dataElements.length > 0 ? (
              section.dataElements.map((psde, index) => {
                const isDynamicServiceField = isServiceField(psde.dataElement);
                
                // Log field rendering for debugging
                if (showDebugPanel) {
                  console.log(`🔍 RENDERING FIELD: "${psde.dataElement.displayName}"`, {
                    sectionName: section.displayName,
                    fieldIndex: index,
                    totalFields: section.dataElements.length,
                    id: psde.dataElement.id,
                    valueType: psde.dataElement.valueType
                  });
                }

                return (
                  <div key={`field-container-${psde.dataElement.id}-${index}`}>
                    {/* TEST: Simple div to verify the mapping loop is working */}
                    <div style={{
                      backgroundColor: '#e8f5e8',
                      border: '1px solid #4caf50',
                      padding: '4px 8px',
                      margin: '4px 0',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#2e7d32'
                    }}>
                      🔍 FIELD {index + 1}: "{psde.dataElement.displayName}" (Type: {psde.dataElement.valueType})
                    </div>
                    
                    <FormField
                      key={`${psde.dataElement.id}-${index}`}
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
                      isLoading={isDynamicServiceField ? loadingServiceSections : false}
                      readOnly={!!readOnlyFields[`dataElement_${psde.dataElement.id}`]}
                      getCurrentPosition={getCurrentPosition}
                      formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}
                      showDebugPanel={showDebugPanel}
                    />
                  </div>
                );
              })
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
              <div className="form-section" style={{ 
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

    // Function to filter out unwanted sections - DISABLED FOR DEBUGGING
    const filterUnwantedSections = (sections) => {
      if (!sections || !Array.isArray(sections)) return [];
      
      // DISABLED: Return all sections for debugging
      console.log('🔍 filterUnwantedSections: Returning ALL sections (filtering disabled)');
      console.log('📋 Available sections:', sections.map(s => s.displayName));
      
      // ADDITIONAL DEBUGGING: Log data elements count for each section
      sections.forEach(section => {
        console.log(`🔍 Section "${section.displayName}": ${section.dataElements?.length || 0} data elements`);
        if (section.dataElements && section.dataElements.length > 0) {
          console.log(`   Data Elements: ${section.dataElements.map(de => de.dataElement.displayName).join(', ')}`);
        }
      });
      
      return sections;
      
      // ORIGINAL FILTERING LOGIC (commented out):
      // return sections.filter(section => 
      //   section.displayName !== "Final_Inspection_Event" && 
      //   section.displayName !== "Preliminary-Report" &&
      //   section.displayName !== "Inspectors Details" &&
      //   !section.displayName.startsWith("Pre-Inspection:")
      // );
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
Does the facility have statutory requirements?,,,,,,,,,,,
Business registration,?,?,?,?,?,?,?,?,?,?,?
Work permits,?,?,?,?,?,?,?,?,?,?,?
Lease agreement,?,?,?,?,?,?,,?,?,?,?
Trading license,?,?,?,?,?,?,?,?,?,?,?
Permission to operate/set up,?,?,,,,,,,,
Occupancy certificate,?,?,?,?,?,?,?,?,?,?,?
Patient charter in English & Setswana,?,?,?,?,?,?,?,?,?,?,?
"Copies of relevant statutory instruments e.g. Public Health Act 2013, Botswana Health Professions Act,2001",?,?,?,?,?,?,?,?,?,?,?
Is there an indemnity insurance?,?,?,?,?,?,?,?,?,?,?,?
Have personnel been cleared by police?,?,?,?,?,?,?,?,?,?,?,?
contracts for staff,?,?,?,?,?,?,?,?,?,?,?
letter of permission to set up/operate,?,?,?,?,?,?,?,?,?,?,?
waste collection carrier licence,?,?,?,?,?,?,?,?,?,?,?
police clearance for employees,?,?,?,?,?,?,?,?,?,?,?
confidentiality clause,?,?,?,?,?,?,?,?,?,?,?
proof of change of land use,?,?,?,?,?,?,?,,,,
tax clearance certificate,?,?,?,?,,?,?,?,?,?
Practitioner's licence,?,?,?,?,?,?,?,?,?,?,?
Fire clearance,?,?,?,?,?,?,?,?,?,?,?
work permits,?,?,?,?,?,?,?,?,?,?,?
residence permit,?,?,?,,?,?,?,?,?,?
contracts for staff,?,?,?,?,?,?,?,?,?,?,?
,,,,,,,,,,,
,,,,,,,,,,,
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
              fieldId: 'auto-assigned'
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
    const [readOnlyFields, setReadOnlyFields] = useState({});
    const [errors, setErrors] = useState({});
    const [showDebugPanel, setShowDebugPanel] = useState(false); // Hide debug panel by default
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

    const fetchTrackedEntityInstance = async (facilityId) => {
      try {
        const apiEndpoint = `/api/trackedEntityInstances?ou=${facilityId}&program=EE8yeLVo6cN&fields=trackedEntityInstance&ouMode=DESCENDANTS`;
        const fullUrl = `${import.meta.env.VITE_DHIS2_URL}${apiEndpoint}`;
        
        // Only log detailed information in debug mode
        if (showDebugPanel) {
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
        }
        
        // Use the API service instead of direct fetch
        const response = await api.request(apiEndpoint);
        
        // Only log detailed response information in debug mode
        if (showDebugPanel) {
          console.log('📡 TEI API Response Status: Success');
          console.log('📡 TEI API Response Body:', JSON.stringify(response, null, 2));
          console.log('📡 TEI API Response Structure:', {
            hasTrackedEntityInstances: !!response.trackedEntityInstances,
            trackedEntityInstancesCount: response.trackedEntityInstances?.length || 0,
            responseKeys: Object.keys(response)
          });
        }
        
        if (response.trackedEntityInstances && response.trackedEntityInstances.length > 0) {
          const tei = response.trackedEntityInstances[0].trackedEntityInstance;
          if (tei && tei.trim() !== '') {
          setTrackedEntityInstance(tei);
          if (showDebugPanel) {
            console.log('✅ Tracked Entity Instance found:', tei);
          }
          } else {
            if (showDebugPanel) {
              console.log('⚠️ TEI found but is empty or invalid:', tei);
            }
            setTrackedEntityInstance(null);
          }
        } else {
          if (showDebugPanel) {
            console.log('ℹ️ No Tracked Entity Instance found for facility');
          }
          setTrackedEntityInstance(null);
        }
      } catch (error) {
        console.error('❌ Failed to fetch Tracked Entity Instance:', error);
        if (showDebugPanel) {
          console.log('🔍 Error details:', {
            message: error.message,
            status: error.status,
            url: `/api/trackedEntityInstances?ou=${facilityId}&program=EE8yeLVo6cN&fields=trackedEntityInstance&ouMode=DESCENDANTS`
          });
        }
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

    // Get facilities with today's date in inspection period
    const activeFacilities = safeUserAssignments.filter(a => {
      const { startDate, endDate } = a.assignment.inspectionPeriod || {};
      
      if (!startDate || !endDate) {
        if (showDebugPanel) {
          console.log(`⚠️ Assignment for ${a.facility.name} missing inspection period dates`);
        }
        return false;
      }
      
      try {
        // Use robust date parsing function
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        const todayDate = parseDate(today);
        
        // Check if dates are valid
        if (!start || !end || !todayDate) {
          if (showDebugPanel) {
            console.log(`⚠️ Invalid date format for ${a.facility.name}:`, { 
              startDate, 
              endDate, 
              today,
              parsedStart: start,
              parsedEnd: end,
              parsedToday: todayDate
            });
          }
          return false;
        }
        
        // Reset time to start of day for accurate date comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999); // End of day
        todayDate.setHours(12, 0, 0, 0); // Middle of day
        
        const isActive = start <= todayDate && todayDate <= end;
        
        if (showDebugPanel) {
          console.log(`🔍 Facility: ${a.facility.name}, Period: ${startDate} to ${endDate}, Today: ${today}, Active: ${isActive}`);
          console.log(`   Parsed dates: Start: ${start.toISOString()}, End: ${end.toISOString()}, Today: ${todayDate.toISOString()}`);
          console.log(`   Date comparison: ${start.toISOString()} <= ${todayDate.toISOString()} <= ${end.toISOString()}`);
        }
        
        return isActive;
      } catch (error) {
        if (showDebugPanel) {
          console.error(`❌ Error processing dates for ${a.facility.name}:`, error);
        }
        return false;
      }
    }).map(a => ({
      id: a.facility.id,
      name: a.facility.name
    }));

    if (showDebugPanel) {
      console.log('✅ Active facilities for today:', activeFacilities);
      console.log('📅 All assignments:', safeUserAssignments.map(a => ({
        facility: a.facility.name,
        period: a.assignment.inspectionPeriod,
        hasValidDates: !!(a.assignment.inspectionPeriod?.startDate && a.assignment.inspectionPeriod?.endDate)
      })));
           console.log('🔍 Date filtering details:', {
         today,
         totalAssignments: safeUserAssignments.length,
         assignmentsWithDates: safeUserAssignments.filter(a => a.assignment.inspectionPeriod?.startDate && a.assignment.inspectionPeriod?.endDate).length,
         activeFacilitiesCount: activeFacilities.length,
         hasActiveFacilities
       });
      
           // Additional debugging for data structure issues
       if (safeUserAssignments.length > 0) {
         console.log('🔍 Sample assignment structure:', {
           firstAssignment: safeUserAssignments[0],
           hasFacility: !!safeUserAssignments[0]?.facility,
           hasAssignment: !!safeUserAssignments[0]?.assignment,
           hasInspectionPeriod: !!safeUserAssignments[0]?.assignment?.inspectionPeriod,
           inspectionPeriodKeys: safeUserAssignments[0]?.assignment?.inspectionPeriod ? Object.keys(safeUserAssignments[0].assignment.inspectionPeriod) : [],
           startDateType: typeof safeUserAssignments[0]?.assignment?.inspectionPeriod?.startDate,
           endDateType: typeof safeUserAssignments[0]?.assignment?.inspectionPeriod?.endDate,
           dateFilteringResult: hasActiveFacilities ? 'Active facilities found' : 'No active facilities'
         });
       }
    }

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
      const fieldName = (psde.dataElement.displayName || psde.dataElement.shortName || '').toLowerCase();
      const isCompulsory = psde.compulsory || false;
      
      // Specific fields that should be mandatory
      const mandatoryFieldNames = ['type', 'service', 'services', 'coordinates'];
      
      // Fields that should NOT be mandatory (exclusions) - using more flexible matching
      const excludedFieldPatterns = [
        'counseling service',
        'independent counseling',
        'patients can access',
        'out-reach services',
        'outreach services',
        'adequate supplies',
        'supplies for services'
      ];
      
      // Check if this field should be excluded from mandatory requirements
      const isExcluded = excludedFieldPatterns.some(pattern => 
        fieldName.includes(pattern.toLowerCase())
      );
      
      // If field is excluded, it's not mandatory regardless of other conditions
      if (isExcluded) {
        return false;
      }
      
      const isMandatory = isCompulsory || mandatoryFieldNames.some(name => fieldName.includes(name));
      return isMandatory;
    };


    
    const finalFacilities = showAllFacilities 
      ? safeUserAssignments
          .filter(assignment => assignment.facility && assignment.facility.id)
          .map(assignment => ({
            id: assignment.facility.id,
            name: assignment.facility.name
          }))
      : uniqueFacilities; // Only show active facilities, no fallback

    if (showDebugPanel) {
      console.log('🏥 Final facilities for dropdown:', {
        finalFacilities: finalFacilities.length,
        source: showAllFacilities ? 'all' : 'active',
        facilities: finalFacilities.map(f => ({ id: f.id, name: f.name }))
      });
    }

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

        // setLoadingServiceSections(true);
        try {
          const facilityId = typeof formData.orgUnit === 'string' ? formData.orgUnit : formData.orgUnit?.id;
          if (showDebugPanel) {
            console.log(`🔍 Fetching service sections for facility: ${facilityId}, inspector: ${currentUser.displayName || currentUser.username}`);
          }
          const assignedSectionNames = await api.getServiceSectionsForInspector(
            facilityId,
            currentUser.displayName || currentUser.username
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
          // Fallback to showing all non-Pre-Inspection sections, excluding specific unwanted sections
          const fallbackSections = filterUnwantedSections(configuration?.programStage?.sections);
          
          // ADDITIONAL DEBUGGING: Log fallback sections
          console.log('🔄 FALLBACK DEBUG: Using fallback sections:', {
            fallbackSections: fallbackSections.length,
            sectionNames: fallbackSections.map(s => s.displayName),
            hasDataElements: fallbackSections.map(s => ({
              name: s.displayName,
              dataElementsCount: s.dataElements?.length || 0
            }))
          });
          
          if (showDebugPanel) {
            console.log('🔄 Using fallback sections:', fallbackSections.length);
          }
          setServiceSections(fallbackSections);
        }
        // setLoadingServiceSections(false);
      };

      fetchServiceSections();
    }, [formData.orgUnit, user, configuration, api]);



    // Function to determine if a field should use dynamic service dropdown
    const isServiceField = (dataElement) => {
      // Check if field name/displayName contains 'service' (case-insensitive)
      const fieldName = (dataElement.displayName || dataElement.shortName || '').toLowerCase();
      
      // Exclude fields that are about supplies, even if they contain 'service'
      if (fieldName.includes('supplies') || fieldName.includes('adequate')) {
        return false;
      }
      
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
        
        // Also fetch and set the facility classification
        fetchFacilityClassification(value);
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
      if (!formData.orgUnit || !formData.eventDate) {
        return false;
      }

      // Check mandatory data element fields
      if (configuration && configuration.programStage && configuration.programStage.allDataElements) {
        for (const psde of configuration.programStage.allDataElements) {
          const fieldName = `dataElement_${psde.dataElement.id}`;
          const fieldValue = formData[fieldName];
          
          // Check if this is a mandatory field
          const isMandatory = isFieldMandatory(psde);
          
          if (isMandatory && (!fieldValue || fieldValue.toString().trim() === '')) {
            return false;
          }
        }
      }

      return true;
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

      // Validate mandatory data element fields
      if (configuration && configuration.programStage && configuration.programStage.allDataElements) {
        for (const psde of configuration.programStage.allDataElements) {
          const fieldName = `dataElement_${psde.dataElement.id}`;
          const fieldValue = formData[fieldName];
          
          // Check if this is a mandatory field
          const isMandatory = isFieldMandatory(psde);
          
          if (isMandatory && (!fieldValue || fieldValue.toString().trim() === '')) {
            // Provide specific error messages for different field types
            let errorMessage = `${psde.dataElement.displayName} is required`;
            
            const fieldNameLower = (psde.dataElement.displayName || '').toLowerCase();
            if (fieldNameLower.includes('service')) {
              errorMessage = `Please select a service section for ${psde.dataElement.displayName}`;
            } else if (fieldNameLower.includes('type')) {
              errorMessage = `Please select an inspection type for ${psde.dataElement.displayName}`;

            } else if (fieldNameLower.includes('coordinates')) {
              errorMessage = `Please provide GPS coordinates for ${psde.dataElement.displayName}`;
            }
            
            newErrors[fieldName] = errorMessage;
          }
        }
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
      
      // Check for missing mandatory fields and provide detailed feedback
      if (missingMandatoryFields > 0) {
        const missingFields = [];
        
        // Check basic mandatory fields
        if (!formData.orgUnit) missingFields.push('Facility');
        if (!formData.eventDate) missingFields.push('Inspection Date');
        
        // Check mandatory data element fields
        if (configuration && configuration.programStage && configuration.programStage.allDataElements) {
          for (const psde of configuration.programStage.allDataElements) {
            const fieldName = `dataElement_${psde.dataElement.id}`;
            const fieldValue = formData[fieldName];
            
            const isMandatory = isFieldMandatory(psde);
            
            if (isMandatory && (!fieldValue || fieldValue.toString().trim() === '')) {
              missingFields.push(psde.dataElement.displayName);
            }
          }
        }
        
        const missingFieldsList = missingFields.join(', ');
        showToast(`Please fill all mandatory fields: ${missingFieldsList}`, 'error');
        return;
      }
      
      handleSave(false);
    };

    const handleSaveDraft = () => {
      handleSave(true);
    };

    // Helper function to count missing mandatory fields
    const getMissingMandatoryFieldsCount = () => {
      let missingCount = 0;
      
      // Check basic mandatory fields
      if (!formData.orgUnit) missingCount++;
      if (!formData.eventDate) missingCount++;
      
      // Check mandatory data element fields
      if (configuration && configuration.programStage && configuration.programStage.allDataElements) {
        for (const psde of configuration.programStage.allDataElements) {
          const fieldName = `dataElement_${psde.dataElement.id}`;
          const fieldValue = formData[fieldName];
          
          const isMandatory = isFieldMandatory(psde);
          
          if (isMandatory && (!fieldValue || fieldValue.toString().trim() === '')) {
            missingCount++;
          }
        }
      }
      
      return missingCount;
    };

    // Get missing mandatory fields count
    const missingMandatoryFields = getMissingMandatoryFieldsCount();



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
        
        // Approach 1: Try to get facility type from a generic dataStore key
        try {
          const facilityTypeResponse = await api.request('/api/dataStore/facility_types');
          if (facilityTypeResponse && typeof facilityTypeResponse === 'object') {
            // Look for a key that contains the facility ID
            const matchingKey = Object.keys(facilityTypeResponse).find(key => 
              key.includes(facilityId) || key.includes('facility') || key.includes('type')
            );
            
            if (matchingKey && facilityTypeResponse[matchingKey]) {
              classification = facilityTypeResponse[matchingKey];
              if (showDebugPanel) {
                console.log('✅ Found facility type via facility_types dataStore:', classification);
              }
            }
          }
        } catch (error) {
          if (showDebugPanel) {
            console.log('⚠️ facility_types dataStore not accessible:', error.message);
          }
        }
        
        // Approach 2: Try to get from a more generic facility dataStore
        if (!classification) {
          try {
            const facilityDataResponse = await api.request('/api/dataStore/facilities');
            if (facilityDataResponse && typeof facilityDataResponse === 'object') {
              // Look for facility data that might contain type/classification
              const facilityData = facilityDataResponse[facilityId] || facilityDataResponse[`facility_${facilityId}`];
              if (facilityData && facilityData.type) {
                classification = facilityData.type;
                if (showDebugPanel) {
                  console.log('✅ Found facility type via facilities dataStore:', classification);
                }
              }
            }
          } catch (error) {
            if (showDebugPanel) {
              console.log('⚠️ facilities dataStore not accessible:', error.message);
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
      // Check basic mandatory fields
      if (!formData.orgUnit || !formData.eventDate) {
        return false;
      }

      // Check if facility classification is set (either auto-populated or manually selected)
      if (!formData.facilityClassification) {
        return false;
      }

      return true;
    };

    return (
      <div className="screen">
        <div className="form-container">
          <div className="form-header">
            <h2>Inspection Form</h2>
            
                     {/* Facility Filtering Status Summary */}
             <div style={{ 
               backgroundColor: hasActiveFacilities ? '#d4edda' : '#f8d7da', 
               border: `1px solid ${hasActiveFacilities ? '#c3e6cb' : '#f5c6cb'}`, 
               borderRadius: '4px', 
               padding: '8px 12px',
               marginBottom: '16px',
               fontSize: '12px',
               color: hasActiveFacilities ? '#155724' : '#721c24'
             }}>
               <strong>�� Facility Status:</strong> {
                 hasActiveFacilities 
                   ? `✅ ${activeFacilities.length} active facilities found for today (${today})`
                   : `❌ No active facilities found for today (${today}). Please check inspection period dates.`
               }
               {!hasActiveFacilities && (
                 <button
                   type="button"
                   onClick={() => setShowDebugPanel(true)}
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

          {/* Debug Panel - Collapsed by default */}
          {showDebugPanel && (
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
                  Hide Debug
                </button>
              </div>
              
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

                           {/* Facility Filtering Debug Information */}
               <div style={{ marginBottom: '12px' }}>
                 <strong>�� Facility Filtering Debug:</strong>
                 <div style={{ marginLeft: '16px' }}>
                   <div>🌍 Today (Botswana): {today}</div>
                   <div>📊 Total Assignments: {safeUserAssignments.length}</div>
                   <div>✅ Active Facilities: {activeFacilities.length}</div>
                   <div>🎯 Final Facilities: {finalFacilities.length}</div>
                   <div>🔍 Filtering Source: {showAllFacilities ? 'All (Debug Mode)' : 'Active Only'}</div>
                  
                  {/* Assignment Details */}
                  <div style={{ marginTop: '8px' }}>
                    <strong>📋 Assignment Details:</strong>
                    {safeUserAssignments.map((assignment, index) => (
                      <div key={index} style={{ marginLeft: '8px', fontSize: '11px', marginTop: '4px' }}>
                        <div>🏥 {assignment.facility.name} (ID: {assignment.facility.id})</div>
                        <div style={{ marginLeft: '8px' }}>
                          📅 Period: {assignment.assignment.inspectionPeriod?.startDate || 'Missing'} to {assignment.assignment.inspectionPeriod?.endDate || 'Missing'}
                          {assignment.assignment.inspectionPeriod?.startDate && assignment.assignment.inspectionPeriod?.endDate ? (
                            <span style={{ color: '#28a745' }}> ✅</span>
                          ) : (
                            <span style={{ color: '#dc3545' }}> ❌</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                          <div>�� Response Structure: Has trackedEntityInstances array</div>
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
            </div>
          )}

          {/* Show Debug Button - Always visible when debug panel is hidden */}
          {!showDebugPanel && (
            <div style={{
              textAlign: 'center',
              margin: '16px 0',
              padding: '8px'
            }}>
              <button
                type="button"
                onClick={() => setShowDebugPanel(true)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  opacity: 0.7
                }}
                title="Show debug information for developers"
              >
                🔍 Show Debug
              </button>
            </div>
          )}



                   <form onSubmit={handleSubmit} className="inspection-form">
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
                  {/* Mandatory fields note */}
                  <div className="mandatory-fields-note">
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                      Fields marked with an asterisk (*) are mandatory and must be filled before submitting the form.
                    </p>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '0' }}>
                      <strong>Mandatory fields:</strong> Facility, Inspection Date, Type, Service(s), and Coordinates.
                    </p>
                    <p style={{ fontSize: '11px', color: '#999', marginTop: '8px', marginBottom: '0', fontStyle: 'italic' }}>
                      Note: Some service-related questions (counseling, outreach services, supplies) are not mandatory.
                    </p>
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

                  {/* Manual refresh button for troubleshooting */}
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔄 Manual refresh triggered');
                                         console.log('📊 Current state:', {
                             userAssignments,
                             safeUserAssignments: safeUserAssignments.length,
                             activeFacilities: activeFacilities.length,
                             today,
                             finalFacilities: finalFacilities.length,
                             hasActiveFacilities
                           });
                          
                          // Test date parsing for troubleshooting
                          if (safeUserAssignments.length > 0) {
                            const testAssignment = safeUserAssignments[0];
                            const { startDate, endDate } = testAssignment.assignment.inspectionPeriod || {};
                            console.log('🧪 Date parsing test:', {
                              facility: testAssignment.facility.name,
                              startDate,
                              endDate,
                              today,
                              parsedStart: parseDate(startDate),
                              parsedEnd: parseDate(endDate),
                              parsedToday: parseDate(today)
                            });
                          }
                        }}
                        style={{
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Debug: Log Current State
                      </button>
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
                     max={(() => {
                       try {
                         if (inspectionPeriod?.endDate) {
                           const maxDate = new Date(inspectionPeriod.endDate);
                           return !isNaN(maxDate.getTime()) ? maxDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                         }
                         const today = new Date();
                         return !isNaN(today.getTime()) ? today.toISOString().split('T')[0] : '2025-12-31';
                       } catch (error) {
                         console.warn('⚠️ Error setting max date:', error);
                         return '2025-12-31';
                       }
                     })()}
                     min={(() => {
                       try {
                         if (inspectionPeriod?.startDate) {
                           const minDate = new Date(inspectionPeriod.startDate);
                           return !isNaN(minDate.getTime()) ? minDate.toISOString().split('T')[0] : '2025-01-01';
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
             )}

            

                         {/* Program stage sections */}
             { serviceSections && date_valid && serviceSections.length > 0 ? (
               <>
                 {/* Debug info for sections */}
                 {showDebugPanel && (
                   <div className="debug-panel" style={{
                     backgroundColor: '#e3f2fd',
                     border: '1px solid #2196f3',
                     borderRadius: '8px',
                     padding: '12px',
                     margin: '16px 0',
                     fontSize: '12px'
                   }}>
                                     <strong>🔍 Sections Debug:</strong>
                    <div>📊 Total sections: {serviceSections.length}</div>
                    <div>📅 Date valid: {date_valid ? '✅ Yes' : '❌ No'}</div>
                    <div>🏥 Facility selected: {formData.orgUnit ? '✅ Yes' : '❌ No'}</div>
                    <div>👤 User: {user?.username || 'None'}</div>
                    <div>📋 Sections: {serviceSections.map(s => s.displayName).join(', ')}</div>
                    <div>🏷️ Facility Classifications: {facilityClassifications.length}</div>
                    <div>🏷️ Selected Classification: {formData.facilityClassification || 'None (will auto-populate)'}</div>
                    <div>✅ Inspection Info Confirmed: {inspectionInfoConfirmed ? 'Yes' : 'No'}</div>
                    
                    {/* Data Elements Count Debug */}
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2196f3' }}>
                      <strong>📝 Data Elements Count:</strong>
                      <div>📊 Total in configuration: {configuration?.programStage?.allDataElements?.length || 0}</div>
                      <div>📊 Total in sections: {serviceSections.reduce((total, section) => total + (section.dataElements?.length || 0), 0)}</div>
                      <div>📊 Expected vs Actual: {configuration?.programStage?.allDataElements?.length || 0} vs {serviceSections.reduce((total, section) => total + (section.dataElements?.length || 0), 0)}</div>
                    </div>
                   
                                     {/* Field count summary */}
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2196f3' }}>
                      <strong>📝 Field Counts:</strong>
                      {serviceSections.map(section => (
                        <div key={section.id} style={{ marginLeft: '8px', fontSize: '11px' }}>
                          {section.displayName}: {section.dataElements?.length || 0} fields
                          {section.dataElements && section.dataElements.length > 0 && (
                            <div style={{ marginLeft: '8px', fontSize: '10px', color: '#666' }}>
                              Fields: {section.dataElements.map(de => de.dataElement.displayName).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>
               )}
               
                                                                       {/* Show only Inspection Information and Inspection Type sections until confirmation */}
                 {!inspectionInfoConfirmed && serviceSections
                   .filter(section => {
                     const sectionName = (section.displayName || '').toLowerCase();
                     return sectionName.includes('inspection information') || sectionName.includes('inspection type');
                   })
                   .map((section, index) => (
                     <FormSection
                       key={`${section.id}-${index}-${section.displayName}`}
                       section={section}
                       formData={formData}
                       onChange={handleFieldChange}
                       errors={errors}
                       serviceSections={serviceOptions}
                       loadingServiceSections={false}
                       readOnlyFields={readOnlyFields}
                       getCurrentPosition={getCurrentPosition}
                       formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}
                       showDebugPanel={showDebugPanel}
                       isFieldMandatory={isFieldMandatory}
                       facilityClassifications={facilityClassifications}
                       loadingFacilityClassifications={loadingFacilityClassifications}
                       inspectionInfoConfirmed={inspectionInfoConfirmed}
                       setInspectionInfoConfirmed={setInspectionInfoConfirmed}
                       areAllInspectionFieldsComplete={areAllInspectionFieldsComplete}
                     />
                   ))}
               
               {/* Show remaining sections only after confirmation */}
               {inspectionInfoConfirmed && (
                 <>
                   {/* Status message */}
                   <div className="form-section" style={{
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
                    {serviceSections
                      .filter(section => {
                        const sectionName = (section.displayName || '').toLowerCase();
                        return !sectionName.includes('inspection information') && !sectionName.includes('inspection type');
                      })
                      .map((section, index) => (
                        <FormSection
                          key={`${section.id}-${index}-${section.displayName}`}
                          section={section}
                          formData={formData}
                          onChange={handleFieldChange}
                          errors={errors}
                          serviceSections={serviceOptions}
                          loadingServiceSections={false}
                          readOnlyFields={readOnlyFields}
                          getCurrentPosition={getCurrentPosition}
                          formatCoordinatesForDHIS2={formatCoordinatesForDHIS2}
                          showDebugPanel={showDebugPanel}
                          isFieldMandatory={isFieldMandatory}
                          facilityClassifications={facilityClassifications}
                          loadingFacilityClassifications={loadingFacilityClassifications}
                          inspectionInfoConfirmed={inspectionInfoConfirmed}
                          setInspectionInfoConfirmed={setInspectionInfoConfirmed}
                          areAllInspectionFieldsComplete={areAllInspectionFieldsComplete}
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
                     Complete and confirm the "Inspection Information" and "Inspection Type" sections above to unlock the remaining {serviceSections.filter(s => {
                       const sectionName = (s.displayName || '').toLowerCase();
                       return !sectionName.includes('inspection information') && !sectionName.includes('inspection type');
                     }).length} inspection sections.
                   </p>
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
                
                {/* Debug info for why sections aren't showing */}
                {showDebugPanel && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                    <strong>🔍 Debug Info:</strong>
                    <div>📊 serviceSections: {serviceSections ? `${serviceSections.length} sections` : 'null/undefined'}</div>
                    <div>📅 date_valid: {date_valid ? 'true' : 'false'}</div>
                    <div>🏥 formData.orgUnit: {formData.orgUnit || 'null/undefined'}</div>
                    <div>👤 user: {user ? 'loaded' : 'null/undefined'}</div>
                    <div>⚙️ configuration: {configuration ? 'loaded' : 'null/undefined'}</div>
                    {configuration && (
                      <div>📋 Total program sections: {configuration.programStage?.sections?.length || 0}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Form footer with actions */}
      <div className="form-footer">
        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={isSubmitting || missingMandatoryFields > 0}
          title={missingMandatoryFields > 0 ? `Please fill ${missingMandatoryFields} mandatory field(s) before submitting` : 'Submit inspection form'}
        >
          {isSubmitting ? 'Submitting...' : missingMandatoryFields > 0 ? `Submit (${missingMandatoryFields} required)` : 'Submit Inspection'}
        </button>
        
        <button
          type="button"
          onClick={handleSaveDraft}
          className="btn btn-secondary"
          disabled={isSubmitting || (!isOnline && !isDraft) || missingMandatoryFields > 0}
          title={missingMandatoryFields > 0 ? `Please fill ${missingMandatoryFields} mandatory field(s) before saving draft` : 'Save as draft'}
        >
          {isSubmitting ? 'Saving...' : missingMandatoryFields > 0 ? `Save Draft (${missingMandatoryFields} required)` : 'Save Draft'}
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