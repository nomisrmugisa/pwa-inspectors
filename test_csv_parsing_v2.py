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
    hospital_index = -1
    for i, t in enumerate(raw_types):
        if 'Hospital' in t:
            hospital_index = i
            break
    
    print(f"Hospital index: {hospital_index}")

    sections_for_hospital = {}
    current_section = "GENERAL"
    
    for i, row in enumerate(lines[1:], start=2):
        if not row or not row[0].strip(): continue
        
        clean_text = re.sub(r'^[·\.\-\s]+', '', row[0].strip())
        
        applicability = []
        for j in range(len(raw_types)):
            val = row[j+1].strip() if j+1 < len(row) else ''
            applicability.append(val == '?')
        
        has_any_applicability = any(applicability)
        
        is_section_header = (not has_any_applicability) and (
            (clean_text.isupper() and len(clean_text) > 3) or
            clean_text.upper().startswith('FACILITY-') or
            clean_text.upper().startswith('CUSTOMER SATISFACTION') or
            clean_text.upper().startswith('LIASON WITH PRIMARY HEALTH CARE')
        )

        if is_section_header:
            current_section = clean_text.upper()
        
        if hospital_index < len(applicability) and applicability[hospital_index]:
            sections_for_hospital[current_section] = sections_for_hospital.get(current_section, 0) + 1

    print("Sections for Hospital:")
    for s, c in sections_for_hospital.items():
        print(f"  {s}: {c} questions")
