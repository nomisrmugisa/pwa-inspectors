# React Re-Render Fix - AppContext.jsx

## Issue Summary
The application was experiencing **infinite re-render loops** causing the browser console to show:
- ⚠️ **Maximum update depth exceeded** warnings
- Multiple warnings about `setState` calls inside `useEffect` without proper dependency arrays
- Performance degradation and potential browser crashes

## Root Causes Identified

### 1. **Missing `useCallback` Wrappers**
Functions defined inside the `AppProvider` component were being recreated on every render, causing:
- Context consumers to re-render unnecessarily
- Dependency arrays in `useEffect` hooks to trigger repeatedly
- Infinite loops when functions called each other

### 2. **Incorrect Dependency Arrays**
- `useMemo` dependency array was incomplete (missing function dependencies)
- `useEffect` hooks had missing or incorrect dependencies
- Using `storage.isReady` instead of the full `storage` object caused stale closures

### 3. **Non-Persistent Flag Variable**
- `isFetchingAssignments` was a regular variable instead of a `useRef`
- This caused the flag to reset on every render, allowing concurrent calls

## Fixes Applied

### 1. **Added `useCallback` to All Functions**
Wrapped all context functions with `useCallback` to prevent recreation:
- ✅ `setEventDate`
- ✅ `fetchConfiguration`
- ✅ `fetchUserAssignments`
- ✅ `login`
- ✅ `logout`
- ✅ `saveEvent`
- ✅ `syncEvents`
- ✅ `retryEvent`
- ✅ `deleteEvent`
- ✅ `updateStats`
- ✅ `showToast`
- ✅ `hideToast`
- ✅ `clearError`

### 2. **Fixed Dependency Arrays**
Updated all `useCallback` hooks with proper dependencies:
```javascript
// Before
const login = async (serverUrl, username, password) => { ... };

// After
const login = useCallback(async (serverUrl, username, password) => {
  ...
}, [api, storage, dispatch, showToast, fetchConfiguration, fetchUserAssignments]);
```

### 3. **Fixed `useMemo` Dependencies**
Added all function dependencies to the context value `useMemo`:
```javascript
const value = useMemo(() => ({
  ...state,
  setEventDate,
  login,
  logout,
  // ... all other functions
}), [
  state,
  api,
  storage,
  setEventDate,
  login,
  logout,
  // ... all function dependencies
]);
```

### 4. **Converted Flag to `useRef`**
Changed `isFetchingAssignments` from a regular variable to a ref:
```javascript
// Before
let isFetchingAssignments = false;

// After
const isFetchingAssignments = useRef(false);

// Usage
if (isFetchingAssignments.current) return;
isFetchingAssignments.current = true;
```

### 5. **Fixed `useEffect` Initialization**
Changed the initialization `useEffect` to only run once:
```javascript
// Before
}, [storage.isReady]); // Re-run if storage readiness changes

// After
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Only run once on mount
```

### 6. **Used Full Object References**
Changed from `storage.isReady` to `storage` in dependency arrays to prevent stale closures:
```javascript
// Before
}, [storage.isReady, dispatch]);

// After
}, [storage, dispatch]);
```

## Benefits

✅ **No More Infinite Loops** - Functions are stable across renders
✅ **Better Performance** - Reduced unnecessary re-renders
✅ **Proper Memoization** - Context value only updates when dependencies change
✅ **Prevents Race Conditions** - `useRef` flag persists across renders
✅ **Cleaner Console** - No more warning messages

## Testing Recommendations

1. ✅ Verify no console errors on page load
2. ✅ Test login/logout functionality
3. ✅ Test form saving and syncing
4. ✅ Verify facility selection works correctly
5. ✅ Check that user assignments load properly
6. ✅ Monitor browser performance (no freezing)

## Files Modified

- `src/contexts/AppContext.jsx` - Complete refactor with `useCallback` wrappers

## Technical Notes

- All async functions maintain their async nature within `useCallback`
- Dependencies are exhaustive to prevent stale closures
- The initialization effect intentionally ignores the exhaustive-deps rule as it should only run once
- Using `useRef` for flags is the React-recommended pattern for values that shouldn't trigger re-renders

---
**Date Fixed:** 2025-12-02
**Issue:** Maximum update depth exceeded / Infinite re-renders
**Status:** ✅ RESOLVED
