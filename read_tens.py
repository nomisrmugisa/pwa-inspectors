
import csv

csv_path = r"c:\Users\SK\Documents\qims\pwa-bots2\pwa-inspectors\src\config\checklist for facilities2.0.csv"

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
except UnicodeDecodeError:
    with open(csv_path, 'r', encoding='latin-1') as f:
        lines = f.readlines()

in_tens_section = False
tens_questions = []

for line in lines:
    line = line.strip()
    if not line:
        continue
        
    # Check for section header
    if line.startswith('TENS') and 'SECTION' not in line: # Adjust based on exact header format if known, but TENS is likely the header
         # Or maybe it is "SECTION ... TENS"
         pass

    # Let's just look for the line containing TENS and then print subsequent lines until next section
    if 'TENS' in line and ',' in line: # Header usually has commas for columns
        # Check if it's the section header row
        parts = line.split(',')
        if parts[0].strip() == 'TENS':
            in_tens_section = True
            print(f"Found Section: {line}")
            continue
    
    if in_tens_section:
        # Check if we hit the next section (usually all caps, no question mark)
        parts = line.split(',')
        first_col = parts[0].strip()
        
        if first_col and first_col.isupper() and '?' not in first_col and len(first_col) > 3:
             # Likely next section
             break
             
        if '?' in first_col:
            print(first_col)

