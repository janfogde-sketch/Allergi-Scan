#!/usr/bin/env python3
# PostToolUse-hook (Write|Edit): scanner den lige-ændrede fil for kyrillisk
# mojibake (tegn-encoding-fejl fra copy/paste af danske tegn — se CLAUDE.md
# afsnit 4 og .claude/skills/ship/SKILL.md for baggrund). Kræver mindst 2
# sammenhængende kyrilliske tegn for at undgå falske positiver fra tekst der
# selv OMTALER scan-regex'en (fx "[Ѐ-ӿ]" i dokumentation).
import json
import re
import sys

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path")
if not path:
    sys.exit(0)

try:
    with open(path, encoding="utf-8") as f:
        text = f.read()
except Exception:
    sys.exit(0)

matches = re.findall(r"[Ѐ-ӿ]{2,}", text)
if matches:
    print(json.dumps({
        "systemMessage": (
            f"⚠️ Mulig mojibake (kyrillisk tekst) fundet i {path}: "
            f"{matches[:5]} — tjek for tegn-encoding-fejl fra copy/paste af "
            f"danske tegn (æ/ø/å) før du committer."
        )
    }))
