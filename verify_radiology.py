import csv
import json

# Open and read the CSV file
with open('checklist-final.csv', 'r', encoding='latin-1') as f:
    reader = csv.reader(f)
    lines = list(reader)

# Get facility types
facility_types = lines[0][1:]
radiology_col = facility_types.index('Radiology') + 1

print("VERIFICATION REPORT")
print("=" * 80)
print(f"\nChecking if generated config files match CSV source...")
print(f"CSV File: checklist-final.csv")
print(f"Radiology Column: {radiology_col}")

# Check all sections for Radiology
current_section = None
section_data = {}

for i, row in enumerate(lines[1:], start=2):
    if not row or not row[0].strip():
        continue
    
    first_col = row[0].strip()
    
    # Detect section headers
    if (first_col.isupper() and 
        not first_col.endswith('?') and 
        len(first_col) > 3):
        current_section = first_col
        if current_section not in section_data:
            section_data[current_section] = []
    
    # Collect fields with ? for Radiology
    elif current_section and len(row) > radiology_col:
        if row[radiology_col].strip() == '?':
            section_data[current_section].append(first_col)

# Print summary
print(f"\n{'='*80}")
print("RADIOLOGY - SECTIONS AND FIELD COUNTS")
print(f"{'='*80}\n")

total_fields = 0
for section, fields in sorted(section_data.items()):
    if fields:  # Only show sections with fields
        print(f"{section}:")
        print(f"  Fields: {len(fields)}")
        total_fields += len(fields)
        
        # Show first 3 fields as examples
        for field in fields[:3]:
            print(f"    - {field}")
        if len(fields) > 3:
            print(f"    ... and {len(fields) - 3} more")
        print()

print(f"{'='*80}")
print(f"TOTAL FIELDS FOR RADIOLOGY: {total_fields}")
print(f"{'='*80}")

# Save detailed report
report = {
    "facility_type": "Radiology",
    "total_fields": total_fields,
    "sections": {section: fields for section, fields in section_data.items() if fields}
}

with open('radiology_csv_report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print(f"\n✓ Detailed report saved to: radiology_csv_report.json")
