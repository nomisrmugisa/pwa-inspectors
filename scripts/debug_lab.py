import csv
import re

def debug_lab_logic():
    with open('checklist-final.csv', 'r', encoding='latin-1') as f:
        reader = csv.reader(f)
        lines = list(reader)
    
    facility_types = [h.strip() for h in lines[0][1:] if h.strip()]
    lab_idx = 1 # Index 1 is Surgery? No, Category 2 is Lab. 
    # Let me check the actual index for Laboratory.
    # [O&G, Lab, Psych, ...] -> Lab is index 1.
    
    sections = []
    questions = []
    section_app = {}
    
    curr = "GENERAL"
    for i, row in enumerate(lines[1:]):
        if not row: continue
        name = row[0].strip()
        is_header = name.isupper() and len(name) > 3
        app = [c.strip() == '?' for c in row[1:]]
        
        if is_header:
            curr = name
            if curr not in sections:
                sections.append(curr)
                section_app[curr] = app
        else:
            questions.append({'name': name, 'section': curr, 'app': app})

    # Now simulate Lab logic for LAB (index 1)
    has_explicit = any(marks[lab_idx] for marks in section_app.values())
    print(f"Laboratory (index 1) has explicit sections: {has_explicit}")
    
    print("\nCheck for SECTION A-ORGANISATION AND MANAGEMENT:")
    s = "SECTION A-ORGANISATION AND MANAGEMENT"
    marked = section_app[s][lab_idx]
    print(f"Section {s} marked for Lab: {marked}")
    
    if has_explicit:
        print("Using strict mode")
    else:
        print("Using legacy mode")
        
    qs = [q for q in questions if q['section'] == s and q['app'][lab_idx]]
    print(f"Found {len(qs)} questions for Lab in {s}")

debug_lab_logic()
# WAIT! I used lab_idx = 1. Let me check the header again.
# 0: O&G, 1: Lab, 2: Psych...
