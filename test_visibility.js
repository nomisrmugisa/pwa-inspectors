
import { sectionVisibilityConfig } from './src/config/sectionVisibilityConfig.js';

const hospitalConfig = sectionVisibilityConfig['Hospital'];
console.log('Hospital Config Keys:', Object.keys(hospitalConfig));
console.log('Has FACILITY GOVERNANCE AND MANAGEMENT:', !!hospitalConfig['FACILITY GOVERNANCE AND MANAGEMENT']);
console.log('Has Inspection Type:', !!hospitalConfig['Inspection Type']);
