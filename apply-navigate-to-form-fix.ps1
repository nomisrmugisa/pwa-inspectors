# PowerShell script to update FormPage.jsx - Navigate to fresh form after save (without deleting IndexedDB)

$filePath = "src\pages\FormPage.jsx"
$content = Get-Content $filePath -Raw

# Define the old code to replace
$oldCode1 = @"
        setIsDraft(saveDraft);

        // Always navigate to dashboard after successful save (both draft and final)
        navigate('/home');
"@

# Define the new code (without IndexedDB deletion)
$newCode1 = @"
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

# Replace the first occurrence
$content = $content.Replace($oldCode1, $newCode1)

# Define the second old code to replace (error handler)
$oldCode2 = @"
        // Always navigate to dashboard even on failure (both draft and final)
        navigate('/home');
"@

# Define the new code for error handler
$newCode2 = @"
        // On error, navigate to dashboard to see existing records
        navigate('/home');
"@

# Replace the second occurrence
$content = $content.Replace($oldCode2, $newCode2)

# Write the updated content back to the file
Set-Content $filePath -Value $content -NoNewline

Write-Host "✅ Successfully updated FormPage.jsx"
Write-Host "Changes made:"
Write-Host "  1. Changed navigation from /home to /form after successful save"
Write-Host "  2. Added success toast message"
Write-Host "  3. Updated error handler comment"
Write-Host "  4. IndexedDB data is NOT automatically deleted (user can manage manually)"
