import csv

csv_path = "checklist-final.csv"

print("🔍 Analyzing BLEEDING ROOM section in checklist-final.csv...")
print("=" * 80)

# Try different encodings
encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
lines = None

for encoding in encodings:
    try:
        with open(csv_path, 'r', encoding=encoding) as file:
            lines = file.readlines()
        print(f"✅ Successfully read CSV with encoding: {encoding}\n")
        break
    except:
        continue

if not lines:
    print("❌ Failed to read CSV file")
    exit(1)

# Parse CSV
reader = csv.reader(lines)
rows = list(reader)

# Find header row (first row)
header = rows[0]
facility_types = header[1:]  # Skip first column (question text)

print(f"📊 Found {len(facility_types)} facility types:")
for i, ft in enumerate(facility_types, 1):
    print(f"  {i}. {ft}")

print("\n" + "=" * 80)

# Find BLEEDING ROOM section
in_bleeding_room = False
bleeding_room_questions = []

for row in rows:
    if not row:
        continue
    
    question_text = row[0].strip() if row else ""
    
    # Check if this is the BLEEDING ROOM section header
    if "BLEEDING ROOM" in question_text.upper() and not any(char.isalnum() for char in question_text[:10]):
        in_bleeding_room = True
        print(f"\n📍 Found BLEEDING ROOM section at: '{question_text}'")
        continue
    
    # Check if we've moved to a new section
    if in_bleeding_room and question_text and not any(char.isalnum() for char in question_text[:15]):
        if any(keyword in question_text.upper() for keyword in ['SECTION', 'ROOM', 'AREA', 'MANAGEMENT', 'FACILITIES']):
            print(f"\n📍 End of BLEEDING ROOM section (next section: '{question_text}')\n")
            break
    
    if in_bleeding_room and question_text:
        # Count how many facility types have this question marked
        marks = row[1:len(facility_types)+1] if len(row) > 1 else []
        marked_count = sum(1 for mark in marks if mark and mark.strip() == '?')
        
        bleeding_room_questions.append({
            'question': question_text,
            'marks': marks,
            'marked_count': marked_count
        })

print(f"\n📋 Total questions in BLEEDING ROOM section: {len(bleeding_room_questions)}")
print("=" * 80)

# Show which facility types each question is marked for
for i, q in enumerate(bleeding_room_questions, 1):
    print(f"\n{i}. {q['question'][:60]}...")
    print(f"   Marked for {q['marked_count']}/{len(facility_types)} facility types")
    
    # Show which specific facility types
    marked_for = []
    for idx, mark in enumerate(q['marks']):
        if mark and mark.strip() == '?':
            if idx < len(facility_types):
                marked_for.append(facility_types[idx])
    
    if marked_for:
        print(f"   Facilities: {', '.join(marked_for[:5])}{' ...' if len(marked_for) > 5 else ''}")
    else:
        print(f"   ⚠️  NOT marked for any facility type!")

print("\n" + "=" * 80)
print("\nℹ️  If you're seeing only 4 fields, check which facility type you selected")
print("    and verify those 4 questions are marked with '?' for that facility type.")
