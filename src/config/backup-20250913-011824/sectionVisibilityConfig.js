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
  // Gynae Clinics - show all sections (comprehensive inspection)
  'Gynae Clinics': {
    'Document Review': true, 
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true, 
    'POLICIES AND PROCEDURES': true
  },

  // Laboratory - focus on technical and safety sections
  'laboratory': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
  },

  // Psychology clinic - focus on patient care and management
  'Psychology clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
  },

  // Eye Clinics - focus on specialized equipment and procedures
  'Eye (opthalmologyoptometry  optician) Clinics': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
  },

  // Physiotherapy - focus on treatment protocols and safety
  'physiotheraphy': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
  },

  // Dental clinic - focus on infection control and procedures
  'dental clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
  },

  // ENT clinic - focus on specialized procedures
  'ENT clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
  },

  // Rehabilitation Centre - focus on patient care and safety
  'Rehabilitation Centre': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
  },

  // Portrait clinic - focus on basic requirements (example of hiding some sections)
  'Potrait clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': false
  },

  // Radiology - focus on safety and technical procedures
  'Radiology': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
  },

  // General clinic - show all sections
  'clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SECTION B-STATUTORY REQUIREMENTS': true,
    'SECTION C-POLICIES AND PROCEDURES': true
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
  // Gynae Clinics - comprehensive inspection, show all DEs
  'Gynae Clinics': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // Laboratory - hide some non-technical DEs
  'laboratory': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Patient care protocols',
      'Patient satisfaction surveys'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': [
      'Patient communication policies'
    ]
  },

  // Psychology clinic - hide technical/equipment specific DEs
  'Psychology clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Equipment maintenance schedules',
      'Technical safety protocols'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // Eye Clinics - hide non-ophthalmology specific DEs
  'Eye (opthalmologyoptometry  optician) Clinics': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Dental equipment protocols',
      'Laboratory testing procedures'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // Physiotherapy - hide non-physio specific DEs
  'physiotheraphy': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Surgical procedures',
      'Anesthesia protocols'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // Dental clinic - hide non-dental specific DEs
  'dental clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Ophthalmology procedures',
      'Cardiology protocols'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // ENT clinic - hide non-ENT specific DEs
  'ENT clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Dental procedures',
      'Ophthalmology protocols'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // Rehabilitation Centre - hide non-rehab specific DEs
  'Rehabilitation Centre': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Surgical procedures',
      'Emergency protocols'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // Portrait clinic - hide SECTION C entirely, plus some DEs from other sections
  'Potrait clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Complex management protocols',
      'Advanced procedures'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [
      'Specialized licensing requirements'
    ],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // Radiology - hide non-radiology specific DEs
  'Radiology': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [
      'Patient care protocols',
      'Counseling procedures'
    ],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
  },

  // General clinic - comprehensive, show all DEs
  'clinic': {
    'SECTION A-ORGANISATION AND MANAGEMENT': [],
    'SECTION B-STATUTORY REQUIREMENTS': [],
    'SECTION C-POLICIES AND PROCEDURES': []
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
  
  // If no facility classification is set, show all sections
  if (!facilityClassification) {
    console.log('🔍 No facility classification set - showing all sections');
    return true;
  }

  // Get the visibility config for this facility type
  // If not found, use the 'clinic' config as default (which shows all sections)
  const facilityConfig = sectionVisibilityConfig[facilityClassification] || sectionVisibilityConfig['clinic'];
  
  if (!facilityConfig) {
    console.log(`🔍 No specific config for facility type "${facilityClassification}" and no default config - showing all sections`);
    return true;
  }

  // Check if this specific section should be shown
  const shouldShow = facilityConfig[sectionName];
  
  if (shouldShow === undefined) {
    // If section not explicitly configured, show it by default
    console.log(`🔍 Section "${sectionName}" not configured for "${facilityClassification}" - showing by default`);
    return true;
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

