/**
 * Configuration for filtering data elements based on the selected Facility Service Department
 * 
 * Structure:
 * {
 *   'Facility Service Department': {
 *     'Section Name': {
 *       showOnly: ['Keyword1', 'Keyword2'], // Only show elements containing these keywords
 *       hide: ['Keyword3', 'Keyword4']      // Hide elements containing these keywords
 *     }
 *   }
 * }
 * 
 * Notes:
 * - If both 'showOnly' and 'hide' are specified for a section, 'showOnly' takes precedence
 * - If a section is not listed for a facility service, all elements in that section will be shown
 * - Keywords are matched case-insensitive and can be partial matches
 */

// const facilityServiceFilters = {
//   // Gynae Clinics - specialized women's health services
//   'Gynae Clinics': {
//     'ORGANISATION AND MANAGEMENT: Inspection': {
//       showOnly: [
//         'facility',
//         'service',
//         'type',
//         'medication',
//         'complaints',
//         'waste'
//       ]
//     },
//     'SECTION B-STATUTORY REQUIREMENTS': {
//       showOnly: [
//         'permit',
//         'work'
//       ]
//     }
//   },
//
//   // Laboratory - focus on lab-specific elements
//   'laboratory': {
//     'ORGANISATION AND MANAGEMENT: Inspection': {
//       showOnly: [
//         'facility',
//         'service',
//         'type',
//         'laboratory',
//         'quality',
//         'waste'
//       ]
//     }
//   },
//
//   // Default configuration for any facility service not specifically defined
//   'default': {
//     // All sections and elements will be shown by default
//   }
// };


// src/config/facilityServiceFilters.js
export const facilityServiceFilters = async (facilityService) => {
    switch ((facilityService || '').toLowerCase()) {
        case 'gynae clinics':
            return (await import('./gynaeClinics.js')).default;
        case 'laboratory':
            return (await import('./laboratory.js')).default;
        case 'clinic':
            return (await import('./clinic.js')).default;
        default:
            return (await import('./default.js')).default;
    }
};
/**
 * Get the filter configuration for a specific facility service department
 * @param {string} facilityService - The selected facility service department
 * @returns {Object} - The filter configuration for the facility service
 */


export const getFilterConfig = async (facilityService) => {
    return await facilityServiceFilters(facilityService) || facilityServiceFilters['default'];
};

/**
 * Check if a data element should be shown based on the facility service department and section
 * @param {string} dataElementName - The name of the data element
 * @param {string} sectionName - The name of the section containing the data element
 * @param {string} facilityService - The selected facility service department
 * @returns {boolean} - Whether the data element should be shown
 */
export const shouldShowDataElementForService = async (dataElementName, sectionName, facilityService) => {
  if (!dataElementName || !sectionName || !facilityService) return true;
  
  // const filterConfig = getFilterConfig(facilityService);
    const filterConfig = await getFilterConfig(facilityService);

  // If no config for this section, show all elements in this section
  if (!filterConfig[sectionName]) {
    console.log(`📋 No filter for section "${sectionName}" - showing all elements`);
    return true;
  }
  
  const sectionConfig = filterConfig[sectionName];
  const normalizedElementName = dataElementName.toLowerCase();
  
  // Debug log for troubleshooting
  console.log(`🔍 Checking filter for: "${dataElementName}" in section "${sectionName}" for service "${facilityService}"`);
  
  // If showOnly is specified, only show elements that match the keywords
  if (sectionConfig.showOnly && Array.isArray(sectionConfig.showOnly)) {
    const shouldShow = sectionConfig.showOnly.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      const isMatch = normalizedElementName.includes(keywordLower);
      console.log(`  - Keyword "${keyword}": ${isMatch ? 'MATCH' : 'no match'}`);
      return isMatch;
    });
    
    console.log(`  => ${shouldShow ? 'SHOWING' : 'HIDING'} element based on showOnly filter`);
    return shouldShow;
  }
  
  // If hide is specified, hide elements that match the keywords
  if (sectionConfig.hide && Array.isArray(sectionConfig.hide)) {
    const shouldHide = sectionConfig.hide.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      const isMatch = normalizedElementName.includes(keywordLower);
      console.log(`  - Keyword "${keyword}": ${isMatch ? 'MATCH' : 'no match'}`);
      return isMatch;
    });
    
    console.log(`  => ${!shouldHide ? 'SHOWING' : 'HIDING'} element based on hide filter`);
    return !shouldHide;
  }
  
  // Default to showing the element
  console.log(`  => SHOWING element (no matching filters)`);
  return true;
};
