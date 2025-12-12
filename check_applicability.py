
import csv

csv_path = r"c:\Users\SK\Documents\qims\pwa-bots2\pwa-inspectors\checklist-final.csv"

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
except UnicodeDecodeError:
    with open(csv_path, 'r', encoding='latin-1') as f:
        lines = f.readlines()

# Print header to know which column is which (optional, but helpful)
print(f"Header: {lines[0].strip()}")

for i, line in enumerate(lines):
    if "Specimen reception room" in line:
        print(f"Line {i+1}: {line.strip()}")
        break
