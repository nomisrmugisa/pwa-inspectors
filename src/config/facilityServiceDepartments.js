/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist-final.csv
 * Generated on: 2026-01-07 13:43:32
 *
 * This file defines facility service departments based on actual sections
 * found in the CSV checklist configuration.
 * To regenerate this file, run: python src/config/generateFilters.py
 */

// All available facility service departments (sections from CSV)
export const ALL_FACILITY_DEPARTMENTS = [
  'FACILITY-CALL CENTRE',
  'FACILITY-CONSULTATION/ TREATMENT ROOM--',
  'FACILITY-ENVIRONMENT',
  'FACILITY-PROCEDURE ROOM-',
  'FACILITY-RECEPTION/WAITING AREA--',
  'FACILITY-SCREENING ROOM--',
  'HIV SCREENING',
  'PERSONNEL',
  'SECTION A-ORGANISATION AND MANAGEMENT',
  'SERVICES PROVIDED',
  'SUPPLIES',
  'TENS',
  'X-RAY ROOM',
];

// Mapping of specializations to their available departments
export const SPECIALIZATION_DEPARTMENT_MAPPING = {
  'Obstetrics & Gynaecology': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Laboratory': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'HIV SCREENING',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Psychology': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Eye (Opthalmology /Optometry)': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Physiotherapy': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Dental': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'HIV SCREENING',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Dental Laboratory': [
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Ear, Nose & Throat': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Rehabilitation Centre': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Radiology': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'General Practice': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Paediatric': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Nursing  Home': [
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'FACILITY-RECEPTION/WAITING AREA--',
    'FACILITY-SCREENING ROOM--',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
  ],

  'Emergency Medical Services': [
    'FACILITY-CALL CENTRE',
    'FACILITY-CONSULTATION/ TREATMENT ROOM--',
    'FACILITY-ENVIRONMENT',
    'FACILITY-PROCEDURE ROOM-',
    'PERSONNEL',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
    'X-RAY ROOM',
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
