import csv

encodings = ['utf-8-sig', 'latin-1', 'cp1252']
rows = None

for encoding in encodings:
    try:
        with open('checklist-final.csv', 'r', encoding=encoding) as f:
            reader = csv.reader(f)
            rows = list(reader)
        print(f"Success with {encoding}")
        break
    except Exception as e:
        print(f"Failed with {encoding}: {e}")

if rows and rows[0]:
    # Find 'Hospita' and replace with 'Hospital'
    rows[0] = [item if item != 'Hospita' else 'Hospital' for item in rows[0]]
    
    # Save back with same encoding if possible, or utf-8-sig
    with open('checklist-final.csv', 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print("Fixed header:", rows[0])
else:
    print("Could not read rows")
