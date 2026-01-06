import json

def list_ultrasound_room_elements(metadata_path):
    with open(metadata_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    with open('ultrasound_final_debug.txt', 'w', encoding='utf-8') as out:
        for section in data.get('programStageSections', []):
            if section.get('displayName').upper() == "ULTRASOUND ROOM":
                out.write(f"Section: {section.get('displayName')} (ID: {section.get('id')})\n")
                for de in section.get('dataElements', []):
                    form_name = de.get('formName', '')
                    disp_form_name = de.get('displayFormName', '')
                    name = de.get('displayName', de.get('name', ''))
                    out.write(f"  - ID: {de.get('id')}\n")
                    out.write(f"    Form Name: '{form_name}'\n")
                    out.write(f"    Display Form Name: '{disp_form_name}'\n")
                    out.write(f"    Name/DisplayName: '{name}'\n")
        
        # Also check for other elements that might be outliers
        out.write("\nChecking for other potential matches outside this section:\n")
        for psde in data.get('programStageDataElements', []):
            de = psde.get('dataElement', {})
            form_name = de.get('formName', '')
            name = de.get('name', '')
            if "ultrasound" in name.lower() or "ultrasound" in form_name.lower():
                out.write(f"  - ID: {de.get('id')} | FormName: '{form_name}' | Name: '{name}'\n")

if __name__ == "__main__":
    list_ultrasound_room_elements('dhis2_full_metadata_v2.json')
