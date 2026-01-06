import csv
import re

# Read CSV
with open('checklist-final.csv', 'r', encoding='utf-8', errors='replace') as f:
    reader = csv.reader(f)
    lines = list(reader)

# Skip header row (row 0)
data_rows = lines[1:]

# Find ULTRASOUND ROOM section
ultrasound_start = None
ultrasound_end = None

for i, row in enumerate(data_rows, start=1):
    if not row or not row[0]:
        continue
    
    first_col = row[0].strip()
    
    # Check if this is ULTRASOUND ROOM section header
    if first_col == 'ULTRASOUND ROOM':
        ultrasound_start = i
        print(f"Found ULTRASOUND ROOM at row {i+1}")
        continue
    
    # If we're past the ultrasound section and hit another section header, stop
    if ultrasound_start and not ultrasound_end:
        is_section = (first_col.isupper() and len(first_col) > 3) or first_col.startswith('FACILITY-')
        if is_section:
            ultrasound_end = i
            print(f"ULTRASOUND ROOM section ends at row {i} (next section: {first_col})")
            break

# Print all rows in the ULTRASOUND ROOM section
if ultrasound_start:
    print(f"\n=== ULTRASOUND ROOM Section (Rows {ultrasound_start+1} to {ultrasound_end if ultrasound_end else 'EOF'}) ===\n")
    end_idx = ultrasound_end if ultrasound_end else len(data_rows)
    
    for i in range(ultrasound_start, end_idx):
        row = data_rows[i]
        if row and row[0]:
            # Check Gynae column (index 1) and Radiology column (index 10)
            gynae = row[1] if len(row) > 1 else ''
            radiology = row[10] if len(row) > 10 else ''
            print(f"Row {i+2}: {row[0][:80]}")
            print(f"  Gynae: '{gynae}' | Radiology: '{radiology}'")
