# Manual Specialization Selection Feature

## Overview
Added a manual specialization selector that allows users to choose from predefined facility types to filter inspection sections and questions. This feature gives users control over which specialization-specific content is displayed during inspections.

## Features Added

### 1. Manual Specialization Selector
**Location:** FormPage.jsx - After Facility Information Display

**UI Components:**
- Dropdown selector with predefined specialization options
- Status indicator showing selected specialization
- Descriptive text explaining the feature's purpose

**Available Specializations:**
- Gynae Clinics
- Laboratory
- Psychology clinic
- Eye (opthalmologyoptometry optician) Clinics
- physiotheraphy
- dental clinic
- ENT clinic
- Rehabilitation Centre
- Potrait clinic
- Radiology
- clinic

### 2. State Management
**New State Variables:**
```javascript
const [manualSpecialization, setManualSpecialization] = useState('');
const specializationOptions = [/* predefined options */];
```

**Handler Function:**
```javascript
const handleSpecializationChange = (selectedSpecialization) => {
  setManualSpecialization(selectedSpecialization);
  setFacilityType(selectedSpecialization); // Update facility type for filtering
};
```

### 3. Enhanced Filtering Logic
**Updated `getCurrentFacilityClassification()` function with priority order:**

1. **Manual Specialization** (Highest Priority)
2. **FormData Classification**
3. **DHIS2 Field Classification**
4. **FacilityType State** (Fallback)

```javascript
const getCurrentFacilityClassification = () => {
  // 1. Prioritize manual specialization selection
  if (manualSpecialization) {
    return manualSpecialization;
  }
  // ... other fallbacks
};
```

### 4. Service Filter Mappings
**Updated `facilityServiceFilters.js` to include "Service " prefix mappings:**

```javascript
const facilityServiceFilters = {
  // Original mappings
  'Gynae Clinics': GynaeClinics,
  'Laboratory': Laboratory,
  // ...
  
  // Service prefix mappings (from dataStore)
  'Service Gynae Clinics': GynaeClinics,
  'Service Laboratory': Laboratory,
  // ...
};
```

### 5. Styling
**Added CSS in `FormPage.css`:**
- Golden/yellow theme for specialization selector
- Hover effects and transitions
- Status indicators with success styling
- Responsive design elements

## User Experience

### Workflow:
1. **User opens inspection form**
2. **Sees facility information display**
3. **Uses manual specialization selector** to choose facility type
4. **Form sections and questions filter** based on selection
5. **Status indicator confirms** active specialization

### Benefits:
- **User Control:** Manual override of automatic classification
- **Immediate Feedback:** Visual confirmation of selection
- **Filtered Content:** Only relevant sections/questions shown
- **Consistent Experience:** Works regardless of dataStore configuration

## Technical Implementation

### Integration Points:
1. **FormPage.jsx:** Main component with selector UI
2. **facilityServiceFilters.js:** Filter mappings for specializations
3. **FormPage.css:** Styling for specialization selector
4. **getCurrentFacilityClassification():** Priority-based classification logic

### Data Flow:
```
User Selection → manualSpecialization state → getCurrentFacilityClassification() → 
shouldShowDataElementForService() → Filtered Questions Display
```

### Compatibility:
- **Backward Compatible:** Existing automatic classification still works
- **DataStore Integration:** Handles both "Service " prefixed and direct names
- **Fallback Support:** Multiple levels of classification detection

## Testing Scenarios

### 1. Manual Selection
- Select each specialization option
- Verify correct filtering of sections/questions
- Confirm status indicator updates

### 2. Priority Testing
- Test with manual selection + dataStore classification
- Verify manual selection takes priority
- Test fallback behavior when manual selection cleared

### 3. Filter Validation
- Verify "Service Gynae Clinics" maps to GynaeClinics filter
- Test all specialization options show correct questions
- Confirm "Facility Information" sections are properly filtered

### 4. UI/UX Testing
- Test dropdown functionality
- Verify styling and hover effects
- Test responsive behavior on different screen sizes

## Future Enhancements

### Potential Improvements:
1. **Persistence:** Save manual selection in localStorage
2. **Smart Defaults:** Auto-select based on facility name patterns
3. **Multi-Selection:** Allow multiple specializations for complex facilities
4. **Custom Specializations:** Allow users to define custom filter sets
5. **Validation:** Warn if manual selection conflicts with dataStore data

## Configuration

### To Add New Specializations:
1. **Add to `specializationOptions` array** in FormPage.jsx
2. **Create filter configuration** in individual clinic files
3. **Add mapping** in facilityServiceFilters.js
4. **Test filtering behavior** with new specialization

### To Modify Existing Filters:
1. **Update individual clinic files** (e.g., gynaeclinics.js)
2. **Regenerate filters** using generateFilters.py if needed
3. **Test question filtering** with updated configuration
