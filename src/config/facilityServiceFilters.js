/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2025-12-04 19:52:28
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
    'INDIVIDUAL PRIVATE PRACTICE': GeneralPractice,
    'Paediatric': Paediatric,
    'Service Paediatric': Paediatric,
    'Nursing Home': NursingHome,
    'Service Nursing Home': NursingHome,
};

export function shouldShowDataElementForService(dataElementName, selectedService, sectionName = null) {
    if (!selectedService || !facilityServiceFilters[selectedService]) {
        // console.log('⚠️ No service or service not found:', selectedService);
        return true; // Show all if no service selected or service not found
    }

    const serviceFilters = facilityServiceFilters[selectedService];

    // If section name is provided, only check that specific section
    if (sectionName) {
        const sectionConfig = serviceFilters[sectionName];

        // DEBUG: Log if we are in the target section, regardless of element name
        if (selectedService === 'Obstetrics & Gynaecology' && sectionName === 'SUPPLIES') {
            // Only log once per section render (hacky but reduces noise) or just log first element
            if (dataElementName.includes('stock')) {
                console.log(`🔍 DEBUG FILTER INPUTS:`);
                console.log(`  - Service: '${selectedService}'`);
                console.log(`  - Section: '${sectionName}'`);
                console.log(`  - Config Keys:`, Object.keys(serviceFilters));
                console.log(`  - Section Config Found?:`, !!sectionConfig);
            }
        }

        if (sectionConfig) {
            if (sectionConfig.showOnly) {
                // Nuclear matching: remove ALL non-alphanumeric characters and lowercase
                // This handles double spaces, tabs, non-breaking spaces, etc.
                const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                const normalizedInput = normalize(dataElementName);
                const matches = sectionConfig.showOnly.some(configItem =>
                    normalize(configItem) === normalizedInput
                );

                // DEBUG: Log specific elements we are interested in for Obstetrics & Gynaecology
                if (selectedService === 'Obstetrics & Gynaecology' && sectionName === 'SUPPLIES') {
                    const lowerName = dataElementName.toLowerCase();
                    if (lowerName.includes('supplies') || lowerName.includes('policies') || lowerName.includes('policy') || lowerName.includes('stock')) {
                        console.log(`🔍 Filter Check [${selectedService}][${sectionName}]:`);
                        console.log(`  - DHIS2 Element: "${dataElementName}"`);
                        console.log(`  - Normalized Input: "${normalizedInput}"`);
                        console.log(`  - Match Found? ${matches}`);
                        if (!matches) {
                            console.log('  - Config List (Normalized):', JSON.stringify(sectionConfig.showOnly.map(i => normalize(i))));
                        }
                    }
                }

                return matches;
            }
            // If section exists but no showOnly, assume show all? Or hide all?
            // Current logic: if section exists, we expect showOnly. If missing, hide.
            return false;
        }

        // Fallback: Section not found in config
        if (selectedService === 'Obstetrics & Gynaecology' && sectionName === 'SUPPLIES') {
            console.log(`❌ Section '${sectionName}' NOT FOUND in config for '${selectedService}'`);
            console.log(`Available Sections:`, Object.keys(serviceFilters));
        }
        return false;
    }

    // If no section specified, check all sections (legacy behavior)
    for (const section in serviceFilters) {
        if (serviceFilters[section].showOnly && serviceFilters[section].showOnly.includes(dataElementName)) {
            return true;
        }
    }

    return false; // Hide if not in showOnly lists
}

export default facilityServiceFilters;
