# Clear Form After Save - Implementation Guide

## 📋 Requirement

After saving an inspection (either as draft or final submission), clear the form and prepare for a new entry instead of navigating to the dashboard.

## 🎯 Current Behavior

Currently, after saving:
```javascript
// Line ~5250 in FormPage.jsx
navigate('/home'); // Goes to dashboard
```

## ✅ Desired Behavior

After saving, the app should:
1. Clear the current form data
2. Delete the IndexedDB entry for the current event
3. Navigate to a fresh form (`/form`) 
4. Show a success message
5. Allow immediate entry of a new inspection

## 🔧 Implementation

### Changes Needed in `handleSave` Function

**Location:** `src/pages/FormPage.jsx` - around line 5129-5261

**Find this code:**
```javascript
const savedEvent = await saveEvent(eventData, saveDraft);

setIsDraft(saveDraft);

// Always navigate to dashboard after successful save (both draft and final)
navigate('/home');
```

**Replace with:**
```javascript
const savedEvent = await saveEvent(eventData, saveDraft);

setIsDraft(saveDraft);

// Clear the IndexedDB form data for this event after successful save
if (finalEventId) {
  try {
    await indexedDBService.deleteFormData(finalEventId);
    console.log('✅ Cleared form data from IndexedDB after save');
  } catch (error) {
    console.warn('⚠️ Failed to clear form data from IndexedDB:', error);
  }
}

// Navigate to new blank form for next inspection (instead of dashboard)
// This allows users to immediately start a new entry
navigate('/form');

// Show success message
showToast(
  saveDraft ? 'Draft saved! Starting new form...' : 'Inspection submitted! Starting new form...', 
  'success'
);
```

**Also update the error handler:**

**Find:**
```javascript
} catch (error) {

  console.error('Failed to save event:', error);

  showToast(`Failed to save: ${error.message}`, 'error');

  // Always navigate to dashboard even on failure (both draft and final)
  navigate('/home');

} finally {
```

**Replace with:**
```javascript
} catch (error) {

  console.error('Failed to save event:', error);

  showToast(`Failed to save: ${error.message}`, 'error');

  // On error, navigate to dashboard to see existing records
  navigate('/home');

} finally {
```

## 📊 Flow Diagram

### Before (Current):
```
Fill Form → Submit → Save to DB → Navigate to Dashboard
                                        ↓
                              User sees saved inspection
                              Must click "New Inspection"
```

### After (New):
```
Fill Form → Submit → Save to DB → Clear Form Data → Navigate to /form
                                                           ↓
                                                  Fresh blank form ready
                                                  User can start new entry immediately
```

## 🎯 Benefits

1. **Faster workflow** - No need to navigate back to form
2. **Clear separation** - Each save starts fresh
3. **Less clicks** - Eliminates "New Inspection" button click
4. **Better UX** - Immediate feedback that save was successful
5. **Data safety** - Old form data is cleared, preventing confusion

## 🧪 Testing Checklist

After implementing:

- [ ] Fill out a form and submit
- [ ] Verify you're redirected to a blank form
- [ ] Verify success toast appears
- [ ] Verify old form data is cleared (check IndexedDB)
- [ ] Fill out another form to confirm workflow
- [ ] Test "Save as Draft" button - should also clear and redirect
- [ ] Test error scenario - should go to dashboard
- [ ] Verify saved inspections appear in dashboard when you navigate there manually

## 📝 Alternative Approach

If you prefer to stay on the same page and just clear the data:

**Instead of `navigate('/form')`, use:**
```javascript
// Clear all form state
setFormData({
  orgUnit: '',
  eventDate: getBotswanaDate()
});
setIntervieweeSignature(null);
setSelectedServiceDepartments([]);
setManualSpecialization('');
setFacilityType(null);
setInspectionInfoConfirmed(false);

// Clear IndexedDB
if (finalEventId) {
  await indexedDBService.deleteFormData(finalEventId);
}

// Generate new event ID for next entry
// This will be handled by the useEffect that checks for eventId

showToast(
  saveDraft ? 'Draft saved! Form cleared for new entry.' : 'Inspection submitted! Form cleared for new entry.', 
  'success'
);
```

However, **navigating to `/form` is cleaner** as it ensures a complete reset of all component state.

## 🚀 Quick Implementation

**Manual Edit:**
1. Open `src/pages/FormPage.jsx`
2. Find line ~5250 (search for `navigate('/home')` in handleSave)
3. Replace the two occurrences as shown above
4. Save the file
5. Test the workflow

**The change is minimal** - just 3 lines of code changes:
1. Add IndexedDB cleanup
2. Change `/home` to `/form`
3. Add success toast message

---

**Status:** Ready to implement
**Priority:** Medium
**Complexity:** Low (3 line change)
**Testing Time:** 5 minutes
