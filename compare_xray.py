import csv
import json
import re

def normalize_name(name):
    # Strictly return the name as is for "exact matching"
    # Only stripping outer whitespace which is usually a file-reading artifact
    return name.strip() if name else ""

def compare_xray_room():
    print("Starting Strict Comparison for 'X-RAY ROOM'")
    
    # 1. Parse CSV
    csv_questions = []
    target_section = "X-RAY ROOM"
    in_target_section = False
    
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
        print("Failed to read CSV with any supported encoding")
        return

    try:
        # lines is a list of lists.
        # Skip header 1 and header 2
        
        for row in lines[2:]:
            if not row or not row[0]: continue
            
            col1 = row[0].strip()
            # Check for section header
            if col1.isupper() and len(col1) > 3 and not col1.endswith('?'):
                current_section = re.sub(r'\s*-\s*', '-', col1)
                if normalize_name(current_section) == normalize_name(target_section):
                    in_target_section = True
                else:
                    in_target_section = False
            
            # If inside target section, collect questions
            elif in_target_section and (col1.endswith('?') or any(c.strip() == '?' for c in row[1:])):
                csv_questions.append(normalize_name(col1))
                    
        print(f"Found {len(csv_questions)} questions in CSV for '{target_section}'")
    except Exception as e:
        print(f"Error parsing CSV data: {e}")
        return

    # 2. Parse DHIS2 Metadata
    dhis2_questions = []
    
    metadata = None
    json_encodings = ['utf-8-sig', 'utf-8', 'latin-1']
    
    for encoding in json_encodings:
        try:
            with open('dhis2_full_metadata_v2.json', 'r', encoding=encoding) as f:
                metadata = json.load(f)
            print(f"Successfully read DHIS2 Metadata with {encoding} encoding")
            break
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
            
    if not metadata:
         print("Failed to read DHIS2 Metadata with supported encodings")
         return

    try:
        sections = metadata.get('programStageSections', [])
        target_uid = None
        
        for section in sections:
            s_name = normalize_name(section.get('name', ''))
            if s_name == normalize_name(target_section) or s_name.replace(' ','') == normalize_name(target_section).replace(' ',''):
                target_uid = section.get('id')
                data_elements = section.get('dataElements', [])
                
                all_psdes = metadata.get('programStageDataElements', [])
                de_cand_map = {}
                for psde in all_psdes:
                    if 'dataElement' in psde:
                        de = psde['dataElement']
                        cands = [
                            de.get('formName'),
                            de.get('displayFormName'),
                            de.get('displayName'),
                            de.get('name')
                        ]
                        de_cand_map[de['id']] = [normalize_name(c) for c in cands if c]
                
                for de_ref in data_elements:
                    de_id = de_ref.get('id')
                    if de_id in de_cand_map:
                        dhis2_questions.extend(de_cand_map[de_id])
                break
        
        if not target_uid:
            print(f"Could not find section '{target_section}' in DHIS2 metadata")
            
        print(f"Found {len(dhis2_questions)} data elements (candidates) in DHIS2 for '{target_section}'")

    except Exception as e:
        print(f"Error reading DHIS2 metadata: {e}")
        return

    # 3. Compare
    print("\nSTRICT COMPARISON RESULTS:")
    
    csv_set = set(csv_questions)
    dhis2_set = set(dhis2_questions)
    
    missing_in_dhis2 = csv_set - dhis2_set
    
    if not missing_in_dhis2:
        print("\nPERFECT STRICT MATCH! All CSV elements have an exact match in DHIS2.")
    else:
        print(f"\nSTRICT MISMATCHES FOUND ({len(missing_in_dhis2)} items):")
        
        for q in sorted(missing_in_dhis2):
            safe_q = q.encode('ascii', 'replace').decode('ascii')
            print(f"\n--- CSV: \"{safe_q}\" ---")
            
            norm_q = q.lower().replace(" ", "")
            near_misses = []
            for d in dhis2_questions:
                if d.lower().replace(" ", "") == norm_q:
                    near_misses.append(d)
                # Also check Levenshtein or contains for things like " -ray" vs "X-ray"
                if "x-ray" in d.lower() and " -ray" in q.lower():
                     near_misses.append(d)
            
            if near_misses:
                print("    NEAR MISSES IN DHIS2:")
                for nm in set(near_misses):
                    print(f"    - \"{nm}\"")
            else:
                print("    NO SIMILAR ITEM FOUND IN DHIS2 SECTION")
                # Dump all DHIS2 items to finding matching
                # print("    Dumping DHIS2 items:")
                # for d in dhis2_questions:
                #    print(f"     -> {d}")

if __name__ == "__main__":
    compare_xray_room()
