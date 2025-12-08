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
    # Extract facility types from first row
    facility_types = [ft.strip() for ft in lines[0][1:] if ft.strip()]
    
    # Find BLEEDING ROOM section
    current_section = None
    bleeding_room_questions = []
    
    for i, row in enumerate(lines[1:], start=2):
        if not row or not row[0].strip():
            continue
        
        first_column = row[0].strip()
        
        # Detect section headers
        if (first_column and 
            first_column.isupper() and 
            len(first_column) > 3 and 
            not first_column.endswith('?')):
            current_section = first_column
        
        # If we're in BLEEDING ROOM section, collect questions
        elif current_section == "BLEEDING ROOM":
            # Check applicability per facility type
            applicability = []
            for j, ft in enumerate(facility_types):
                cell_value = row[j + 1].strip() if j + 1 < len(row) else ''
                applicability.append(cell_value == '?')
            
            # Check if this is a question
            has_any_applicability = any(applicability)
            if first_column.endswith('?') or has_any_applicability:
                bleeding_room_questions.append({
                    'question': first_column,
                    'applicability': applicability,
                    'applicable_to': [facility_types[i] for i, applicable in enumerate(applicability) if applicable]
                })
    
    # Write output to file
    with open('bleeding_room_data_elements_output.txt', 'w', encoding='utf-8') as output:
        output.write(f"BLEEDING ROOM Section - {len(bleeding_room_questions)} Data Elements\n")
        output.write("=" * 100 + "\n\n")
        
        for i, q in enumerate(bleeding_room_questions, 1):
            output.write(f"{i}. {q['question']}\n")
            output.write(f"   Applicable to: {', '.join(q['applicable_to']) if q['applicable_to'] else 'None'}\n\n")
        
        output.write("=" * 100 + "\n")
        output.write(f"\nSummary: {len(bleeding_room_questions)} data elements in BLEEDING ROOM section\n\n")
        
        # Show which facility types have this section
        all_facilities_with_bleeding_room = set()
        for q in bleeding_room_questions:
            all_facilities_with_bleeding_room.update(q['applicable_to'])
        
        output.write(f"Facility types with BLEEDING ROOM section:\n")
        for ft in sorted(all_facilities_with_bleeding_room):
            count = sum(1 for q in bleeding_room_questions if ft in q['applicable_to'])
            output.write(f"   - {ft}: {count} questions\n")
    
    print("✅ Output written to: bleeding_room_data_elements_output.txt")
    print(f"📊 Found {len(bleeding_room_questions)} data elements in BLEEDING ROOM section")
else:
    print("Failed to read CSV file")
