import csv
import json

def get_bytes(s):
    return ":".join("{:02x}".format(ord(c)) for c in s)

def debug_facility():
    print("DEBUG FACILITY-ENVIRONMENT MATCHING")
    
    # CSV
    csv_headers = []
    try:
        with open('checklist-final.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            lines = list(reader)
            for row in lines:
                if row and "FACILITY-ENVIRONMENT" in row[0]: # relaxed check
                    csv_headers.append(row[0].strip())
    except Exception as e:
        print(f"CSV Error: {e}")

    print(f"\nCSV Candidates found: {len(csv_headers)}")
    for h in csv_headers:
        print(f"CSV: '{h}' -> Bytes: {get_bytes(h)}")

    # DHIS2
    dhis2_candidates = []
    try:
        with open('dhis2_full_metadata_v2.json', 'r', encoding='utf-8-sig') as f:
            metadata = json.load(f)
            sections = metadata.get('programStageSections', [])
            for s in sections:
                name = s.get('name', '')
                if "FACILITY" in name and "ENVIRONMENT" in name:
                    dhis2_candidates.append(name)
    except Exception as e:
        print(f"JSON Error: {e}")

    print(f"\nDHIS2 Candidates found: {len(dhis2_candidates)}")
    for h in dhis2_candidates:
        print(f"DHIS2: '{h}' -> Bytes: {get_bytes(h)}")

if __name__ == "__main__":
    debug_facility()
