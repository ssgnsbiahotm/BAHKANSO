#!/usr/bin/env python3
"""BAHKANSO — Audit CSS / Design System."""
import argparse, json, re, sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "docs" / "audit"

EXCLUDE_DIRS = {
    "node_modules","dist","build",".git",".agents",".claude",".codex",
    ".bolt",".omc",".playwright-mcp",".playwright-cli","_claude-output",
    "backup_20261014-103945","backup_routage_20261014-114150",
    ".backup_boutons","output","public",
}
EXCLUDE_FILES = [r".*\.test\.(ts|tsx)$", r".*\.spec\.(ts|tsx)$",
                 r".*\.backup$", r".*\.bak$", r".*\.d\.ts$"]
SCAN_EXTS = {".tsx", ".ts", ".css"}

TW = ("slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|"
      "emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose")
SH = "50|100|200|300|400|500|600|700|800|900|950"
V = r"(?:sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|disabled:|group-hover:|focus-visible:|dark:)*"

RE_BG     = re.compile(rf"{V}bg-(?:{TW})-(?:{SH})\b")
RE_TEXT   = re.compile(rf"{V}text-(?:{TW})-(?:{SH})\b")
RE_BORDER = re.compile(rf"{V}border-(?:{TW})-(?:{SH})\b")
RE_RING   = re.compile(rf"{V}ring-(?:{TW})-(?:{SH})\b")
RE_HEX    = re.compile(r"#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")
RE_RGB    = re.compile(r"rgba?\([^)]+\)")
RE_INLINE = re.compile(r"style=\{\{")
RE_VARUSE = re.compile(r"var\(\s*(--[\w-]+)")
RE_VARDEF = re.compile(r"(--[\w-]+)\s*:")
RE_CLASS  = re.compile(r"\.([a-zA-Z_][\w-]*)")
RE_COMMENT= re.compile(r"^\s*(//|\*|/\*)")

def exclude(p):
    if any(part in EXCLUDE_DIRS for part in p.parts): return True
    return any(re.search(pat, p.name) for pat in EXCLUDE_FILES)

def walk(root, sub=None):
    base = (root / sub) if sub else root
    if not base.exists():
        print(f"⚠ Chemin introuvable : {base}", file=sys.stderr); return
    for p in base.rglob("*"):
        if p.is_file() and p.suffix in SCAN_EXTS and not exclude(p):
            yield p

def rel(p, root):
    try: return str(p.relative_to(root))
    except ValueError: return str(p)

class R:
    def __init__(self):
        self.files = 0; self.tsx = 0; self.css = 0
        self.colors = []; self.bg = []; self.text = []; self.border = []
        self.ring = []; self.inline = []
        self.vdef = defaultdict(list); self.vuse = defaultdict(list)
        self.cdef = defaultdict(list); self.cuse = set()

def scan(path, r, root):
    relp = rel(path, root)
    try: txt = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        print(f"⚠ Lecture {relp}: {e}", file=sys.stderr); return
    for n, line in enumerate(txt.splitlines(), 1):
        if RE_COMMENT.match(line): continue
        ctx = line.strip()[:90]
        for m in RE_HEX.findall(line): r.colors.append((relp, n, m, "hex", ctx))
        for m in RE_RGB.findall(line): r.colors.append((relp, n, m, "rgb", ctx))
        for m in RE_BG.findall(line):   r.bg.append((relp, n, m))
        for m in RE_TEXT.findall(line): r.text.append((relp, n, m))
        for m in RE_BORDER.findall(line): r.border.append((relp, n, m))
        for m in RE_RING.findall(line): r.ring.append((relp, n, m))
        if RE_INLINE.search(line): r.inline.append((relp, n, ctx))
        for v in RE_VARUSE.findall(line): r.vuse[v].append(f"{relp}:{n}")
        for m in re.finditer(r'className=(?:"([^"]*)"|\{`([^`]*)`\})', line):
            for c in (m.group(1) or m.group(2) or "").split():
                bare = c.split(":")[-1]
                if bare: r.cuse.add(bare)
        for c in RE_VARDEF.findall(line): r.vdef[c].append(f"{relp}:{n}")
        for c in RE_CLASS.findall(line): r.cdef[c].append(f"{relp}:{n}")

def audit(root, sub=None):
    r = R()
    for p in walk(root, sub):
        r.files += 1
        if p.suffix == ".css": r.css += 1
        else: r.tsx += 1
        scan(p, r, root)
    return r

def md(r):
    L = []; now = datetime.now().strftime("%Y-%m-%d %H:%M")
    tw_total = len(r.bg)+len(r.text)+len(r.border)+len(r.ring)
    undef = set(r.vuse) - set(r.vdef)
    unused = set(r.vdef) - set(r.vuse)
    orphan = set(r.cdef) - r.cuse

    L.append("# BAHKANSO — Audit CSS / Design System\n")
    L.append(f"**Généré le** : {now}  ")
    L.append(f"**Fichiers scannés** : {r.files} ({r.tsx} TSX/TS, {r.css} CSS)\n")
    L.append("## Résumé exécutif\n")
    L.append("| Métrique | Total | Statut |")
    L.append("|---|---|---|")
    sc = "🔴" if len(r.colors)>100 else "🟠" if len(r.colors)>20 else "🟢"
    st = "🔴" if tw_total>200 else "🟠" if tw_total>50 else "🟢"
    si = "🔴" if len(r.inline)>200 else "🟠" if len(r.inline)>50 else "🟢"
    L.append(f"| Couleurs hardcodées | {len(r.colors)} | {sc} |")
    L.append(f"| Classes Tailwind par défaut | {tw_total} | {st} |")
    L.append(f"| Styles inline `style={{{{...}}}}` | {len(r.inline)} | {si} |")
    L.append(f"| Variables CSS non définies | {len(undef)} | {'🔴' if undef else '🟢'} |")
    L.append(f"| Variables CSS non utilisées | {len(unused)} | 🟡 |")
    L.append(f"| Classes CSS orphelines | {len(orphan)} | {'🟠' if len(orphan)>20 else '🟢'} |")
    L.append("")

    if undef:
        L.append("## 🔴 Variables CSS utilisées mais NON définies\n")
        L.append("*Cause de styles cassés silencieux.*\n")
        L.append("| Variable | Utilisée dans |")
        L.append("|---|---|")
        for v in sorted(undef):
            locs = ", ".join(r.vuse[v][:3])
            extra = f" (+{len(r.vuse[v])-3})" if len(r.vuse[v])>3 else ""
            L.append(f"| `{v}` | {locs}{extra} |")
        L.append("")

    if r.colors:
        L.append("## 🎨 Couleurs hardcodées\n")
        cnt = Counter(c[0] for c in r.colors)
        L.append("### Top 10 fichiers\n")
        L.append("| Fichier | Occurrences |")
        L.append("|---|---|")
        for f, n in cnt.most_common(10): L.append(f"| `{f}` | {n} |")
        L.append("\n### 30 premières occurrences\n")
        L.append("| Fichier | Ligne | Couleur | Type |")
        L.append("|---|---|---|---|")
        for f, n, m, t, _ in r.colors[:30]:
            L.append(f"| `{f}` | {n} | `{m}` | {t} |")
        L.append("")

    if tw_total:
        L.append("## 🎨 Classes Tailwind par défaut\n")
        for label, items in [("Background", r.bg), ("Text", r.text),
                             ("Border", r.border), ("Ring", r.ring)]:
            if items:
                L.append(f"### {label} ({len(items)})\n")
                L.append("| Fichier | Ligne | Classe |")
                L.append("|---|---|---|")
                for f, n, m in items[:15]: L.append(f"| `{f}` | {n} | `{m}` |")
                if len(items)>15: L.append(f"\n*... et {len(items)-15} autres.*")
                L.append("")

    if r.inline:
        L.append("## 🎨 Styles inline\n")
        cnt = Counter(c[0] for c in r.inline)
        L.append("| Fichier | Occurrences |")
        L.append("|---|---|")
        for f, n in cnt.most_common(10): L.append(f"| `{f}` | {n} |")
        L.append("")

    if orphan:
        L.append(f"## 🎨 Classes CSS orphelines ({len(orphan)})\n")
        L.append("*Définies mais jamais utilisées dans les TSX.*\n")
        L.append("| Classe | Définie dans |")
        L.append("|---|---|")
        for c in sorted(orphan)[:30]:
            L.append(f"| `.{c}` | `{r.cdef[c][0]}` |")
        L.append("")

    L.append("## 📋 Plan d'action\n")
    acts = []
    if undef: acts.append(f"🔴 **P0** — Définir/supprimer les {len(undef)} variables CSS fantômes")
    if r.colors: acts.append(f"🔴 **P0** — Remplacer les {len(r.colors)} couleurs hardcodées")
    if tw_total>50: acts.append(f"🟠 **P1** — Migrer les {tw_total} classes Tailwind par défaut")
    if len(r.inline)>50: acts.append(f"🟠 **P1** — Convertir les {len(r.inline)} styles inline")
    if orphan: acts.append(f"🟡 **P2** — Nettoyer les {len(orphan)} classes orphelines")
    for a in acts: L.append(f"- {a}")
    L.append("")

    return "\n".join(L)

def js(r):
    undef = sorted(set(r.vuse) - set(r.vdef))
    unused = sorted(set(r.vdef) - set(r.vuse))
    orphan = sorted(set(r.cdef) - r.cuse)
    return {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "files": r.files, "tsx": r.tsx, "css": r.css,
            "colors": len(r.colors), "tw_bg": len(r.bg), "tw_text": len(r.text),
            "tw_border": len(r.border), "tw_ring": len(r.ring),
            "inline": len(r.inline), "undef_vars": len(undef),
            "unused_vars": len(unused), "orphan_classes": len(orphan),
        },
        "colors": r.colors, "bg": r.bg, "text": r.text,
        "border": r.border, "ring": r.ring, "inline": r.inline,
        "undef_vars": undef, "unused_vars": unused, "orphan_classes": orphan,
    }

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--path"); p.add_argument("--format", choices=["markdown","json","both"], default="both")
    p.add_argument("--stdout", action="store_true")
    a = p.parse_args()

    print(f"🔍 Scan de {ROOT}...", file=sys.stderr)
    r = audit(ROOT, a.path)
    print(f"✅ {r.files} fichiers ({r.tsx} TSX/TS, {r.css} CSS)", file=sys.stderr)

    if a.stdout:
        print(md(r)); return 0

    if a.format in ("markdown","both"):
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        mp = OUTPUT_DIR / "CSS_AUDIT.md"
        mp.write_text(md(r), encoding="utf-8")
        print(f"📄 {mp.relative_to(ROOT)}", file=sys.stderr)

    if a.format in ("json","both"):
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        jp = OUTPUT_DIR / "css-audit.json"
        jp.write_text(json.dumps(js(r), indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"📄 {jp.relative_to(ROOT)}", file=sys.stderr)

    undef = set(r.vuse) - set(r.vdef)
    print(f"\n📊 Couleurs: {len(r.colors)} | Tailwind: {len(r.bg)+len(r.text)+len(r.border)+len(r.ring)} | Inline: {len(r.inline)} | Var. non définies: {len(undef)}", file=sys.stderr)
    return 0

if __name__ == "__main__":
    sys.exit(main())
