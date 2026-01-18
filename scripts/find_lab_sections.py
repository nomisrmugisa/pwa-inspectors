import csv

def find_lab_sections():
    with open('checklist-final.csv', 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lines = list(reader)
    
    header = lines[0]
    # Header check
    for i, h in enumerate(header):
        print(f"Index {i}: {h}")
        
    lab_idx = 2 # Laboratory is likely index 2 (Column 3)
    
    for i, row in enumerate(lines):
        if not row: continue
        name = row[0].strip()
        if name.isupper() and len(name) > 3:
            mark = row[lab_idx].strip() if len(row) > lab_idx else ''
            if mark == '?':
                print(f"Row {i+1}: {name} is marked for Laboratory (index {lab_idx})")

find_lab_sections()
