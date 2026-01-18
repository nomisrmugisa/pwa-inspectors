import csv
import re

def scan_csv():
    encodings = ['utf-8-sig', 'latin-1', 'cp1252']
    lines = None

    for encoding in encodings:
        try:
            with open('checklist-final.csv', 'r', encoding=encoding) as f:
                reader = csv.reader(f)
                lines = list(reader)
            break
        except Exception:
            continue

    if not lines:
        return

    for i, row in enumerate(lines):
        if not row: continue
        first_col = row[0].strip()
        clean_text = re.sub(r'^[·\.\-\s]+', '', first_col)
        
        # Reproduce generator logic
        has_any_applicability = any(cell.strip() == '?' for cell in row[1:])
        
        is_section_header = (not has_any_applicability) and (
            (clean_text.isupper() and len(clean_text) > 3) or
            clean_text.upper().startswith('FACILITY-') or
            clean_text.upper().startswith('CUSTOMER SATISFACTION') or
            clean_text.upper().startswith('LIASON WITH PRIMARY HEALTH CARE')
        )
        
        # Check if it SHOULD have been a section header but wasn't
        should_be_section = (clean_text.isupper() and len(clean_text) > 3) or \
                            clean_text.upper().startswith('FACILITY-') or \
                            clean_text.upper().startswith('SECTION')
        
        if should_be_section:
            status = "DETECTED" if is_section_header else "MISSED (has ?)"
            print(f"Row {i+1}: '{clean_text[:40]}' -> {status}")

scan_csv()
