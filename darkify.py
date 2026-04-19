import os
import re

file_path = "src/App.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (r'bg-white(?! dark:)', 'bg-white dark:bg-slate-900'),
    (r'text-slate-800(?! dark:)', 'text-slate-800 dark:text-slate-100'),
    (r'border-slate-200(?! dark:)', 'border-slate-200 dark:border-slate-800'),
    (r'bg-slate-50(?! dark:)', 'bg-slate-50 dark:bg-slate-950'),
    (r'bg-slate-100(?! dark:)', 'bg-slate-100 dark:bg-slate-800'),
    (r'text-slate-500(?! dark:)', 'text-slate-500 dark:text-slate-400'),
    (r'text-slate-600(?! dark:)', 'text-slate-600 dark:text-slate-300'),
    (r'text-slate-700(?! dark:)', 'text-slate-700 dark:text-slate-200'),
    (r'bg-slate-200(?! dark:)', 'bg-slate-200 dark:bg-slate-800'),
    (r'bg-slate-900(?! dark:)', 'bg-slate-900 dark:bg-slate-800'), # Adjusting inner slate-900 components
]

for pattern, repl in replacements:
    content = re.sub(pattern, repl, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Darkify complete.")
