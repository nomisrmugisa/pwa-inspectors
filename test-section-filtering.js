/**
 * Test Script for Conditional Section Filtering
 * 
 * This script demonstrates how the section visibility system works
 * with different facility types. Run this with Node.js to test the logic.
 */

// Import the configuration (you'll need to run this in the project directory)
import { shouldShowSection, getAvailableFacilityTypes, getVisibleSectionsForFacility } from './src/config/sectionVisibilityConfig.js';

// Test data - different facility types
const testFacilities = [
  'Gynae Clinics',
  'laboratory',
  'Psychology clinic',
  'Eye (opthalmologyoptometry  optician) Clinics',
  'physiotheraphy',
  'dental clinic',
  'ENT clinic',
  'Rehabilitation Centre',
  'Potrait clinic', // This one has SECTION C hidden
  'Radiology',
  'clinic'
];

// Test sections
const testSections = [
  'SECTION A-ORGANISATION AND MANAGEMENT',
  'SECTION B-STATUTORY REQUIREMENTS',
  'SECTION C-POLICIES AND PROCEDURES'
];

console.log('🏥 Testing Conditional Section Filtering System\n');

// Test 1: Show all available facility types
console.log('📋 Available Facility Types:');
getAvailableFacilityTypes().forEach((type, index) => {
  console.log(`  ${index + 1}. ${type}`);
});

console.log('\n' + '='.repeat(80) + '\n');

// Test 2: Test each facility type with each section
console.log('🔍 Section Visibility Test Results:\n');

testFacilities.forEach(facilityType => {
  console.log(`🏥 Facility Type: ${facilityType}`);
  console.log('─'.repeat(50));

  testSections.forEach(sectionName => {
    const isVisible = shouldShowSection(sectionName, facilityType);
    const status = isVisible ? '✅ SHOW' : '🚫 HIDE';
    console.log(`  ${sectionName}: ${status}`);
  });

  // Show summary
  const visibleSections = getVisibleSectionsForFacility(facilityType);
  const totalSections = testSections.length;
  const hiddenSections = totalSections - visibleSections.length;

  console.log(`\n  📊 Summary: ${visibleSections.length}/${totalSections} sections visible`);
  if (hiddenSections > 0) {
    console.log(`  🚫 ${hiddenSections} section(s) hidden for this facility type`);
  }

  console.log('\n');
});

// Test 3: Edge cases
console.log('🔍 Edge Case Testing:\n');

// Test with null/undefined facility classification
console.log('Testing with no facility classification:');
testSections.forEach(sectionName => {
  const isVisible = shouldShowSection(sectionName, null);
  const status = isVisible ? '✅ SHOW' : '🚫 HIDE';
  console.log(`  ${sectionName}: ${status} (default behavior)`);
});

console.log('\n');

// Test with unknown facility type
console.log('Testing with unknown facility type:');
testSections.forEach(sectionName => {
  const isVisible = shouldShowSection(sectionName, 'Unknown Facility Type');
  const status = isVisible ? '✅ SHOW' : '🚫 HIDE';
  console.log(`  ${sectionName}: ${status} (default behavior)`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Testing Complete!');
console.log('\nTo use this in your application:');
console.log('1. Select a facility from the dropdown');
console.log('2. The system will automatically detect the facility type');
console.log('3. Sections will be filtered based on the facility classification');
console.log('4. Use the debug panel to see which sections are visible/hidden');
console.log('5. Check the console for detailed filtering decisions');

