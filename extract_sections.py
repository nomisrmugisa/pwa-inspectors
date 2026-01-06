import json

def extract_sections(metadata_path):
    with open(metadata_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    sections = []
    # Check programStages
    if 'programStages' in data:
        for stage in data['programStages']:
            if 'programStageSections' in stage:
                for section in stage['programStageSections']:
                    sections.append({
                        'id': section.get('id'),
                        'name': section.get('name'),
                        'displayName': section.get('displayName')
                    })
    
    # Also check top-level programStageSections if any
    if 'programStageSections' in data:
        for section in data['programStageSections']:
            sections.append({
                'id': section.get('id'),
                'name': section.get('name'),
                'displayName': section.get('displayName')
            })
            
    return sections

if __name__ == "__main__":
    sections = extract_sections('dhis2_full_metadata_v2.json')
    unique_sections = {s['name']: s for s in sections}.values()
    for s in sorted(unique_sections, key=lambda x: x['name']):
        print(f"{s['name']}")
