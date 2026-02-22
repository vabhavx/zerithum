#!/usr/bin/env python3
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
PAGES_DIR = os.path.join(ROOT_DIR, "src", "pages")

def fix_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}", file=sys.stderr)
        return

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

if __name__ == "__main__":
    if os.path.exists(PAGES_DIR):
        for root, dirs, files in os.walk(PAGES_DIR):
            for file in files:
                if file.endswith('.jsx') or file.endswith('.tsx') or file.endswith('.js') or file.endswith('.ts'):
                    fix_file(os.path.join(root, file))
    else:
        print(f"Directory not found: {PAGES_DIR}", file=sys.stderr)
