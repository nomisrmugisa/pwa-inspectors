import csv
import re
from pathlib import Path

def extract_hierarchy(csv_path="checklist-final.csv", output_path="checklist_hierarchy.md"):
    encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
    lines = None

    for encoding in encodings:
        try:
            with open(csv_path, 'r', encoding=encoding) as file:
                reader = csv.reader(file)
                lines = list(reader)
            break
        except Exception:
            continue

    if not lines:
        print("Could not read CSV")
        return

    hierarchy = []
    current_section = None
    
    # Skip header
    for row in lines[1:]:
        if not row or not row[0].strip():
            continue
            
        text = row[0].strip()
        clean_text = re.sub(r'^[\.\-\s]+', '', text)
        
        # Section Header Logic (mirroring generateFilters.py)
        is_strong_header = (
            (clean_text.upper().startswith('SECTION ') and not clean_text.endswith('--')) or 
            (clean_text.upper().startswith('FACILITY-') and not clean_text.endswith('--')) or
            (clean_text.upper().startswith('CUSTOMER SATISFACTION') and not clean_text.endswith('--')) or
            (clean_text.upper().startswith('LIASON WITH PRIMARY HEALTH CARE') and not clean_text.endswith('--')) or
            (clean_text.upper().startswith('TOILET FACILITIES') and not clean_text.endswith('--')) or
            (clean_text.isupper() and len(clean_text) > 5 and not clean_text.endswith('?') and not clean_text.endswith('--'))
        )
        is_weak_header = (clean_text.isupper() and len(clean_text) > 3 and not clean_text.endswith('--'))
        is_section = (is_strong_header or is_weak_header) and (clean_text and not clean_text[0].isdigit())
        
        if is_section:
            current_section = clean_text.upper().replace('--', '').strip()
            hierarchy.append({"type": "section", "name": current_section, "subsections": []})
        elif current_section:
            # Detect Subsection: 
            # 1. Numbered items with few dots (e.g. 22.7 but not 22.7.1)
            # 2. Items ending with --
            # 3. Items containing :--
            
            is_subsection = False
            if clean_text.endswith('--') or ':--' in clean_text:
                is_subsection = True
            else:
                # Check for numbering like X.Y or X.Y.Z
                match = re.match(r'^(\d+(\.\d+){1,2})\s', clean_text)
                if match and not clean_text.endswith('?'):
                    is_subsection = True
            
            if is_subsection:
                sub_name = clean_text.replace('--', '').strip()
                hierarchy[-1]["subsections"].append(sub_name)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Checklist Hierarchy (Sections and Subsections)\n\n")
        for item in hierarchy:
            f.write(f"## {item['name']}\n")
            if item['subsections']:
                for sub in item['subsections']:
                    f.write(f"- {sub}\n")
            else:
                f.write("*No subsections identified*\n")
            f.write("\n")
            
    print(f"Hierarchical report generated: {output_path}")

if __name__ == "__main__":
    extract_hierarchy()
