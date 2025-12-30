import { ALL_FACILITY_DEPARTMENTS } from './facilityServiceDepartments';

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

export const CANONICAL_FACILITY_TYPES = [
  'Obstetrics & Gynaecology',
  'Laboratory',
  'Psychology',
  'Eye (Opthalmology /Optometry)',
  'Physiotherapy',
  'Dental',
  'Dental Laboratory',
  'Ear, Nose & Throat',
  'Rehabilitation Centre',
  'Radiology',
  'General Practice',
  'Paediatric',
  'Nursing  Home',
  'Emergency Medical Services'
];

// Map a variety of legacy / DHIS2 / CSV labels to canonical facility types
const LEGACY_TO_CANONICAL = {
  'Hospital': 'General Practice',
  'hospital': 'General Practice',
  'Clinic': 'General Practice',
  'clinic': 'General Practice',
  'Gynae Clinics': 'Obstetrics & Gynaecology',
  'Gynae': 'Obstetrics & Gynaecology',
  'Obstetrics & Gynaecology': 'Obstetrics & Gynaecology',
  'Obstetrics & Gynaecology ': 'Obstetrics & Gynaecology',
  'Laboratory': 'Laboratory',
  'laboratory': 'Laboratory',
  'Psychology': 'Psychology',
  'Psychology ': 'Psychology',
  'Psycology': 'Psychology',
  'Psychology clinic': 'Psychology',
  'Eye': 'Eye (Opthalmology /Optometry)',
  'Eye (Opthalmology /Optometry)': 'Eye (Opthalmology /Optometry)',
  'Eye (Opthalmology /Optometry) ': 'Eye (Opthalmology /Optometry)',
  'Eye (opthalmologyoptometry  optician) Clinics': 'Eye (Opthalmology /Optometry)',
  'Physiotherapy': 'Physiotherapy',
  'Physiotheraphy': 'Physiotherapy',
  'Physio': 'Physiotherapy',
  'physiotheraphy': 'Physiotherapy',
  'Dental': 'Dental',
  'Dental ': 'Dental',
  'Dental clinic': 'Dental',
  'dental clinic': 'Dental',
  'Dental Laboratory': 'Dental Laboratory',
  'ENT': 'Ear, Nose & Throat',
  'ENT clinic': 'Ear, Nose & Throat',
  'Ear, Nose & Throat': 'Ear, Nose & Throat',
  'Rehab': 'Rehabilitation Centre',
  'Rehabilitation Centre': 'Rehabilitation Centre',
  'Radiology': 'Radiology',
  'Paediatric': 'Paediatric',
  'Nursing Home': 'Nursing  Home',
  'Nursing  Home': 'Nursing  Home',
  'Emergency Medical Services': 'Emergency Medical Services',
  'Potrait clinic': 'General Practice'
};



export const normalizeFacilityClassification = (raw) => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  // Exact canonical match
  if (CANONICAL_FACILITY_TYPES.includes(trimmed)) {
    return trimmed;
  }
  // Legacy mapping
  if (LEGACY_TO_CANONICAL[trimmed]) {
    return LEGACY_TO_CANONICAL[trimmed];
  }
  // Case-insensitive canonical match
  const lower = trimmed.toLowerCase();
  const canonicalMatch = CANONICAL_FACILITY_TYPES.find(
    (type) => type.toLowerCase() === lower
  );
  if (canonicalMatch) {
    return canonicalMatch;
  }
  // Fallback to trimmed value
  return trimmed;
};


const legacySectionVisibilityConfig = {
  // Hospital - show all sections
  'Hospital': {
    'Document Review': true,
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Clinic - show all sections
  'Clinic': {
    'Document Review': true,
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Laboratory - focus on technical and safety sections
  'Laboratory': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Radiology - focus on safety and technical procedures
  'Radiology': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false,
    'X-RAY ROOM': true
  },

  // ENT - focus on specialized procedures
  'ENT': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Dental - focus on infection control and procedures
  'Dental': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Eye - focus on specialized equipment and procedures
  'Eye': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Psycology - focus on patient care and management
  'Psycology': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Physio - focus on treatment protocols and safety
  'Physio': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Rehab - focus on patient care and safety
  'Rehab': {
    'ORGANISATION AND MANAGEMENT': true,
    'STATUTORY REQUIREMENTS': true,
    'POLICIES AND PROCEDURES': true,
    'Inspection Type': true,
    'Inspectors Details': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Gynae - show specific sections for gynecological facilities
  'Gynae': {
    'Inspection Type': true,
    'Inspectors Details': true,
    'ORGANISATION AND MANAGEMENT': true,
    'SERVICES PROVIDED': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-RECEPTION/WAITING AREA': true,
    'FACILITY-SCREENING ROOM': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-PROCEDURE ROOM': true,
    'BLEEDING ROOM': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'PHARMACY/DISPENSARY': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'RECORDS/ INFORMATION MANAGEMENT': true,
    'CUSTOMER SATISFACTION': false
  },

  // Emergency Medical Services - includes call centre operations
  'EMS': {
    'Inspection Type': true,
    'Inspectors Details': true,
    'SECTION A-ORGANISATION AND MANAGEMENT': true,
    'SERVICES PROVIDED': true,
    'PERSONNEL': true,
    'FACILITY-ENVIRONMENT': true,
    'FACILITY-CONSULTATION/ TREATMENT ROOM': true,
    'FACILITY-CALL CENTRE': true,
    'SLUICE ROOM': true,
    'TOILET FACILITIES': true,
    'SAFETY AND WASTE MANAGEMENT': true,
    'SUPPLIES': true,
    'CUSTOMER SATISFACTION': true,
    'INSTRUMENT WASHING/STERILISING ROOM': true
  }
};

export const sectionVisibilityConfig = {
  ...legacySectionVisibilityConfig,

  // Canonical CSV facility types mapped to legacy configs
  'Obstetrics & Gynaecology': legacySectionVisibilityConfig['Gynae'],
  'Laboratory': legacySectionVisibilityConfig['Laboratory'],
  'Psychology': legacySectionVisibilityConfig['Psycology'],
  'Eye (Opthalmology /Optometry)': legacySectionVisibilityConfig['Eye'],
  'Physiotheraphy': legacySectionVisibilityConfig['Physio'],
  'Dental': legacySectionVisibilityConfig['Dental'],
  'Dental Laboratory': legacySectionVisibilityConfig['Dental'],
  'Ear, Nose & Throat': legacySectionVisibilityConfig['ENT'],
  'Rehabilitation Centre': legacySectionVisibilityConfig['Rehab'],
  'Radiology': legacySectionVisibilityConfig['Radiology'],
  'General Practice': legacySectionVisibilityConfig['Clinic'],
  'Paediatric': legacySectionVisibilityConfig['Clinic'],
  'Nursing  Home': legacySectionVisibilityConfig['Clinic'],
  'Emergency Medical Services': legacySectionVisibilityConfig['EMS']
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
const legacyDataElementFilterConfig = {
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
    'FACILITY-ENVIRONMENT': [],
    'FACILITY-RECEPTION/WAITING AREA': [],
    'FACILITY-SCREENING ROOM': [],
    'FACILITY-CONSULTATION/ TREATMENT ROOM': [],
    'FACILITY-PROCEDURE ROOM': [],
    'BLEEDING ROOM': [],
    'SLUICE ROOM': [],
    'TOILET FACILITIES': [],
    'PHARMACY/DISPENSARY': [],
    'SAFETY AND WASTE MANAGEMENT': [],
    'SUPPLIES': [],
    'RECORDS/ INFORMATION MANAGEMENT': [],
    'CUSTOMER SATISFACTION': []
  },

  // Psycology - hide technical/equipment specific DEs
  'Psycology': {
    'ORGANISATION AND MANAGEMENT': [
      'Equipment maintenance schedules',
      'Technical safety protocols'
    ],
    'STATUTORY REQUIREMENTS': [],
    'FACILITY-ENVIRONMENT': [],
    'FACILITY-RECEPTION/WAITING AREA': [],
    'FACILITY-SCREENING ROOM': [],
    'FACILITY-CONSULTATION/ TREATMENT ROOM': [],
    'FACILITY-PROCEDURE ROOM': [],
    'BLEEDING ROOM': [],
    'SLUICE ROOM': [],
    'TOILET FACILITIES': [],
    'PHARMACY/DISPENSARY': [],
    'SAFETY AND WASTE MANAGEMENT': [],
    'SUPPLIES': [],
    'RECORDS/ INFORMATION MANAGEMENT': [],
    'CUSTOMER SATISFACTION': []
  },

  // Physio - hide non-physio specific DEs
  'Physio': {
    'ORGANISATION AND MANAGEMENT': [
      'Surgical procedures',
      'Anesthesia protocols'
    ],
    'STATUTORY REQUIREMENTS': [],
    'FACILITY-ENVIRONMENT': [],
    'FACILITY-RECEPTION/WAITING AREA': [],
    'FACILITY-SCREENING ROOM': [],
    'FACILITY-CONSULTATION/ TREATMENT ROOM': [],
    'FACILITY-PROCEDURE ROOM': [],
    'BLEEDING ROOM': [],
    'SLUICE ROOM': [],
    'TOILET FACILITIES': [],
    'PHARMACY/DISPENSARY': [],
    'SAFETY AND WASTE MANAGEMENT': [],
    'SUPPLIES': [],
    'RECORDS/ INFORMATION MANAGEMENT': [],
    'CUSTOMER SATISFACTION': []
  },

  // Rehab - hide non-rehab specific DEs
  'Rehab': {
    'ORGANISATION AND MANAGEMENT': [
      'Surgical procedures',
      'Emergency protocols'
    ],
    'STATUTORY REQUIREMENTS': [],
    'FACILITY-ENVIRONMENT': [],
    'FACILITY-RECEPTION/WAITING AREA': [],
    'FACILITY-SCREENING ROOM': [],
    'FACILITY-CONSULTATION/ TREATMENT ROOM': [],
    'FACILITY-PROCEDURE ROOM': [],
    'BLEEDING ROOM': [],
    'SLUICE ROOM': [],
    'TOILET FACILITIES': [],
    'PHARMACY/DISPENSARY': [],
    'SAFETY AND WASTE MANAGEMENT': [],
    'SUPPLIES': [],
    'RECORDS/ INFORMATION MANAGEMENT': [],
    'CUSTOMER SATISFACTION': []
  },

  // Gynae - comprehensive inspection, show all DEs
  'Gynae': {
    'ORGANISATION AND MANAGEMENT': [],
    'STATUTORY REQUIREMENTS': [],
    'FACILITY-ENVIRONMENT': [],
    'FACILITY-RECEPTION/WAITING AREA': [],
    'FACILITY-SCREENING ROOM': [],
    'FACILITY-CONSULTATION/ TREATMENT ROOM': [],
    'FACILITY-PROCEDURE ROOM': [],
    'BLEEDING ROOM': [],
    'SLUICE ROOM': [],
    'TOILET FACILITIES': [],
    'PHARMACY/DISPENSARY': [],
    'SAFETY AND WASTE MANAGEMENT': [],
    'SUPPLIES': [],
    'RECORDS/ INFORMATION MANAGEMENT': [],
    'CUSTOMER SATISFACTION': []
  }
};

export const dataElementFilterConfig = {
  ...legacyDataElementFilterConfig,

  // Canonical CSV facility types mapped to legacy DE filter configs
  'Obstetrics & Gynaecology': legacyDataElementFilterConfig['Gynae'],
  'Laboratory': legacyDataElementFilterConfig['Laboratory'],
  'Psychology': legacyDataElementFilterConfig['Psycology'],
  'Eye (Opthalmology /Optometry)': legacyDataElementFilterConfig['Eye'],
  'Physiotheraphy': legacyDataElementFilterConfig['Physio'],
  'Dental': legacyDataElementFilterConfig['Dental'],
  'Dental Laboratory': legacyDataElementFilterConfig['Dental'],
  'Ear, Nose & Throat': legacyDataElementFilterConfig['ENT'],
  'Rehabilitation Centre': legacyDataElementFilterConfig['Rehab'],
  'Radiology': legacyDataElementFilterConfig['Radiology'],
  'General Practice': legacyDataElementFilterConfig['Clinic'],
  'Paediatric': legacyDataElementFilterConfig['Clinic'],
  'Nursing  Home': legacyDataElementFilterConfig['Clinic'],
  'Emergency Medical Services': legacyDataElementFilterConfig['Clinic']
};


/**
 * Helper function to check if a section should be visible
 * @param {string} sectionName - The name of the section to check
 * @param {string} facilityClassification - The facility type/classification
 * @returns {boolean} - Whether the section should be shown
 */
export const shouldShowSection = (sectionName, facilityClassification) => {
  // Normalize section name once
  const rawSectionName = (sectionName || '').trim();
  const sectionNameUpper = rawSectionName.toUpperCase();

  // Always show the inspection type section
  if (rawSectionName && rawSectionName.toLowerCase().includes('inspection type')) {
    console.log(`✅ Always showing Inspection Type section`);
    return true;
  }

  // Never show pre-inspection sections
  if (rawSectionName && rawSectionName.toLowerCase().startsWith('pre-inspection')) {
    console.log(`🚫 Never showing Pre-inspection section: ${sectionName}`);
    return false;
  }

  // If no facility classification is set, show only inspection type sections
  if (!facilityClassification) {
    console.log('🔍 No facility classification set - only showing inspection type sections');
    return false;
  }

  const normalizedClassification = normalizeFacilityClassification(facilityClassification);

  // Get the visibility config for this facility type from sectionVisibilityConfig
  // No default fallback - only show sections explicitly configured
  const facilityConfig = normalizedClassification
    ? sectionVisibilityConfig[normalizedClassification]
    : null;

  if (!facilityConfig) {
    console.log(
      `🔍 No specific config for facility type "${facilityClassification}" (normalized: "${normalizedClassification}") - hiding section`
    );
    return false;
  }

  // First, try direct lookup
  let shouldShow = facilityConfig[rawSectionName];

  // 1. Check if the section matches any of our dynamic CSV departments
  // This ensures that any section added to the CSV is automatically visible
  // without needing manual updates to this file or the whitelist.
  const isDynamicCsvSection = ALL_FACILITY_DEPARTMENTS.some(dept =>
    rawSectionName.toUpperCase().includes(dept.toUpperCase()) ||
    dept.toUpperCase().includes(rawSectionName.toUpperCase())
  );

  if (isDynamicCsvSection) {
    console.log(
      `✅ Section "${sectionName}" matches a dynamic CSV department - defaulting to SHOW`
    );
    return true;
  }

  // 2. CSV-driven sections that should default to visible even if legacy config doesn't know them.
  // We keep this as a backup manual whitelist.
  const CSV_ALWAYS_VISIBLE_SECTION_TOKENS = [
    'SERVICES PROVIDED',
    'PERSONNEL',
    'HIV SCREENING',
    'TENS',
    'SPECIMEN RECEPTION',
    'LABORATORY TESTING',
    'MICROBIOLOGY'
  ];

  if (shouldShow === undefined) {
    const upper = sectionNameUpper;
    const isCsvDrivenMatch = CSV_ALWAYS_VISIBLE_SECTION_TOKENS.some((token) =>
      upper.includes(token)
    );

    if (isCsvDrivenMatch) {
      console.log(
        `✅ Section "${sectionName}" is a CSV-driven section (matched via token) without explicit legacy config - defaulting to SHOW`
      );
      return true;
    }

    // If section not explicitly configured and not in our CSV override list, hide it by default
    console.log(
      `🔍 Section "${sectionName}" not configured for "${normalizedClassification}" and not in CSV override list - hiding by default`
    );
    return false;
  }

  console.log(
    `🔍 Section "${sectionName}" for "${normalizedClassification}": ${shouldShow ? 'SHOW' : 'HIDE'}`
  );
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

  const normalizedClassification = normalizeFacilityClassification(facilityClassification);

  // Get the DE filter config for this facility type
  const facilityDEConfig = normalizedClassification
    ? dataElementFilterConfig[normalizedClassification]
    : null;

  if (!facilityDEConfig) {
    // If no DE config for this facility type, show all DEs
    return true;
  }

  // Get the hidden DEs for this section
  const hiddenDEs = facilityDEConfig[sectionName] || [];

  // Check if this specific DE should be hidden
  const shouldHide = hiddenDEs.includes(dataElementName);

  if (shouldHide) {
    console.log(
      `🚫 Hiding Data Element "${dataElementName}" in section "${sectionName}" for facility type "${normalizedClassification}"`
    );
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
  const normalizedClassification = normalizeFacilityClassification(facilityClassification);

  if (!normalizedClassification || !dataElementFilterConfig[normalizedClassification]) {
    return 0;
  }

  const facilityDEConfig = dataElementFilterConfig[normalizedClassification];
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
  const normalizedClassification = normalizeFacilityClassification(facilityClassification);

  if (!normalizedClassification || !sectionVisibilityConfig[normalizedClassification]) {
    return [];
  }

  const facilityConfig = sectionVisibilityConfig[normalizedClassification];
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
  const normalizedClassification = normalizeFacilityClassification(facilityClassification);

  if (!normalizedClassification || !sectionVisibilityConfig[normalizedClassification]) {
    return [];
  }

  const facilityConfig = sectionVisibilityConfig[normalizedClassification];
  return Object.entries(facilityConfig)
    .filter(([, isVisible]) => !isVisible)
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

  const normalizedClassification =
    normalizeFacilityClassification(facilityClassification) || 'General Practice';

  // Check if the facility classification exists in our config
  // If not, use the 'General Practice' config as a default (which shows all sections)
  const facilityConfig =
    sectionVisibilityConfig[normalizedClassification] ||
    sectionVisibilityConfig['General Practice'] ||
    {};
  const facilityDEConfig =
    dataElementFilterConfig[normalizedClassification] ||
    dataElementFilterConfig['General Practice'] ||
    {};

  const sectionDetails = {};

  // Add null check before calling Object.keys
  if (facilityConfig && typeof facilityConfig === 'object') {
    Object.keys(facilityConfig).forEach((sectionName) => {
      const isVisible = facilityConfig[sectionName];
      const filteredDECount = facilityDEConfig[sectionName]
        ? facilityDEConfig[sectionName].length
        : 0;

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

