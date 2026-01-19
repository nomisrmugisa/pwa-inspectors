import re

with open('src/config/hospital.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Potentially missed section headers (uppercase lines inside lists):")
for line in lines:
    line = line.strip()
    # Match strings in quotes
    match = re.search(r'"([^"]+)"', line)
    if match:
        content = match.group(1)
        # Check if fully uppercase, long enough, and NOT ending with --
        if content.isupper() and len(content) > 10 and not content.endswith('--'):
            # Filter out known good sections if they appear in keys (lines ending with :)
            if not line.endswith(':'): 
                print(f"  {content}")
