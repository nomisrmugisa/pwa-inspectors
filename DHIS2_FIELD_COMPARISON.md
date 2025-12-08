# DHIS2 DataElement Field Used for Comparison

**Last Updated:** 2025-12-04

## Answer: `displayName` Field

The application uses the **`displayName`** field from DHIS2 dataElement metadata to compare against the CSV configuration questions.

---

## Evidence from Code

### 1. **FormPage.jsx** (Line 5818)
```javascript
const shouldShow = shouldShowDataElementForService(
  psde.dataElement.displayName,  // ← Uses displayName
  currentFacilityType
);
```

### 2. **FormPage.jsx** (Lines 1334-1347)
```javascript
// For comment elements
const mainElementPasses = shouldShowDataElementForService(
  mainElementName,
  facilityType
);

// For main elements
const shouldShow = shouldShowDataElementForService(
  displayName,  // ← Uses displayName
  facilityType
);
```

### 3. **csvConfigParser.js** (Lines 477-478)
```javascript
const showMain = await shouldShowDataElementForService(
  pair.mainDataElement.displayName,  // ← Uses displayName
  section.name, 
  facilityType, 
  false
);

const showComment = pair.commentDataElement ? 
  await shouldShowDataElementForService(
    pair.commentDataElement.displayName,  // ← Uses displayName
    section.name, 
    facilityType, 
    true, 
    pair.mainDataElement.displayName
  ) : false;
```

---

## DHIS2 DataElement Metadata Structure

```json
{
  "id": "xYz123456Ab",
  "name": "Does the bleeding room have space? Elaborate.",
  "displayName": "Does the bleeding room have space? Elaborate.",  // ← THIS FIELD IS USED
  "shortName": "Bleeding room space",
  "code": "BLEEDING_ROOM_SPACE",
  "valueType": "TEXT",
  "domainType": "TRACKER",
  "aggregationType": "NONE"
}
```

---

## Why `displayName` Instead of `name`?

In DHIS2:
- **`name`**: Internal identifier, may have restrictions
- **`displayName`**: User-facing label, often same as `name` but can be different
- **`shortName`**: Abbreviated version for displays

The code uses `displayName` because:
1. ✅ It's the user-facing field that typically matches what you see in CSV
2. ✅ It's more likely to match your CSV question text exactly
3. ✅ It's what appears in the DHIS2 UI forms

---

## Critical Matching Requirement

For a BLEEDING ROOM dataElement to be shown, its `displayName` must **EXACTLY match** the CSV question:

### ✅ CORRECT Match:
```javascript
// CSV Question
"Does the bleeding room have space? Elaborate."

// DHIS2 metadata
{
  "displayName": "Does the bleeding room have space? Elaborate."
}
// → Will SHOW
```

### ❌ INCORRECT Matches:
```javascript
// Case mismatch
{
  "displayName": "does the bleeding room have space? Elaborate."
}
// → Will NOT show

// Punctuation mismatch
{
  "displayName": "Does the bleeding room have space Elaborate"
}
// → Will NOT show

// Extra spaces
{
  "displayName": "Does the bleeding room have space?  Elaborate."
}
// → Will NOT show
```

---

## How the Matching Works

### Step 1: Load CSV Configuration
```javascript
// CSV is parsed to extract questions
const csvQuestions = [
  "Does the bleeding room have space? Elaborate.",
  "Does the room have wheelchair accessibility?",
  // ...
];
```

### Step 2: Generate Filter Configuration
```bash
python src\config\generateFilters.py
```
This creates `.js` files with exact question names in `showOnly` arrays.

### Step 3: Load DHIS2 DataElements
```javascript
// App fetches program stage dataElements
const dataElements = programStage.programStageDataElements.map(psde => ({
  id: psde.dataElement.id,
  displayName: psde.dataElement.displayName,  // ← This is what gets compared
  ...
}));
```

### Step 4: Filter DataElements
```javascript
// For each dataElement, check if it should be shown
function shouldShowDataElementForService(dataElementName, selectedService) {
  const serviceFilters = facilityServiceFilters[selectedService];
  
  for (const section in serviceFilters) {
    if (serviceFilters[section].showOnly && 
        serviceFilters[section].showOnly.includes(dataElementName)) {  // ← Exact string match
      return true;
    }
  }
  
  return false;
}
```

---

## Summary

| Field | Used For Comparison? | Purpose |
|-------|---------------------|---------|
| `displayName` | ✅ **YES** | This is compared against CSV questions |
| `name` | ❌ No | Not used in filtering logic |
| `shortName` | ❌ No | Not used in filtering logic |
| `code` | ❌ No | Not used in filtering logic |

---

## Action Items

To ensure BLEEDING ROOM dataElements display correctly:

1. **Export your DHIS2 dataElements** and check their `displayName` values
2. **Compare with CSV** questions character-by-character
3. **Update either**:
   - **Option A:** Update DHIS2 `displayName` to match CSV exactly
   - **Option B:** Update CSV questions to match DHIS2 `displayName` exactly
4. **Regenerate configuration**: `python src\config\generateFilters.py`
5. **Test in app**

---

## Debugging Tips

If dataElements don't show:
1. Open browser console
2. Check filtering logs
3. Verify `displayName` values match exactly
4. Check for hidden characters or encoding issues
5. Validate section names match exactly too

---

**Conclusion:** The `displayName` field from DHIS2 dataElement metadata is used for all comparisons. Ensure exact character-for-character matching between CSV questions and DHIS2 `displayName` values.
