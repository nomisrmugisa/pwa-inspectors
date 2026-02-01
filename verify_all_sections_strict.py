import csv
import json
import re
import os

def get_credentials():
    env_path = '.env'
    creds = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    creds[key] = value
    return creds.get('DHIS2_USERNAME'), creds.get('DHIS2_PASSWORD')

def fetch_latest_metadata():
    username, password = get_credentials()
    if not username or not password:
        print("⚠️  Skipping metadata fetch: DHIS2_USERNAME or DHIS2_PASSWORD not found in .env")
        print("   (Create a .env file with these variables to enable auto-update)")
        return

    print("🔄 Fetching latest DHIS2 metadata...")
    try:
        import subprocess
        result = subprocess.run(
            ["node", "scripts/fetch-metadata.js", username, password],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✅ Metadata updated successfully.")
        else:
            print(f"❌ Failed to fetch metadata: {result.stderr}")
    except Exception as e:
        print(f"❌ Error running fetch script: {e}")

def verify_all_sections():
    print("Starting Global Strict Comparison for all sections")
    
    # 1. Update Metadata
    fetch_latest_metadata()

    # 2. Parse CSV
    section_map = {} # {section_name: [questions]}
    current_section = None
    
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
        # Skip header 1 and header 2
        for row in lines[2:]:
            if not row or not row[0]: continue
            
            col1 = row[0].strip()
            # Check for section header: 
            # 1. In first column
            # 2. No "?" in any column (sections aren't questions)
            # 3. Followed by many empty columns (at least 10)
            # 4. Or specifically ALL CAPS or ends with --
            is_section_format = (len(row) > 10 and all(not c.strip() for c in row[1:10]))
            has_question_mark = col1.endswith('?') or any(c.strip() == '?' for c in row[1:])
            
            is_header = col1 and not has_question_mark and (col1.isupper() or is_section_format or col1.endswith('--'))

            if is_header:
                # Handle potential dash normalization (similar to how the app might)
                current_section = normalize_name(re.sub(r'\s*-\s*', '-', col1))
                if current_section not in section_map:
                    section_map[current_section] = []
            
            # If inside a section and it looks like a question
            elif current_section and (col1.endswith('?') or any(c.strip() == '?' for c in row[1:])):
                section_map[current_section].append(normalize_name(col1))
                    
        print(f"Found {len(section_map)} sections in CSV")
    except Exception as e:
        print(f"Error parsing CSV data: {e}")
        return

    # 2. Parse DHIS2 Metadata
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
         print("Failed to read DHIS2 Metadata")
         return

    # Map for all data elements globally
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

    dhis2_sections = metadata.get('programStageSections', [])
    
    print("\n--- GLOBAL STRICT COMPARISON RESULTS ---\n")
    
    overall_mismatches = 0
    passed_sections = 0
    
    for section_name, questions in section_map.items():
        if not questions: continue
        
        # Find corresponding DHIS2 section
        dhis2_section = None
        for s in dhis2_sections:
            s_name = normalize_name(s.get('name', ''))
            # Try exact match first
            if s_name == section_name:
                dhis2_section = s
                break
            # Try match with single dash vs spaces etc
            if s_name.replace(" ", "") == section_name.replace(" ", ""):
                dhis2_section = s
                break
        
        if not dhis2_section:
            print(f"Section [MISSED]: \"{section_name}\" - Not found in DHIS2 Sections")
            # Try to print near matches for section names
            print("  Possible candidates:")
            for s in dhis2_sections:
                sn = s.get('name','')
                if section_name[:10].lower() in sn.lower():
                    print(f"  - {sn}")
            overall_mismatches += 1
            continue

        # Collect all candidates for this section
        dhis2_candidates = []
        for de_ref in dhis2_section.get('dataElements', []):
            de_id = de_ref.get('id')
            if de_id in de_cand_map:
                dhis2_candidates.extend(de_cand_map[de_id])
        
        csv_set = set(questions)
        dhis2_set = set(dhis2_candidates)
        missing = csv_set - dhis2_set
        
        if not missing:
            passed_sections += 1
            # print(f"Section [OK]: \"{section_name}\" - Perfect match")
        else:
            print(f"Section [FAIL]: \"{section_name}\" - {len(missing)} mismatches")
            overall_mismatches += 1
            for q in sorted(missing):
                safe_q = q.encode('ascii', 'replace').decode('ascii')
                print(f"  - CSV: \"{safe_q}\"")
                # Look for near misses
                norm_q = q.lower().replace(" ", "")
                near_misses = [c for c in dhis2_candidates if c.lower().replace(" ", "") == norm_q]
                if near_misses:
                    for nm in set(near_misses):
                        print(f"    Near Miss: \"{nm}\"")
                else:
                    print("    No similar item found in DHIS2")

    print(f"\nVerification Complete.")
    print(f"Passed Sections: {passed_sections}")
    print(f"Sections with Mismatches: {overall_mismatches}")

if __name__ == "__main__":
    verify_all_sections()
