import csv

def check_marks():
    hospital_idx = 15 # Column 16
    with open('checklist-final.csv', 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lines = list(reader)
        
    for i, row in enumerate(lines):
        if not row: continue
        name = row[0].strip()
        if name.isupper() and len(name) > 3:
            mark = row[hospital_idx].strip() if len(row) > hospital_idx else ''
            print(f"Row {i+1}: {name} -> Mark: '{mark}'")

check_marks()
