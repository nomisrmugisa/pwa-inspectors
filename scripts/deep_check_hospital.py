import csv

def deep_check_hospital():
    encodings = ['utf-8-sig', 'latin-1', 'cp1252']
    rows = None

    for encoding in encodings:
        try:
            with open('checklist-final.csv', 'r', encoding=encoding) as f:
                reader = csv.reader(f)
                rows = list(reader)
            break
        except Exception:
            continue

    if not rows:
        return

    header = rows[0]
    hospital_indices = [i for i, h in enumerate(header) if any(x in h.strip().lower() for x in ['hospita', 'hospital'])]
    
    print(f"Hospital search: {[(i, header[i]) for i in hospital_indices]}")
    
    for idx in hospital_indices:
        non_empty = []
        for r_idx, row in enumerate(rows[1:], start=2):
            if len(row) > idx:
                val = row[idx].strip()
                if val:
                    non_empty.append((r_idx, row[0][:30], val))
        
        print(f"\nNon-empty values in column {idx} ({header[idx]}):")
        if not non_empty:
            print("  None")
        else:
            for item in non_empty[:10]: # Print first 10
                print(f"  Row {item[0]}: {item[1]} -> '{item[2]}'")
            if len(non_empty) > 10:
                print(f"  ... and {len(non_empty)-10} more.")

deep_check_hospital()
