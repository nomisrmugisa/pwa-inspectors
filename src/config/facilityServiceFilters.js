/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2025-11-25 11:54:31
 *
 * This file imports all individual clinic filter files and combines them
 * To regenerate this file, run: python src/config/generateFilters.py
 */

import ObstetricsandGynaecology from './obstetricsandgynaecology.js';
import laboratory from './laboratory.js';
import Psychology from './psychology.js';
import EyeOpthalmologyOptometry from './eyeopthalmologyoptometry.js';
import Physiotheraphy from './physiotheraphy.js';
import Dental from './dental.js';
import DentalLaboratory from './dentallaboratory.js';
import EarNoseandThroat from './earnoseandthroat.js';
import RehabilitationCentre from './rehabilitationcentre.js';
import Radiology from './radiology.js';
import GeneralPractice from './generalpractice.js';
import Paediatric from './paediatric.js';
import NursingHome from './nursinghome.js';

const facilityServiceFilters = {
    'Obstetrics & Gynaecology': ObstetricsandGynaecology,
    'Service Obstetrics & Gynaecology': ObstetricsandGynaecology,
    'laboratory': laboratory,
    'Service laboratory': laboratory,
    'Psychology': Psychology,
    'Service Psychology': Psychology,
    'Eye (Opthalmology /Optometry)': EyeOpthalmologyOptometry,
    'Service Eye (Opthalmology /Optometry)': EyeOpthalmologyOptometry,
    'Physiotheraphy': Physiotheraphy,
    'Service Physiotheraphy': Physiotheraphy,
    'Dental': Dental,
    'Service Dental': Dental,
    'Dental Laboratory': DentalLaboratory,
    'Service Dental Laboratory': DentalLaboratory,
    'Ear, Nose & Throat': EarNoseandThroat,
    'Service Ear, Nose & Throat': EarNoseandThroat,
    'Rehabilitation Centre': RehabilitationCentre,
    'Service Rehabilitation Centre': RehabilitationCentre,
    'Radiology': Radiology,
    'Service Radiology': Radiology,
    'General Practice': GeneralPractice,
    'Service General Practice': GeneralPractice,
    'Paediatric': Paediatric,
    'Service Paediatric': Paediatric,
    'Nursing Home': NursingHome,
    'Service Nursing Home': NursingHome,
};

/**
 * Normalize a string for case-insensitive comparison by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Removing extra spaces
 */
function normalizeForComparison(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

export function shouldShowDataElementForService(dataElementName, selectedService) {
    if (!selectedService || !facilityServiceFilters[selectedService]) {
        return true; // Show all if no service selected or service not found
    }

    const serviceFilters = facilityServiceFilters[selectedService];

    // Normalize the data element name for case-insensitive comparison
    const normalizedDEName = normalizeForComparison(dataElementName);

    // Check if the data element should be shown for this service
    for (const section in serviceFilters) {
        if (serviceFilters[section].showOnly) {
            // Check for exact match first (faster)
            if (serviceFilters[section].showOnly.includes(dataElementName)) {
                return true;
            }

            // Then check case-insensitive match
            for (const csvQuestion of serviceFilters[section].showOnly) {
                const normalizedCSV = normalizeForComparison(csvQuestion);
                if (normalizedDEName === normalizedCSV) {
                    return true;
                }
            }
        }
    }

    return false; // Hide if not in showOnly lists
}

export default facilityServiceFilters;
