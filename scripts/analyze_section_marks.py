import csv

def analyze_all_sections():
    with open('checklist-final.csv', 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lines = list(reader)
    
    header = lines[0]
    facility_types = [h.strip() for h in header[1:] if h.strip()]
    
    sections = []
    for i, row in enumerate(lines):
        if not row: continue
        name = row[0].strip()
        if name.isupper() and len(name) > 3:
            marks = [row[j+1].strip() == '?' for j in range(len(facility_types)) if j+1 < len(row)]
            sections.append({'row': i+1, 'name': name, 'marks': marks})
            
    print(f"Total Sections: {len(sections)}")
    for s in sections[:10]: # Check first 10
        print(f"Row {s['row']}: {s['name']} -> Any Marks: {any(s['marks'])}")

analyze_all_sections()
