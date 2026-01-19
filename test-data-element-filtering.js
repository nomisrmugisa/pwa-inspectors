/**
 * Test Script for Data Element Filtering System
 * 
 * This script demonstrates how the Data Element filtering system works
 * with different facility types, showing the count of filtered DEs per section.
 */

// Import the configuration (you'll need to run this in the project directory)
const { 
  shouldShowSection, 
  shouldShowDataElement, 
  getFilteredDataElementCount, 
  getSectionDetailsForFacility, 
  getFacilitySummary,
  getAvailableFacilityTypes 
} = require('./src/config/sectionVisibilityConfig.js');

// Test data - different facility types
const testFacilities = [
  'Gynae Clinics',
  'laboratory', 
  'Psychology clinic',
  'Potrait clinic' // This one has SECTION C hidden + filtered DEs
];

// Test sections
const testSections = [
  'SECTION A-ORGANISATION AND MANAGEMENT',
  'SECTION B-STATUTORY REQUIREMENTS',
  'SECTION C-POLICIES AND PROCEDURES'
];

console.log('🏥 Testing Data Element Filtering System\n');

// Test 1: Show all available facility types
console.log('📋 Available Facility Types:');
getAvailableFacilityTypes().forEach((type, index) => {
  console.log(`  ${index + 1}. ${type}`);
});

console.log('\n' + '='.repeat(100) + '\n');

// Test 2: Test each facility type with detailed DE filtering analysis
console.log('🔍 Data Element Filtering Analysis:\n');

testFacilities.forEach(facilityType => {
  console.log(`🏥 Facility Type: ${facilityType}`);
  console.log('─'.repeat(80));
  
  // Get detailed section information
  const sectionDetails = getSectionDetailsForFacility(facilityType);
  const facilitySummary = getFacilitySummary(facilityType);
  
  // Test each section
  testSections.forEach(sectionName => {
    const isVisible = shouldShowSection(sectionName, facilityType);
    const filteredDECount = getFilteredDataElementCount(sectionName, facilityType);
    const status = isVisible ? '✅ SHOW' : '🚫 HIDE';
    
    console.log(`  ${sectionName}: ${status}`);
    
    if (isVisible && filteredDECount > 0) {
      console.log(`    🚫 ${filteredDECount} Data Elements filtered out`);
    } else if (!isVisible) {
      console.log(`    🚫 Section hidden entirely`);
    } else {
      console.log(`    ✅ All Data Elements visible`);
    }
  });
  
  // Show summary statistics
  console.log(`\n  📊 Summary:`);
  console.log(`    • Total Sections: ${facilitySummary.totalSections}`);
  console.log(`    • Visible Sections: ${facilitySummary.visibleSections}`);
  console.log(`    • Hidden Sections: ${facilitySummary.hiddenSections}`);
  console.log(`    • Total Filtered DEs: ${facilitySummary.totalFilteredDEs}`);
  console.log(`    • Sections with Filtered DEs: ${facilitySummary.sectionsWithFilteredDEs}`);
  
  console.log('\n');
});

console.log('✅ Testing Complete!');
console.log('\nKey Features:');
console.log('1. Section-level filtering (show/hide entire sections)');
console.log('2. Data Element-level filtering (show/hide specific questions)');
console.log('3. Per-section filtered DE count display');
console.log('4. Facility-specific filtering rules');
console.log('5. Comprehensive summary statistics');
