import json
import re

def find_ultrasound_elements(metadata_path):
    with open(metadata_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    elements = []
    # Search for anything related to "Ultrasound room" in the metadata
    for item in data.get('programStageDataElements', []):
        de = item.get('dataElement', {})
        name = de.get('name', '')
        form_name = de.get('formName', '')
        display_name = de.get('displayName', '')
        
        if 'Ultrasound' in name or 'Ultrasound' in form_name or 'Ultrasound' in display_name:
            elements.append({
                'id': de.get('id'),
                'name': name,
                'formName': form_name,
                'displayName': display_name
            })
            
    return elements

if __name__ == "__main__":
    elements = find_ultrasound_elements('dhis2_full_metadata_v2.json')
    for e in elements:
        print(f"ID: {e['id']}")
        print(f"Name: {e['name'] if e['name'] else 'N/A'}")
        print(f"FormName: {e['formName'] if e['formName'] else 'N/A'}")
        print("-" * 40)
