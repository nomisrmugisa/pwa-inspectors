/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist-final.csv
 * Generated on: 2026-01-19 03:32:42
 *
 * This file imports all individual clinic filter files and combines them
 * To regenerate this file, run: python src/config/generateFilters.py
 */

import ObstetricsandGynaecology from './obstetricsandgynaecology.js';
import Laboratory from './laboratory.js';
import Psychology from './psychology.js';
import EyeOpthalmologyOptometry from './eyeopthalmologyoptometry.js';
import Physiotherapy from './physiotherapy.js';
import Dental from './dental.js';
import DentalLaboratory from './dentallaboratory.js';
import EarNoseandThroat from './earnoseandthroat.js';
import RehabilitationCentre from './rehabilitationcentre.js';
import Radiology from './radiology.js';
import GeneralPractice from './generalpractice.js';
import Paediatric from './paediatric.js';
import NursingHome from './nursinghome.js';
import EmergencyMedicalServices from './emergencymedicalservices.js';
import Hospital from './hospital.js';

const facilityServiceFilters = {
    "Obstetrics & Gynaecology": ObstetricsandGynaecology,
    "Service Obstetrics & Gynaecology": ObstetricsandGynaecology,
    "Laboratory": Laboratory,
    "Service Laboratory": Laboratory,
    "Psychology": Psychology,
    "Service Psychology": Psychology,
    "Eye (Opthalmology /Optometry)": EyeOpthalmologyOptometry,
    "Service Eye (Opthalmology /Optometry)": EyeOpthalmologyOptometry,
    "Physiotherapy": Physiotherapy,
    "Service Physiotherapy": Physiotherapy,
    "Dental": Dental,
    "Service Dental": Dental,
    "Dental Laboratory": DentalLaboratory,
    "Service Dental Laboratory": DentalLaboratory,
    "Ear, Nose & Throat": EarNoseandThroat,
    "Service Ear, Nose & Throat": EarNoseandThroat,
    "Rehabilitation Centre": RehabilitationCentre,
    "Service Rehabilitation Centre": RehabilitationCentre,
    "Radiology": Radiology,
    "Service Radiology": Radiology,
    "General Practice": GeneralPractice,
    "Service General Practice": GeneralPractice,
    "Paediatric": Paediatric,
    "Service Paediatric": Paediatric,
    "Nursing  Home": NursingHome,
    "Service Nursing  Home": NursingHome,
    "Emergency Medical Services": EmergencyMedicalServices,
    "Service Emergency Medical Services": EmergencyMedicalServices,
    "Hospital": Hospital,
    "Service Hospital": Hospital,
};


export function shouldShowDataElementForService(dataElementName, selectedService, sectionName = null) {
    if (!selectedService || !facilityServiceFilters[selectedService]) {
        return true; // Show all if no service selected or service not found
    }

    const serviceFilters = facilityServiceFilters[selectedService];

    // Helper to normalize strings for comparison (handles apostrophes, case, and whitespace)
    const normalize = (str) => {
        if (!str) return '';
        // Strip leading non-alphanumeric symbols like bullets
        return str.replace(/^[^a-zA-Z0-9(]+/, "").replace(/['‘’]/g, "").toLowerCase().trim();
    };

    const normalizedDataElementName = normalize(dataElementName);

    // Helper to find a section key case-insensitively
    const findSectionKey = (filters, name) => {
        if (!name) return null;
        const normalizedName = normalize(name);
        // First try exact match
        if (filters[name]) return name;
        // Then try case-insensitive match
        return Object.keys(filters).find(key => normalize(key) === normalizedName);
    };

    // If a section name is provided, STRICTLY check within that specific section
    if (sectionName) {
        // Try to find the section key (handling case mismatches)
        const matchedSectionKey = findSectionKey(serviceFilters, sectionName);

        if (matchedSectionKey) {
            const section = serviceFilters[matchedSectionKey];
            if (section && section.showOnly) {
                return section.showOnly.some(item =>
                    item === dataElementName || normalize(item) === normalizedDataElementName
                );
            }
        }

        // STRICT MODE: If not found in the specific section, DO NOT search elsewhere.
        // DO NOT perform substring checks ("loose matching").
        return false;
    }

    // If no section name provided, check across all sections (legacy/fallback behavior)
    // This is only used if the caller doesn't know the section context.
    for (const section in serviceFilters) {
        if (serviceFilters[section].showOnly) {
            if (serviceFilters[section].showOnly.some(item =>
                item === dataElementName || normalize(item) === normalizedDataElementName
            )) {
                return true;
            }
        }
    }

    return false; // Hide if not in showOnly lists
}

export default facilityServiceFilters;
