import re
from pathlib import Path

p=Path('pdf-template.js')
s=p.read_text(encoding='utf-8')

# Remove body .logos CSS block
s=re.sub(r"\n\s*\.logos\{[\s\S]*?\}\n\s*\.logos img\{[\s\S]*?\}\n","\n  /* Body-Logos entfernt – Logos sind im Header-Template (Seitenrand) enthalten */\n\n", s)

# Ensure helper comment label
s=s.replace('\n// Helpers\n','\n// Helpers (HTML-Encode + kleine UI-Bausteine)\n')

p.write_text(s,encoding='utf-8')
print('updated')

