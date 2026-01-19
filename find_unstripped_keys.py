
import re

try:
    with open('src/config/hospital.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    print("Checking for keys ending with --\":")
    found = False
    for i, line in enumerate(lines):
        # Look for dictionary keys: "KEY--": {
        if re.search(r'^\s*"[^"]+--":\s*\{', line):
            print(f"Line {i+1}: {line.strip()}")
            found = True
            
    if not found:
        print("No malformed keys found.")

except Exception as e:
    print(f"Error: {e}")
