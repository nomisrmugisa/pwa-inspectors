# Backup current config files
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path 'src/config' ('backup-' + $ts)
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item src/config/*.js $backup -Force
if (Test-Path src/config/generation_report.json) {
  Copy-Item src/config/generation_report.json $backup -Force
}
Write-Host ("Backup created at " + $backup)

# Ensure UTF-8 output for Python on Windows
try {
  chcp 65001 | Out-Null
} catch {}
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$env:PYTHONUTF8 = '1'

# Run the Python generator
python .\src\config\genreateFilters.py
