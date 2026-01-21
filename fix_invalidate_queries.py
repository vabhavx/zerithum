import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to match invalidateQueries(['...']) or invalidateQueries(["..."])
    # It captures the content inside the array brackets
    # Avoiding matches that already have { queryKey: ... }

    # Pattern: queryClient.invalidateQueries( [ ... ] )
    # We want to replace it with queryClient.invalidateQueries({ queryKey: [ ... ] })

    # We look for invalidateQueries followed immediately by ( and then [

    new_content = re.sub(
        r'invalidateQueries\(\s*(\[[^\]]+\])\s*\)',
        r'invalidateQueries({ queryKey: \1 })',
        content
    )

    if new_content != content:
        print(f"Fixing {filepath}")
        with open(filepath, 'w') as f:
            f.write(new_content)

for root, dirs, files in os.walk('src/pages'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.tsx') or file.endswith('.js') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
