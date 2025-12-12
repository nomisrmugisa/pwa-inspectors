
import csv

csv_path = r"c:\Users\SK\Documents\qims\pwa-bots2\pwa-inspectors\checklist-final.csv"

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
except UnicodeDecodeError:
    with open(csv_path, 'r', encoding='latin-1') as f:
        lines = f.readlines()

in_tens_section = False
found_tens = False

print("Searching for TENS section...")

for i, line in enumerate(lines):
    line = line.strip()
    if not line:
        continue
        
    parts = line.split(',')
    first_col = parts[0].strip()
    
    # Check for TENS header
    # Based on previous file, it was "TENS" in all caps
    if first_col == 'TENS':
        in_tens_section = True
        found_tens = True
        print(f"--- Found Section Header at line {i+1} ---")
        print(line)
        continue
    
    if in_tens_section:
        # Check for next section header
        # Usually all caps, length > 3, no question mark
        if first_col and first_col.isupper() and '?' not in first_col and len(first_col) > 3:
            print(f"--- Found Next Section Header at line {i+1} ---")
            print(line)
            break
            
        # Print the item/question
        print(f"Line {i+1}: {first_col}")

if not found_tens:
    print("TENS section not found.")
