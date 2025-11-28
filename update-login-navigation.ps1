# PowerShell script to update LoginPage.jsx to navigate to new form after login

$path = "src\pages\LoginPage.jsx"
$content = Get-Content $path -Raw

# Add the generateDHIS2Id helper function and update handleSubmit
$oldHandleSubmit = @"
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.serverUrl, formData.username, formData.password);
    } catch (error) {
      // Error is handled by the context and displayed via toast
      console.error('Login failed:', error);
    }
  };
"@

$newHandleSubmit = @"
  // Helper to generate DHIS2 compatible ID
  const generateDHIS2Id = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = chars.charAt(Math.floor(Math.random() * 52)); // Start with letter
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * 62));
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.serverUrl, formData.username, formData.password);
      
      // After successful login, navigate to a new form with a fresh ID
      const newId = generateDHIS2Id();
      window.location.href = `/form/${newId}`;
    } catch (error) {
      // Error is handled by the context and displayed via toast
      console.error('Login failed:', error);
    }
  };
"@

# Normalize line endings
$content = $content -replace "`r`n", "`n"
$oldHandleSubmit = $oldHandleSubmit -replace "`r`n", "`n"
$newHandleSubmit = $newHandleSubmit -replace "`r`n", "`n"

# Apply changes
if ($content.Contains($oldHandleSubmit)) {
    $content = $content.Replace($oldHandleSubmit, $newHandleSubmit)
    Set-Content $path -Value $content -NoNewline
    Write-Host "✅ Successfully updated LoginPage.jsx to navigate to new form after login"
} else {
    Write-Error "❌ Could not find handleSubmit function to update"
}
