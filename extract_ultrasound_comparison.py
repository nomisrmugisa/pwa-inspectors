import json
import csv
import re

def get_csv_ultrasound_elements(csv_path):
    elements = []
    found_section = False
    lines = []
    # Try different encodings
    for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
        try:
            with open(csv_path, 'r', encoding=encoding) as f:
                reader = csv.reader(f)
                lines = list(reader)
            break
        except UnicodeDecodeError:
            continue
            
    for row in lines:
            if not row or not row[0].strip():
                continue
            text = row[0].strip()
            if text == "ULTRASOUND ROOM":
                found_section = True
                continue
            if found_section:
                # If we encounter another section (ALL CAPS, no ?), stop
                if text.isupper() and not text.endswith('?') and len(text) > 3:
                    break
                elements.append(text)
    return elements

def get_dhis2_ultrasound_elements(metadata_path):
    with open(metadata_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    elements = []
    
    # First, look for the Ultrasound room section to get its data elements
    ultrasound_section = None
    for section in data.get('programStageSections', []):
        if "Ultrasound room" in section.get('displayName', ''):
            ultrasound_section = section
            break
    
    if ultrasound_section:
        for de in ultrasound_section.get('dataElements', []):
            form_name = de.get('formName', '')
            name = de.get('displayName', de.get('name', ''))
            elements.append({
                'id': de.get('id'),
                'formName': form_name if form_name else name
            })
    else:
        # Fallback to searching all data elements if section not found
        for item in data.get('programStageDataElements', []):
            de = item.get('dataElement', {})
            name = de.get('name', '')
            form_name = de.get('formName', de.get('displayFormName', ''))
            
            if any(keyword in name or keyword in form_name for keyword in ["Ultrasound", "records available", "change room", "handicapped", "waste bin", "ventilation", "liason", "statistical reporting"]):
                elements.append({
                    'id': de.get('id'),
                    'formName': form_name if form_name else name
                })
            
    return elements

if __name__ == "__main__":
    csv_elements = get_csv_ultrasound_elements('checklist-final.csv')
    dhis2_elements = get_dhis2_ultrasound_elements('dhis2_full_metadata_v2.json')
    
    with open('ultrasound_comparison_debug.txt', 'w', encoding='utf-8') as f:
        f.write("CSV ELEMENTS:\n")
        for e in csv_elements:
            f.write(f"- {e}\n")
            
        f.write("\nDHIS2 ELEMENTS:\n")
        for e in dhis2_elements:
            f.write(f"- {e['formName']} (ID: {e['id']})\n")
    
    print("Comparison results written to ultrasound_comparison_debug.txt")
