/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2025-09-04 06:59:14
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
    // Original mappings
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

    // Add mappings for service names with "Service " prefix (from dataStore)
    'Service Gynae Clinics': GynaeClinics,
    'Service Laboratory': Laboratory,
    'Service Psychology clinic': Psychologyclinic,
    'Service Eye (opthalmologyoptometry  optician) Clinics': EyeopthalmologyoptometryopticianClinics,
    'Service physiotheraphy': physiotheraphy,
    'Service dental clinic': dentalclinic,
    'Service ENT clinic': ENTclinic,
    'Service Rehabilitation Centre': RehabilitationCentre,
    'Service Potrait clinic': Potraitclinic,
    'Service Radiology': Radiology,
};

export function shouldShowDataElementForService(dataElementName, selectedService) {
    if (!selectedService || !facilityServiceFilters[selectedService]) {
        return true; // Show all if no service selected or service not found
    }

    const serviceFilters = facilityServiceFilters[selectedService];

    // Check if the data element should be shown for this service
    for (const section in serviceFilters) {
        if (serviceFilters[section].showOnly && serviceFilters[section].showOnly.includes(dataElementName)) {
            return true;
        }
    }

    return false; // Hide if not in showOnly lists
}

export default facilityServiceFilters;
