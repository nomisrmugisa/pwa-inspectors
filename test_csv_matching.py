import csv

csv_path = 'checklist-final.csv'

with open(csv_path, 'r', encoding='latin-1') as file:
    reader = csv.reader(file)
    lines = list(reader)

header_row = lines[0]
print(f"Header row items ({len(header_row)}):")
for i, item in enumerate(header_row):
    print(f"  {i}: '{item}'")

raw_types = [ft.strip() for ft in header_row[1:] if ft.strip()]
print(f"raw_types ({len(raw_types)}):")
for i, t in enumerate(raw_types):
    print(f"  {i}: '{t}'")

hospital_index = -1
for i, t in enumerate(raw_types):
    if 'Hospital' in t:
        hospital_index = i
        break
print(f"Hospital index: {hospital_index}")

if hospital_index != -1:
    target_col = hospital_index + 1
    print(f"Hospital target column in data rows: {target_col}")
    
    row3 = lines[3]
    print(f"Row 3 length: {len(row3)}")
    if target_col < len(row3):
        print(f"Row 3, Col {target_col}: '{row3[target_col]}'")
    else:
        print(f"Row 3, Col {target_col}: OUT OF BOUNDS")
