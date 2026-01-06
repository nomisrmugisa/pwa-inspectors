import json

def analyze_sections(metadata_path):
    with open(metadata_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Total Sections: {len(data.get('programStageSections', []))}")
    for section in data.get('programStageSections', []):
        display_name = section.get('displayName', '')
        if "Ultrasound" in display_name:
            print(f"\nSection: {display_name} (ID: {section.get('id')})")
            print(f"Data Elements: {len(section.get('dataElements', []))}")
            for de in section.get('dataElements', []):
                form_name = de.get('formName', '')
                display_form_name = de.get('displayFormName', '')
                name = de.get('displayName', de.get('name', ''))
                print(f"  - ID: {de.get('id')}")
                print(f"    Form Name: '{form_name}'")
                print(f"    Display Form Name: '{display_form_name}'")
                print(f"    Name/DisplayName: '{name}'")

if __name__ == "__main__":
    analyze_sections('dhis2_full_metadata_v2.json')
