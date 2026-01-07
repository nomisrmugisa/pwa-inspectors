
import { sectionVisibilityConfig, normalizeFacilityClassification, shouldShowSection } from './sectionVisibilityConfig.js';

console.log("--- TEST CONFIG ---");
const rawType = "Emergency Medical Services";
const normalized = normalizeFacilityClassification(rawType);
console.log(`Raw: "${rawType}" -> Normalized: "${normalized}"`);

const config = sectionVisibilityConfig[normalized];
console.log("Config found for normalized:", !!config);

if (config) {
    console.log("Customer Satisfaction Visible:", config['CUSTOMER SATISFACTION']);
    console.log("Facility Call Centre Visible:", config['FACILITY-CALL CENTRE']);
    // console.log("Entire Config Object:", config);
}

const shouldShow = shouldShowSection('CUSTOMER SATISFACTION', rawType);
console.log(`shouldShowSection('CUSTOMER SATISFACTION', '${rawType}') =`, shouldShow);

console.log("--- TEST CLINIC CONFIG COMPARISON ---");
// Check if it looks like Clinic config
// Clinic config hides CUSTOMER SATISFACTION (false)
const clinicConfig = sectionVisibilityConfig['General Practice']; // mapped to Clinic
if (clinicConfig) {
    console.log("Clinic Config Customer Satisfaction:", clinicConfig['CUSTOMER SATISFACTION']);
}
