import React, { useState, useEffect } from 'react';
import { CSVConfigParser, DHIS2DataElementMapper } from '../utils/csvConfigParser';
import { Form, Button, Container, Row, Col, Spinner, Alert, Accordion, Nav, Badge, Card, Table } from 'react-bootstrap';

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
    const initializeForm = async () => {
      if (csvContent && dhis2DataElements.length > 0) {
        try {
          const parser = new CSVConfigParser(csvContent);
          const mapper = new DHIS2DataElementMapper(parser);
          
          setCsvConfig(parser);
          
          // Validate mapping between CSV and DHIS2 Data Elements
          const validation = mapper.validateMapping(dhis2DataElements);
          setMappingValidation(validation);
          
          if (facilityType && validation.isValid) {
            const config = await mapper.getFormConfig(facilityType, dhis2DataElements); // Await the async call
            setFormConfig(config);
            console.log('🔗 [DynamicFormRenderer] Final Form Config:', config);
            
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
    };
    initializeForm();
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
    
    // All fields are optional - no validation required
    const newErrors = {};
    setErrors(newErrors);
    
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
      <Form.Group as={Row} key={pairId} className="mb-3">
        <Col md={commentDataElement ? 6 : 12}>
          <Form.Label htmlFor={mainDataElement.id}>{mainDataElement.displayName}</Form.Label>
          {renderDHIS2Field(mainDataElement, mainValue, mainError)}
          {mainError && <Form.Text className="text-danger">{mainError}</Form.Text>}
        </Col>

        <Col md={6}>
          {commentDataElement ? (
            <>
              <Form.Label htmlFor={commentDataElement.id}>{commentDataElement.displayName}</Form.Label>
              {renderDHIS2Field(commentDataElement, commentValue, commentError)}
              {commentError && <Form.Text className="text-danger">{commentError}</Form.Text>}
            </>
          ) : (
            <>
              <Form.Label>Comment (Not Available)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="No specific comment field from DHIS2 available for this item."
                disabled
              />
            </>
          )}
        </Col>
      </Form.Group>
    );
  };

  // Render DHIS2 Data Element based on its valueType
  const renderDHIS2Field = (dataElement, value, error) => {
    const fieldId = dataElement.id;
    const isInvalid = !!error;

    switch (dataElement.valueType) {
      case 'BOOLEAN':
        return (
          <div>
            <Form.Check
              inline
              type="radio"
              id={`${fieldId}-yes`}
              name={fieldId}
              label="Yes"
              value="true"
              checked={value === 'true'}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
              disabled={readOnly}
              isInvalid={isInvalid}
            />
            <Form.Check
              inline
              type="radio"
              id={`${fieldId}-no`}
              name={fieldId}
              label="No"
              value="false"
              checked={value === 'false'}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
              disabled={readOnly}
              isInvalid={isInvalid}
            />
          </div>
        );

      case 'TEXT':
        return (
          <Form.Control
            type="text"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            disabled={readOnly}
            placeholder={`Enter ${dataElement.displayName}`}
            isInvalid={isInvalid}
          />
        );

      case 'LONG_TEXT':
        return (
          <Form.Control
            as="textarea"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            rows={3}
            disabled={readOnly}
            placeholder={`Enter ${dataElement.displayName}`}
            isInvalid={isInvalid}
          />
        );

      case 'INTEGER':
      case 'INTEGER_POSITIVE':
      case 'INTEGER_NEGATIVE':
      case 'INTEGER_ZERO_OR_POSITIVE':
      case 'NUMBER':
      case 'PERCENTAGE':
        return (
          <Form.Control
            type="number"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            disabled={readOnly}
            placeholder={`Enter ${dataElement.displayName}`}
            isInvalid={isInvalid}
          />
        );

      case 'DATE':
        return (
          <Form.Control
            type="date"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            disabled={readOnly}
            isInvalid={isInvalid}
          />
        );

      case 'DATETIME':
        return (
          <Form.Control
            type="datetime-local"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            disabled={readOnly}
            isInvalid={isInvalid}
          />
        );

      default:
        if (dataElement.optionSet && dataElement.optionSet.options) {
          return (
            <Form.Select
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
              disabled={readOnly}
              isInvalid={isInvalid}
            >
              <option value="">Select {dataElement.displayName}</option>
              {dataElement.optionSet.options
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map(option => (
                  <option key={option.id} value={option.code || option.id}>
                    {option.displayName}
                  </option>
                ))}
            </Form.Select>
          );
        }

        return (
          <Form.Control
            type="text"
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            disabled={readOnly}
            placeholder={`Enter ${dataElement.displayName}`}
            isInvalid={isInvalid}
          />
        );
    }
  };

  // Render form section
  const renderSection = (section) => {
    return (
      <Card key={section.name} className="mb-3">
        <Card.Header as="h3">{section.name}</Card.Header>
        <Card.Body>
          {section.dataElements.map(renderFieldPair)}
        </Card.Body>
      </Card>
    );
  };

  // Render debug panel
  const renderDebugPanel = () => {
    if (!showDebugPanel || !debugInfo) return null;

    return (
      <Accordion defaultActiveKey="0" className="mb-3">
        <Card>
          <Accordion.Header as="h3" className="debug-panel-header">🔍 Debug Information</Accordion.Header>
          <Accordion.Body>
            <Accordion>
              <Card>
                <Accordion.Header as="h4" eventKey="0">📋 CSV Structure ({debugInfo.csvStructure.totalQuestions} questions)</Accordion.Header>
                <Accordion.Body>
                  <h5>Facility Types:</h5>
                  <ul>
                    {debugInfo.csvStructure.facilityTypes.map(type => (
                      <li key={type}>{type}</li>
                    ))}
                  </ul>

                  <h5>Sections:</h5>
                  {debugInfo.csvStructure.sections.map(section => (
                    <div key={section.name} className="mb-2">
                      <strong>{section.name}</strong> ({section.questionCount} questions)
                      <ul>
                        {section.questions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Accordion.Body>
              </Card>

              <Card>
                <Accordion.Header as="h4" eventKey="1">🏥 DHIS2 Data Elements ({debugInfo.dhis2Elements.total} total)</Accordion.Header>
                <Accordion.Body>
                  <h5>Element Types:</h5>
                  <ul>
                    {Object.entries(debugInfo.dhis2Elements.elementTypes).map(([type, count]) => (
                      <li key={type}>{type}: {count}</li>
                    ))}
                  </ul>

                  <h5>Main Elements ({debugInfo.dhis2Elements.mainElements.length}):</h5>
                  <ul>
                    {debugInfo.dhis2Elements.mainElements.slice(0, 5).map(de => (
                      <li key={de.id}>{de.displayName} ({de.valueType})</li>
                    ))}
                    {debugInfo.dhis2Elements.mainElements.length > 5 && (
                      <li>... and {debugInfo.dhis2Elements.mainElements.length - 5} more</li>
                    )}
                  </ul>

                  <h5>Comment Elements ({debugInfo.dhis2Elements.commentElements.length}):</h5>
                  <ul>
                    {debugInfo.dhis2Elements.commentElements.slice(0, 5).map(de => (
                      <li key={de.id}>{de.displayName} ({de.valueType})</li>
                    ))}
                    {debugInfo.dhis2Elements.commentElements.length > 5 && (
                      <li>... and {debugInfo.dhis2Elements.commentElements.length - 5} more</li>
                    )}
                  </ul>
                </Accordion.Body>
              </Card>

              <Card>
                <Accordion.Header as="h4" eventKey="2">🔗 CSV to DHIS2 Mapping</Accordion.Header>
                <Accordion.Body>
                  {debugInfo.mapping.summary.map(section => (
                    <div key={section.sectionName} className="mb-2">
                      <h5>{section.sectionName}</h5>
                      <p>
                        <strong>Mapped:</strong> <Badge bg="success">{section.mappedCount}</Badge> |
                        <strong>Unmapped:</strong> <Badge bg="danger">{section.unmappedCount}</Badge>
                      </p>

                      <Accordion>
                        <Card>
                          <Accordion.Header eventKey="0">View Mapping Details</Accordion.Header>
                          <Accordion.Body>
                            <Table striped bordered hover responsive size="sm">
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
                                  <tr key={index} className={pair.mainDE === 'NOT FOUND' ? 'table-danger' : ''}>
                                    <td>{pair.csvQuestion}</td>
                                    <td>{pair.mainDE}</td>
                                    <td>{pair.commentDE}</td>
                                    <td>
                                      {pair.mainDE === 'NOT FOUND' ? <Badge bg="danger">❌ Unmapped</Badge> :
                                       pair.commentDE === 'NOT FOUND' ? <Badge bg="warning">⚠️ No Comment</Badge> : <Badge bg="success">✅ Complete</Badge>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Accordion.Body>
                        </Card>
                      </Accordion>
                    </div>
                  ))}
                </Accordion.Body>
              </Card>

              {debugInfo.formConfig && (
                <Card>
                  <Accordion.Header as="h4" eventKey="3">📝 Form Configuration ({debugInfo.formConfig.facilityType})</Accordion.Header>
                  <Accordion.Body>
                    {debugInfo.formConfig.sections.map(section => (
                      <div key={section.name} className="mb-2">
                        <h5>{section.name}</h5>
                        <p><strong>Data Elements:</strong> <Badge bg="info">{section.dataElementCount}</Badge></p>

                        <Accordion>
                          <Card>
                            <Accordion.Header eventKey="0">View Form Fields</Accordion.Header>
                            <Accordion.Body>
                              <ul>
                                {section.dataElements.map((de, index) => (
                                  <li key={index}>
                                    <strong>Main:</strong> {de.mainDE} |
                                    <strong>Comment:</strong> {de.commentDE}
                                  </li>
                                ))}
                              </ul>
                            </Accordion.Body>
                          </Card>
                        </Accordion>
                      </div>
                    ))}
                  </Accordion.Body>
                </Card>
              )}
            </Accordion>

            <div className="d-flex justify-content-end mt-3">
              <Button
                variant="info"
                onClick={() => console.log('Debug Info:', debugInfo)}
                className="me-2"
              >
                Log to Console
              </Button>
              <Button
                variant="primary"
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
              >
                Download Debug JSON
              </Button>
            </div>
          </Accordion.Body>
        </Card>
      </Accordion>
    );
  };

  // Show mapping validation errors
  if (mappingValidation && !mappingValidation.isValid) {
    return (
      <Alert variant="danger" className="m-3">
        <Alert.Heading>Configuration Mapping Errors</Alert.Heading>
        <p>The CSV configuration could not be properly mapped to DHIS2 Data Elements.</p>

        <h5>Errors:</h5>
        <ul>
          {mappingValidation.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>

        {mappingValidation.warnings.length > 0 && (
          <>
            <h5>Warnings:</h5>
            <ul>
              {mappingValidation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </>
        )}

        <hr />
        <h5>Mapping Statistics:</h5>
        <p>
          Total CSV Questions: <Badge bg="secondary">{csvConfig?.totalQuestions || 0}</Badge><br />
          Mapped Data Elements: <Badge bg="success">{Object.values(mappingValidation.mapping).reduce((sum, section) =>
            sum + (section.dataElements?.length || 0), 0
          )}</Badge>
        </p>
      </Alert>
    );
  }

  if (!csvConfig || !formConfig) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading form configuration...</p>
        {!dhis2DataElements.length && (
          <Alert variant="warning" className="mt-3">
            No DHIS2 Data Elements provided
          </Alert>
        )}
      </Container>
    );
  }

  return (
    <Container className="dynamic-form py-3">
      <Card className="mb-3">
        <Card.Header>
          <h2>Facility Inspection Form</h2>
          <p className="text-muted">Facility Type: {formConfig.facilityType}</p>
          <p className="form-description">
            This form is based on the {formConfig.facilityType} checklist configuration.
            Each question automatically includes its corresponding comment field from DHIS2.
          </p>

          <div className="mapping-info">
            <p>
              <strong>DHIS2 Data Elements:</strong> <Badge bg="primary">{dhis2DataElements.length}</Badge> |
              <strong>Mapped Pairs:</strong> <Badge bg="success">{Object.values(formConfig.sections).reduce((sum, section) =>
                sum + (section.dataElements?.length || 0), 0
              )}</Badge>
            </p>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col>
              <h3>🔍 Form Debug Information</h3>
              <Row className="g-2">
                <Col md={4}>
                  <Card bg="light">
                    <Card.Body>
                      <Card.Text><strong>CSV Config:</strong> <Badge bg="success">✅ Loaded</Badge></Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card bg="light">
                    <Card.Body>
                      <Card.Text><strong>DHIS2 Elements:</strong> <Badge bg="success">{dhis2DataElements.length}</Badge></Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card bg="light">
                    <Card.Body>
                      <Card.Text><strong>Form Sections:</strong> <Badge bg="success">{formConfig.sections.length}</Badge></Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card bg="light">
                    <Card.Body>
                      <Card.Text><strong>Total Form Fields:</strong> <Badge bg="success">
                        {formConfig.sections.reduce((sum, section) =>
                          sum + (section.dataElements?.length || 0), 0
                        )}
                      </Badge></Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card bg="light">
                    <Card.Body>
                      <Card.Text><strong>Mapping Coverage:</strong> <Badge bg="success">
                        {csvConfig ?
                          `${((Object.values(formConfig.sections).reduce((sum, section) =>
                            sum + (section.dataElements?.length || 0), 0
                          ) / csvConfig.totalQuestions * 100).toFixed(1))}%` : 'N/A'
                        }
                      </Badge></Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card bg="light">
                    <Card.Body>
                      <Card.Text><strong>Form Data Fields:</strong> <Badge bg="success">{Object.keys(formData).length}</Badge></Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <h4 className="mt-3">📋 Section Details</h4>
              <Row className="g-2">
                {formConfig.sections.map((section, index) => (
                  <Col md={4} key={index}>
                    <Card bg="light">
                      <Card.Body>
                        <Card.Title as="h5">{section.name}</Card.Title>
                        <Card.Text>
                          <strong>Questions:</strong> <Badge bg="secondary">{csvConfig?.sections.find(s => s.name === section.name)?.questions?.length || 0}</Badge><br />
                          <strong>Mapped:</strong> <Badge bg="success">{section.dataElements?.length || 0}</Badge><br />
                          <strong>Coverage:</strong> <Badge bg="info">
                            {csvConfig?.sections.find(s => s.name === section.name)?.questions?.length > 0 ?
                            `${((section.dataElements?.length || 0) / csvConfig.sections.find(s => s.name === section.name)?.questions?.length * 100).toFixed(1)}%` :
                            'N/A'
                            }
                          </Badge>
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {renderDebugPanel()}

      {formConfig.sections.length > 1 && (
        <Card className="mb-3">
          <Card.Header>
            <h3>Form Sections</h3>
            <div className="d-flex justify-content-end">
              <Button
                variant={viewAllSections ? "secondary" : "primary"}
                onClick={() => setViewAllSections(!viewAllSections)}
              >
                {viewAllSections ? '📋 View Section by Section' : '📄 View All Sections'}
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {!viewAllSections && (
              <>
                <Nav variant="pills" className="mb-3">
                  {formConfig.sections.map((section, index) => (
                    <Nav.Item key={index}>
                      <Nav.Link
                        active={currentSection === index}
                        onClick={() => setCurrentSection(index)}
                      >
                        {section.name.replace('SECTION ', '').replace('-', ' ')}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => setCurrentSection(currentSection - 1)}
                    disabled={currentSection === 0}
                  >
                    ← Previous Section
                  </Button>
                  <span>
                    Section {currentSection + 1} of {formConfig.sections.length}
                  </span>
                  <Button
                    variant="outline-primary"
                    onClick={() => setCurrentSection(currentSection + 1)}
                    disabled={currentSection === formConfig.sections.length - 1}
                  >
                    Next Section →
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      <Form onSubmit={handleSubmit} className="inspection-form">
        {formConfig.sections.length > 1 && !viewAllSections ? (
          renderSection(formConfig.sections[currentSection])
        ) : (
          formConfig.sections.map(renderSection)
        )}

        <div className="d-grid gap-2">
          <Button
            variant="success"
            type="submit"
            disabled={readOnly}
          >
            {readOnly ? 'View Only' : 'Submit Inspection'}
          </Button>
        </div>
      </Form>
    </Container>
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
    return (
      <div className="text-center my-3">
        <Spinner animation="border" size="sm" role="status">
          <span className="visually-hidden">Loading facility types...</span>
        </Spinner>
        <p className="mt-2">Loading facility types...</p>
      </div>
    );
  }

  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="facilityType">Select Facility Type:</Form.Label>
          <Form.Select
            id="facilityType"
            value={selectedType || ''}
            onChange={(e) => onFacilityTypeSelect(e.target.value)}
          >
            <option value="">Choose a facility type...</option>
            {csvConfig.getAvailableFacilityTypes().map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {selectedType && (
          <Card className="mt-3">
            <Card.Body>
              <Card.Text>
                <strong>Selected:</strong> <Badge bg="primary">{selectedType}</Badge><br />
                <strong>Total Sections:</strong> <Badge bg="info">{csvConfig.sections.length}</Badge><br />
                <strong>Total Questions:</strong> <Badge bg="info">{csvConfig.totalQuestions}</Badge>
              </Card.Text>
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
}
