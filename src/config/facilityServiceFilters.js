// Main facility service filters file
// This file imports all individual clinic filter files and combines them

import GynaeClinics from './gynaeclinics.js';
import Laboratory from './laboratory.js';
import Psychologyclinic from './psychologyclinic.js';
import EyeopthalmologyoptometryopticianClinics from './eyeopthalmologyoptometryopticianclinics.js';
import physiotheraphy from './physiotheraphy.js';
import dentalclinic from './dentalclinic.js';
import ENTclinic from './entclinic.js';
import RehabilitationCentre from './rehabilitationcentre.js';
import Potraitclinic from './potraitclinic.js';
import Radiology from './radiology.js';
import clinic from './clinic.js';

const facilityServiceFilters = {
    'Gynae Clinics': GynaeClinics,
    'Laboratory': Laboratory,
    'Psychology clinic': Psychologyclinic,
    'Eye (opthalmologyoptometry  optician) Clinics': EyeopthalmologyoptometryopticianClinics,
    'physiotheraphy': physiotheraphy,
    'dental clinic': dentalclinic,
    'ENT clinic': ENTclinic,
    'Rehabilitation Centre': RehabilitationCentre,
    'Potrait clinic': Potraitclinic,
    'Radiology': Radiology,
    'clinic': clinic,
};

export function shouldShowDataElementForService(dataElementName, selectedService) {
    if (!selectedService || !facilityServiceFilters[selectedService]) {
        return true; // Show all if no service selected or service not found
    }
    
    const serviceFilters = facilityServiceFilters[selectedService];
    
    // Check if the data element should be shown for this service
    for (const section in serviceFilters) {
        if (serviceFilters[section].showOnly && serviceFilters[section].showOnly.includes(dataElementName)) {
            return true;
        }
    }
    
    return false; // Hide if not in showOnly lists
}

export default facilityServiceFilters;
