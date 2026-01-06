/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: checklist for facilities2.0.csv
 * Generated on: 2026-01-06 10:04:21
 *
 * This file defines facility service departments based on actual sections
 * found in the CSV checklist configuration.
 * To regenerate this file, run: python src/config/generateFilters.py
 */

// All available facility service departments (sections from CSV)
export const ALL_FACILITY_DEPARTMENTS = [
  'BLEEDING ROOM',
  'CUSTOMER SATISFACTION',
  'HIV SCREENING',
  'INSTRUMENT WASHING/STERILISING ROOM',
  'LABORATORY TESTING AREAS CHEMISTRY',
  'LABORATORY TESTING AREAS HAEMATOLOGY',
  'MICROBIOLOGY',
  'PERSONNEL',
  'PHARMACY/DISPENSARY',
  'SAFETY AND WASTE MANAGEMENT',
  'SECTION A-ORGANISATION AND MANAGEMENT',
  'SERVICES PROVIDED',
  'SLUICE ROOM',
  'SPECIMEN RECEPTION ROOM',
  'SUPPLIES',
  'TENS',
  'TOILET FACILITIES',
  'ULTRASOUND ROOM',
  'X-RAY ROOM',
];

// Mapping of specializations to their available departments
export const SPECIALIZATION_DEPARTMENT_MAPPING = {
  'Obstetrics & Gynaecology': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Laboratory': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'HIV SCREENING',
    'LABORATORY TESTING AREAS CHEMISTRY',
    'LABORATORY TESTING AREAS HAEMATOLOGY',
    'MICROBIOLOGY',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SPECIMEN RECEPTION ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Psychology': [
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Eye (Opthalmology /Optometry)': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Physiotheraphy': [
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Dental': [
    'CUSTOMER SATISFACTION',
    'INSTRUMENT WASHING/STERILISING ROOM',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Dental Laboratory': [
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Ear, Nose & Throat': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Rehabilitation Centre': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'PHARMACY/DISPENSARY',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Radiology': [
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
    'X-RAY ROOM',
  ],

  'General Practice': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'PHARMACY/DISPENSARY',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Paediatric': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Nursing  Home': [
    'BLEEDING ROOM',
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'PHARMACY/DISPENSARY',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
  ],

  'Emergency Medical Services': [
    'CUSTOMER SATISFACTION',
    'PERSONNEL',
    'SAFETY AND WASTE MANAGEMENT',
    'SECTION A-ORGANISATION AND MANAGEMENT',
    'SERVICES PROVIDED',
    'SLUICE ROOM',
    'SUPPLIES',
    'TOILET FACILITIES',
    'ULTRASOUND ROOM',
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
