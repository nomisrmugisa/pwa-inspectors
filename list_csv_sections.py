import csv
import os

def list_sections(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found")
        return

    sections = []
    try:
        with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.reader(f)
            # Row 0 is the header with facility types
            header = next(reader)
            
            for row in reader:
                if not row or not row[0]:
                    continue
                
                first_column = row[0].strip()
                
                # Use the logic from generateFilters.py
                is_section_header = (first_column.isupper() and len(first_column) > 3) or first_column.startswith('FACILITY-')
                
                if is_section_header:
                    sections.append(first_column)
                    
        return sections
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    found_sections = list_sections('checklist-final.csv')
    if found_sections:
        for s in found_sections:
            print(s)
