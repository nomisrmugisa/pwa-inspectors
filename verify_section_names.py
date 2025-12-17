import json
import re
import os

# Paths
metadata_path = 'dhis2_full_metadata_v2.json'
config_path = 'src/config/facilityServiceDepartments.js'

def load_json(path):
    # Use utf-8-sig to handle BOM
    with open(path, 'r', encoding='utf-8-sig') as f:
        return json.load(f)

def load_config_sections(path):
    sections = []
    # Config file likely utf-8? Or sig? Try sig safely?
    # Python open handles utf-8-sig fine on plain utf-8 too usually.
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        match = re.search(r'export const ALL_FACILITY_DEPARTMENTS = \[(.*?)\];', content, re.DOTALL)
        if match:
            raw_list = match.group(1)
            sections = re.findall(r"['\"](.*?)['\"]", raw_list)
    return sections

def clean_dhis2_name(name):
    clean = name
    clean = re.sub(r'^[\d-]*\s*Inspection:\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'^FACILITY:-?\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'^SO,\d+\s+SERVICES OFFERED:\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'^SO,\d+\s*', '', clean, flags=re.IGNORECASE)
    return clean.strip()

def verify():
    print("Loading Metadata...")
    if not os.path.exists(metadata_path):
        print(f"Error: {metadata_path} not found.")
        return

    try:
        data = load_json(metadata_path)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return

    dhis2_sections = {}
    if 'programStageSections' in data:
        for section in data['programStageSections']:
            dhis2_sections[section['id']] = section['displayName']
    else:
        print("No programStageSections found in metadata.")
        return

    print(f"Found {len(dhis2_sections)} sections in DHIS2.")

    print("\nLoading Config...")
    config_sections = load_config_sections(config_path)
    print(f"Found {len(config_sections)} sections in Config.")

    print("\n--- COMPARISON ---")
    
    found_count = 0
    missing_count = 0
    
    dhis2_names = list(dhis2_sections.values())
    dhis2_clean_names = [clean_dhis2_name(n) for n in dhis2_names]

    clean_to_orig = {clean_dhis2_name(n): n for n in dhis2_names}

    for cfg_sec in config_sections:
        match_found = False
        
        if cfg_sec in dhis2_names:
            match_found = True
        
        if not match_found:
             if cfg_sec in dhis2_clean_names:
                 match_found = True

        if match_found:
            found_count += 1
        else:
            missing_count += 1
            print(f"❌ MISSING IN DHIS2: '{cfg_sec}'")
            potential = [n for n in dhis2_names if cfg_sec.lower() in n.lower() or n.lower() in cfg_sec.lower()]
            if potential:
                print(f"   Potential Candidates in DHIS2: {potential}")
            else:
                 print(f"   No candidates found.")

    print(f"\nSummary:")
    print(f"  Matched: {found_count}")
    print(f"  Missing: {missing_count}")

    print("\n--- SPECIMEN RECEPTION ROOM ANALYSIS ---")
    specimen_candidates = [n for n in dhis2_names if 'SPECIMEN' in n.upper()]
    print(f"DHIS2 Sections containing 'SPECIMEN':")
    for s in specimen_candidates:
        print(f"  - Original: '{s}'")
        print(f"  - Cleaned:  '{clean_dhis2_name(s)}'")

verify()
