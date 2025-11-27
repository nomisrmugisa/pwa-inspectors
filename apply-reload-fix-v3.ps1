# PowerShell script to update FormPage.jsx - Fix reload logic with 3s delay (Robust Version)

$filePath = "src\pages\FormPage.jsx"
$content = Get-Content $filePath -Raw

# 1. Replace the Success Logic
$oldSuccess = "// Always navigate to dashboard after successful save (both draft and final)`r`n        navigate('/home');"
$newSuccess = "// Show success message before reload
        showToast(
          saveDraft ? 'Draft saved! Reloading...' : 'Inspection submitted! Reloading...', 
          'success'
        );
        
        // Reload the app with a fresh form after a brief delay to show the toast
        setTimeout(() => {
          window.location.href = '/form';
        }, 3000);"

if ($content.Contains($oldSuccess)) {
    $content = $content.Replace($oldSuccess, $newSuccess)
    Write-Host "✅ Replaced success logic."
} else {
    # Try matching with different line endings just in case
    $oldSuccessUnix = $oldSuccess.Replace("`r`n", "`n")
    if ($content.Contains($oldSuccessUnix)) {
        $content = $content.Replace($oldSuccessUnix, $newSuccess)
        Write-Host "✅ Replaced success logic (Unix line endings)."
    } else {
        Write-Warning "⚠️ Could not find success logic block."
    }
}

# 2. Replace the Error Logic (Comment update)
$oldError = "// Always navigate to dashboard even on failure (both draft and final)`r`n        navigate('/home');"
$newError = "// On error, navigate to dashboard to see existing records
        navigate('/home');"

if ($content.Contains($oldError)) {
    $content = $content.Replace($oldError, $newError)
    Write-Host "✅ Replaced error logic."
} else {
     # Try matching with different line endings
    $oldErrorUnix = $oldError.Replace("`r`n", "`n")
    if ($content.Contains($oldErrorUnix)) {
        $content = $content.Replace($oldErrorUnix, $newError)
        Write-Host "✅ Replaced error logic (Unix line endings)."
    } else {
        Write-Warning "⚠️ Could not find error logic block."
    }
}

Set-Content $filePath -Value $content -NoNewline
Write-Host "✅ Done."
