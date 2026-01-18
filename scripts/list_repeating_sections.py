import csv
from collections import Counter

def list_sections():
    encodings = ['utf-8-sig', 'latin-1', 'cp1252']
    rows = None

    for encoding in encodings:
        try:
            with open('checklist-final.csv', 'r', encoding=encoding) as f:
                reader = csv.reader(f)
                rows = list(reader)
            break
        except Exception:
            continue

    if not rows:
        return

    sections = []
    for i, row in enumerate(rows):
        if not row: continue
        first_col = row[0].strip()
        # Section identification: Uppercase and no applicability in the row
        is_upper = first_col.isupper() and len(first_col) > 3
        starts_with_section = first_col.upper().startswith('SECTION')
        has_any_applicability = any(cell.strip() == '?' for cell in row[1:])
        
        if (is_upper or starts_with_section) and not has_any_applicability:
            sections.append(first_col)

    counts = Counter(sections)
    duplicates = {s: c for s, c in counts.items() if c > 1}
    
    if duplicates:
        print("Repeating Sections Found:")
        for s, c in duplicates.items():
            print(f"  - {s}: {c} times")
    else:
        print("No repeating section names found in the CSV structure.")

list_sections()
