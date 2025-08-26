# Conditional Section Filtering System

## Overview

This system allows you to show/hide specific inspection form sections based on the facility classification (type). This ensures that inspectors only see relevant sections for the type of facility they're inspecting, making the form more focused and efficient.

## How It Works

1. **Facility Classification Detection**: The system automatically detects the facility type from:
   - The selected facility in the form
   - DHIS2 facility classification data
   - CSV configuration data

2. **Section Visibility Rules**: Each facility type has a configuration that defines which sections should be visible

3. **Dynamic Filtering**: Sections are automatically shown/hidden based on the current facility classification

4. **User Feedback**: The system provides clear information about which sections are available and which are hidden

## Configuration File

The main configuration is in `src/config/sectionVisibilityConfig.js`. This file contains:

- **Facility Type Mappings**: Each facility type and its section visibility rules
- **Helper Functions**: Functions to check visibility and get section information
- **Default Behavior**: Rules for handling unconfigured facility types

## Current Configuration

### Facility Types Supported

1. **Gynae Clinics** - Shows all sections (comprehensive inspection)
2. **Laboratory** - Shows all sections (technical focus)
3. **Psychology clinic** - Shows all sections (patient care focus)
4. **Eye Clinics** - Shows all sections (specialized equipment focus)
5. **Physiotherapy** - Shows all sections (treatment protocols focus)
6. **Dental clinic** - Shows all sections (infection control focus)
7. **ENT clinic** - Shows all sections (specialized procedures focus)
8. **Rehabilitation Centre** - Shows all sections (patient care focus)
9. **Portrait clinic** - Hides SECTION C (example of selective hiding)
10. **Radiology** - Shows all sections (safety focus)
11. **General clinic** - Shows all sections (comprehensive)

### Section Structure

- **SECTION A-ORGANISATION AND MANAGEMENT**: Basic organizational requirements
- **SECTION B-STATUTORY REQUIREMENTS**: Legal and regulatory requirements
- **SECTION C-POLICIES AND PROCEDURES**: Operational policies and procedures

## Customizing the Configuration

### Adding New Facility Types

```javascript
// Add a new facility type to the configuration
'New Facility Type': {
  'SECTION A-ORGANISATION AND MANAGEMENT': true,
  'SECTION B-STATUTORY REQUIREMENTS': true,
  'SECTION C-POLICIES AND PROCEDURES': false, // Hide if not applicable
}
```

### Modifying Section Visibility

```javascript
// Example: Hide SECTION C for laboratories
'laboratory': {
  'SECTION A-ORGANISATION AND MANAGEMENT': true,
  'SECTION B-STATUTORY REQUIREMENTS': true,
  'SECTION C-POLICIES AND PROCEDURES': false, // Now hidden
}
```

### Adding New Sections

```javascript
// Add a new section to all facility types
'Gynae Clinics': {
  'SECTION A-ORGANISATION AND MANAGEMENT': true,
  'SECTION B-STATUTORY REQUIREMENTS': true,
  'SECTION C-POLICIES AND PROCEDURES': true,
  'SECTION D-NEW SECTION': true, // New section
}
```

## User Interface Features

### 1. Section Visibility Indicators

- **Visible Sections**: Shown normally with full functionality
- **Hidden Sections**: Completely removed from the form
- **Debug Information**: Shows which sections are hidden and why

### 2. Facility Classification Display

- Shows current facility type in the locked sections message
- Displays count of available vs. total sections
- Indicates how many sections are hidden for the current facility type

### 3. Debug Panel

When debug mode is enabled, you can see:
- Current facility classification
- List of visible sections
- List of hidden sections
- Section visibility counts

## Technical Implementation

### Key Functions

1. **`shouldShowSection(sectionName, facilityClassification)`**
   - Main function that determines section visibility
   - Returns `true` to show, `false` to hide

2. **`getCurrentFacilityClassification()`**
   - Retrieves the current facility type from form data
   - Falls back to DHIS2 field if needed

3. **Section Filtering**
   - Applied to both initial sections and remaining sections
   - Filters happen before rendering

### Integration Points

- **FormPage.jsx**: Main form component with filtering logic
- **DynamicFormRenderer.jsx**: Renders individual form fields
- **AppContext.jsx**: Manages application state
- **useAPI.js**: Handles DHIS2 API interactions

## Testing the System

### 1. Enable Debug Mode

Click the "🔍 Debug" button to see:
- Current facility classification
- Section visibility status
- Hidden sections list

### 2. Change Facility Types

1. Select different facilities from the dropdown
2. Watch how sections appear/disappear
3. Check console logs for visibility decisions

### 3. Verify Section Filtering

- **Before Confirmation**: Only Inspection Information and Inspection Type sections
- **After Confirmation**: Remaining sections based on facility classification
- **Hidden Sections**: Should not appear in the form

## Console Logging

The system provides detailed console logging:

```
🔍 Section "SECTION C-POLICIES AND PROCEDURES" for "Potrait clinic": HIDE
🚫 Hiding section "SECTION C-POLICIES AND PROCEDURES" for facility type "Potrait clinic"
🔍 Current facility classification set - showing relevant sections
```

## Troubleshooting

### Common Issues

1. **Sections Not Filtering**
   - Check facility classification is set correctly
   - Verify section names match exactly in configuration
   - Enable debug mode to see visibility decisions

2. **Wrong Facility Type Detected**
   - Check DHIS2 facility classification field
   - Verify CSV configuration data
   - Use debug panel to see current classification

3. **Configuration Not Loading**
   - Ensure `sectionVisibilityConfig.js` is properly imported
   - Check for JavaScript syntax errors
   - Verify build process completes successfully

### Debug Steps

1. Open browser console
2. Enable debug panel in the form
3. Check facility classification detection
4. Verify section filtering logic
5. Review console logs for errors

## Future Enhancements

### Potential Improvements

1. **Dynamic Configuration Loading**
   - Load rules from DHIS2 dataStore
   - Allow runtime configuration changes

2. **Advanced Filtering Rules**
   - Date-based section visibility
   - User role-based filtering
   - Conditional field dependencies

3. **User Interface Improvements**
   - Visual indicators for hidden sections
   - Section availability preview
   - Bulk section visibility toggles

## Support

For questions or issues with the conditional filtering system:

1. Check the console logs for error messages
2. Verify the configuration file syntax
3. Test with different facility types
4. Use the debug panel for troubleshooting

## Example Use Cases

### Case 1: Laboratory Inspection
- **Facility Type**: Laboratory
- **Visible Sections**: All sections (comprehensive inspection)
- **Focus**: Technical requirements and safety protocols

### Case 2: Portrait Clinic Inspection
- **Facility Type**: Portrait clinic
- **Visible Sections**: A and B only
- **Hidden Sections**: SECTION C (policies not applicable)
- **Focus**: Basic organizational and statutory requirements

### Case 3: Dental Clinic Inspection
- **Facility Type**: Dental clinic
- **Visible Sections**: All sections
- **Focus**: Infection control and specialized procedures

