
import { ALL_FACILITY_DEPARTMENTS } from './src/config/facilityServiceDepartments.js';
import { sectionVisibilityConfig } from './src/config/sectionVisibilityConfig.js';

console.log('🔍 Verifying Section Visibility Configuration...');

const facilityTypes = Object.keys(sectionVisibilityConfig);
const sampleFacility = 'General Practice'; // Use a generic one to check keys
const configSections = Object.keys(sectionVisibilityConfig[sampleFacility] || {});

console.log(`\n📋 Sections in CSV (${ALL_FACILITY_DEPARTMENTS.length}):`);
ALL_FACILITY_DEPARTMENTS.forEach(s => console.log(` - ${s}`));

console.log(`\n📋 Sections in Config (${configSections.length}):`);
configSections.forEach(s => console.log(` - ${s}`));

console.log('\n⚠️  Missing/Mismatch Check:');
const missing = ALL_FACILITY_DEPARTMENTS.filter(csvSection => {
    // Check if this CSV section exists in the config keys
    // OR if it's handled by special logic (like HIV SCREENING)
    if (configSections.includes(csvSection)) return false;

    // Known special cases handled by CSV_ALWAYS_VISIBLE_SECTION_TOKENS
    if (['SERVICES PROVIDED', 'HIV SCREENING', 'TENS'].includes(csvSection)) return false;

    return true;
});

if (missing.length > 0) {
    console.log('❌ The following CSV sections are NOT explicitly in sectionVisibilityConfig (and not in special tokens):');
    missing.forEach(s => console.log(`   - "${s}"`));
} else {
    console.log('✅ All CSV sections are covered by configuration or special tokens.');
}
