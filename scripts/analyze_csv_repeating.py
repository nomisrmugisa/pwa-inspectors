import csv
from collections import Counter

def analyze_csv_structure():
    encodings = ['utf-8-sig', 'latin-1', 'cp1252']
    rows = None

    for encoding in encodings:
        try:
            with open('checklist-final.csv', 'r', encoding=encoding) as f:
                reader = csv.reader(f)
                rows = list(reader)
            print(f"Read success with {encoding}")
            break
        except Exception as e:
            continue

    if not rows:
        print("Could not read CSV")
        return

    header = rows[0]
    print(f"Headers: {header}")
    
    # Check for duplicate facility types in header
    header_counts = Counter([h.strip() for h in header if h.strip()])
    duplicates = {h: c for h, c in header_counts.items() if c > 1}
    if duplicates:
        print(f"\nDuplicate Facility Types in Header: {duplicates}")
    else:
        print("\nNo duplicate Facility Types in Header.")

    # Identify Sections
    sections = []
    for i, row in enumerate(rows):
        if not row: continue
        first_col = row[0].strip()
        
        # Heuristic for section header: uppercase or starts with SECTION
        if first_col.isupper() and len(first_col) > 3 or first_col.startswith('SECTION'):
            # But exclude questions (apply row applicability check)
            applicability = any(cell.strip() == '?' for cell in row[1:])
            if not applicability:
                sections.append((i, first_col))

    print(f"\nTotal Sections Found: {len(sections)}")
    
    # Check for repeating section names
    section_names = [s[1] for s in sections]
    section_counts = Counter(section_names)
    repeating = {s: c for s, c in section_counts.items() if c > 1}
    
    if repeating:
        print("\nRepeating Sections:")
        for name, count in repeating.items():
            occurrences = [s[0] for s in sections if s[1] == name]
            print(f"  - '{name}': {count} occurrences at rows {occurrences}")
    else:
        print("\nNo repeating section names found.")

    # Check Hospital column (Canonical 'Hospital')
    hospital_idx = -1
    for i, h in enumerate(header):
        if h.strip() in ['Hospital', 'Hospita']:
            hospital_idx = i
            break
            
    if hospital_idx != -1:
        print(f"\nAnalyzing 'Hospital' column (index {hospital_idx}):")
        applicable_count = 0
        for row in rows[1:]:
            if len(row) > hospital_idx and row[hospital_idx].strip() == '?':
                applicable_count += 1
        print(f"  Applicable questions for Hospital: {applicable_count}")
    else:
        print("\n'Hospital' column not found.")

analyze_csv_structure()
