/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2025-09-21 23:13:46
 *
 * This file defines facility service departments based on actual sections
 * found in the CSV checklist configuration.
 * To regenerate this file, run: python src/config/generateFilters.py
 */

// All available facility service departments (sections from CSV)
export const ALL_FACILITY_DEPARTMENTS = [
  'BLEEDING ROOM',
  'CONSULTATION ROOM',
  'CUSTOMER SATISFACTION',
  'ENVIRONMENT',
  'HIV SCREENING',
  'INSTRUMENT WASHING/ STERILISING ROOM',
  'LAB SERVICES PROVIDED',
  'ORGANISATION AND MANAGEMENT',
  'PERSONNEL',
  'PHARMACY/ DISPENSARY',
  'PROCEDURE ROOM',
  'RECEPTION AREA',
  'RECORDS/ INFORMATION MANAGEMENT',
  'SAFETY AND WASTE MANAGEMENT',
  'SCREENING ROOM',
  'SERVICE PROVIDED',
  'SLUICE ROOM',
  'SPECIMEN ROOM',
  'SUPPLIES',
  'TOILET FACILITITES',
  'ULTRASOUND ROOM',
  'X-RAY ROOM',
];

// Mapping of specializations to their available departments
export const SPECIALIZATION_DEPARTMENT_MAPPING = {
  'Hospital': [
    'BLEEDING ROOM',
    'CONSULTATION ROOM',
    'ENVIRONMENT',
    'PROCEDURE ROOM',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SCREENING ROOM',
    'SLUICE ROOM',
    'TOILET FACILITITES',
  ],

  'Clinic': [
    'BLEEDING ROOM',
    'CONSULTATION ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'PHARMACY/ DISPENSARY',
    'PROCEDURE ROOM',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SCREENING ROOM',
    'SERVICE PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITITES',
  ],

  'Laboratory': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'HIV SCREENING',
    'LAB SERVICES PROVIDED',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SERVICE PROVIDED',
    'SPECIMEN ROOM',
    'SUPPLIES',
    'TOILET FACILITITES',
  ],

  'Radiology': [
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SERVICE PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITITES',
    'ULTRASOUND ROOM',
    'X-RAY ROOM',
  ],

  'ENT': [
    'CONSULTATION ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'PROCEDURE ROOM',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SERVICE PROVIDED',
    'SUPPLIES',
    'TOILET FACILITITES',
  ],

  'Dental': [
    'CONSULTATION ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'INSTRUMENT WASHING/ STERILISING ROOM',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SCREENING ROOM',
    'SERVICE PROVIDED',
    'SUPPLIES',
    'TOILET FACILITITES',
  ],

  'Eye': [
    'CONSULTATION ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'PROCEDURE ROOM',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SCREENING ROOM',
    'SERVICE PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITITES',
  ],

  'Psycology': [
    'CONSULTATION ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SERVICE PROVIDED',
    'SUPPLIES',
    'TOILET FACILITITES',
  ],

  'Physio': [
    'CONSULTATION ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SERVICE PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITITES',
  ],

  'Rehab': [
    'BLEEDING ROOM',
    'CONSULTATION ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'PROCEDURE ROOM',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SCREENING ROOM',
    'SERVICE PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITITES',
  ],

  'Gynae': [
    'BLEEDING ROOM',
    'CONSULTATION ROOM',
    'CUSTOMER SATISFACTION',
    'ENVIRONMENT',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'PHARMACY/ DISPENSARY',
    'PROCEDURE ROOM',
    'RECEPTION AREA',
    'RECORDS/ INFORMATION MANAGEMENT',
    'SAFETY AND WASTE MANAGEMENT',
    'SCREENING ROOM',
    'SERVICE PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITITES',
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
