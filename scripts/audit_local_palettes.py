#!/usr/bin/env python3
"""Audit en lecture seule des palettes locales Finance / Surveillance."""

from pathlib import Path
import re
import sys

ROOT = Path.cwd()

TARGETS = [
    "src/modules/Finance/tabs/ExpensesTab.tsx",
    "src/modules/Finance/tabs/TreasuryTab.tsx",
    "src/modules/Finance/tabs/DocumentsTab.tsx",
    "src/modules/Finance/tabs/FundingsTab.tsx",
    "src/pages/surveillance/tabs/EvenementsTab.tsx",
    "src/lib/constants.ts",
]

DECLARATION_RE = re.compile(
    r"\b(?:const|let|var)\s+"
    r"([A-Z][A-Z0-9_]*(?:COLORS?|STATUS|TYPE|DIRECTION)[A-Z0-9_]*)\s*="
)

CLASS_RE = re.compile(
    r"""['"`]([^'"`\n]*(?:bg-|text-|border-)[^'"`\n]*)['"`]"""
)

def print_section(title):
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)

def extract_declarations(lines):
    found = []
    for index, line in enumerate(lines):
        match = DECLARATION_RE.search(line)
        if match:
            found.append((index, match.group(1)))
    return found

def show_declaration(lines, start, name):
    print(f"\n  Déclaration : {name} (ligne {start + 1})")
    depth = 0
    started = False

    for index in range(start, min(start + 100, len(lines))):
        line = lines[index]
        print(f"    {index + 1:4}: {line}")

        # Comptage simple des accolades, suffisant pour les objets JS usuels.
        depth += line.count("{") - line.count("}")
        if "{" in line:
            started = True

        if started and depth <= 0 and index > start:
            break

def audit_file(relative_path):
    path = ROOT / relative_path
    print_section(relative_path)

    if not path.is_file():
        print("  [ABSENT] Fichier introuvable.")
        return

    lines = path.read_text(encoding="utf-8").splitlines()
    declarations = extract_declarations(lines)

    if declarations:
        for start, name in declarations:
            show_declaration(lines, start, name)
    else:
        print("  Aucune déclaration de palette détectée.")

    classes = {}
    for index, line in enumerate(lines):
        for match in CLASS_RE.finditer(line):
            value = match.group(1).strip()
            if value:
                classes.setdefault(value, []).append(index + 1)

    if classes:
        print("\n  Classes de couleurs utilisées :")
        for value, line_numbers in sorted(classes.items()):
            locations = ", ".join(map(str, line_numbers[:8]))
            suffix = "..." if len(line_numbers) > 8 else ""
            print(f"    - {value}  [lignes {locations}{suffix}]")

def main():
    print("AUDIT DES PALETTES LOCALES — BAHKANSO")
    print(f"Racine : {ROOT}")
    print("Mode : lecture seule — aucune modification de fichier")

    for relative_path in TARGETS:
        audit_file(relative_path)

    print_section("FIN DE L'AUDIT")
    print("Aucun fichier source n'a été modifié.")
    print("Les résultats permettent d'identifier les palettes à comparer.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
