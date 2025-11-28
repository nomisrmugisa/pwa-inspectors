# PowerShell script to update handleNewForm in HomePage.jsx

$path = "src\pages\HomePage.jsx"
$content = Get-Content $path -Raw

# Define the old code block to replace
$oldCode = @"
  const handleNewForm = () => {
    if (!configuration) {
      showToast('Configuration not loaded yet', 'warning');
      return;
    }
    navigate('/form');
  };
"@

# Define the new code block with ID generation and full reload
$newCode = @"
  // Helper to generate DHIS2 compatible ID
  const generateDHIS2Id = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = chars.charAt(Math.floor(Math.random() * 52)); // Start with letter
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * 62));
    }
    return result;
  };

  const handleNewForm = () => {
    if (!configuration) {
      showToast('Configuration not loaded yet', 'warning');
      return;
    }
    
    // Generate a new ID and force a full reload to ensure a completely clean state
    // This bypasses any "restore draft" logic that might trigger on /form
    const newId = generateDHIS2Id();
    window.location.href = `/form/${newId}`;
  };
"@

# Normalize line endings
$content = $content -replace "`r`n", "`n"
$oldCode = $oldCode -replace "`r`n", "`n"
$newCode = $newCode -replace "`r`n", "`n"

if ($content.Contains($oldCode)) {
    $content = $content.Replace($oldCode, $newCode)
    Set-Content $path -Value $content -NoNewline
    Write-Host "✅ Successfully updated handleNewForm to force fresh form load."
} else {
    Write-Warning "⚠️ Could not find the exact handleNewForm code block."
    # Debug: print what we were looking for vs what might be there
    Write-Host "Looking for:"
    Write-Host $oldCode
}
