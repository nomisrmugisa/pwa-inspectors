# Clear Form Data on Logout - Implementation Summary

## Overview
This implementation ensures that when a user logs out and logs back in, they start with a fresh record instead of continuing with old draft forms from the previous session.

## Changes Made

### File: `src/contexts/AppContext.jsx`

#### 1. Updated `logout()` function (lines 777-819)

**What was changed:**
- Added code to delete the `InspectionFormDB` IndexedDB database on logout
- Updated the logout confirmation message to inform users that draft forms will be cleared

**Why this matters:**
- Previously, only synced events and authentication data were cleared on logout
- Draft form data stored in `InspectionFormDB` persisted across login sessions
- Now, all data is cleared, ensuring a clean slate for each login session

**Implementation details:**
```javascript
// Clear InspectionFormDB to start fresh on next login
try {
  const formDBRequest = indexedDB.deleteDatabase('InspectionFormDB');
  formDBRequest.onsuccess = () => {
    console.log('✅ InspectionFormDB cleared successfully');
  };
  formDBRequest.onerror = (error) => {
    console.warn('⚠️ Failed to clear InspectionFormDB:', error);
  };
  formDBRequest.onblocked = () => {
    console.warn('⚠️ InspectionFormDB deletion blocked - close all tabs using this database');
  };
} catch (formDBError) {
  console.warn('Failed to clear form database:', formDBError);
  // Continue with logout anyway
}
```

## How It Works

### Before Logout:
1. User is working on inspection forms
2. Form data is automatically saved to `InspectionFormDB` (incremental save)
3. Synced events are stored in `DHIS2PWA` database

### During Logout:
1. User clicks logout button
2. Confirmation dialog appears: "Logging out will clear all data from this device, including draft forms. Do you want to continue?"
3. If confirmed:
   - Clears synced events from `DHIS2PWA` database
   - Clears authentication data
   - **NEW:** Deletes entire `InspectionFormDB` database
4. User is redirected to login page

### After Login:
1. User logs in with credentials
2. Fresh session starts
3. No old draft forms are present
4. User can start a new inspection record from scratch

## Error Handling

The implementation includes robust error handling:
- **Success callback**: Logs successful deletion
- **Error callback**: Logs errors but continues with logout
- **Blocked callback**: Warns if database deletion is blocked (e.g., other tabs are using it)
- **Try-catch wrapper**: Ensures logout proceeds even if database deletion fails

## Testing Recommendations

1. **Basic Flow:**
   - Create a new inspection and fill in some fields
   - Save as draft
   - Logout
   - Login again
   - Verify no draft forms are present

2. **Multiple Tabs:**
   - Open the app in multiple tabs
   - Create drafts in one tab
   - Logout from another tab
   - Check console for "blocked" warnings
   - Close all tabs and verify database is cleared

3. **Offline Scenario:**
   - Work offline and create drafts
   - Logout (should still clear data)
   - Login again
   - Verify clean state

## Benefits

✅ **Clean Sessions**: Each login starts fresh without old data  
✅ **User Privacy**: Previous user's draft data is not accessible to next user  
✅ **Data Integrity**: Prevents confusion from mixing old and new inspection data  
✅ **Clear Communication**: Users are informed that draft forms will be cleared  

## Notes

- The database deletion is asynchronous but non-blocking
- Logout proceeds even if database deletion fails
- Console logs help with debugging
- The `InspectionFormDB` will be automatically recreated when the user starts a new form
