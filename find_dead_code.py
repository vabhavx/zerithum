import os
import re
import sys
import json

# Configuration
ROOT_DIR = "."
SRC_DIR = "src"
FUNCTIONS_DIR = "functions"
EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.css', '.scss'}

# Entry points (Files we KNOW are used)
ENTRY_POINTS = [
    "src/main.jsx",
    "index.html",
    "src/pages.config.js",
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "jsconfig.json",
    "package.json",
]

# Add all top-level functions as entry points
if os.path.exists(FUNCTIONS_DIR):
    for f in os.listdir(FUNCTIONS_DIR):
        if f.endswith(".ts") and os.path.isfile(os.path.join(FUNCTIONS_DIR, f)):
            ENTRY_POINTS.append(os.path.join(FUNCTIONS_DIR, f))

# Resolve Alias
def resolve_path(current_file, import_path):
    # Handle @ alias
    if import_path.startswith("@/"):
        return os.path.join(ROOT_DIR, "src", import_path[2:])

    # Handle relative paths
    if import_path.startswith("."):
        return os.path.normpath(os.path.join(os.path.dirname(current_file), import_path))

    # Handle absolute paths (rare in this setup but possible)
    if import_path.startswith("/"):
        return os.path.join(ROOT_DIR, import_path[1:])

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
                # Actually @/ is our alias. @radix... is a package.
                if not match.startswith(".") and not match.startswith("/") and not match.startswith("@/"):
                    continue

                resolved = resolve_path(filepath, match)
                if resolved:
                    found = find_file(resolved)
                    if found:
                        imports.add(found)
                    else:
                        pass # Could not resolve file, maybe CSS or non-standard

    except Exception as e:
        print(f"Error reading {filepath}: {e}", file=sys.stderr)
    return imports

def get_all_files(directory):
    files = set()
    for root, _, filenames in os.walk(directory):
        for filename in filenames:
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
    for entry in ENTRY_POINTS:
        resolved = find_file(entry)
        if resolved:
            queue.append(resolved)
            visited.add(resolved)

    while queue:
        current = queue.pop(0)
        imports = scan_imports(current)

        for imp in imports:
            if imp not in visited:
                visited.add(imp)
                queue.append(imp)

    # 3. Determine dead code
    dead_code = all_files - visited

    # 4. Output results
    print("=== DEAD CODE CANDIDATES ===")
    for f in sorted(list(dead_code)):
        print(f)

if __name__ == "__main__":
    main()
