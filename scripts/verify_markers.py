import csv

def verify_markers():
    with open('checklist-final.csv', 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lines = list(reader)
    
    lab_idx = 2
    hosp_idx = 15
    
    for i, row in enumerate(lines):
        if not row: continue
        name = row[0].strip()
        if name.isupper() and len(name) > 3:
            lab_mark = row[lab_idx].strip() if len(row) > lab_idx else ''
            hosp_mark = row[hosp_idx].strip() if len(row) > hosp_idx else ''
            
            if lab_mark == '?' or hosp_mark == '?':
                print(f"Row {i+1}: {name} -> Lab: '{lab_mark}', Hospital: '{hosp_mark}'")

verify_markers()
