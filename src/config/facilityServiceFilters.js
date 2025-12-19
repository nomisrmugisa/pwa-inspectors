/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: src/config/checklist for facilities2.0.csv
 * Generated on: 2025-12-19 15:23:18
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


export function shouldShowDataElementForService(dataElementName, selectedService, sectionName = null) {
    if (!selectedService || !facilityServiceFilters[selectedService]) {
        return true; // Show all if no service selected or service not found
    }

    const serviceFilters = facilityServiceFilters[selectedService];

    // Helper to normalize strings for comparison (handles apostrophes, case, and whitespace)
    const normalize = (str) => {
        if (!str) return '';
        return str.replace(/['‘’]/g, "").toLowerCase().trim();
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

    // If a section name is provided, only check within that specific section
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
        
        // Let's try one more fallback: check if the section name is a substring of a key or vice versa
        const looseSectionKey = Object.keys(serviceFilters).find(key => 
            key.toLowerCase().includes(sectionName.toLowerCase()) || 
            sectionName.toLowerCase().includes(key.toLowerCase())
        );
        
        if (looseSectionKey) {
             const section = serviceFilters[looseSectionKey];
             if (section && section.showOnly) {
                return section.showOnly.some(item => 
                    item === dataElementName || normalize(item) === normalizedDataElementName
                );
            }
        }

        // If section doesn't exist in filters, don't show the element
        return false;
    }

    // If no section name provided, check across all sections (legacy behavior)
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
