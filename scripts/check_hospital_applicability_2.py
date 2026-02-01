import csv

with open('checklist-final.csv', 'r', encoding='latin-1') as f:
    reader = csv.reader(f)
    rows = list(reader)

hospital_col = -1
for i, cell in enumerate(rows[0]):
    if 'Hospital' in cell:
        hospital_col = i
        break

print(f"Hospital column index: {hospital_col}")

for i in range(1201, 1238):
    row = rows[i]
    val = row[hospital_col] if hospital_col < len(row) else "N/A"
    print(f"{i+1}: {row[0][:50]} | {val}")
