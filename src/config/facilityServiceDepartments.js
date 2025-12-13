/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2025-12-13 16:03:49
 *
 * This file defines facility service departments based on actual sections
 * found in the CSV checklist configuration.
 * To regenerate this file, run: python src/config/generateFilters.py
 */

// All available facility service departments (sections from CSV)
export const ALL_FACILITY_DEPARTMENTS = [
  'FACILITY-CONSULTATION/ TREATMENT ROOM',
  'FACILITY-ENVIRONMENT',
  'FACILITY-PROCEDURE ROOM',
  'FACILITY-RECEPTION/WAITING AREA',
  'FACILITY-SCREENING ROOM',
  'HIV SCREENING',
  'ORGANISATION AND MANAGEMENT',
  'PERSONNEL',
  'SERVICES PROVIDED',
  'SUPPLIES',
  'TENS',
];

// Mapping of specializations to their available departments
export const SPECIALIZATION_DEPARTMENT_MAPPING = {
  'Obstetrics & Gynaecology': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'laboratory': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'HIV SCREENING',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Psychology': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Eye (Opthalmology /Optometry)': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Physiotheraphy': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Dental': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'HIV SCREENING',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Dental Laboratory': [
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Ear, Nose & Throat': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Rehabilitation Centre': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Radiology': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'HIV SCREENING',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'General Practice': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Paediatric': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Nursing Home': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM',
    'FACILITY-RECEPTION/WAITING AREA',
    'FACILITY-SCREENING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

};

/**
 * Get departments available for a specific specialization
 * @param {string} specialization - The facility specialization
 * @returns {Array<string>} Array of department names
 */
export function getDepartmentsForSpecialization(specialization) {
  if (!specialization || !SPECIALIZATION_DEPARTMENT_MAPPING[specialization]) {
    return ALL_FACILITY_DEPARTMENTS;
  }
  return SPECIALIZATION_DEPARTMENT_MAPPING[specialization];
}

/**
 * Get statistics about departments for a specialization
 * @param {string} specialization - The facility specialization
 * @returns {Object} Statistics object with total and available counts
 */
export function getDepartmentStats(specialization) {
  const available = getDepartmentsForSpecialization(specialization);
  return {
    total: ALL_FACILITY_DEPARTMENTS.length,
    available: available.length,
    specialization: specialization
  };
}

export default {
  ALL_FACILITY_DEPARTMENTS,
  SPECIALIZATION_DEPARTMENT_MAPPING,
  getDepartmentsForSpecialization,
  getDepartmentStats
};
