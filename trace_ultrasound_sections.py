import json
import re

def clean_name(name):
    if not name: return ""
    # Strip bullets and cleaning logic similar to the app
    return re.sub(r'^[·\.\-\s]+', '', name).strip().lower()

with open('dhis2_full_metadata_v2.json', 'r', encoding='utf-8') as f:
    meta = json.load(f)

sections = meta.get('programStageSections', [])

targets = [
    "Is the ultrasound machine commissioned",
    "Are there written and signed off user requirements",
    "Is there a copy of the commissioning report",
    "Is there a planned preventive maintenance",
    "Is there an up-to-date maintenance logbook",
    "Is the equipment being used for its intended purpose",
    "Is there a dedicated and clearly labeled storage area",
    "Is there a designated focal person",
    "Is there a system to refer patients"
]

print("Searching for Ultrasound-related questions in DHIS2 Sections...")
for s in sections:
    s_name = s['displayName']
    for psde in s['programStageDataElements']:
        de = psde['dataElement']
        de_name = de.get('formName') or de.get('displayName')
        cleaned = clean_name(de_name)
        
        for t in targets:
            if clean_name(t) in cleaned:
                print(f"Match Found: '{de_name}' -> Section: '{s_name}' [ID: {de['id']}]")

print("\nListing all sections in DHIS2 for reference:")
for s in sections:
    print(f"- {s['displayName']}")
