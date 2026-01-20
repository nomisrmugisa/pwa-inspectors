
import { shouldShowSection } from './sectionVisibilityConfig.js';
import { getDepartmentsForSpecialization } from './facilityServiceDepartments.js';

// Mock the internal component function from FormPage.jsx
const DEPARTMENT_SECTION_MAPPING = {
    'CUSTOMER SATISFACTION': ['CUSTOMER SATISFACTION']
};

const shouldShowSectionForServiceDepartments = (sectionName, selectedDepartments) => {
    const safeName = (sectionName || '').toString();
    const sectionLower = safeName.toLowerCase();

    if (sectionLower.includes('inspection information') || sectionLower.includes('inspection type')) {
        return true;
    }

    if (!selectedDepartments || selectedDepartments.length === 0) {
        return false;
    }

    const departmentSectionMapping = DEPARTMENT_SECTION_MAPPING;

    for (const department of selectedDepartments) {
        if (department === 'OTHER') {
            return true;
        }
        const keywords = departmentSectionMapping[department] || [];

        if (keywords.some(k => {
            const keywordLower = k.toLowerCase();
            const normalizedSectionLower = sectionLower.replace(/^section\s+[a-z]\s*-\s*/i, '');
            return sectionLower === keywordLower ||
                normalizedSectionLower === keywordLower ||
                sectionLower.includes(keywordLower) ||
                normalizedSectionLower.includes(keywordLower);
        })) {
            return true;
        }
    }
    return false;
};

// TEST 1: Check available departments for EMS
console.log("--- TEST 1: Available Departments for EMS ---");
const emsDepartments = getDepartmentsForSpecialization('Emergency Medical Services');
console.log("Departments:", emsDepartments);
const hasCustSat = emsDepartments.includes('CUSTOMER SATISFACTION');
console.log("Has CUSTOMER SATISFACTION:", hasCustSat);

// TEST 2: Check section visibility config
console.log("\n--- TEST 2: Section Visibility Config ---");
const sectionName = 'CUSTOMER SATISFACTION';
const facilityType = 'Emergency Medical Services';
const isVisibleInConfig = shouldShowSection(sectionName, facilityType);
console.log(`shouldShowSection("${sectionName}", "${facilityType}") =`, isVisibleInConfig);

// TEST 3: Check service department filtering
console.log("\n--- TEST 3: Service Department Filtering ---");
const selectedDepts = ['CUSTOMER SATISFACTION'];
const isVisibleForDept = shouldShowSectionForServiceDepartments(sectionName, selectedDepts);
console.log(`shouldShowSectionForServiceDepartments("${sectionName}", ${JSON.stringify(selectedDepts)}) =`, isVisibleForDept);

// TEST 4: Case insensitive check
console.log("\n--- TEST 4: Case Insensitive Check ---");
const facilityTypeLower = 'emergency medical services';
const isVisibleInConfigLower = shouldShowSection(sectionName, facilityTypeLower);
console.log(`shouldShowSection("${sectionName}", "${facilityTypeLower}") =`, isVisibleInConfigLower);
