# PowerShell script to update AppContext.jsx logout function - v2

$path = "src\contexts\AppContext.jsx"
$content = Get-Content $path -Raw

# Update logout function with correct indentation (4 spaces)
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
$oldLogout = $oldLogout -replace "`r`n", "`n"
$newLogout = $newLogout -replace "`r`n", "`n"

# Apply changes
if ($content.Contains($oldLogout)) {
    $content = $content.Replace($oldLogout, $newLogout)
    Set-Content $path -Value $content -NoNewline
    Write-Host "✅ Successfully updated logout function to clear form drafts"
} else {
    Write-Error "❌ Could not find logout function to update"
}
