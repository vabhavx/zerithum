import re

content = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'"""

matches = re.findall(r'from\s+[\'"]([^\'"]+)[\'"]', content)
print("From matches:", matches)
matches_import = re.findall(r'import\s+[\'"]([^\'"]+)[\'"]', content)
print("Import matches:", matches_import)
