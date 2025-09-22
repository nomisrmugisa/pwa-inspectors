/**
 * Section Visibility Configuration
 * 
 * This file defines which sections should be shown/hidden for each facility type.
 * You can easily customize these rules by modifying the values below.
 * 
 * Structure:
 * - Key: Facility type (must match exactly what's in your CSV or DHIS2)
 * - Value: Object with section names as keys and boolean visibility as values
 * 
 * Example:
 * 'laboratory': {
 *   'SECTION A-ORGANISATION AND MANAGEMENT': true,  // Show this section
 *   'SECTION B-STATUTORY REQUIREMENTS': true,      // Show this section
 *   'SECTION C-POLICIES AND PROCEDURES': false,    // Hide this section
 * }
 */

export const sectionVisibilityConfig = {
  // Hospital - show all sections
  'Hospital': {
    'Document Review': true, 
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Clinic - show all sections
  'Clinic': {
    'Document Review': true, 
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Laboratory - focus on technical and safety sections
  'Laboratory': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Radiology - focus on safety and technical procedures
  'Radiology': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true,
    'X-RAY ROOM': true
  },

  // ENT - focus on specialized procedures
  'ENT': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Dental - focus on infection control and procedures
  'Dental': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Eye - focus on specialized equipment and procedures
  'Eye': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Psycology - focus on patient care and management
  'Psycology': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Physio - focus on treatment protocols and safety
  'Physio': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Rehab - focus on patient care and safety
  'Rehab': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  },

  // Gynae - show specific sections for gynecological facilities
  'Gynae': {
    'Inspection Type': true,
    'Inspectors Details': true,
    'ORGANISATION AND MANAGEMENT': true,
    'SERVICE PROVIDED': true,
    'PERSONNEL': true,
    'ENVIRONMENT': true,
    'RECEPTION AREA': true,
    'SCREENING ROOM': true,
    'CONSULTATION ROOM': true,
    'PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITITES': true,
    'PHARMACY/ DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': true
  }
};

/**
 * Data Element Filtering Configuration
 * 
 * This defines which Data Elements (DEs) should be hidden for each facility type
 * within specific sections. This allows for granular control over individual questions.
 * 
 * Structure:
 * - Key: Facility type
 * - Value: Object with section names as keys and arrays of hidden DE names as values
 * 
 * Example:
 * 'laboratory': {
 *   'SECTION A-ORGANISATION AND MANAGEMENT': ['DE_NAME_1', 'DE_NAME_2'], // Hide these DEs
 *   'SECTION B-STATUTORY REQUIREMENTS': [], // Show all DEs
 * }
 */
export const dataElementFilterConfig = {
  // Hospital - show all DEs
  'Hospital': {
    'ORGANISATION AND MANAGEMENT': [],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // Clinic - show all DEs
  'Clinic': {
    'ORGANISATION AND MANAGEMENT': [],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // Laboratory - hide some non-technical DEs
  'Laboratory': {
    'ORGANISATION AND MANAGEMENT': [
      'Patient care protocols',
      'Patient satisfaction surveys'
    ],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': [
      'Patient communication policies'
    ]
  },

  // Radiology - hide non-radiology specific DEs
  'Radiology': {
    'ORGANISATION AND MANAGEMENT': [
      'Patient care protocols',
      'Counseling procedures'
    ],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // ENT - hide non-ENT specific DEs
  'ENT': {
    'ORGANISATION AND MANAGEMENT': [
      'Dental procedures',
      'Ophthalmology protocols'
    ],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // Dental - hide non-dental specific DEs
  'Dental': {
    'ORGANISATION AND MANAGEMENT': [
      'Ophthalmology procedures',
      'Cardiology protocols'
    ],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // Eye - hide non-ophthalmology specific DEs
  'Eye': {
    'ORGANISATION AND MANAGEMENT': [
      'Dental equipment protocols',
      'Laboratory testing procedures'
    ],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // Psycology - hide technical/equipment specific DEs
  'Psycology': {
    'ORGANISATION AND MANAGEMENT': [
      'Equipment maintenance schedules',
      'Technical safety protocols'
    ],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // Physio - hide non-physio specific DEs
  'Physio': {
    'ORGANISATION AND MANAGEMENT': [
      'Surgical procedures',
      'Anesthesia protocols'
    ],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // Rehab - hide non-rehab specific DEs
  'Rehab': {
    'ORGANISATION AND MANAGEMENT': [
      'Surgical procedures',
      'Emergency protocols'
    ],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  },

  // Gynae - comprehensive inspection, show all DEs
  'Gynae': {
    'ORGANISATION AND MANAGEMENT': [],
    'STATUTORY REQUIREMENTS': [],
    'POLICIES AND PROCEDURES': []
  }
};

/**
 * Helper function to check if a section should be visible
 * @param {string} sectionName - The name of the section to check
 * @param {string} facilityClassification - The facility type/classification
 * @returns {boolean} - Whether the section should be shown
 */
export const shouldShowSection = (sectionName, facilityClassification) => {
  // Always show the inspection type section
  if (sectionName && sectionName.toLowerCase().includes('inspection type')) {
    console.log(`✅ Always showing Inspection Type section`);
    return true;
  }
  
  // Never show pre-inspection sections
  if (sectionName && sectionName.toLowerCase().startsWith('pre-inspection')) {
    console.log(`🚫 Never showing Pre-inspection section: ${sectionName}`);
    return false;
  }
  
  // If no facility classification is set, show only inspection type sections
  if (!facilityClassification) {
    console.log('🔍 No facility classification set - only showing inspection type sections');
    return false;
  }

  // Get the visibility config for this facility type from sectionVisibilityConfig
  // No default fallback - only show sections explicitly configured
  const facilityConfig = sectionVisibilityConfig[facilityClassification] || {};
  
  if (!facilityConfig) {
    console.log(`🔍 No specific config for facility type "${facilityClassification}" - hiding section`);
    return false;
  }

  // Check if this specific section should be shown
  const shouldShow = facilityConfig[sectionName];
  
  if (shouldShow === undefined) {
    // If section not explicitly configured, hide it by default
    console.log(`🔍 Section "${sectionName}" not configured for "${facilityClassification}" - hiding by default`);
    return false;
  }

  console.log(`🔍 Section "${sectionName}" for "${facilityClassification}": ${shouldShow ? 'SHOW' : 'HIDE'}`);
  return shouldShow;
};

/**
 * Helper function to check if a Data Element should be visible
 * @param {string} dataElementName - The name of the Data Element to check
 * @param {string} sectionName - The section containing the Data Element
 * @param {string} facilityClassification - The facility type/classification
 * @returns {boolean} - Whether the Data Element should be shown
 */
export const shouldShowDataElement = (dataElementName, sectionName, facilityClassification) => {
  // Always show all fields in the inspection type section
  if (sectionName && sectionName.toLowerCase().includes('inspection type')) {
    console.log(`✅ Always showing Data Element "${dataElementName}" in Inspection Type section`);
    return true;
  }
  
  // Never show data elements in pre-inspection sections
  if (sectionName && sectionName.toLowerCase().startsWith('pre-inspection')) {
    console.log(`🚫 Never showing Data Element "${dataElementName}" in Pre-inspection section`);
    return false;
  }
  
  // If no facility classification is set, show all Data Elements
  if (!facilityClassification) {
    return true;
  }

  // Get the DE filter config for this facility type
  const facilityDEConfig = dataElementFilterConfig[facilityClassification];
  
  if (!facilityDEConfig) {
    // If no DE config for this facility type, show all DEs
    return true;
  }

  // Get the hidden DEs for this section
  const hiddenDEs = facilityDEConfig[sectionName] || [];
  
  // Check if this specific DE should be hidden
  const shouldHide = hiddenDEs.includes(dataElementName);
  
  if (shouldHide) {
    console.log(`🚫 Hiding Data Element "${dataElementName}" in section "${sectionName}" for facility type "${facilityClassification}"`);
  }
  
  return !shouldHide;
};

/**
 * Get the count of filtered Data Elements for a specific section and facility
 * @param {string} sectionName - The name of the section
 * @param {string} facilityClassification - The facility type/classification
 * @returns {number} - Count of filtered (hidden) Data Elements
 */
export const getFilteredDataElementCount = (sectionName, facilityClassification) => {
  if (!facilityClassification || !dataElementFilterConfig[facilityClassification]) {
    return 0;
  }

  const facilityDEConfig = dataElementFilterConfig[facilityClassification];
  const hiddenDEs = facilityDEConfig[sectionName] || [];
  
  return hiddenDEs.length;
};

/**
 * Get all available facility types from the configuration
 * @returns {string[]} - Array of facility type names
 */
export const getAvailableFacilityTypes = () => {
  return Object.keys(sectionVisibilityConfig);
};

/**
 * Get sections that are visible for a specific facility type
 * @param {string} facilityClassification - The facility type/classification
 * @returns {string[]} - Array of visible section names
 */
export const getVisibleSectionsForFacility = (facilityClassification) => {
  if (!facilityClassification || !sectionVisibilityConfig[facilityClassification]) {
    return [];
  }

  const facilityConfig = sectionVisibilityConfig[facilityClassification];
  return Object.entries(facilityConfig)
    .filter(([sectionName, isVisible]) => isVisible)
    .map(([sectionName]) => sectionName);
};

/**
 * Get sections that are hidden for a specific facility type
 * @param {string} facilityClassification - The facility type/classification
 * @returns {string[]} - Array of hidden section names
 */
export const getHiddenSectionsForFacility = (facilityClassification) => {
  if (!facilityClassification || !sectionVisibilityConfig[facilityClassification]) {
    return [];
  }

  const facilityConfig = sectionVisibilityConfig[facilityClassification];
  return Object.entries(facilityConfig)
    .filter(([sectionName, isVisible]) => !isVisible)
    .map(([sectionName]) => sectionName);
};

/**
 * Get detailed section information including filtered DE counts
 * @param {string} facilityClassification - The facility type/classification
 * @returns {Object} - Object with section details including filtered DE counts
 */
export const getSectionDetailsForFacility = (facilityClassification) => {
  if (!facilityClassification) {
    return {};
  }

  // Check if the facility classification exists in our config
  // If not, use the 'clinic' config as a default (which shows all sections)
  const facilityConfig = sectionVisibilityConfig[facilityClassification] || sectionVisibilityConfig['clinic'] || {};
  const facilityDEConfig = dataElementFilterConfig[facilityClassification] || dataElementFilterConfig['clinic'] || {};
  
  const sectionDetails = {};
  
  // Add null check before calling Object.keys
  if (facilityConfig && typeof facilityConfig === 'object') {
    Object.keys(facilityConfig).forEach(sectionName => {
      const isVisible = facilityConfig[sectionName];
      const filteredDECount = facilityDEConfig[sectionName] ? facilityDEConfig[sectionName].length : 0;
      
      sectionDetails[sectionName] = {
        visible: isVisible,
        filteredDECount: filteredDECount,
        hiddenDEs: facilityDEConfig[sectionName] || []
      };
    });
  }
  
  return sectionDetails;
};

/**
 * Get summary statistics for a facility type
 * @param {string} facilityClassification - The facility type/classification
 * @returns {Object} - Summary statistics including total sections, visible sections, and total filtered DEs
 */
export const getFacilitySummary = (facilityClassification) => {
  if (!facilityClassification) {
    return {
      totalSections: 0,
      visibleSections: 0,
      hiddenSections: 0,
      totalFilteredDEs: 0,
      sectionsWithFilteredDEs: 0
    };
  }

  // Get section details with proper fallback handling
  const sectionDetails = getSectionDetailsForFacility(facilityClassification);
  
  // Ensure sectionDetails is an object before calling Object.keys
  const sectionNames = sectionDetails && typeof sectionDetails === 'object' ? Object.keys(sectionDetails) : [];
  
  const totalSections = sectionNames.length;
  const visibleSections = sectionNames.filter(name => 
    sectionDetails[name] && sectionDetails[name].visible
  ).length;
  const hiddenSections = totalSections - visibleSections;
  
  let totalFilteredDEs = 0;
  let sectionsWithFilteredDEs = 0;
  
  sectionNames.forEach(sectionName => {
    // Add null check before accessing properties
    if (sectionDetails[sectionName] && typeof sectionDetails[sectionName] === 'object') {
      const filteredCount = sectionDetails[sectionName].filteredDECount || 0;
      totalFilteredDEs += filteredCount;
      if (filteredCount > 0) {
        sectionsWithFilteredDEs++;
      }
    }
  });
  
  return {
    totalSections,
    visibleSections,
    hiddenSections,
    totalFilteredDEs,
    sectionsWithFilteredDEs
  };
};

