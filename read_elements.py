import json
with open('dhis2_full_metadata_v2.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)
for item in data['programStageDataElements'][:5]:
    print(json.dumps(item, indent=2))
    print("-" * 20)
