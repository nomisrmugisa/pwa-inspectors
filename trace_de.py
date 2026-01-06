import json

def find_de_in_sections(metadata_path, de_id):
    with open(metadata_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    sections_found = []
    for section in data.get('programStageSections', []):
        for de in section.get('dataElements', []):
            if de.get('id') == de_id:
                sections_found.append(section.get('displayName'))
    
    return sections_found

if __name__ == "__main__":
    # Test with one of the ultrasound IDs
    target_id = "hUes6rnPV8h"
    sections = find_de_in_sections('dhis2_full_metadata_v2.json', target_id)
    print(f"Data Element {target_id} is in sections: {sections}")

    # Let's also list all section names to be sure
    with open('dhis2_full_metadata_v2.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("\nAll Section Names:")
    for section in data.get('programStageSections', []):
        print(f" - {section.get('displayName')}")
