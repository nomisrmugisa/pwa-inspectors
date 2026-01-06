import json

def list_ultrasound_room_elements(metadata_path):
    with open(metadata_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for section in data.get('programStageSections', []):
        if section.get('displayName').upper() == "ULTRASOUND ROOM":
            print(f"Section: {section.get('displayName')}")
            for de in section.get('dataElements', []):
                form_name = de.get('formName', '')
                disp_form_name = de.get('displayFormName', '')
                name = de.get('displayName', de.get('name', ''))
                print(f"  - ID: {de.get('id')}")
                print(f"    Form Name: '{form_name}'")
                print(f"    Display Form Name: '{disp_form_name}'")
                print(f"    Name/DisplayName: '{name}'")

if __name__ == "__main__":
    list_ultrasound_room_elements('dhis2_full_metadata_v2.json')
