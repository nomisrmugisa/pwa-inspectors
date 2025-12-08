# Fix Progress Bar Refresh Issue
# This script applies two fixes:
# 1. Disables DebugInfo component to stop infinite loop
# 2. Fixes the loadExistingData useEffect to prevent infinite loop

Write-Host "Applying progress bar refresh fixes..." -ForegroundColor Cyan

# Fix 1: Disable DebugInfo component
$debugInfoPath = "src\components\DebugInfo.jsx"
Write-Host "`n1. Disabling DebugInfo component..." -ForegroundColor Yellow

$debugInfoContent = Get-Content $debugInfoPath -Raw
$debugInfoFixed = $debugInfoContent -replace 'export function DebugInfo\(\) \{', @'
export function DebugInfo() {
  // Temporarily disabled to prevent infinite loop from console interceptor
  return null;
  
'@

Set-Content -Path $debugInfoPath -Value $debugInfoFixed -NoNewline
Write-Host "   ✓ DebugInfo disabled" -ForegroundColor Green

# Fix 2: Fix loadExistingData useEffect dependencies
$formPagePath = "src\pages\FormPage.jsx"
Write-Host "`n2. Fixing loadExistingData useEffect..." -ForegroundColor Yellow

$formPageContent = Get-Content $formPagePath -Raw
# Remove loadFormData and showToast from the dependency array
$formPageFixed = $formPageContent -replace '\}, \[eventId, loadFormData, showToast\]\);', '}, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps'

Set-Content -Path $formPagePath -Value $formPageFixed -NoNewline
Write-Host "   ✓ useEffect dependencies fixed" -ForegroundColor Green

Write-Host "`n✅ All fixes applied successfully!" -ForegroundColor Green
Write-Host "`nPlease refresh your browser to see the changes." -ForegroundColor Cyan
