import React, { useState, useEffect } from 'react';
import { CSVConfigParser, DHIS2DataElementMapper } from '../utils/csvConfigParser';

/**
 * Dynamic Form Renderer Component
 * Renders forms based on CSV configuration with actual DHIS2 Data Elements
 * Automatically renders comment Data Elements that follow main Data Elements
 */
export function DynamicFormRenderer({ 
  csvContent, 
  facilityType, 
  dhis2DataElements = [], // Actual DHIS2 Data Elements
  onFormSubmit, 
  initialValues = {},
  readOnly = false,
  showDebugPanel = false // New prop for debug panel
}) {
  const [csvConfig, setCsvConfig] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [mappingValidation, setMappingValidation] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [currentSection, setCurrentSection] = useState(0); // Add section navigation state
  const [viewAllSections, setViewAllSections] = useState(false); // Add toggle for viewing all sections

  // Initialize CSV configuration and DHIS2 mapping
  useEffect(() => {
    if (csvContent && dhis2DataElements.length > 0) {
      try {
        const parser = new CSVConfigParser(csvContent);
        const mapper = new DHIS2DataElementMapper(parser);
        
        setCsvConfig(parser);
        
        // Validate mapping between CSV and DHIS2 Data Elements
        const validation = mapper.validateMapping(dhis2DataElements);
        setMappingValidation(validation);
        
        if (facilityType && validation.isValid) {
          const config = mapper.getFormConfig(facilityType, dhis2DataElements);
          setFormConfig(config);
          
          // Generate debug information
          if (showDebugPanel) {
            const debug = generateDebugInfo(parser, mapper, dhis2DataElements, config);
            setDebugInfo(debug);
          }
        }
      } catch (error) {
        console.error('Error parsing CSV configuration or mapping DHIS2 Data Elements:', error);
      }
    }
  }, [csvContent, facilityType, dhis2DataElements, showDebugPanel]);

  // Generate comprehensive debug information
  const generateDebugInfo = (parser, mapper, dhis2Elements, formConfig) => {
    const rawMapping = mapper.mapDHIS2DataElements(dhis2Elements);
    
    return {
      csvStructure: {
        facilityTypes: parser.getAvailableFacilityTypes(),
        sections: parser.sections.map(section => ({
          name: section.name,
          questionCount: section.questions.length,
          questions: section.questions.map(q => q.text)
        })),
        totalQuestions: parser.totalQuestions
      },
      dhis2Elements: {
        total: dhis2Elements.length,
        mainElements: dhis2Elements.filter(de => !mapper.isCommentDataElement(de.displayName)),
        commentElements: dhis2Elements.filter(de => mapper.isCommentDataElement(de.displayName)),
        elementTypes: dhis2Elements.reduce((acc, de) => {
          acc[de.valueType] = (acc[de.valueType] || 0) + 1;
          return acc;
        }, {})
      },
      mapping: {
        raw: rawMapping,
        summary: Object.entries(rawMapping).map(([sectionName, section]) => ({
          sectionName,
          mappedCount: section.dataElements.length,
          unmappedCount: parser.sections.find(s => s.name === sectionName)?.questions.length - section.dataElements.length || 0,
          mappedPairs: section.dataElements.map(de => ({
            csvQuestion: de.csvQuestion,
            mainDE: de.mainDataElement?.displayName || 'NOT FOUND',
            commentDE: de.commentDataElement?.displayName || 'NOT FOUND',
            mainDEId: de.mainDataElement?.id || 'NOT FOUND',
            commentDEId: de.commentDataElement?.id || 'NOT FOUND'
          }))
        }))
      },
      formConfig: formConfig ? {
        facilityType: formConfig.facilityType,
        sections: formConfig.sections.map(section => ({
          name: section.name,
          dataElementCount: section.dataElements.length,
          dataElements: section.dataElements.map(de => ({
            csvQuestion: de.csvQuestion,
            mainDE: de.mainDataElement?.displayName || 'NOT FOUND',
            commentDE: de.commentDataElement?.displayName || 'NOT FOUND'
          }))
        }))
      } : null
    };
  };

  // Handle form field changes
  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (formConfig) {
      formConfig.sections.forEach(section => {
        section.dataElements.forEach(de => {
          if (de.mainDataElement.compulsory && !formData[de.mainDataElement.id]) {
            newErrors[de.mainDataElement.id] = 'This field is required';
          }
        });
      });
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form data
    if (onFormSubmit) {
      onFormSubmit(formData);
    }
  };

  // Render individual form field pair (main + comment)
  const renderFieldPair = (dataElementPair) => {
    const { mainDataElement, commentDataElement, pairId } = dataElementPair;
    const mainValue = formData[mainDataElement.id] || '';
    const commentValue = formData[commentDataElement?.id] || '';
    const mainError = errors[mainDataElement.id];
    const commentError = errors[commentDataElement?.id];

    return (
      <div key={pairId} className="form-field-group">
        {/* Main DHIS2 Data Element Field */}
        <div className="form-field main-field">
          <label htmlFor={mainDataElement.id} className="form-label">
            {mainDataElement.displayName}
            {mainDataElement.compulsory && <span className="required">*</span>}
          </label>
          
          {renderDHIS2Field(mainDataElement, mainValue, mainError)}
          
          {mainError && <div className="error-message">{mainError}</div>}
        </div>

        {/* Comment DHIS2 Data Element Field - Automatically Rendered */}
        {commentDataElement && (
          <div className="form-field comment-field">
            <label htmlFor={commentDataElement.id} className="form-label">
              {commentDataElement.displayName}
              {commentDataElement.compulsory && <span className="required">*</span>}
            </label>
            
            {renderDHIS2Field(commentDataElement, commentValue, commentError)}
            
            {commentError && <div className="error-message">{commentError}</div>}
          </div>
        )}
      </div>
    );
  };

  // Render DHIS2 Data Element based on its valueType
  const renderDHIS2Field = (dataElement, value, error) => {
    const fieldId = dataElement.id;
    const fieldClass = `form-field-input ${error ? 'error' : ''}`;

    switch (dataElement.valueType) {
      case 'BOOLEAN':
        return (
          <div className="boolean-field">
            <label className="radio-label">
              <input
                type="radio"
                name={fieldId}
                value="true"
                checked={value === 'true'}
                onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                disabled={readOnly}
              />
              Yes
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name={fieldId}
                value="false"
                checked={value === 'false'}
                onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                disabled={readOnly}
              />
              No
            </label>
          </div>
        );

      case 'TEXT':
        return (
          <input
            type="text"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className={fieldClass}
            disabled={readOnly}
            placeholder={`Enter ${dataElement.displayName}`}
          />
        );

      case 'LONG_TEXT':
        return (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className={fieldClass}
            rows={3}
            disabled={readOnly}
            placeholder={`Enter ${dataElement.displayName}`}
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
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className={fieldClass}
            disabled={readOnly}
            placeholder={`Enter ${dataElement.displayName}`}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className={fieldClass}
            disabled={readOnly}
          />
        );

      case 'DATETIME':
        return (
          <input
            type="datetime-local"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className={fieldClass}
            disabled={readOnly}
          />
        );

      default:
        // Handle option sets (dropdowns)
        if (dataElement.optionSet && dataElement.optionSet.options) {
          return (
            <select
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
              className={fieldClass}
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

        // Default to text input for unknown types
        return (
          <input
            type="text"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className={fieldClass}
            disabled={readOnly}
            placeholder={`Enter ${dataElement.displayName}`}
          />
        );
    }
  };

  // Render form section
  const renderSection = (section) => {
    return (
      <div key={section.name} className="form-section">
        <h3 className="section-title">{section.name}</h3>
        <div className="section-content">
          {section.dataElements.map(renderFieldPair)}
        </div>
      </div>
    );
  };

  // Render debug panel
  const renderDebugPanel = () => {
    if (!showDebugPanel || !debugInfo) return null;

    return (
      <div className="debug-panel">
        <h3>🔍 Debug Information</h3>
        
        {/* CSV Structure */}
        <details className="debug-section">
          <summary>📋 CSV Structure ({debugInfo.csvStructure.totalQuestions} questions)</summary>
          <div className="debug-content">
            <h4>Facility Types:</h4>
            <ul>
              {debugInfo.csvStructure.facilityTypes.map(type => (
                <li key={type}>{type}</li>
              ))}
            </ul>
            
            <h4>Sections:</h4>
            {debugInfo.csvStructure.sections.map(section => (
              <div key={section.name} className="debug-section-item">
                <strong>{section.name}</strong> ({section.questionCount} questions)
                <ul>
                  {section.questions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>

        {/* DHIS2 Elements */}
        <details className="debug-section">
          <summary>🏥 DHIS2 Data Elements ({debugInfo.dhis2Elements.total} total)</summary>
          <div className="debug-content">
            <h4>Element Types:</h4>
            <ul>
              {Object.entries(debugInfo.dhis2Elements.elementTypes).map(([type, count]) => (
                <li key={type}>{type}: {count}</li>
              ))}
            </ul>
            
            <h4>Main Elements ({debugInfo.dhis2Elements.mainElements.length}):</h4>
            <ul>
              {debugInfo.dhis2Elements.mainElements.slice(0, 5).map(de => (
                <li key={de.id}>{de.displayName} ({de.valueType})</li>
              ))}
              {debugInfo.dhis2Elements.mainElements.length > 5 && (
                <li>... and {debugInfo.dhis2Elements.mainElements.length - 5} more</li>
              )}
            </ul>
            
            <h4>Comment Elements ({debugInfo.dhis2Elements.commentElements.length}):</h4>
            <ul>
              {debugInfo.dhis2Elements.commentElements.slice(0, 5).map(de => (
                <li key={de.id}>{de.displayName} ({de.valueType})</li>
              ))}
              {debugInfo.dhis2Elements.commentElements.length > 5 && (
                <li>... and {debugInfo.dhis2Elements.commentElements.length - 5} more</li>
              )}
            </ul>
          </div>
        </details>

        {/* Mapping Details */}
        <details className="debug-section">
          <summary>🔗 CSV to DHIS2 Mapping</summary>
          <div className="debug-content">
            {debugInfo.mapping.summary.map(section => (
              <div key={section.sectionName} className="debug-mapping-section">
                <h4>{section.sectionName}</h4>
                <p>
                  <strong>Mapped:</strong> {section.mappedCount} | 
                  <strong>Unmapped:</strong> {section.unmappedCount}
                </p>
                
                <details>
                  <summary>View Mapping Details</summary>
                  <table className="debug-mapping-table">
                    <thead>
                      <tr>
                        <th>CSV Question</th>
                        <th>Main DE</th>
                        <th>Comment DE</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.mappedPairs.map((pair, index) => (
                        <tr key={index} className={pair.mainDE === 'NOT FOUND' ? 'unmapped' : 'mapped'}>
                          <td>{pair.csvQuestion}</td>
                          <td>{pair.mainDE}</td>
                          <td>{pair.commentDE}</td>
                          <td>
                            {pair.mainDE === 'NOT FOUND' ? '❌ Unmapped' : 
                             pair.commentDE === 'NOT FOUND' ? '⚠️ No Comment' : '✅ Complete'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </div>
            ))}
          </div>
        </details>

        {/* Form Configuration */}
        {debugInfo.formConfig && (
          <details className="debug-section">
            <summary>📝 Form Configuration ({debugInfo.formConfig.facilityType})</summary>
            <div className="debug-content">
              {debugInfo.formConfig.sections.map(section => (
                <div key={section.name} className="debug-form-section">
                  <h4>{section.name}</h4>
                  <p><strong>Data Elements:</strong> {section.dataElementCount}</p>
                  
                  <details>
                    <summary>View Form Fields</summary>
                    <ul>
                      {section.dataElements.map((de, index) => (
                        <li key={index}>
                          <strong>Main:</strong> {de.mainDE} | 
                          <strong>Comment:</strong> {de.commentDE}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Quick Actions */}
        <div className="debug-actions">
          <button 
            onClick={() => console.log('Debug Info:', debugInfo)}
            className="debug-button"
          >
            Log to Console
          </button>
          <button 
            onClick={() => {
              const blob = new Blob([JSON.stringify(debugInfo, null, 2)], {
                type: 'application/json'
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `debug_${facilityType}_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="debug-button"
          >
            Download Debug JSON
          </button>
        </div>
      </div>
    );
  };

  // Show mapping validation errors
  if (mappingValidation && !mappingValidation.isValid) {
    return (
      <div className="mapping-error">
        <h3>Configuration Mapping Errors</h3>
        <p>The CSV configuration could not be properly mapped to DHIS2 Data Elements.</p>
        
        <div className="error-details">
          <h4>Errors:</h4>
          <ul>
            {mappingValidation.errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
          
          {mappingValidation.warnings.length > 0 && (
            <>
              <h4>Warnings:</h4>
              <ul>
                {mappingValidation.warnings.map((warning, index) => (
                  <li key={index} className="warning-item">{warning}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        
        <div className="mapping-stats">
          <h4>Mapping Statistics:</h4>
          <p>Total CSV Questions: {csvConfig?.totalQuestions || 0}</p>
          <p>Mapped Data Elements: {Object.values(mappingValidation.mapping).reduce((sum, section) => 
            sum + (section.dataElements?.length || 0), 0
          )}</p>
        </div>
      </div>
    );
  }

  if (!csvConfig || !formConfig) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading form configuration...</p>
          {!dhis2DataElements.length && (
            <p className="warning">No DHIS2 Data Elements provided</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-form">
      <div className="form-header">
        <h2>Facility Inspection Form</h2>
        <p className="facility-type">Facility Type: {formConfig.facilityType}</p>
        <p className="form-description">
          This form is based on the {formConfig.facilityType} checklist configuration.
          Each question automatically includes its corresponding comment field from DHIS2.
        </p>
        
        {/* Show mapping statistics */}
        <div className="mapping-info">
          <p>
            <strong>DHIS2 Data Elements:</strong> {dhis2DataElements.length} | 
            <strong>Mapped Pairs:</strong> {Object.values(formConfig.sections).reduce((sum, section) => 
              sum + (section.dataElements?.length || 0), 0
            )}
          </p>
        </div>
      </div>

      {/* Real-time Debug Information */}
      <div className="form-debug-info">
        <h3>🔍 Form Debug Information</h3>
        <div className="debug-info-grid">
          <div className="debug-info-item">
            <span className="debug-label">CSV Config:</span>
            <span className="debug-value success">✅ Loaded</span>
          </div>
          <div className="debug-info-item">
            <span className="debug-label">DHIS2 Elements:</span>
            <span className="debug-value success">{dhis2DataElements.length}</span>
          </div>
          <div className="debug-info-item">
            <span className="debug-label">Form Sections:</span>
            <span className="debug-value success">{formConfig.sections.length}</span>
          </div>
          <div className="debug-info-item">
            <span className="debug-label">Total Form Fields:</span>
            <span className="debug-value success">
              {formConfig.sections.reduce((sum, section) => 
                sum + (section.dataElements?.length || 0), 0
              )}
            </span>
          </div>
          <div className="debug-info-item">
            <span className="debug-label">Mapping Coverage:</span>
            <span className="debug-value success">
              {csvConfig ? 
                `${((Object.values(formConfig.sections).reduce((sum, section) => 
                  sum + (section.dataElements?.length || 0), 0
                ) / csvConfig.totalQuestions * 100).toFixed(1))}%` : 'N/A'
              }
            </span>
          </div>
          <div className="debug-info-item">
            <span className="debug-label">Form Data Fields:</span>
            <span className="debug-value success">{Object.keys(formData).length}</span>
          </div>
        </div>
        
        {/* Section-by-Section Debug Info */}
        <div className="section-debug-info">
          <h4>📋 Section Details</h4>
          <div className="section-debug-grid">
            {formConfig.sections.map((section, index) => (
              <div key={index} className="section-debug-item">
                <h5>{section.name}</h5>
                <div className="section-stats">
                  <span className="stat">
                    <strong>Questions:</strong> {csvConfig?.sections.find(s => s.name === section.name)?.questions?.length || 0}
                  </span>
                  <span className="stat">
                    <strong>Mapped:</strong> {section.dataElements?.length || 0}
                  </span>
                  <span className="stat">
                    <strong>Coverage:</strong> {
                      csvConfig?.sections.find(s => s.name === section.name)?.questions?.length > 0 ?
                      `${((section.dataElements?.length || 0) / csvConfig.sections.find(s => s.name === section.name)?.questions?.length * 100).toFixed(1)}%` :
                      'N/A'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {renderDebugPanel()}

      {/* Section Navigation */}
      {formConfig.sections.length > 1 && (
        <div className="section-navigation">
          <div className="section-navigation-header">
            <h3>Form Sections</h3>
            <div className="view-toggle">
              <button
                onClick={() => setViewAllSections(!viewAllSections)}
                className={`toggle-button ${viewAllSections ? 'active' : ''}`}
              >
                {viewAllSections ? '📋 View Section by Section' : '📄 View All Sections'}
              </button>
            </div>
          </div>
          
          {!viewAllSections && (
            <>
              <div className="section-indicators">
                {formConfig.sections.map((section, index) => (
                  <button
                    key={index}
                    className={`section-indicator ${currentSection === index ? 'active' : ''}`}
                    onClick={() => setCurrentSection(index)}
                  >
                    {section.name.replace('SECTION ', '').replace('-', ' ')}
                  </button>
                ))}
              </div>
              
              <div className="section-navigation-controls">
                {currentSection > 0 && (
                  <button
                    onClick={() => setCurrentSection(currentSection - 1)}
                    className="nav-button prev-button"
                  >
                    ← Previous Section
                  </button>
                )}
                
                <span className="section-counter">
                  Section {currentSection + 1} of {formConfig.sections.length}
                </span>
                
                {currentSection < formConfig.sections.length - 1 && (
                  <button
                    onClick={() => setCurrentSection(currentSection + 1)}
                    className="nav-button next-button"
                  >
                    Next Section →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="inspection-form">
        {/* Show sections based on toggle */}
        {formConfig.sections.length > 1 && !viewAllSections ? (
          renderSection(formConfig.sections[currentSection])
        ) : (
          formConfig.sections.map(renderSection)
        )}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={readOnly}
          >
            {readOnly ? 'View Only' : 'Submit Inspection'}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Facility Type Selector Component
 */
export function FacilityTypeSelector({ csvContent, onFacilityTypeSelect, selectedType }) {
  const [csvConfig, setCsvConfig] = useState(null);

  useEffect(() => {
    if (csvContent) {
      try {
        const parser = new CSVConfigParser(csvContent);
        setCsvConfig(parser);
      } catch (error) {
        console.error('Error parsing CSV configuration:', error);
      }
    }
  }, [csvContent]);

  if (!csvConfig) {
    return <div>Loading facility types...</div>;
  }

  return (
    <div className="facility-type-selector">
      <label htmlFor="facilityType" className="form-label">
        Select Facility Type:
      </label>
      <select
        id="facilityType"
        value={selectedType || ''}
        onChange={(e) => onFacilityTypeSelect(e.target.value)}
        className="form-select"
      >
        <option value="">Choose a facility type...</option>
        {csvConfig.getAvailableFacilityTypes().map(type => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      
      {selectedType && (
        <div className="facility-info">
          <p>
            <strong>Selected:</strong> {selectedType}
          </p>
          <p>
            <strong>Total Sections:</strong> {csvConfig.sections.length}
          </p>
          <p>
            <strong>Total Questions:</strong> {csvConfig.totalQuestions}
          </p>
        </div>
      )}
    </div>
  );
}
