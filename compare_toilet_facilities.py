import csv
import json
import re

def normalize_name(name):
    return name.strip() if name else ""

def compare_toilet_facilities():
    print("Starting Strict Comparison for 'TOILET FACILITIES'")
    
    csv_questions = []
    target_section = "TOILET FACILITIES"
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
        print("Failed to read CSV")
        return

    try:
        for row in lines[2:]:
            if not row or not row[0]: continue
            col1 = row[0].strip()
            
            is_section_format = (len(row) > 10 and all(not c.strip() for c in row[1:10]))
            has_question_mark = col1.endswith('?') or any(c.strip() == '?' for c in row[1:])
            
            if col1 and not has_question_mark and (col1.isupper() or is_section_format or col1.endswith('--')):
                current_section = normalize_name(re.sub(r'\s*-\s*', '-', col1))
                if current_section == target_section:
                    in_target_section = True
                else:
                    in_target_section = False
            
            elif in_target_section and has_question_mark:
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
            break
        except:
            continue
            
    if not metadata:
         print("Failed to read DHIS2 Metadata")
         return

    try:
        sections = metadata.get('programStageSections', [])
        target_uid = None
        
        for section in sections:
            s_name = normalize_name(section.get('name', ''))
            if s_name == target_section:
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
                # Check for "toilet" substring match
                if "toilet" in d.lower() and "toilet" in q.lower():
                     near_misses.append(d)
            
            if near_misses:
                print("    NEAR MISSES IN DHIS2:")
                for nm in set(near_misses):
                    print(f"    - \"{nm}\"")
            else:
                print("    NO SIMILAR ITEM FOUND IN DHIS2 SECTION")

if __name__ == "__main__":
    compare_toilet_facilities()
