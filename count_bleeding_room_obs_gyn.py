import csv

csv_path = "checklist-final.csv"

print("Checking BLEEDING ROOM section for Obstetrics & Gynaecology")
print("=" * 80)

# Try different encodings
encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
lines = None

for encoding in encodings:
    try:
        with open(csv_path, 'r', encoding=encoding) as file:
            lines = file.readlines()
        print(f"Successfully read CSV with encoding: {encoding}\n")
        break
    except:
        continue

if not lines:
    print("Failed to read CSV file")
    exit(1)

# Parse CSV
reader = csv.reader(lines)
rows = list(reader)

# Find header row
header = rows[0]
print(f"Header row has {len(header)} columns")

# Find the column index for "Obstetrics & Gynaecology"
obs_gyn_index = None
for i, col in enumerate(header):
    if "Obstetrics" in col and "Gynaecology" in col:
        obs_gyn_index = i
        print(f"Found 'Obstetrics & Gynaecology' at column index {i}: '{col}'")
        break

if obs_gyn_index is None:
    print("Could not find 'Obstetrics & Gynaecology' column")
    exit(1)

# Find BLEEDING ROOM section
in_bleeding_room = False
marked_questions = []
all_questions = []

for row in rows[1:]:  # Skip header
    if not row or len(row) == 0:
        continue
    
    question_text = row[0].strip() if row else ""
    
    # Check if this is the BLEEDING ROOM section header
    if "BLEEDING ROOM" in question_text.upper():
        if question_text.strip() == "BLEEDING ROOM" or question_text.startswith("BLEEDING ROOM"):
            in_bleeding_room = True
            print(f"\nFound BLEEDING ROOM section header: '{question_text}'")
            continue
    
    # Check if we've moved to a new section
    if in_bleeding_room and question_text:
        if (len(question_text) < 50 and 
            any(keyword in question_text.upper() for keyword in 
                ['TOILET', 'SAFETY', 'SUPPLIES', 'TENS', 'SLUICE', 'FACILITY', 'SECTION'])):
            print(f"End of BLEEDING ROOM (found next section: '{question_text}')\n")
            break
    
    if in_bleeding_room and question_text and len(question_text) > 5:
        all_questions.append(question_text)
        
        # Check if this question is marked with "?" for Obstetrics & Gynaecology
        if obs_gyn_index < len(row):
            mark = row[obs_gyn_index].strip()
            if mark == '?':
                marked_questions.append(question_text)

print(f"Total questions in BLEEDING ROOM section: {len(all_questions)}")
print(f"Questions marked with '?' for Obstetrics & Gynaecology: {len(marked_questions)}")
print("=" * 80)

if len(marked_questions) > 0:
    print("\nQuestions that SHOULD show (marked with '?'):\n")
    for i, q in enumerate(marked_questions, 1):
        print(f"{i}. {q}")
else:
    print("\nNO questions are marked with '?' for this section!")

print("\n" + "=" * 80)
print(f"\nExpected count: {len(marked_questions)} data elements")
print(f"Actual count shown in app: 4 data elements")

if len(marked_questions) != 4:
    print(f"\nMISMATCH: The CSV says {len(marked_questions)} should show, but only 4 are showing.")
    print("This means only 4 of the marked questions have matching DHIS2 data elements.")
