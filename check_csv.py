import csv

# Open and read the CSV file
with open('checklist-final.csv', 'r', encoding='latin-1') as f:
    reader = csv.reader(f)
    lines = list(reader)

# Get facility types from row 0
facility_types = lines[0][1:]
print("Facility Types:")
for i, ft in enumerate(facility_types):
    print(f"  Column {i+1}: {ft}")

# Find Radiology column
radiology_col = facility_types.index('Radiology') + 1 if 'Radiology' in facility_types else -1
print(f"\nRadiology is in column: {radiology_col}")

# Find the FACILITY- CONSULTATION/TREATMENT ROOM section
section_found = False
section_start_row = 0
fields_with_question_mark = []

for i, row in enumerate(lines[1:], start=2):
    if not row or not row[0].strip():
        continue
    
    first_col = row[0].strip()
    
    # Check if this is the section we're looking for
    if first_col == 'FACILITY- CONSULTATION/TREATMENT ROOM':
        section_found = True
        section_start_row = i
        print(f"\n✓ Found section at row {i}")
        continue
    
    # If we found the section, process its rows
    if section_found:
        # Check if we've hit the next section (all caps, no ?, length > 3)
        if (first_col.isupper() and 
            not first_col.endswith('?') and 
            len(first_col) > 3):
            print(f"\n✓ Next section found at row {i}: {first_col}")
            break
        
        # Check if this row has a ? for Radiology
        if len(row) > radiology_col:
            radiology_value = row[radiology_col].strip()
            if radiology_value == '?':
                fields_with_question_mark.append({
                    'row': i,
                    'field': first_col
                })

print(f"\n{'='*80}")
print(f"RESULTS FOR RADIOLOGY - FACILITY- CONSULTATION/TREATMENT ROOM")
print(f"{'='*80}")
print(f"\nTotal fields with '?' mark: {len(fields_with_question_mark)}")
print(f"\nFields:")
for item in fields_with_question_mark:
    print(f"  Row {item['row']}: {item['field']}")
