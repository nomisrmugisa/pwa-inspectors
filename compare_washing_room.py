import csv
import json
import re

def normalize_name(name):
    # Standardize normalization for comparison
    return re.sub(r'\s+', ' ', name).strip()

def compare_washing_room():
    print("🚀 Starting Comparison for 'INSTRUMENT WASHING/STERILISING ROOM'")
    
    # 1. Parse CSV
    csv_questions = []
    target_section = "INSTRUMENT WASHING/STERILISING ROOM"
    in_target_section = False
    
    encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
    lines = None

    for encoding in encodings:
        try:
            with open('checklist-final.csv', 'r', encoding=encoding) as f:
                reader = csv.reader(f)
                lines = list(reader)
            print(f"✅ Successfully read CSV with {encoding} encoding")
            break
        except UnicodeDecodeError:
            continue
    
    if not lines:
        print("❌ Failed to read CSV with any supported encoding")
        return

    try:
        # lines is a list of lists.
        # Skip header 1 and header 2
        
        for row in lines[2:]:
            if not row: continue
            
            col1 = row[0].strip()
            # Check for section header
            if col1.isupper() and len(col1) > 3 and not col1.endswith('?'):
                current_section = re.sub(r'\s*-\s*', '-', col1)
                # Normalize spaces in section name comparison as well just in case
                if normalize_name(current_section) == normalize_name(target_section):
                    in_target_section = True
                else:
                    in_target_section = False
            
            # If inside target section, collect questions
            elif in_target_section and (col1.endswith('?') or any(c.strip() == '?' for c in row[1:])):
                csv_questions.append(normalize_name(col1))
                    
        print(f"✅ Found {len(csv_questions)} questions in CSV for '{target_section}'")
    except Exception as e:
        print(f"❌ Error parsing CSV data: {e}")
        return

    # 2. Parse DHIS2 Metadata
    dhis2_questions = []
    
    # Try reading with utf-8-sig first to handle BOM
    metadata = None
    json_encodings = ['utf-8-sig', 'utf-8', 'latin-1']
    
    for encoding in json_encodings:
        try:
            with open('dhis2_full_metadata_v2.json', 'r', encoding=encoding) as f:
                metadata = json.load(f)
            print(f"✅ Successfully read DHIS2 Metadata with {encoding} encoding")
            break
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
            
    if not metadata:
         print("❌ Failed to read DHIS2 Metadata with supported encodings")
         return

    try:
        sections = metadata.get('programStageSections', [])
        target_uid = None
        
        for section in sections:
            if normalize_name(section.get('name', '')) == normalize_name(target_section):
                target_uid = section.get('id')
                data_elements = section.get('dataElements', [])
                
                # Resolve data element names
                all_des = metadata.get('dataElements', [])
                de_map = {de['id']: de['name'] for de in all_des} 
                
                for de_ref in data_elements:
                    de_id = de_ref['id']
                    if de_id in de_map:
                        dhis2_questions.append(normalize_name(de_map[de_id]))
                break
        
        if not target_uid:
            print(f"❌ Could not find section '{target_section}' in DHIS2 metadata")
            print("   Similar sections found:")
            for s in sections:
                s_name = s.get('name', '')
                if 'WASHING' in s_name or 'STERILISING' in s_name:
                    print(f"   - {s_name}")
            # Don't return, let's show empty DHIS2 list vs CSV
            
        print(f"✅ Found {len(dhis2_questions)} data elements in DHIS2 for '{target_section}'")

    except Exception as e:
        print(f"❌ Error reading DHIS2 metadata: {e}")
        return

    # 3. Compare
    print("\n📊 COMPARISON RESULTS:")
    
    csv_set = set(csv_questions)
    dhis2_set = set(dhis2_questions)
    
    missing_in_dhis2 = csv_set - dhis2_set
    missing_in_csv = dhis2_set - csv_set
    
    if not missing_in_dhis2 and not missing_in_csv:
        print("\n✅ PERFECT MATCH! All data elements align exactly.")
    else:
        if missing_in_dhis2:
            print(f"\n❌ MISSING IN DHIS2 ({len(missing_in_dhis2)} items):")
            print("   (These are in the CSV but not in the DHIS2 Section)")
            for q in sorted(missing_in_dhis2):
                print(f"   - {q}")
                
        if missing_in_csv:
            print(f"\n⚠️  MISSING IN CSV ({len(missing_in_csv)} items):")
            print("   (These are in DHIS2 but not in the current CSV section)")
            for q in sorted(missing_in_csv):
                print(f"   - {q}")

if __name__ == "__main__":
    compare_washing_room()
