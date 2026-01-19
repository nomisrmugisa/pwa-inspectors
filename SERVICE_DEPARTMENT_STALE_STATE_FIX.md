# Service Department Stale State Fix

## Problem Statement
When users changed the "Facility Type" (e.g., from Hospital to Clinic), the "Service Departments" list was not being reset correctly. This caused:
- Departments from the previous facility type to linger in the selection
- Mismatch errors in the Validation Tool
- Incorrect data entry forms being displayed
- Inconsistent state between the UI and the backend

### Example Scenario
1. User selects "Hospital" → departments include "TOILET FACILITIES HOSPITAL"
2. User changes to "Obstetrics & Gynaecology" → should show "TOILET FACILITIES" instead
3. **Bug**: "TOILET FACILITIES HOSPITAL" remained selected, causing validation errors

---

## Solution Overview
Updated `handleSpecializationChange()` in `src/pages/FormPage.jsx` to **immediately and strictly** reset the Service Departments when the facility type changes.

---

## Implementation Details

### Key Changes in `handleSpecializationChange()` (Lines 2882-2950)

#### 1. **Immediate Department Reset** (Lines 2906-2917)
```javascript
if (!isLoadingFromIndexedDB) {
  // FIX: Immediately set the new defaults to prevent stale state
  const defaults = getDepartmentsForSpecialization(selectedSpecialization);
  console.log(`🔄 Specialization changed to ${selectedSpecialization}. Auto-selecting ${defaults.length} departments.`);
  setSelectedServiceDepartments(defaults);

  // Also sync global state immediately
  if (window.updateSelectedServiceDepartments) {
    window.updateSelectedServiceDepartments(defaults);
  }
}
```

#### 2. **Global State Synchronization** (Lines 2919-2950)
- Clears cached department options: `window.__departmentOptionsForSection = null`
- Updates global specialization: `window.__currentSpecialization = selectedSpecialization`
- Forces form re-render to reflect changes immediately

#### 3. **Hardcoded Department Mapping** (Lines 2932-2950)
Uses `getDepartmentsForSpecialization()` from `facilityServiceDepartments.js` to get the correct departments for each specialization.

---

## Supporting Infrastructure

### `getDepartmentsForSpecialization()` Function
Located in `src/config/facilityServiceDepartments.js`:
```javascript
export function getDepartmentsForSpecialization(specialization) {
  if (!specialization || !SPECIALIZATION_DEPARTMENT_MAPPING[specialization]) {
    return ALL_FACILITY_DEPARTMENTS;
  }
  return SPECIALIZATION_DEPARTMENT_MAPPING[specialization];
}
```

### Department Mapping
Each specialization has a predefined list of valid departments:
- **Obstetrics & Gynaecology**: 16 departments (TOILET FACILITIES, not HOSPITAL variant)
- **Laboratory**: 15 departments
- **Psychology**: 10 departments
- ... (13 total specializations)

---

## Verification Results

### Manual Testing
✅ **Switching from Hospital to Obstetrics & Gynaecology**:
- "TOILET FACILITIES HOSPITAL" immediately cleared
- "TOILET FACILITIES" automatically selected
- Form sections updated correctly

### Validation Tool
✅ **0 validation errors** after specialization change
- Selected departments match facility type configuration
- No orphaned departments from previous selection

### Console Output
```
🔄 Specialization changed to Obstetrics & Gynaecology. Auto-selecting 16 departments.
```

---

## Edge Cases Handled

1. **Loading from IndexedDB**: Skips reset to preserve saved state
2. **No specialization selected**: Falls back to all departments
3. **Invalid specialization**: Returns all departments as fallback
4. **Global state sync**: Ensures UI and backend stay in sync

---

## Testing Checklist

- [x] Change facility type → departments reset correctly
- [x] Validation tool reports 0 errors
- [x] Form sections update based on new departments
- [x] Console logs show correct department count
- [x] Reload page → saved state preserved
- [x] Switch between multiple facility types → each resets correctly

