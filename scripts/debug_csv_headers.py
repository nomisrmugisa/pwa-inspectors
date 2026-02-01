import csv
import re

def normalize(text):
    clean = re.sub(r'^[\.\-\s]+', '', text)
    return clean.strip()

headers = []
with open('checklist-final.csv', 'r', encoding='latin-1') as f:
    reader = csv.reader(f)
    for i, row in enumerate(reader):
        if not row or not row[0]: continue
        text = row[0].strip()
        if text.isupper() and len(text) > 3 and not text.endswith('--'):
            if not text[0].isdigit():
                headers.append((i+1, text))

with open('csv_headers_debug.txt', 'w') as f:
    for line, h in headers:
        f.write(f"{line}: {h}\n")
