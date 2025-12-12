
import csv

csv_path = r"c:\Users\SK\Documents\qims\pwa-bots2\pwa-inspectors\src\config\checklist for facilities2.0.csv"

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
except UnicodeDecodeError:
    with open(csv_path, 'r', encoding='latin-1') as f:
        lines = f.readlines()

for i in range(580, 620):
    if i < len(lines):
        print(f"Line {i+1}: {lines[i].strip()}")
