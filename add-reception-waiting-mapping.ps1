# Add mapping for FACILITY-RECEPTION/WAITING AREA

$filePath = "src\pages\FormPage.jsx"
$content = Get-Content $filePath -Raw

# Find the PATIENT WAITING AREA line and add FACILITY-RECEPTION/WAITING AREA after it
$pattern = "      'PATIENT WAITING AREA': \['WAITING', 'WAITING AREA', 'PATIENT WAITING'\],"
$replacement = @"
      'PATIENT WAITING AREA': ['WAITING', 'WAITING AREA', 'PATIENT WAITING'],
      'FACILITY-RECEPTION/WAITING AREA': ['FACILITY-RECEPTION/WAITING AREA', 'FACILITY-RECEPTION', 'RECEPTION', 'WAITING', 'WAITING AREA'],
"@

$content = $content -replace [regex]::Escape($pattern), $replacement

Set-Content $filePath -Value $content -NoNewline

Write-Host "✅ Added mapping for FACILITY-RECEPTION/WAITING AREA!" -ForegroundColor Green
Write-Host "Please refresh your browser to see the changes." -ForegroundColor Cyan
