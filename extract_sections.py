import csv

encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
lines = None

for encoding in encodings:
    try:
        with open('checklist-final.csv', 'r', encoding=encoding) as file:
            reader = csv.reader(file)
            lines = list(reader)
        break
    except UnicodeDecodeError:
        continue

if lines:
    sections = []
    for i, row in enumerate(lines[1:], start=2):
        if not row or not row[0].strip():
            continue
        
        first_column = row[0].strip()
        
        # Detect section headers - fully capitalized names
        if (first_column and 
            first_column.isupper() and 
            len(first_column) > 3 and 
            not first_column.endswith('?')):
            sections.append(first_column)
    
    print(f"Found {len(sections)} sections:\n")
    for i, section in enumerate(sections, 1):
        print(f"{i}. {section}")
else:
    print("Failed to read CSV file")
