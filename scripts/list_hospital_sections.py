import csv

def list_hospital_sections():
    hospital_idx = 15 # Column 16
    with open('checklist-final.csv', 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lines = list(reader)
    
    print(f"Index 15 value for Row 3: '{lines[2][ hospital_idx] if len(lines[2]) > hospital_idx else 'OUT OF RANGE'}'")
    
    for i, row in enumerate(lines):
        if not row: continue
        name = row[0].strip()
        if name.isupper() and len(name) > 3:
            mark = row[hospital_idx].strip() if len(row) > hospital_idx else ''
            if mark == '?':
                print(f"Row {i+1}: [MARKED] {name}")
            else:
                print(f"Row {i+1}: [EMPTY ] {name}")

list_hospital_sections()
