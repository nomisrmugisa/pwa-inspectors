import json
import re
import os

# Paths
metadata_path = 'dhis2_full_metadata_v2.json'
config_path = 'src/config/laboratory.js'

def load_json(path):
    with open(path, 'r', encoding='utf-8-sig', errors='ignore') as f:
        return json.load(f)

def load_config_strings(path):
    strings = []
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        # Naive string extraction: "..." or '...'
        # We might pick up keys, but that's okay.
        strings = re.findall(r"['\"](.*?)['\"]", content)
    # Filter out short strings or keys likely not questions
    return [s for s in strings if len(s) > 5]

def clean_dhis2_name(name):
    if not name: return ""
    clean = name
    clean = re.sub(r'^[\d-]*\s*Inspection:\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'^FACILITY:-?\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'^SO,\d+\s*', '', clean, flags=re.IGNORECASE)
    # Also handle the bullet point issue if DHIS2 has them (unlikely)
    clean = re.sub(r'^[·\.\-\s]+', '', clean)
    return clean.strip()

def verify():
    print("Loading Data Elements from Metadata...")
    data = load_json(metadata_path)
    
    dhis2_names = []
    if 'programStageDataElements' in data:
        for psde in data['programStageDataElements']:
            de = psde.get('dataElement', {})
            # Gather all possible names
            names = [
                de.get('formName'),
                de.get('displayFormName'),
                de.get('displayName'),
                de.get('name')
            ]
            # Add non-None names
            dhis2_names.extend([n for n in names if n])
            
    dhis2_names = list(set(dhis2_names)) # Unique
    print(f"Found {len(dhis2_names)} unique Data Element names/forms in DHIS2.")
    
    # Pre-clean DHI2 names
    dhis2_clean_names = set([clean_dhis2_name(n) for n in dhis2_names])

    print("Loading Laboratory Config...")
    config_strings = load_config_strings(config_path)
    print(f"Found {len(config_strings)} strings in laboratory.js.")

    print("\n--- CHECKING SPECIMEN RECEPTION ROOM QUESTIONS ---")
    # I'll manually list a few I know match "Specimen Reception Room" context
    targets = [
        "Chairs and a table",
        "Microscope?",
        "Centrifuge?",
        "Refrigerator?",
        "Staining rack and sink?",
        "Running water"
    ]
    
    matches = 0
    for t in targets:
        # Check against Config (to see if parsing worked)
        in_config = any(t in s for s in config_strings)
        
        # Check against DHIS2 (Cleaned)
        in_dhis2 = t in dhis2_clean_names
        
        status = "✅ Found" if in_dhis2 else "❌ MISSING"
        
        print(f"Item: '{t}'")
        print(f"  In Config: {in_config}")
        print(f"  In DHIS2 (Cleaned): {status}")
        
        if not in_dhis2:
            # Fuzzy search
            print(f"  Possible matches in DHIS2:")
            suggestions = [n for n in dhis2_clean_names if t.lower() in n.lower()]
            for s in suggestions[:5]:
                print(f"    - '{s}'")

verify()
