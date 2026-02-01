
import csv
import json
import re

def normalize_name(name):
    return name.strip() if name else ""

def check_csv_duplicates():
    print("Checking CSV for duplicate sections...")
    section_counts = {}
    
    encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
    lines = None

    for encoding in encodings:
        try:
            with open('checklist-final.csv', 'r', encoding=encoding) as f:
                reader = csv.reader(f)
                lines = list(reader)
            print(f"Successfully read CSV with {encoding} encoding")
            break
        except UnicodeDecodeError:
            continue
    
    if not lines:
        print("Failed to read CSV")
        return

    current_section = None
    for row in lines[2:]:
        if not row or not row[0]: continue
        
        col1 = row[0].strip()
        is_section_format = (len(row) > 10 and all(not c.strip() for c in row[1:10]))
        has_question_mark = col1.endswith('?') or any(c.strip() == '?' for c in row[1:])
        
        is_header = col1 and not has_question_mark and (col1.isupper() or is_section_format or col1.endswith('--'))

        if is_header:
            section_name = normalize_name(re.sub(r'\s*-\s*', '-', col1))
            # Removing "SECTION X -" prefix if present to match DHIS2 logic
            normalized_name = re.sub(r'^SECTION\s+[A-Z0-9]+\s*[-:]\s*', '', section_name, flags=re.IGNORECASE).strip()
            
            section_counts[normalized_name] = section_counts.get(normalized_name, 0) + 1

    duplicates = {name: count for name, count in section_counts.items() if count > 1}
    
    if duplicates:
        print("\nPossible CSV Duplicate Sections:")
        for name, count in duplicates.items():
            print(f"- {name}: {count} times")
    else:
        print("No duplicate sections found in CSV based on normalized names.")


def check_dhis2_duplicates():
    print("\nChecking DHIS2 Metadata for duplicate sections...")
    try:
        with open('dhis2_full_metadata_v2.json', 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        print(f"Failed to read metadata: {e}")
        return

    sections = metadata.get('programStageSections', [])
    section_counts = {}
    
    for section in sections:
        name = section.get('displayName', '') or section.get('name', '')
        # Removing "SECTION X -" prefix if present
        normalized_name = re.sub(r'^SECTION\s+[A-Z0-9]+\s*[-:]\s*', '', name, flags=re.IGNORECASE).strip()
        
        if normalized_name not in section_counts:
            section_counts[normalized_name] = []
        section_counts[normalized_name].append(section.get('id'))

    duplicates = {name: ids for name, ids in section_counts.items() if len(ids) > 1}
    
    if duplicates:
        print("\nDHIS2 Duplicate Sections Found (Same Name, Different IDs):")
        for name, ids in duplicates.items():
            print(f"- {name}: {len(ids)} occurrences (IDs: {', '.join(ids)})")
            
        print("\nRecommendation: Delete the duplicate sections using the API or recreate metadata.")
    else:
        print("No duplicate sections found in DHIS2 metadata.")

if __name__ == "__main__":
    check_csv_duplicates()
    check_dhis2_duplicates()
