import json

def get_keys(filename):
    try:
        with open(filename, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            return list(data.keys())
    except Exception as e:
        return str(e)

print(f"v2 keys: {get_keys('dhis2_full_metadata_v2.json')}")
print(f"v1 keys: {get_keys('dhis2_full_metadata.json')}")
