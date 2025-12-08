# Progress Bar Debugging Guide

## Issue
Progress bar not updating when service departments are selected.

## Changes Made

### 1. Added Force Re-render on Department Change (Line 3516-3520)
```javascript
useEffect(() => {
  setLastUpdateTimestamp(Date.now());
}, [selectedServiceDepartments]);
```

### 2. Added Key Prop to FloatingProgress (Line 6125)
```javascript
<FloatingProgress key={JSON.stringify(selectedServiceDepartments)} />
```

### 3. Removed Early Return for Empty Sections (Line 5978-5984)
- Progress bar now shows even with 0% completion
- Helps users see that sections are available

### 4. Added Comprehensive Debug Logging
Check browser console for these logs:
- `📊 getVisibleSections called` - Shows when sections are being calculated
- `🏥 Current classification` - Shows the selected facility type
- `✅ Section passed all filters` - Shows which sections are visible
- `❌ Section filtered out` - Shows why sections are hidden
- `🎯 FloatingProgress render` - Shows progress bar state

## How to Debug

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)

2. **Start New Inspection**
   - Select a facility type (e.g., "General Practice")
   - Select service departments (e.g., "PERSONNEL", "SUPPLIES")

3. **Check Console Logs**
   Look for:
   - `📊 getVisibleSections called` - Should show `selectedServiceDepartments: ["PERSONNEL", "SUPPLIES"]`
   - `📋 Filtered sections: X out of Y` - Should show how many sections passed filters
   - `🎯 FloatingProgress render` - Should show `visibleSections: X`

4. **Common Issues**
   - If `serviceSectionsCount: 0` → Sections haven't loaded from DHIS2 yet
   - If `selectedServiceDepartments: []` → Departments not being saved to state
   - If all sections show `❌ filtered out by departments` → Department matching logic issue

## Expected Behavior

When you select "PERSONNEL" department:
- Console should show: `✅ Section "PERSONNEL" passed all filters`
- Progress bar should appear showing "0/X sections complete"
- As you fill fields, progress should update

## Next Steps if Still Not Working

Check console for specific error messages and share:
1. What `serviceSectionsCount` shows
2. What `selectedServiceDepartments` shows
3. Which sections are being filtered out and why
