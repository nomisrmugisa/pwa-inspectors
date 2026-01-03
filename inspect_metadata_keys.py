
import json

try:
    print("Reading dhis2_full_metadata_v2.json...")
    with open('dhis2_full_metadata_v2.json', 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
        
    print(f"Data type: {type(data)}")
    if isinstance(data, dict):
        print("Root keys:", list(data.keys()))
        for key in data.keys():
            if isinstance(data[key], list):
                print(f"Key '{key}' has {len(data[key])} items")
            else:
                 print(f"Key '{key}' is type {type(data[key])}")
    else:
        print("Root is not a dict")

except Exception as e:
    print(f"Error: {e}")
