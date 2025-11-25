

// DHIS2 API validation functions
function validateValue(value, valueType, compulsory = false) {
  // All fields are now optional
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

    // Global request deduplication cache
    this._requestCache = new Map();
    this._pendingRequests = new Map();
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
    const method = options.method || 'GET';
    const requestKey = `${method}:${url}`;

    // For GET requests, implement deduplication
    if (method === 'GET') {
      const now = Date.now();
      const CACHE_DURATION = 5000; // 5 seconds

      // Check if we have a cached response
      if (this._requestCache.has(requestKey)) {
        const cached = this._requestCache.get(requestKey);
        if ((now - cached.timestamp) < CACHE_DURATION) {
          console.log(`🚀 Using cached response for: ${endpoint}`);
          return cached.data;
        }
      }

      // Check if there's already a pending request for this endpoint
      if (this._pendingRequests.has(requestKey)) {
        console.log(`⏳ Waiting for pending request: ${endpoint}`);
        return await this._pendingRequests.get(requestKey);
      }
    }

    const config = {
      headers: this.headers,
      ...options
    };

    // Create the request promise
    const requestPromise = (async () => {
      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // Cache GET responses
        if (method === 'GET') {
          this._requestCache.set(requestKey, {
            data: data,
            timestamp: Date.now()
          });
        }

        return data;
      } catch (error) {
        console.error('API Request failed:', error);
        throw error;
      } finally {
        // Remove from pending requests
        if (method === 'GET') {
          this._pendingRequests.delete(requestKey);
        }
      }
    })();

    // Store pending request for GET requests
    if (method === 'GET') {
      this._pendingRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
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
      'programStages[id,displayName,description,sortOrder,repeatable,generatedByEnrollmentDate,minDaysFromStart,programStageSections[id,displayName,sortOrder,programStageDataElements[id,displayName,sortOrder,compulsory,allowProvidedElsewhere,dataElement[id,displayName,shortName,code,description,valueType,aggregationType,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]],programStageDataElements[id,displayName,sortOrder,repeatable,generatedByEnrollmentDate,minDaysFromStart,programStageSections[id,displayName,sortOrder,programStageDataElements[id,displayName,sortOrder,compulsory,allowProvidedElsewhere,dataElement[id,displayName,shortName,code,description,valueType,aggregationType,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]]]'
    ].join(',');
    
    return this.request(`/api/programs?fields=${fields}&filter=programType:eq:WITHOUT_REGISTRATION&paging=false`);
  }





  async getOrganisationUnits() {
    return this.request('/api/organisationUnits?fields=id,displayName,level,path,parent[id,displayName]&paging=false');
  }

  /**
   * Get Data Elements from DHIS2 for CSV filtering
   * This will be used to filter which Data Elements to show based on CSV template
   */
  async getDataElements(options = {}) {
    const fields = [
      'id',
      'displayName',
      'shortName',
      'name',
      'valueType',
      'compulsory',
      'optionSet[id,displayName,options[id,displayName,code,sortOrder]]',
      'formName',
      'categoryCombo[id,displayName]',
      'description'
    ].join(',');

    const params = new URLSearchParams({
      fields,
      paging: 'false',
      ...options
    });

    console.log(' Fetching DHIS2 Data Elements for CSV filtering...');
    const response = await this.request(`/api/dataElements?${params}`);
    console.log(`✅ Fetched ${response.dataElements?.length || 0} Data Elements from DHIS2`);
    
    return response.dataElements || [];
  }

  /**
   * Search Data Elements by text for better CSV matching
   */
  async searchDataElements(searchTerm, options = {}) {
    const params = new URLSearchParams({
      query: searchTerm,
      fields: 'id,displayName,shortName,valueType',
      paging: 'false',
      ...options
    });

    return this.request(`/api/dataElements?${params}`);
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
      
      // IMMEDIATELY try to get service sections for this user (using username priority)
      console.log('🔍 TESTING: Attempting to get service sections for user:', me.username);
      if (transformedOrgUnits.length > 0) {
        const firstFacility = transformedOrgUnits[0];
        console.log(`🏢 TESTING: Getting service sections for facility: ${firstFacility.id} (${firstFacility.displayName}), user: ${me.username} (username priority)`);
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
      
      console.log('🏗️ Raw stage metadata received:', {
        name: stageMetadata.name || stageMetadata.displayName,
        hasSections: !!stageMetadata.programStageSections?.length,
        hasStageDataElements: !!stageMetadata.programStageDataElements?.length,
        sectionsCount: stageMetadata.programStageSections?.length || 0,
        stageDataElementsCount: stageMetadata.programStageDataElements?.length || 0
      });

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
        programId: configuration.program.id,
        programType: configuration.program.programType,
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
    console.log(`🔍 Fetching comprehensive metadata for program stage: ${stageId}`);
    
    // Enhanced fields to get ALL possible Data Elements from the stage
    const fields = [
      'id',
      'name',
      'displayName',
      'description',
      'sortOrder',
      'repeatable',
      // Get Data Elements from program stage sections
      'programStageSections[id,name,displayName,sortOrder,dataElements[id,formName,displayFormName,name,displayName,shortName,code,description,valueType,compulsory,allowProvidedElsewhere,lastUpdated,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]',
      // Get Data Elements directly from program stage
      'programStageDataElements[id,displayName,sortOrder,compulsory,allowProvidedElsewhere,dataElement[id,formName,displayFormName,name,displayName,shortName,code,description,valueType,aggregationType,lastUpdated,optionSet[id,displayName,options[id,displayName,code,sortOrder]]]]'
    ].join(',');
    
    const metadata = await this.request(`/api/programStages/${stageId}?fields=${fields}`);
    
    console.log(`✅ Stage metadata fetched for ${stageId}:`, {
      name: metadata.name || metadata.displayName,
      hasSections: !!metadata.programStageSections?.length,
      hasStageDataElements: !!metadata.programStageDataElements?.length,
      sectionsCount: metadata.programStageSections?.length || 0,
      stageDataElementsCount: metadata.programStageDataElements?.length || 0
    });
    
    return metadata;
  }



  /**
   * Process the stage metadata into sections format
   */
  processStageMetadataIntoSections(stageMetadata) {
    const sections = [];

    console.log('🔍 Processing stage metadata into sections...');

    if (stageMetadata.programStageSections && stageMetadata.programStageSections.length > 0) {
      console.log(`📋 Found ${stageMetadata.programStageSections.length} program stage sections`);
      
      stageMetadata.programStageSections.forEach((section, index) => {
        // First, collect all data elements with their metadata
        let dataElementsWithMetadata = section.dataElements?.map((de, deIndex) => ({
          id: `psde_${de.id}`,
          // Prioritize formName for CSV matching, then displayFormName, then name
          displayName: de.formName || de.displayFormName || de.name || `Field ${deIndex + 1}`,
          sortOrder: deIndex,
          compulsory: de.compulsory || false,
          allowProvidedElsewhere: false,
          lastUpdated: de.lastUpdated,
          dataElement: {
            id: de.id,
            // Prioritize formName for CSV matching, then displayFormName, then name
            displayName: de.formName || de.displayFormName || de.name || `Field ${deIndex + 1}`,
            shortName: de.name || `field_${deIndex + 1}`,
            valueType: de.valueType || 'TEXT',
            optionSet: de.optionSet,
            lastUpdated: de.lastUpdated
          }
        })) || [];

        // Handle duplicates: keep only the most recently updated data element for each displayName
        const nameToElementMap = new Map();
        dataElementsWithMetadata.forEach(element => {
          const name = element.displayName;
          const existing = nameToElementMap.get(name);

          if (!existing) {
            // First occurrence of this name
            nameToElementMap.set(name, element);
          } else {
            // Duplicate found - keep the one with the latest lastUpdated date
            const existingDate = existing.lastUpdated ? new Date(existing.lastUpdated) : new Date(0);
            const currentDate = element.lastUpdated ? new Date(element.lastUpdated) : new Date(0);

            if (currentDate > existingDate) {
              console.log(`  🔄 Duplicate found: "${name}" - keeping newer version (${element.dataElement.id} updated ${element.lastUpdated})`);
              nameToElementMap.set(name, element);
            } else {
              console.log(`  🔄 Duplicate found: "${name}" - keeping existing version (${existing.dataElement.id} updated ${existing.lastUpdated})`);
            }
          }
        });

        // Convert map back to array, preserving original sort order where possible
        const deduplicatedElements = Array.from(nameToElementMap.values())
          .sort((a, b) => a.sortOrder - b.sortOrder);

        const processedSection = {
          id: `section_${index}`,
          displayName: section.name || section.displayName,
          description: null,
          sortOrder: section.sortOrder || index,
          dataElements: deduplicatedElements
        };
        
        console.log(`  📂 Section ${index + 1}: "${processedSection.displayName}" with ${processedSection.dataElements.length} Data Elements`);
        
        sections.push(processedSection);
      });
    } else {
      console.log('📋 No program stage sections found in metadata');
    }

    console.log(`✅ Processed ${sections.length} sections from stage metadata`);
    return sections;
  }

  /**
   * Extract all data elements from metadata (flattened list)
   */
  extractAllDataElementsFromMetadata(stageMetadata) {
    const allDataElements = [];
    let sectionElementsCount = 0;
    let stageElementsCount = 0;

    console.log('🔍 Extracting Data Elements from stage metadata...');

    // Extract Data Elements from program stage sections (if any)
    if (stageMetadata.programStageSections && stageMetadata.programStageSections.length > 0) {
      console.log(`📋 Processing ${stageMetadata.programStageSections.length} program stage sections...`);
      
      stageMetadata.programStageSections.forEach((section, sectionIndex) => {
        console.log(`  📂 Section ${sectionIndex + 1}: "${section.name || section.displayName}"`);
        
        if (section.dataElements && section.dataElements.length > 0) {
          console.log(`    📝 Found ${section.dataElements.length} Data Elements in section`);
          
          section.dataElements.forEach((de, deIndex) => {
            const element = {
              id: `psde_${de.id}`,
              // Prioritize formName for CSV matching, then displayFormName, then name
              displayName: de.formName || de.displayFormName || de.name || `Field ${deIndex + 1}`,
              sortOrder: allDataElements.length,
              compulsory: de.compulsory || false,
              allowProvidedElsewhere: false,
              sectionName: section.name || section.displayName,
              sectionIndex: sectionIndex,
              lastUpdated: de.lastUpdated,
              dataElement: {
                id: de.id,
                // Prioritize formName for CSV matching, then displayFormName, then name
                displayName: de.formName || de.displayFormName || de.name || `Field ${deIndex + 1}`,
                shortName: de.name || `field_${deIndex + 1}`,
                valueType: de.valueType || 'TEXT',
                optionSet: de.optionSet,
                lastUpdated: de.lastUpdated
              }
            };

            allDataElements.push(element);
            sectionElementsCount++;

            console.log(`      ✅ Added: ${element.displayName} (${de.valueType || 'UNKNOWN'})`);
          });
        } else {
          console.log(`    ⚠️ No Data Elements found in section "${section.name || section.displayName}"`);
        }
      });
    } else {
      console.log('📋 No program stage sections found');
    }

    // Extract Data Elements directly from program stage (if no sections or additional elements)
    if (stageMetadata.programStageDataElements && stageMetadata.programStageDataElements.length > 0) {
      console.log(`📝 Processing ${stageMetadata.programStageDataElements.length} direct program stage Data Elements...`);
      
      stageMetadata.programStageDataElements.forEach((psde, index) => {
        // programStageDataElements wraps the actual dataElement
        const de = psde.dataElement || psde;

        // Check if this element is already included from sections
        const existingElement = allDataElements.find(elem => elem.dataElement.id === de.id);
        if (!existingElement) {
          const element = {
            id: `psde_${de.id}`,
            // Prioritize formName for CSV matching, then displayFormName, then displayName, then name
            displayName: de.formName || de.displayFormName || de.displayName || de.name || `Field ${index + 1}`,
            sortOrder: allDataElements.length,
            compulsory: psde.compulsory || de.compulsory || false,
            allowProvidedElsewhere: psde.allowProvidedElsewhere || de.allowProvidedElsewhere || false,
            sectionName: 'Direct Stage Assignment',
            sectionIndex: -1,
            lastUpdated: de.lastUpdated,
            dataElement: {
              id: de.id,
              // Prioritize formName for CSV matching, then displayFormName, then displayName, then name
              displayName: de.formName || de.displayFormName || de.displayName || de.name || `Field ${index + 1}`,
              shortName: de.name || `field_${index + 1}`,
              valueType: de.valueType || 'TEXT',
              optionSet: de.optionSet,
              lastUpdated: de.lastUpdated
            }
          };
          
          allDataElements.push(element);
          stageElementsCount++;
          
          console.log(`  ✅ Added direct stage element: ${element.displayName} (${de.valueType || 'UNKNOWN'})`);
        } else {
          console.log(`  ⚠️ Skipped duplicate: ${de.displayName || de.name} (already in sections)`);
        }
      });
    } else {
      console.log('📝 No direct program stage Data Elements found');
    }

    console.log(`📊 Data Element extraction summary:`, {
      fromSections: sectionElementsCount,
      fromStage: stageElementsCount,
      total: allDataElements.length,
      sectionsProcessed: stageMetadata.programStageSections?.length || 0
    });

    // If no Data Elements found, log a warning
    if (allDataElements.length === 0) {
      console.warn('⚠️ No Data Elements found in program stage metadata. This might indicate:');
      console.warn('   - Program stage has no Data Elements assigned');
      console.warn('   - Data Elements are assigned at program level, not stage level');
      console.warn('   - Permission issues accessing the data');
      console.warn('   - Program stage ID might be incorrect');
      console.warn('   - API endpoint might not have the right permissions');
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
  async getInspectionAssignments(year = new Date().getFullYear()) {
    const endpoint = `/api/dataStore/inspection/${year}`;
    try {
      const data = await this.request(endpoint);
      return data || [];
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`No inspection assignments found for year ${year}`);
        return [];
      }
      throw error;
    }
  }

  /**
   * Get service sections for a specific facility and inspector
   * Returns array of section names that should populate the service dropdown
   * Uses username for inspector lookup (prioritized over displayName)
   */
  async getServiceSectionsForInspector(facilityId, inspectorIdentifier) {
    console.log(`🔍 Getting service sections for facility: ${facilityId}, inspector: ${inspectorIdentifier} (username priority)`);
    
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

      // Find assignments for the inspector using username (prioritized) or displayName, robust match
      const norm = (v) => (v ?? '').toString().trim().toLowerCase();
      const inspectorAssignments = facilityInspection.assignments.filter((assignment) => {
        const aName = norm(assignment.inspectorName);
        const iName = norm(inspectorIdentifier);
        return (
          aName === iName ||
          aName.includes(iName) ||
          iName.includes(aName)
        );
      });

      if (inspectorAssignments.length === 0) {
        console.warn(`⚠️ No assignments found for inspector: ${inspectorIdentifier} at facility: ${facilityId}`);
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
    
    // All fields are now optional, so no validation is needed
    // You can add custom validation logic here if needed in the future
    
    return {
      valid: true,
      errors: []
    };
  }

  formatEventData(formData, configuration, eventId = null) {
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

    // Always ensure we have a proper DHIS2 event ID
    const finalEventId = eventId || generateDHIS2Id();
    console.log('🆔 Event ID for formatEventData:', finalEventId, eventId ? '(provided)' : '(generated)');

    const eventData = {
      event: finalEventId,
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

// Export a singleton instance for direct use
export const apiService = new DHIS2APIService();

// Hook for using the API (for components that need it)
export function useAPI() {
  return apiService;
} 