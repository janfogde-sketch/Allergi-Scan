#!/usr/bin/env python3
"""PreToolUse-hook: blokerer et lille sæt uigenkaldeligt destruktive Bash-mønstre."""
import json
import re
import sys

DANGEROUS_PATTERNS = [
    (r"\brm\s+-[a-zA-Z]*r[a-zA-Z]*f\b.*\s/(\s|$)", "rm -rf mod filsystemets rod"),
    (r"\bgit\s+push\s+.*--force(?!-with-lease)\b.*\b(main|master)\b", "force-push til main/master uden --force-with-lease"),
    (r"\bgit\s+push\s+.*\b(main|master)\b.*--force(?!-with-lease)\b", "force-push til main/master uden --force-with-lease"),
    # Undtagelse: "git reset --hard origin/main" er den stående, veletablerede
    # resync-branch-kommando (CLAUDE.md afsnit 4, trin 10) — køres altid EFTER
    # en allerede-verificeret, netop mergetet PR, mod den kendte produktions-
    # branch. Ethvert andet reset-mål (en anden branch, en commit-SHA, bare
    # "git reset --hard" der rammer HEAD) skal stadig bekræftes.
    (r"\bgit\s+reset\s+--hard\b(?!\s+origin/main\b)", "git reset --hard"),
]


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return

    if payload.get("tool_name") != "Bash":
        return

    command = payload.get("tool_input", {}).get("command", "")
    if not command:
        return

    for pattern, reason in DANGEROUS_PATTERNS:
        if re.search(pattern, command):
            print(
                json.dumps(
                    {
                        "hookSpecificOutput": {
                            "hookEventName": "PreToolUse",
                            "permissionDecision": "ask",
                            "permissionDecisionReason": f"Potentielt destruktiv kommando fanget af block-dangerous-bash.py: {reason}. Bekræft at dette er tilsigtet.",
                        }
                    }
                )
            )
            return


if __name__ == "__main__":
    main()
