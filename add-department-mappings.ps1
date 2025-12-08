# Add department mappings for FACILITY CONSULTATION/TREATMENT ROOM and FACILITY SCREENING ROOM

$filePath = "src\pages\FormPage.jsx"
$content = Get-Content $filePath -Raw

# Find the line with SCREENING ROOM and add FACILITY SCREENING ROOM after it
$pattern1 = "      'SCREENING ROOM': \['SCREENING', 'SCREENING ROOM'\],"
$replacement1 = @"
      'SCREENING ROOM': ['SCREENING', 'SCREENING ROOM'],
      'FACILITY SCREENING ROOM': ['FACILITY SCREENING ROOM', 'FACILITY SCREENING', 'SCREENING'],
"@

$content = $content -replace [regex]::Escape($pattern1), $replacement1

# Find the line with CONSULTATION ROOM and add FACILITY CONSULTATION/TREATMENT ROOM after it  
$pattern2 = "      'CONSULTATION ROOM': \['CONSULTATION', 'CONSULTATION ROOM', 'CONSULT'\],"
$replacement2 = @"
      'CONSULTATION ROOM': ['CONSULTATION', 'CONSULTATION ROOM', 'CONSULT'],
      'FACILITY CONSULTATION/TREATMENT ROOM': ['FACILITY CONSULTATION/TREATMENT ROOM', 'FACILITY CONSULTATION', 'CONSULTATION', 'TREATMENT ROOM'],
"@

$content = $content -replace [regex]::Escape($pattern2), $replacement2

Set-Content $filePath -Value $content -NoNewline

Write-Host "✅ Added department mappings successfully!" -ForegroundColor Green
Write-Host "Please refresh your browser to see the changes." -ForegroundColor Cyan
