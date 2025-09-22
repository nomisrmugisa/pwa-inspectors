/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2025-09-21 23:13:46
 *
 * This file imports all individual clinic filter files and combines them
 * To regenerate this file, run: python src/config/generateFilters.py
 */

import Hospital from './hospital.js';
import Clinic from './clinic.js';
import Laboratory from './laboratory.js';
import Radiology from './radiology.js';
import ENT from './ent.js';
import Dental from './dental.js';
import Eye from './eye.js';
import Psycology from './psycology.js';
import Physio from './physio.js';
import Rehab from './rehab.js';
import Gynae from './gynae.js';

const facilityServiceFilters = {
    'Hospital': Hospital,
    'Service Hospital': Hospital,
    'Clinic': Clinic,
    'Service Clinic': Clinic,
    'Laboratory': Laboratory,
    'Service Laboratory': Laboratory,
    'Radiology': Radiology,
    'Service Radiology': Radiology,
    'ENT': ENT,
    'Service ENT': ENT,
    'Dental': Dental,
    'Service Dental': Dental,
    'Eye': Eye,
    'Service Eye': Eye,
    'Psycology': Psycology,
    'Service Psycology': Psycology,
    'Physio': Physio,
    'Service Physio': Physio,
    'Rehab': Rehab,
    'Service Rehab': Rehab,
    'Gynae': Gynae,
    'Service Gynae': Gynae,
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
