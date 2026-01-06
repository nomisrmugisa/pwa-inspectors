import json

def find_elements_by_keyword(metadata_path, keyword):
    with open(metadata_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    elements = []
    for item in data.get('programStageDataElements', []):
        de = item.get('dataElement', {})
        name = de.get('name', '')
        form_name = de.get('formName', '')
        
        if keyword.lower() in name.lower() or keyword.lower() in form_name.lower():
            elements.append({
                'id': de.get('id'),
                'name': name,
                'formName': form_name
            })
            
    return elements

if __name__ == "__main__":
    elements = find_elements_by_keyword('dhis2_full_metadata_v2.json', 'records available')
    for e in elements:
        print(f"ID: {e['id']}")
        print(f"Name: {e['name']}")
        print(f"FormName: {e['formName']}")
        print("-" * 40)
