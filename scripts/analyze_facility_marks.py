import csv

def analyze_facility_marks():
    with open('checklist-final.csv', 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lines = list(reader)
    
    header = lines[0]
    facility_types = [h.strip() for h in header[1:] if h.strip()]
    
    # Track how many sections are explicitly marked per facility
    section_marks_count = [0] * len(facility_types)
    
    for i, row in enumerate(lines):
        if not row: continue
        name = row[0].strip()
        if name.isupper() and len(name) > 3:
            for j in range(len(facility_types)):
                if j+1 < len(row) and row[j+1].strip() == '?':
                    section_marks_count[j] += 1
                    
    for i, name in enumerate(facility_types):
        print(f"{name}: {section_marks_count[i]} sections explicitly marked")

analyze_facility_marks()
