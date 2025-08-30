import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Container, Row, Col, Nav } from 'react-bootstrap';
import { useApp } from '../contexts/AppContext';
import useIndexedDB from '../hooks/useIndexedDB';
import './InspectionForm.css';

const InspectionForm = ({ assignment, onClose, onSave }) => {
  const [formData, setFormData] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOnline } = useApp();
  const { saveInspection } = useIndexedDB();

  const sections = useMemo(() => assignment?.sections || [], [assignment?.sections]);

  // Initialize form data for each section
  useEffect(() => {
    const initialData = {};
    sections.forEach((section, index) => {
      initialData[index] = {
        sectionName: section,
        date: new Date().toISOString().split('T')[0],
        inspector: assignment?.inspector || '',
        facility: assignment?.facility || '',
        status: 'pending',
        observations: '',
        compliance: 'yes',
        recommendations: '',
        photos: [],
        notes: ''
      };
    });
    setFormData(initialData);
  }, [assignment, sections]);

  const handleInputChange = (sectionIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionIndex]: {
        ...prev[sectionIndex],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Save to IndexedDB
      const result = await saveInspection(assignment.id, formData);
      
      if (result.success) {
        onSave(formData);
      } else {
        throw new Error(result.error || 'Failed to save inspection data');
      }
    } catch (error) {
      console.error('Error saving inspection data:', error);
      alert('Failed to save inspection data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionForm = (sectionIndex) => {
    const section = sections[sectionIndex];
    const data = formData[sectionIndex] || {};
    const sectionName = section.replace('FACILITY:-', '');

    return (
      <Container>
        <Row className="mb-3">
          <Col>
            <h2>{sectionName}</h2>
          </Col>
        </Row>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm={3}>Inspection Date</Form.Label>
          <Col sm={9}>
            <Form.Control
              type="date"
              value={data.date || ''}
              onChange={(e) => handleInputChange(sectionIndex, 'date', e.target.value)}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm={3}>Inspector</Form.Label>
          <Col sm={9}>
            <Form.Control
              type="text"
              value={data.inspector || ''}
              onChange={(e) => handleInputChange(sectionIndex, 'inspector', e.target.value)}
              readOnly
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm={3}>Facility</Form.Label>
          <Col sm={9}>
            <Form.Control
              type="text"
              value={data.facility || ''}
              onChange={(e) => handleInputChange(sectionIndex, 'facility', e.target.value)}
              readOnly
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm={3}>Compliance Status</Form.Label>
          <Col sm={9}>
            <Form.Select
              value={data.compliance || 'yes'}
              onChange={(e) => handleInputChange(sectionIndex, 'compliance', e.target.value)}
            >
              <option value="yes">Compliant</option>
              <option value="no">Non-Compliant</option>
              <option value="partial">Partially Compliant</option>
              <option value="na">Not Applicable</option>
            </Form.Select>
          </Col>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observations</Form.Label>
          <Form.Control
            as="textarea"
            value={data.observations || ''}
            onChange={(e) => handleInputChange(sectionIndex, 'observations', e.target.value)}
            placeholder="Enter detailed observations..."
            rows="4"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Recommendations</Form.Label>
          <Form.Control
            as="textarea"
            value={data.recommendations || ''}
            onChange={(e) => handleInputChange(sectionIndex, 'recommendations', e.target.value)}
            placeholder="Enter recommendations for improvement..."
            rows="3"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Additional Notes</Form.Label>
          <Form.Control
            as="textarea"
            value={data.notes || ''}
            onChange={(e) => handleInputChange(sectionIndex, 'notes', e.target.value)}
            placeholder="Any additional notes..."
            rows="2"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Photos</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              handleInputChange(sectionIndex, 'photos', files);
            }}
          />
          <Form.Text className="text-muted">Upload photos of the inspection area</Form.Text>
        </Form.Group>
      </Container>
    );
  };

  return (
    <Modal show={true} onHide={onClose} fullscreen={true}>
      <Modal.Header closeButton>
        <Modal.Title>Inspection Form - {assignment?.facility}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Nav variant="tabs" defaultActiveKey={currentSection}>
          {sections.map((section, index) => (
            <Nav.Item key={index}>
              <Nav.Link
                eventKey={index}
                onClick={() => setCurrentSection(index)}
              >
                {section.replace('FACILITY:-', '')}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
        <div className="mt-3">
          {renderSectionForm(currentSection)}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="status-indicator">
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span>{isOnline ? 'Online - Data will sync' : 'Offline - Data saved locally'}</span>
        </div>

        {currentSection > 0 && (
          <Button variant="secondary" onClick={() => setCurrentSection(currentSection - 1)}>
            Previous
          </Button>
        )}

        {currentSection < sections.length - 1 && (
          <Button variant="primary" onClick={() => setCurrentSection(currentSection + 1)}>
            Next
          </Button>
        )}

        {currentSection === sections.length - 1 && (
          <Button variant="success" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Inspection'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default InspectionForm; 
        <div className="form-group">

          <label>Observations</label>

          <textarea

            value={data.observations || ''}

            onChange={(e) => handleInputChange(sectionIndex, 'observations', e.target.value)}

            placeholder="Enter detailed observations..."

            rows="4"

          />

        </div>



        <div className="form-group">

          <label>Recommendations</label>

          <textarea

            value={data.recommendations || ''}

            onChange={(e) => handleInputChange(sectionIndex, 'recommendations', e.target.value)}

            placeholder="Enter recommendations for improvement..."

            rows="3"

          />

        </div>



        <div className="form-group">

          <label>Additional Notes</label>

          <textarea

            value={data.notes || ''}

            onChange={(e) => handleInputChange(sectionIndex, 'notes', e.target.value)}

            placeholder="Any additional notes..."

            rows="2"

          />

        </div>



        <div className="form-group">

          <label>Photos</label>

          <div className="photo-upload">

            <input

              type="file"

              accept="image/*"

              multiple

              onChange={(e) => {

                const files = Array.from(e.target.files);

                handleInputChange(sectionIndex, 'photos', files);

              }}

            />

            <p className="upload-hint">Upload photos of the inspection area</p>

          </div>

        </div>

      </div>

    );

  };



  return (

    <div className="inspection-form-overlay">

      <div className="inspection-form-modal">

        <div className="form-header">

          <h1>Inspection Form - {assignment?.facility}</h1>

          <button onClick={onClose} className="close-button">×</button>

        </div>



        <div className="form-navigation">

          {sections.map((section, index) => (

            <button

              key={index}

              className={`nav-button ${currentSection === index ? 'active' : ''}`}

              onClick={() => setCurrentSection(index)}

            >

              {section.replace('FACILITY:-', '')}

            </button>

          ))}

        </div>



        <div className="form-content">

          {renderSectionForm(currentSection)}

        </div>



        <div className="form-actions">

          <div className="status-indicator">

            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>

            <span>{isOnline ? 'Online - Data will sync' : 'Offline - Data saved locally'}</span>

          </div>

          

          <div className="action-buttons">

            {currentSection > 0 && (

              <button

                onClick={() => setCurrentSection(currentSection - 1)}

                className="nav-button"

              >

                Previous

              </button>

            )}

            

            {currentSection < sections.length - 1 && (

              <button

                onClick={() => setCurrentSection(currentSection + 1)}

                className="nav-button"

              >

                Next

              </button>

            )}

            

            {currentSection === sections.length - 1 && (

              <button

                onClick={handleSave}

                className="save-button"

                disabled={isSubmitting}

              >

                {isSubmitting ? 'Saving...' : 'Save Inspection'}

              </button>

            )}

          </div>

        </div>

      </div>

    </div>

  );

};



export default InspectionForm; 
