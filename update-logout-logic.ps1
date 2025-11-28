# PowerShell script to update AppContext.jsx logout function

$path = "src\contexts\AppContext.jsx"
$content = Get-Content $path -Raw

# Step 1: Add import for indexedDBService
$oldImports = @"
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAPI } from '../hooks/useAPI';
import { useStorage } from '../hooks/useStorage';
"@

$newImports = @"
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAPI } from '../hooks/useAPI';
import { useStorage } from '../hooks/useStorage';
import indexedDBService from '../services/indexedDBService';
"@

# Step 2: Update logout function
$oldLogout = @"
  const logout = async () => {
    const confirmed = window.confirm(
      "Logging out will clear all synced data from this device. Do you want to continue?"
    );
    if (!confirmed) return;

    try {
      if (storage.isReady) {
        try {
          await storage.clearSyncedEvents();
          await storage.clearAuth();
        } catch (storageError) {
          console.warn('Failed to clear stored credentials:', storageError);
          // Continue with logout anyway
        }
      }
      dispatch({ type: ActionTypes.LOGOUT });
      showToast('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if storage fails
      dispatch({ type: ActionTypes.LOGOUT });
      showToast('Logged out', 'info');
    }
  };
"@

$newLogout = @"
  const logout = async () => {
    const confirmed = window.confirm(
      "Logging out will clear all synced data and form drafts from this device. Do you want to continue?"
    );
    if (!confirmed) return;

    try {
      if (storage.isReady) {
        try {
          await storage.clearSyncedEvents();
          await storage.clearAuth();
        } catch (storageError) {
          console.warn('Failed to clear stored credentials:', storageError);
          // Continue with logout anyway
        }
      }
      
      // Clear all form drafts from IndexedDB
      try {
        await indexedDBService.clearAll();
        console.log('✅ Cleared all form drafts from IndexedDB');
      } catch (indexedDBError) {
        console.warn('Failed to clear IndexedDB:', indexedDBError);
        // Continue with logout anyway
      }
      
      // Clear localStorage items related to forms
      try {
        localStorage.removeItem('lastSelectedFacility');
        console.log('✅ Cleared localStorage form data');
      } catch (localStorageError) {
        console.warn('Failed to clear localStorage:', localStorageError);
        // Continue with logout anyway
      }
      
      dispatch({ type: ActionTypes.LOGOUT });
      showToast('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if storage fails
      dispatch({ type: ActionTypes.LOGOUT });
      showToast('Logged out', 'info');
    }
  };
"@

# Normalize line endings
$content = $content -replace "`r`n", "`n"
$oldImports = $oldImports -replace "`r`n", "`n"
$newImports = $newImports -replace "`r`n", "`n"
$oldLogout = $oldLogout -replace "`r`n", "`n"
$newLogout = $newLogout -replace "`r`n", "`n"

# Apply changes
$changesMade = 0

if ($content.Contains($oldImports)) {
    $content = $content.Replace($oldImports, $newImports)
    Write-Host "✅ Added indexedDBService import"
    $changesMade++
} else {
    Write-Warning "⚠️ Could not find import section to update"
}

if ($content.Contains($oldLogout)) {
    $content = $content.Replace($oldLogout, $newLogout)
    Write-Host "✅ Updated logout function to clear form drafts"
    $changesMade++
} else {
    Write-Warning "⚠️ Could not find logout function to update"
}

if ($changesMade -eq 2) {
    Set-Content $path -Value $content -NoNewline
    Write-Host "`n✅ Successfully updated AppContext.jsx ($changesMade changes applied)"
} else {
    Write-Error "❌ Failed to apply all changes. Only $changesMade/2 changes were made."
}
