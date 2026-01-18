import csv

def analyze_hospital():
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
    hospital_indices = [i for i, val in enumerate(header) if val.strip() == 'Hospital' or val.strip() == 'Hospita']
    
    print(f"Hospital column indices: {hospital_indices}")
    
    if not hospital_indices:
        print("Hospital column not found")
        return

    # Check for repeating sections in the first column
    sections = []
    for row in rows:
        if row and row[0].strip().startswith('SECTION'):
            sections.append(row[0].strip())
    
    from collections import Counter
    section_counts = Counter(sections)
    repeating_sections = {s: c for s, c in section_counts.items() if c > 1}
    
    print("\nRepeating sections in Column A:")
    for s, c in repeating_sections.items():
        print(f"  - {s}: {c} times")

    # Check mapping for Hospital
    print("\nContent analysis for Hospital columns:")
    for idx in hospital_indices:
        col_name = header[idx]
        marks = [row[idx] for row in rows if len(row) > idx]
        mark_counts = Counter(marks)
        print(f"  Column {idx} ({col_name}) marks: {mark_counts}")

analyze_hospital()
