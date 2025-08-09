import { useRef } from 'react';

// DHIS2 API validation functions
function validateValue(value, valueType, compulsory = false) {
  // Check if required field is empty
  if (compulsory && (!value || value.toString().trim() === '')) {
    return { valid: false, message: 'This field is required' };
  }
  
  // If value is empty and not required, it's valid
  if (!value || value.toString().trim() === '') {
    return { valid: true, message: '' };
  }
  
  const stringValue = value.toString().trim();
  
  switch (valueType) {
    case 'INTEGER':
    case 'INTEGER_POSITIVE':
    case 'INTEGER_NEGATIVE':
    case 'INTEGER_ZERO_OR_POSITIVE': {
      if (!/^-?\d+$/.test(stringValue)) {
        return { valid: false, message: 'Must be a whole number' };
      }
      const intValue = parseInt(stringValue);
      if (valueType === 'INTEGER_POSITIVE' && intValue <= 0) {
        return { valid: false, message: 'Must be a positive number' };
      }
      if (valueType === 'INTEGER_NEGATIVE' && intValue >= 0) {
        return { valid: false, message: 'Must be a negative number' };
      }
      if (valueType === 'INTEGER_ZERO_OR_POSITIVE' && intValue < 0) {
        return { valid: false, message: 'Must be zero or positive' };
      }
      break;
    }
      
    case 'NUMBER':
    case 'PERCENTAGE': {
      if (!/^-?\d*\.?\d+$/.test(stringValue)) {
        return { valid: false, message: 'Must be a valid number' };
      }
      if (valueType === 'PERCENTAGE') {
        const numValue = parseFloat(stringValue);
        if (numValue < 0 || numValue > 100) {
          return { valid: false, message: 'Must be between 0 and 100' };
        }
      }
      break;
    }
      
    case 'DATE': {
      const dateValue = new Date(stringValue);
      if (isNaN(dateValue.getTime())) {
        return { valid: false, message: 'Must be a valid date' };
      }
      break;
    }
      
    case 'DATETIME': {
      const datetimeValue = new Date(stringValue);
      if (isNaN(datetimeValue.getTime())) {
        return { valid: false, message: 'Must be a valid date and time' };
      }
      break;
    }
      
    case 'EMAIL': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return { valid: false, message: 'Must be a valid email address' };
      }
      break;
    }
      
    case 'PHONE_NUMBER': {
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(stringValue.replace(/\s/g, ''))) {
        return { valid: false, message: 'Must be a valid phone number' };
      }
      break;
    }
      
    case 'URL':
      try {
        new URL(stringValue);
      } catch {
        return { valid: false, message: 'Must be a valid URL' };
      }
      break;
      
    default:
      break;
  }
  
  return { valid: true, message: '' };
}

// DHIS2 API service
class DHIS2APIService {
  constructor() {
    this.baseUrl = '';
    this.credentials = null;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  setConfig(baseUrl, username, password) {
    // In development, use relative URLs to leverage Vite proxy
    if (import.meta.env.DEV) {
      this.baseUrl = '';
      console.log('🔧 Development mode: Using proxy for API calls');
    } else {
      this.baseUrl = baseUrl.replace(/\/$/, '');
    }
    this.credentials = btoa(`${username}:${password}`);
    this.headers['Authorization'] = `Basic ${this.credentials}`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: this.headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async testAuth() {
    try {
      const response = await this.request('/api/me');
      return { success: true, user: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMe() {
    return this.request('/api/me?fields=id,displayName,username,organisationUnits[id,name]');
  }

  /**
   * Get programs with complete metadata for mobile data collection
   * Similar to Android DHIS2 app metadata fetching
   */
  async getPrograms() {
    const fields = [
      'id',
      'displayName',
      'description',
      'programType',
      'withoutRegistration',
      'programStages[id,displayName,description,sortOrder,repeatable,generatedByEnrollmentDate,minDaysFromStart,programStageSections[id,displayName,sortOrder,programStageDataElements[id,displayName,sortOrder,compulsory,allowProvidedElsewhere,dataElement[id,displayName,shortName,code,description,valueType,aggregationType,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]],programStageDataElements[id,displayName,sortOrder,compulsory,allowProvidedElsewhere,dataElement[id,displayName,shortName,code,description,valueType,aggregationType,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]]'
    ].join(',');
    
    return this.request(`/api/programs?fields=${fields}&filter=programType:eq:WITHOUT_REGISTRATION&paging=false`);
  }



  async getOrganisationUnits() {
    return this.request('/api/organisationUnits?fields=id,displayName,level,path,parent[id,displayName]&paging=false');
  }

  /**
   * Get user's assigned organisation units for data capture
   * Uses the specific endpoint: /api/me?fields=organisationUnits[id,name]
   */
  async getUserOrgUnits() {
    console.log('🏥 Fetching user organization units...');
    const me = await this.getMe();
    console.log('👤 User data from /api/me:', me);
    
    if (me.organisationUnits && me.organisationUnits.length > 0) {
      console.log('📍 Raw organization units from API:', me.organisationUnits);
      
      // Transform 'name' field to 'displayName' for consistency with rest of the app
      const transformedOrgUnits = me.organisationUnits.map(ou => ({
        ...ou,
        displayName: ou.name || ou.displayName
      }));
      
      console.log('✅ Transformed organization units:', transformedOrgUnits);
      
      // IMMEDIATELY try to get service sections for this user
      console.log('🔍 TESTING: Attempting to get service sections for user:', me.username);
      if (transformedOrgUnits.length > 0) {
        const firstFacility = transformedOrgUnits[0];
        console.log(`🏢 TESTING: Getting service sections for facility: ${firstFacility.id} (${firstFacility.displayName}), user: ${me.username}`);
        try {
          const testSections = await this.getServiceSectionsForInspector(firstFacility.id, me.username);
          console.log('🎯 TESTING: Service sections result:', testSections);
        } catch (error) {
          console.error('❌ TESTING: Failed to get service sections:', error);
        }
      }
      return { organisationUnits: transformedOrgUnits };
    }
    
    console.log('⚠️ No user-assigned org units found, returning empty array');
    return { organisationUnits: [] };
  }

  /**
   * Get organization units that are assigned to a specific program
   * AND that the user has access to
   */
  async getProgramAssignedOrgUnits(programId) {
    console.log(`🔍 Getting program-assigned org units for program: ${programId}`);
    try {
      // First get user's accessible org units
      const userOrgUnits = await this.getUserOrgUnits();
      console.log('👥 User accessible org units:', userOrgUnits);
      const userOrgUnitIds = userOrgUnits.organisationUnits?.map(ou => ou.id) || [];
      console.log('🆔 User org unit IDs:', userOrgUnitIds);
      
      if (userOrgUnitIds.length === 0) {
        console.warn('⚠️ User has no accessible organization units');
        return { organisationUnits: [] };
      }
      
      // Get org units that have the program assigned
      const fields = 'id,displayName,path,programs[id]';
      const programQuery = `/api/organisationUnits?filter=programs:in:[${programId}]&fields=${fields}&paging=false`;
      console.log('📡 Program assignment query:', programQuery);
      
      const programAssignedOrgUnits = await this.request(programQuery);
      console.log('🏥 Program-assigned org units from API:', programAssignedOrgUnits);
      
      // Filter to only include org units that the user has access to
      const accessibleProgramOrgUnits = programAssignedOrgUnits.organisationUnits?.filter(ou => 
        userOrgUnitIds.includes(ou.id)
      ) || [];
      
      console.log('✅ Program-assigned facilities summary:', {
        totalProgramAssigned: programAssignedOrgUnits.organisationUnits?.length || 0,
        userAccessible: userOrgUnitIds.length,
        filtered: accessibleProgramOrgUnits.length,
        finalOrgUnits: accessibleProgramOrgUnits
      });
      
      return { organisationUnits: accessibleProgramOrgUnits };
    } catch (error) {
      console.error('❌ Failed to fetch program-assigned org units:', error);
      // No fallback to user org units
      return { organisationUnits: [] };
    }
  }

  /**
   * Get complete metadata configuration for data collection using direct endpoint
   * Loads form configuration immediately - org units now come from DataStore assignments
   */
  async getDataCollectionConfiguration() {
    try {
      // Direct configuration IDs for Facility-Registry program
      const FACILITY_REGISTRY_PROGRAM_ID = 'EE8yeLVo6cN';
      const INSPECTIONS_STAGE_ID = 'Eupjm3J0dt2';
      
      // Only fetch stage metadata - org units now come from DataStore assignments
      const stageMetadata = await this.getInspectionStageMetadata(INSPECTIONS_STAGE_ID);

      console.log('🏗️ Building configuration (org units from DataStore assignments)');

      // Build configuration from direct metadata
      const configuration = {
        program: {
          id: FACILITY_REGISTRY_PROGRAM_ID,
          displayName: '1. Facility-Registry',
          description: 'Facility Registry Inspections Program',
          programType: 'WITHOUT_REGISTRATION'
        },
        programStage: {
          id: INSPECTIONS_STAGE_ID,
          displayName: stageMetadata.name || 'Inspections',
          description: 'Facility inspection data collection',
          sections: this.processStageMetadataIntoSections(stageMetadata),
          allDataElements: this.extractAllDataElementsFromMetadata(stageMetadata)
        },
        organisationUnits: [] // Now populated from DataStore assignments in userAssignments
      };

      // Fallback: if no sections configured in the stage, create a single synthetic section
      if (!configuration.programStage.sections || configuration.programStage.sections.length === 0) {
        const synthetic = {
          id: 'section_all',
          displayName: stageMetadata.name || 'Inspection Form',
          description: null,
          sortOrder: 0,
          dataElements: configuration.programStage.allDataElements || []
        };
        configuration.programStage.sections = [synthetic];
      }

      console.log('✅ Direct configuration loaded:', {
        program: configuration.program.displayName,
        stage: configuration.programStage.displayName,
        sectionsCount: configuration.programStage.sections.length,
        dataElementsCount: configuration.programStage.allDataElements.length,
        note: 'Facilities now come from DataStore assignments'
      });

      return configuration;
    } catch (error) {
      console.error('Failed to fetch data collection configuration:', error);
      throw new Error(`Configuration Error: ${error.message}\n\nPlease check:\n- Program stage ID "Eupjm3J0dt2" exists and is accessible\n- You have proper access permissions`);
    }
  }

  /**
   * Get inspection stage metadata using the direct endpoint
   */
  async getInspectionStageMetadata(stageId) {
    // Use the exact fields from your endpoint, enhanced with required metadata
    const fields = 'name,programStageSections[name,dataElements[displayFormName,name,id,valueType,compulsory,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]';
    return this.request(`/api/programStages/${stageId}?fields=${fields}`);
  }

  /**
   * Process the stage metadata into sections format
   */
  processStageMetadataIntoSections(stageMetadata) {
    const sections = [];

    if (stageMetadata.programStageSections && stageMetadata.programStageSections.length > 0) {
      stageMetadata.programStageSections.forEach((section, index) => {
        const processedSection = {
          id: `section_${index}`,
          displayName: section.name,
          description: null,
          sortOrder: index,
          dataElements: section.dataElements?.map((de, deIndex) => ({
            id: `psde_${de.id}`,
            displayName: de.displayFormName || de.name || `Field ${deIndex + 1}`,
            sortOrder: deIndex,
            compulsory: de.compulsory || false,
            allowProvidedElsewhere: false,
            dataElement: {
              id: de.id,
              displayName: de.displayFormName || de.name || `Field ${deIndex + 1}`,
              shortName: de.name || `field_${deIndex + 1}`,
              valueType: de.valueType || 'TEXT',
              optionSet: de.optionSet
            }
          })) || []
        };
        
        sections.push(processedSection);
      });
    }

    return sections;
  }

  /**
   * Extract all data elements from metadata (flattened list)
   */
  extractAllDataElementsFromMetadata(stageMetadata) {
    const allDataElements = [];

    if (stageMetadata.programStageSections) {
      stageMetadata.programStageSections.forEach(section => {
        if (section.dataElements) {
          section.dataElements.forEach((de, index) => {
            allDataElements.push({
              id: `psde_${de.id}`,
              displayName: de.displayFormName || de.name || `Field ${index + 1}`,
              sortOrder: index,
              compulsory: de.compulsory || false,
              allowProvidedElsewhere: false,
              dataElement: {
                id: de.id,
                displayName: de.displayFormName || de.name || `Field ${index + 1}`,
                shortName: de.name || `field_${index + 1}`,
                valueType: de.valueType || 'TEXT',
                optionSet: de.optionSet
              }
            });
          });
        }
      });
    }

    return allDataElements;
  }



  async submitEvent(eventData) {
    const payload = {
      events: [eventData]
    };

    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async submitEvents(events) {
    const payload = {
      events: events
    };

    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getEvents(params = {}) {
    const queryParams = new URLSearchParams();
    
    queryParams.append('fields', 'event,program,programStage,orgUnit,eventDate,dataValues,status');
    queryParams.append('totalPages', 'true');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });

    return this.request(`/api/events?${queryParams.toString()}`);
  }

  async updateEvent(eventId, eventData) {
    return this.request(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
  }

  async deleteEvent(eventId) {
    return this.request(`/api/events/${eventId}`, {
      method: 'DELETE'
    });
  }

  async checkConnectivity() {
    try {
      const response = await fetch(`${this.baseUrl}/api/system/ping`, {
        method: 'GET',
        headers: { 'Accept': 'text/plain' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get inspection assignments from dataStore
   * Used to create dynamic service dropdown based on facility and inspector
   */
  async getInspectionAssignments(year = '2025') {
    console.log(`📋 Fetching inspection assignments for year: ${year}`);
    console.log(`🌐 Full URL will be: ${this.baseUrl}/api/dataStore/inspection/${year}`);
    try {
      const data = await this.request(`/api/dataStore/inspection/${year}`);
      console.log('✅ Inspection assignments data:', data);
      console.log('📊 Data structure:', {
        hasInspections: !!data.inspections,
        inspectionsCount: data.inspections?.length || 0,
        inspectionsKeys: data.inspections ? Object.keys(data.inspections[0] || {}) : []
      });
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch inspection assignments:', error);
      console.error('📍 Error details:', {
        message: error.message,
        status: error.status,
        url: `/api/dataStore/inspection/${year}`
      });
      return { inspections: [] };
    }
  }

  /**
   * Get service sections for a specific facility and inspector
   * Returns array of section names that should populate the service dropdown
   */
  async getServiceSectionsForInspector(facilityId, inspectorDisplayName) {
    console.log(`🔍 Getting service sections for facility: ${facilityId}, inspector: ${inspectorDisplayName}`);
    
    try {
      let assignmentsData = await this.getInspectionAssignments();
      if (Array.isArray(assignmentsData)) 
        assignmentsData = { inspections: assignmentsData }
      console.log('📊 Processing assignments data:', assignmentsData);
      
      if (!assignmentsData.inspections || assignmentsData.inspections.length === 0) {
        console.warn('⚠️ No inspections found in assignments data');
        return [];
      }

      // Find the facility
      const facilityInspection = assignmentsData.inspections.find(
        inspection => inspection.facilityId === facilityId
      );
      
      if (!facilityInspection) {
        console.warn(`⚠️ No inspection found for facility: ${facilityId}`);
        return [];
      }

      console.log('🏥 Found facility inspection:', facilityInspection);

      // Find assignments for the inspector using displayName, robust match
      const norm = (v) => (v ?? '').toString().trim().toLowerCase();
      const inspectorAssignments = facilityInspection.assignments.filter((assignment) => {
        const aName = norm(assignment.inspectorName);
        const iName = norm(inspectorDisplayName);
        return (
          aName === iName ||
          aName.includes(iName) ||
          iName.includes(aName)
        );
      });

      if (inspectorAssignments.length === 0) {
        console.warn(`⚠️ No assignments found for inspector: ${username} at facility: ${facilityId}`);
        return [];
      }

      console.log('👤 Found inspector assignments:', inspectorAssignments);

      // Collect all sections from all assignments for this inspector
      const allSections = [];
      inspectorAssignments.forEach(assignment => {
        if (assignment.sections && Array.isArray(assignment.sections)) {
          allSections.push(...assignment.sections);
        }
      });

      // Remove duplicates
      const uniqueSections = [...new Set(allSections)];
      
      console.log('📋 Final service sections for dropdown:', uniqueSections);
      return uniqueSections;

    } catch (error) {
      console.error('❌ Failed to get service sections:', error);
      return [];
    }
  }

  validateEventData(eventData, programStageConfiguration) {
    const errors = [];
    
    if (!eventData.program) errors.push('Program is required');
    if (!eventData.programStage) errors.push('Program stage is required');
    if (!eventData.orgUnit) errors.push('Organisation unit is required');
    if (!eventData.eventDate) errors.push('Event date is required');
    
    if (programStageConfiguration && eventData.dataValues) {
      const allDataElements = programStageConfiguration.allDataElements || [];
      
      allDataElements.forEach(psde => {
        const dataElement = psde.dataElement;
        const dataValue = eventData.dataValues.find(dv => dv.dataElement === dataElement.id);
        
        if (psde.compulsory && (!dataValue || !dataValue.value)) {
          errors.push(`${dataElement.displayName} is required`);
        }
        
        if (dataValue && dataValue.value) {
          const validation = validateValue(dataValue.value, dataElement.valueType);
          if (!validation.valid) {
            errors.push(`${dataElement.displayName}: ${validation.message}`);
          }
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  formatEventData(formData, configuration) {
    const eventData = {
      program: configuration.program.id,
      programStage: configuration.programStage.id,
      orgUnit: formData.orgUnit,
      eventDate: formData.eventDate,
      status: 'COMPLETED',
      dataValues: []
    };

    Object.entries(formData).forEach(([key, value]) => {
      if (key.startsWith('dataElement_') && value !== '') {
        const dataElementId = key.replace('dataElement_', '');
        eventData.dataValues.push({
          dataElement: dataElementId,
          value: value.toString()
        });
      }
    });

    return eventData;
  }
}

// Hook for using the API
export function useAPI() {
  const apiRef = useRef(null);

  if (!apiRef.current) {
    apiRef.current = new DHIS2APIService();
  }

  return apiRef.current;
} 