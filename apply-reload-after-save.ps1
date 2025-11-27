# PowerShell script to update FormPage.jsx - Reload app with fresh event after save

$filePath = "src\pages\FormPage.jsx"
$content = Get-Content $filePath -Raw

# Define the old code to replace
$oldCode1 = @"
        setIsDraft(saveDraft);

        // Navigate to new blank form for next inspection (instead of dashboard)
        // This allows users to immediately start a new entry
        navigate('/form');
        
        // Show success message
        showToast(
          saveDraft ? 'Draft saved! Starting new form...' : 'Inspection submitted! Starting new form...', 
          'success'
        );
"@

# Define the new code with page reload
$newCode1 = @"
        setIsDraft(saveDraft);

        // Show success message before reload
        showToast(
          saveDraft ? 'Draft saved! Reloading...' : 'Inspection submitted! Reloading...', 
          'success'
        );
        
        // Reload the app with a fresh form after a brief delay to show the toast
        setTimeout(() => {
          window.location.href = '/form';
        }, 1000);
"@

# Replace the code
$content = $content.Replace($oldCode1, $newCode1)

# Write the updated content back to the file
Set-Content $filePath -Value $content -NoNewline

Write-Host "✅ Successfully updated FormPage.jsx"
Write-Host "Changes made:"
Write-Host "  1. Changed to full page reload instead of React Router navigation"
Write-Host "  2. Added 1 second delay to show success toast"
Write-Host "  3. Reloads to /form with completely fresh state"
Write-Host "  4. New event ID will be generated on reload"
