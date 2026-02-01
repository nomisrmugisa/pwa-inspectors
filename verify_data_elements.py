import json
import os
import re

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

def load_dhis2_metadata():
    # Attempt to fetch fresh metadata first
    fetch_latest_metadata()
    
    try:
        with open('dhis2_full_metadata_v2.json', 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            dhis2_elements = {}
            for psde in data.get('programStageDataElements', []):
                de = psde['dataElement']
                # App logic: formName || displayFormName || name (displayName)
                # We use .strip() because the app likely trims input too
                best_name = de.get('formName') or de.get('displayFormName') or de.get('displayName')
                if best_name:
                    dhis2_elements[best_name.strip()] = de['id']
            # Fallback for older metadata structure or direct dataElements list
            if not dhis2_elements and 'dataElements' in data:
                 for de in data['dataElements']:
                    best_name = de.get('formName') or de.get('displayFormName') or de.get('displayName')
                    if best_name:
                        dhis2_elements[best_name.strip()] = de['id']
            
            return dhis2_elements
    except Exception as e:
        print(f"❌ Error loading DHIS2 metadata: {e}")
        return {}


def extract_questions_from_js_config(file_path):
    questions_by_section = {}
    current_section = None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for line in lines:
            line = line.strip()
            section_match = re.search(r'"([^"]+)":\s*{', line)
            if section_match:
                current_section = section_match.group(1)
                questions_by_section[current_section] = []
                continue
                
            if current_section and line.startswith('"') and line.endswith(','):
                question = line[1:-2]
                if question == 'showOnly": [': 
                    continue
                questions_by_section[current_section].append(question)
                
    except Exception as e:
        print(f"❌ Error reading config file {file_path}: {e}")
        
    return questions_by_section

def check_facility_type(facility_name, config_file, dhis2_elements, report_file):
    report_file.write(f"\n🏥 Check: {facility_name.upper()}\n")
    report_file.write("=" * 60 + "\n")
    
    local_questions = extract_questions_from_js_config(config_file)
    
    total_questions = 0
    total_missing = 0
    total_formatting_mismatch = 0
    
    for section, questions in local_questions.items():
        missing_in_section = []
        formatting_mismatches = []
        
        for q in questions:
            if q.strip() in dhis2_elements:
                continue
                
            # Check for formatting match
            # Normalize: remove bullets, dots at start, generic spaces
            normalized_q = re.sub(r'^[·\.\-\s]+', '', q.strip()).strip()
            
            # Find if there is a DHIS2 element that matches normalized_q
            # We need to normalize DHIS2 keys too roughly for this check? 
            # Or just check if normalized_q exists in dhis2_elements (assuming dhis2 is "clean")
            
            if normalized_q in dhis2_elements:
                 formatting_mismatches.append((q, normalized_q))
            else:
                 # Try case-insensitive match
                 match_found = False
                 for d_key in dhis2_elements.keys():
                     if d_key.lower() == normalized_q.lower():
                         formatting_mismatches.append((q, d_key))
                         match_found = True
                         break
                 
                 if not match_found:
                     missing_in_section.append(q)

        total_questions += len(questions)
        total_missing += len(missing_in_section)
        total_formatting_mismatch += len(formatting_mismatches)
        
        if missing_in_section or formatting_mismatches:
            report_file.write(f"\n  📂 Section: {section}\n")
            
            if formatting_mismatches:
                report_file.write(f"     ⚠️  FORMATTING MISMATCH: {len(formatting_mismatches)} questions (Fix items in CSV/Config)\n")
                for original, match in formatting_mismatches:
                    report_file.write(f"      - \"{original}\"  -> matches DHIS2: \"{match}\"\n")
            
            if missing_in_section:
                report_file.write(f"     ❌ TRULY MISSING in DHIS2: {len(missing_in_section)} questions\n")
                for m in missing_in_section:
                    report_file.write(f"      - \"{m}\"\n")

    if total_missing == 0 and total_formatting_mismatch == 0:
        report_file.write(f"  ✅ ALL {total_questions} questions match exactly in DHIS2!\n")
    else:
        report_file.write(f"\n  ⚠️  SUMMARY: {total_missing} missing, {total_formatting_mismatch} formatting issues out of {total_questions} questions.\n")

def main():
    dhis2_elements = load_dhis2_metadata()
    
    with open('DATA_ELEMENT_COMPARISON_REPORT.txt', 'w', encoding='utf-8') as report_file:
        if not dhis2_elements:
            report_file.write("Could not verify without DHIS2 data.\n")
            return

        report_file.write(f"Loaded {len(dhis2_elements)} Data Elements from DHIS2.\n")
        
        config_dir = 'src/config'
        for filename in os.listdir(config_dir):
            if filename.endswith('.js') and filename not in ['facilityServiceDepartments.js', 'facilityServiceFilters.js', 'sectionVisibilityConfig.js']:
                facility_name = filename.replace('.js', '')
                check_facility_type(facility_name, os.path.join(config_dir, filename), dhis2_elements, report_file)
        
        print("✅ Report generated: DATA_ELEMENT_COMPARISON_REPORT.txt")

if __name__ == "__main__":
    main()
