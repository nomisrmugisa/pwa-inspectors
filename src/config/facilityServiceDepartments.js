/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2025-11-24 20:06:33
 *
 * This file defines facility service departments based on actual sections
 * found in the CSV checklist configuration.
 * To regenerate this file, run: python src/config/generateFilters.py
 */

// All available facility service departments (sections from CSV)
export const ALL_FACILITY_DEPARTMENTS = [
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
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'laboratory': [
    'HIV SCREENING',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Psychology': [
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Eye (Opthalmology /Optometry)': [
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Physiotheraphy': [
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Dental': [
    'HIV SCREENING',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Dental Laboratory': [
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Ear, Nose & Throat': [
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Rehabilitation Centre': [
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Radiology': [
    'HIV SCREENING',
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'General Practice': [
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Paediatric': [
    'ORGANISATION AND MANAGEMENT',
    'PERSONNEL',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TENS',
  ],

  'Nursing Home': [
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
