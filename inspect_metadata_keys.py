import json
with open('dhis2_full_metadata_v2.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)
print(data.keys())
if 'programStages' in data:
    print(f"Number of programStages: {len(data['programStages'])}")
    if len(data['programStages']) > 0:
        print(f"Keys in first programStage: {data['programStages'][0].keys()}")
        if 'programStageSections' in data['programStages'][0]:
             print(f"Number of sections in first stage: {len(data['programStages'][0]['programStageSections'])}")
