
import json

APP_SECTIONS = [
  'BLEEDING ROOM',
  'CUSTOMER SATISFACTION',
  'FACILITY-CALL CENTRE',
  'FACILITY-CONSULTATION/ TREATMENT ROOM',
  'FACILITY-ENVIRONMENT',
  'FACILITY-PROCEDURE ROOM',
  'FACILITY-RECEPTION/WAITING AREA',
  'FACILITY-SCREENING ROOM',
  'HIV SCREENING',
  'INSTRUMENT WASHING/STERILISING ROOM',
  'LABORATORY TESTING AREAS CHEMISTRY',
  'LABORATORY TESTING AREAS HAEMATOLOGY',
  'MICROBIOLOGY',
  'PERSONNEL',
  'PHARMACY/DISPENSARY',
  'SAFETY AND WASTE MANAGEMENT',
  'SECTION A-ORGANISATION AND MANAGEMENT',
  'SERVICES PROVIDED',
  'SLUICE ROOM',
  'SPECIMEN RECEPTION ROOM',
  'SUPPLIES',
  'TENS',
  'TOILET FACILITIES',
]

try:
    with open('dhis2_sections_output_v3.json', 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
        
    dhis2_sections = []
    if 'programStageSections' in data:
        for s in data['programStageSections']:
            name = s.get('displayName', s.get('name', 'Unknown'))
            dhis2_sections.append(name.strip())
            
    # Normalize for comparison
    app_sections_set = set(s.strip() for s in APP_SECTIONS)
    dhis2_sections_set = set(dhis2_sections)
    
    print("\n--- COMPARISON ---")
    
    missing_in_dhis2 = [s for s in APP_SECTIONS if s.strip() not in dhis2_sections_set]
    if missing_in_dhis2:
        print("\n[WARNING] The following sections are in the APP but NOT in DHIS2:")
        for s in missing_in_dhis2:
            print(f" - {s}")
    else:
        print("\n[SUCCESS] All app sections are present in DHIS2.")
        
    print("\n--- ALL DHIS2 SECTIONS ---")
    for s in dhis2_sections:
        print(f" - {s}")

except Exception as e:
    print(f"Error: {e}")
