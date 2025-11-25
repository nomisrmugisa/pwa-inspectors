// Temporary helper to document canonical facility types and mapping from legacy values
// This is NOT used by the app; it's just for our reference while editing.

export const CANONICAL_FACILITY_TYPES = [
  'Obstetrics & Gynaecology',
  'laboratory',
  'Psychology',
  'Eye (Opthalmology /Optometry)',
  'Physiotheraphy',
  'Dental',
  'Dental Laboratory',
  'Ear, Nose & Throat',
  'Rehabilitation Centre',
  'Radiology',
  'General Practice',
  'Paediatric',
  'Nursing Home',
];

export const LEGACY_TO_CANONICAL = {
  // Dropdown options / internal strings
  Hospital: 'General Practice',
  Clinic: 'General Practice',
  Laboratory: 'laboratory',
  Radiology: 'Radiology',
  ENT: 'Ear, Nose & Throat',
  Dental: 'Dental',
  Eye: 'Eye (Opthalmology /Optometry)',
  Psycology: 'Psychology',
  Physio: 'Physiotheraphy',
  Rehab: 'Rehabilitation Centre',
  Gynae: 'Obstetrics & Gynaecology',

  // CSV-embedded classifications and orgUnit group names
  'Gynae Clinics': 'Obstetrics & Gynaecology',
  'Psychology clinic': 'Psychology',
  'Eye (opthalmologyoptometry  optician) Clinics': 'Eye (Opthalmology /Optometry)',
  'physiotheraphy': 'Physiotheraphy',
  'dental clinic': 'Dental',
  'ENT clinic': 'Ear, Nose & Throat',
  'Rehabilitation Centre': 'Rehabilitation Centre',
  'Potrait clinic': 'General Practice',
  'clinic': 'General Practice',
  'hospital': 'General Practice',
};

