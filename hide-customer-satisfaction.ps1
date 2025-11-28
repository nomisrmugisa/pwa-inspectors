# PowerShell script to hide CUSTOMER SATISFACTION section by default

$path = "src\config\sectionVisibilityConfig.js"
$content = Get-Content $path -Raw

# Replace 'CUSTOMER SATISFACTION': true with 'CUSTOMER SATISFACTION': false
# This will hide it for all facility types in the configuration
if ($content.Contains("'CUSTOMER SATISFACTION': true")) {
    $content = $content.Replace("'CUSTOMER SATISFACTION': true", "'CUSTOMER SATISFACTION': false")
    Set-Content $path -Value $content -NoNewline
    Write-Host "✅ Successfully updated configuration to hide CUSTOMER SATISFACTION."
} else {
    Write-Warning "⚠️ Could not find 'CUSTOMER SATISFACTION': true in the configuration file."
}
