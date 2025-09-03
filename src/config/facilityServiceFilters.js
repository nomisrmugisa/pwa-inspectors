/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2025-09-02 21:08:01
 *
 * This file imports all individual clinic filter files and combines them
 * To regenerate this file, run: python src/config/generateFilters.py
 */

import GynaeClinics from './gynaeclinics.js';
import Laboratory from './laboratory.js';
import Psychologyclinic from './psychologyclinic.js';
import EyeopthalmologyoptometryopticianClinics from './eyeopthalmologyoptometryopticianclinics.js';
import physiotheraphy from './physiotheraphy.js';
import dentalclinic from './dentalclinic.js';
import ENTclinic from './entclinic.js';
import RehabilitationCentre from './rehabilitationcentre.js';
import Potraitclinic from './potraitclinic.js';
import Radiology from './radiology.js';
import clinic from './clinic.js';

const facilityServiceFilters = {
    'Gynae Clinics': GynaeClinics,
    'Laboratory': Laboratory,
    'Psychology clinic': Psychologyclinic,
    'Eye (opthalmologyoptometry  optician) Clinics': EyeopthalmologyoptometryopticianClinics,
    'physiotheraphy': physiotheraphy,
    'dental clinic': dentalclinic,
    'ENT clinic': ENTclinic,
    'Rehabilitation Centre': RehabilitationCentre,
    'Potrait clinic': Potraitclinic,
    'Radiology': Radiology,
    'clinic': clinic,
};

export function shouldShowDataElementForService(dataElementName, sectionName, facilityType) {
    console.log(`🔍 FILTER FUNCTION DEBUG: DataElement="${dataElementName}", Section="${sectionName}", FacilityType="${facilityType}"`);

    // If no facility type is provided, show all elements
    if (!facilityType) {
        console.log(`🔍 No facility type provided - showing all elements`);
        return true;
    }

    // Check if we have filters for this facility type
    if (!facilityServiceFilters[facilityType]) {
        console.log(`🔍 No filters found for facility type "${facilityType}" - showing all elements`);
        console.log(`🔍 Available facility types:`, Object.keys(facilityServiceFilters));
        return true;
    }

    const serviceFilters = facilityServiceFilters[facilityType];
    console.log(`🔍 Found filters for "${facilityType}":`, serviceFilters);

    // Check if the data element should be shown for this facility type and section
    if (serviceFilters[sectionName] && serviceFilters[sectionName].showOnly) {
        const shouldShow = serviceFilters[sectionName].showOnly.includes(dataElementName);
        console.log(`🔍 Section "${sectionName}" has showOnly filter. Element "${dataElementName}" should show: ${shouldShow}`);
        return shouldShow;
    }

    // If no specific section filter, show the element
    console.log(`🔍 No specific filter for section "${sectionName}" - showing element "${dataElementName}"`);
    return true;
}

export default facilityServiceFilters;
