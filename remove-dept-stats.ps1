# PowerShell script to remove department stats display

$path = "src\pages\FormPage.jsx"
$content = Get-Content $path -Raw

# Define the block to remove. 
# Note: We use a regex to be more robust against whitespace variations
$pattern = "\s+\{departmentStats && \(\s+<span style=\{\{\s+backgroundColor: '#f0f8ff',\s+padding: '2px 6px',\s+borderRadius: '8px',\s+fontSize: '11px'\s+\}\}>\s+\{departmentStats\.available\}/\{departmentStats\.total\} departments\s+</span>\s+\)\}"

if ($content -match $pattern) {
    $content = $content -replace $pattern, ""
    Set-Content $path -Value $content -NoNewline
    Write-Host "✅ Successfully removed department stats display."
} else {
    Write-Warning "⚠️ Could not find the department stats block to remove."
    
    # Fallback: Try exact string match if regex fails (sometimes regex escaping is tricky)
    $exactBlock = @"
              {departmentStats && (
                <span style={{ 
                  backgroundColor: '#f0f8ff',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}>
                  {departmentStats.available}/{departmentStats.total} departments
                </span>
              )}
"@
    # Normalize line endings
    $contentNormalized = $content -replace "`r`n", "`n"
    $exactBlockNormalized = $exactBlock -replace "`r`n", "`n"
    
    if ($contentNormalized.Contains($exactBlockNormalized)) {
        $newContent = $contentNormalized.Replace($exactBlockNormalized, "")
        Set-Content $path -Value $newContent -NoNewline
        Write-Host "✅ Successfully removed department stats display (using exact match)."
    } else {
        Write-Error "❌ Failed to find block with exact match either."
    }
}
