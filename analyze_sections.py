import csv

def analyze_csv(file_path):
    sections = []
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if len(lines) < 2:
        return
        
    facility_types = [t.strip() for t in lines[1].split(',') if t.strip()]
    
    for i in range(2, len(lines)):
        line = lines[i].strip()
        if not line:
            continue
            
        columns = line.split(',')
        if not columns:
            continue
            
        first_column = columns[0].strip()
        
        if first_column.startswith('SECTION'):
            sections.append({
                'name': first_column,
                'type': 'main',
                'questions_count': 0,
                'subsections': []
            })
        elif first_column and first_column.endswith('?') and len(first_column) > 25:
            if sections:
                sections[-1]['subsections'].append({
                    'name': first_column,
                    'questions_count': 0
                })
        elif first_column and sections:
            sections[-1]['questions_count'] += 1
            if sections[-1]['subsections']:
                sections[-1]['subsections'][-1]['questions_count'] += 1
                
    for s in sections:
        print(f"MAIN SECTION: {s['name']} ({s['questions_count']} total questions)")
        for sub in s['subsections']:
            print(f"  - SUBSECTION: {sub['name']} ({sub['questions_count']} questions)")

if __name__ == "__main__":
    analyze_csv(r"c:\Users\SK\Documents\qims\pwa-bots2\pwa-inspectors\checklist-final.csv")
