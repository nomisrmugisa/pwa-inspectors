import csv
import re

csv_path = 'checklist-final.csv'

encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
lines = None

for encoding in encodings:
    try:
        with open(csv_path, 'r', encoding=encoding) as file:
            reader = csv.reader(file)
            lines = list(reader)
        print(f"✅ Read with {encoding}")
        break
    except UnicodeDecodeError:
        continue

if lines:
    raw_types = [ft.strip() for ft in lines[0][1:] if ft.strip()]
    print(f"Raw types ({len(raw_types)}):")
    for i, t in enumerate(raw_types):
        print(f"  {i}: '{t}'")

    hospital_index = -1
    for i, t in enumerate(raw_types):
        if 'Hospital' in t:
            hospital_index = i
            break
    
    print(f"Hospital index in self.facility_types: {hospital_index}")

    count = 0
    row_lengths = {}
    for i, row in enumerate(lines[1:]):
        if not row or not row[0].strip(): continue
        
        j = hospital_index
        cell_value = row[j + 1].strip() if j + 1 < len(row) else ''
        if cell_value == '?':
            count += 1
        
        rlen = len(row)
        row_lengths[rlen] = row_lengths.get(rlen, 0) + 1

    print(f"Questions found for Hospital: {count}")
    print(f"Row lengths frequency: {row_lengths}")
