import csv

def check_shared_section():
    with open('checklist-final.csv', 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lines = list(reader)
    
    row3 = lines[2] # SECTION A...
    print(f"Row 3: {row3[0]}")
    print(f"Marks: {row3[1:]}")
    
    any_marks = any(c.strip() == '?' for c in row3[1:])
    print(f"Any marks on header: {any_marks}")

check_shared_section()
