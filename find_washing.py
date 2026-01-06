import json

def find_washing():
    print("Searching for WASHING/STERILIZ/STERILIS in DHIS2 Metadata...")
    
    json_encodings = ['utf-8-sig', 'utf-8', 'latin-1']
    metadata = None
    
    for encoding in json_encodings:
        try:
            with open('dhis2_full_metadata_v2.json', 'r', encoding=encoding) as f:
                metadata = json.load(f)
            print(f"✅ Loaded metadata with {encoding}")
            break
        except Exception:
            continue
            
    if not metadata:
        print("❌ Failed to load metadata")
        return

    # Check programStageSections
    sections = metadata.get('programStageSections', [])
    print(f"Found {len(sections)} sections in metadata.")
    
    found = False
    for s in sections:
        name = s.get('name', '')
        if 'WASHING' in name.upper() or 'STERILIZ' in name.upper() or 'STERILIS' in name.upper():
            print(f"🎯 FOUND SECTION MATCH: '{name}' (ID: {s.get('id')})")
            found = True
            
    if not found:
        print("❌ No matching SECTIONS found.")
        
    # Check dataElements too just in case
    des = metadata.get('dataElements', [])
    print(f"Found {len(des)} data elements.")
    count_de = 0
    for de in des:
         name = de.get('name', '')
         if 'STERILIZ' in name.upper() or 'STERILIS' in name.upper():
             if count_de < 5:
                print(f"   (DE Match): '{name}'")
             count_de += 1
             
    print(f"Total DE matches: {count_de}")

if __name__ == "__main__":
    find_washing()
