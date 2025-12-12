
import csv

csv_path = r"c:\Users\SK\Documents\qims\pwa-bots2\pwa-inspectors\src\config\checklist for facilities2.0.csv"

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
except UnicodeDecodeError:
    with open(csv_path, 'r', encoding='latin-1') as f:
        lines = f.readlines()

found_tens = False
for i, line in enumerate(lines):
    if 'TENS' in line:
        print(f"Line {i}: {line.strip()}")
        # Print next 20 lines
        for j in range(1, 21):
            if i + j < len(lines):
                print(f"Line {i+j}: {lines[i+j].strip()}")
        found_tens = True
        break

if not found_tens:
    print("TENS not found in file")
