#!/usr/bin/env python3
"""
Finds potentially unused source files in the project.
Usage: python3 scripts/find_dead_code.py
"""

import os
import re
import sys

# Configuration
# Determine root directory relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

SRC_DIR = os.path.join(ROOT_DIR, "src")
FUNCTIONS_DIR = os.path.join(ROOT_DIR, "functions")

EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.css', '.scss'}

# Entry points (Files we KNOW are used)
# These are relative to ROOT_DIR
ENTRY_POINT_PATHS = [
    "src/main.jsx",
    "index.html",
    "src/pages.config.js",
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "jsconfig.json",
    "package.json",
]

def get_entry_points():
    entry_points = []
    for p in ENTRY_POINT_PATHS:
        entry_points.append(os.path.join(ROOT_DIR, p))

    # Add all top-level functions as entry points
    if os.path.exists(FUNCTIONS_DIR):
        for f in os.listdir(FUNCTIONS_DIR):
            if f.endswith(".ts") and os.path.isfile(os.path.join(FUNCTIONS_DIR, f)):
                entry_points.append(os.path.join(FUNCTIONS_DIR, f))

    return entry_points

# Resolve Alias
def resolve_path(current_file, import_path):
    # Handle @ alias
    if import_path.startswith("@/"):
        return os.path.normpath(os.path.join(ROOT_DIR, "src", import_path[2:]))

    # Handle relative paths
    if import_path.startswith("."):
        return os.path.normpath(os.path.join(os.path.dirname(current_file), import_path))

    # Handle absolute paths (rare in this setup but possible)
    if import_path.startswith("/"):
        return os.path.normpath(os.path.join(ROOT_DIR, import_path[1:]))

    return None # Likely a node module or external dependency

def find_file(filepath):
    # Tries to find the file with various extensions
    if os.path.exists(filepath) and os.path.isfile(filepath):
        return filepath

    for ext in EXTENSIONS:
        if os.path.exists(filepath + ext):
            return filepath + ext
        # Check index files
        if os.path.exists(os.path.join(filepath, "index" + ext)):
            return os.path.join(filepath, "index" + ext)

    return None

def scan_imports(filepath):
    imports = set()
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

            # Regex for imports
            # import ... from '...'
            # import '...'
            matches = re.findall(r'from\s+[\'"]([^\'"]+)[\'"]', content)
            matches += re.findall(r'import\s+[\'"]([^\'"]+)[\'"]', content)
            matches += re.findall(r'import\(\s*[\'"]([^\'"]+)[\'"]\s*\)', content)
            matches += re.findall(r'require\(\s*[\'"]([^\'"]+)[\'"]\s*\)', content)

            for match in matches:
                # Filter out node_modules (simple heuristic: no ./, ../, / at start, and doesn't start with @/)
                if not match.startswith(".") and not match.startswith("/") and not match.startswith("@/"):
                    continue

                resolved = resolve_path(filepath, match)
                if resolved:
                    found = find_file(resolved)
                    if found:
                        imports.add(found)
                    else:
                        pass # Could not resolve file

    except Exception as e:
        print(f"Error reading {filepath}: {e}", file=sys.stderr)
    return imports

def is_test_file(filename):
    return (
        filename.endswith(".test.js") or
        filename.endswith(".test.jsx") or
        filename.endswith(".test.ts") or
        filename.endswith(".test.tsx") or
        filename.endswith(".spec.js") or
        filename.endswith(".spec.jsx") or
        filename.endswith(".spec.ts") or
        filename.endswith(".spec.tsx")
    )

def get_all_files(directory):
    files = set()
    for root, _, filenames in os.walk(directory):
        if 'node_modules' in root:
            continue
        for filename in filenames:
            if is_test_file(filename):
                continue

            if any(filename.endswith(ext) for ext in EXTENSIONS):
                files.add(os.path.normpath(os.path.join(root, filename)))
    return files

def main():
    # 1. Identify all source files
    all_src_files = get_all_files(SRC_DIR)
    all_func_files = get_all_files(FUNCTIONS_DIR)
    all_files = all_src_files.union(all_func_files)

    # 2. Build dependency graph
    visited = set()
    queue = []

    # Initialize queue with entry points
    for entry in get_entry_points():
        resolved = find_file(entry)
        if resolved:
            # We add normalized path
            norm_resolved = os.path.normpath(resolved)
            if norm_resolved not in visited:
                queue.append(norm_resolved)
                visited.add(norm_resolved)

    while queue:
        current = queue.pop(0)
        imports = scan_imports(current)

        for imp in imports:
            # imports contain full paths found by find_file
            norm_imp = os.path.normpath(imp)
            if norm_imp not in visited:
                visited.add(norm_imp)
                queue.append(norm_imp)

    # 3. Determine dead code
    dead_code = all_files - visited

    # 4. Output results
    print("=== DEAD CODE CANDIDATES ===")
    if not dead_code:
        print("No dead code found!")
    else:
        for f in sorted(list(dead_code)):
            # Print path relative to root for readability
            print(os.path.relpath(f, ROOT_DIR))

if __name__ == "__main__":
    main()
