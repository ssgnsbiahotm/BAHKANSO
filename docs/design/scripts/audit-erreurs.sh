#!/usr/bin/env bash
# Audit d'erreurs Bahkanso - lecture seule (hors reconstruction de dist/)
cd "$(git rev-parse --show-toplevel)" || exit 1
E=0; A=0
ok()   { echo "  [OK]      $*"; }
warn() { echo "  [ALERTE]  $*"; A=$((A+1)); }
err()  { echo "  [ERREUR]  $*"; E=$((E+1)); }
sec()  { echo; echo "=== $* ==="; }

sec "1. ENVIRONNEMENT"
echo "  node $(node -v) | npm $(npm -v)"
echo "  branche : $(git branch --show-current)"
echo "  dernier commit : $(git log --oneline -1)"
echo "  fichiers modifies non commites : $(git status -s | wc -l)"

sec "2. FICHIERS CLES"
for f in index.html src/main.tsx src/index.css tailwind.config.js \
         postcss.config.js vite.config.ts; do
  [ -f "$f" ] && ok "$f" || err "$f manquant"
done

sec "3. POINT D'ENTREE CSS"
grep -q "index.css" src/main.tsx 2>/dev/null \
  && ok "main.tsx importe index.css" \
  || err "main.tsx n'importe pas index.css"
grep -q "src/main" index.html 2>/dev/null \
  && ok "index.html charge src/main" \
  || warn "index.html ne reference pas src/main"

sec "4. src/index.css"
n=$(grep -c "^@tailwind" src/index.css)
[ "$n" -eq 3 ] && ok "3 directives @tailwind" \
  || err "directives @tailwind : $n (attendu : 3)"
t=$(grep -n "^@tailwind" src/index.css | head -1 | cut -d: -f1)
last=$(grep -n "^@import" src/index.css | tail -1 | cut -d: -f1)
if [ -n "$t" ] && [ -n "$last" ]; then
  if [ "$last" -gt "$t" ]; then
    err "@import (ligne $last) apres @tailwind (ligne $t) : imports ignores"
  else
    ok "tous les @import sont avant @tailwind"
  fi
fi
echo "  --- 14 premieres lignes ---"
sed -n '1,14p' src/index.css | cut -c1-70 | sed 's/^/     /'

sec "5. CONFIG TAILWIND ET POSTCSS"
grep -q tailwindcss postcss.config.js 2>/dev/null \
  && ok "postcss : tailwindcss" || err "postcss sans tailwindcss"
grep -q autoprefixer postcss.config.js 2>/dev/null \
  && ok "postcss : autoprefixer" || warn "autoprefixer absent"
grep -n -A5 "content" tailwind.config.js 2>/dev/null | head -10 | sed 's/^/     /'
grep -q 'src/\*\*' tailwind.config.js 2>/dev/null \
  && ok "content couvre src/**" || err "content ne couvre pas src/**"

sec "6. DEPENDANCES INSTALLEES"
for p in tailwindcss postcss autoprefixer vite-plugin-pwa \
         @fontsource-variable/fraunces @fontsource-variable/inter \
         @fontsource-variable/geist-mono; do
  [ -d "node_modules/$p" ] && ok "$p" || err "$p absent de node_modules"
done

sec "7. BUILD DE PRODUCTION (reconstruit dist/)"
npm run build > /tmp/audit-build.log 2>&1
rc=$?
[ $rc -eq 0 ] && ok "build termine" || err "build en echec (code $rc)"
c=$(grep -c "@import must precede" /tmp/audit-build.log)
[ "$c" -eq 0 ] && ok "aucun avertissement @import" \
  || err "$c avertissements @import"
echo "  messages suspects :"
grep -iE "error|failed|cannot|unknown|not found" /tmp/audit-build.log \
  | head -8 | cut -c1-100 | sed 's/^/     /'

sec "8. CSS CONSTRUIT (dist/assets)"
cat dist/assets/*.css > /tmp/audit-all.css 2>/dev/null
echo "  taille totale CSS : $(wc -c < /tmp/audit-all.css) octets"
grep -q "box-sizing:border-box" /tmp/audit-all.css \
  && ok "preflight Tailwind present" \
  || err "preflight absent (@tailwind base non traite)"
grep -qE '\.flex\{|\.flex,' /tmp/audit-all.css \
  && ok "utilitaire .flex present" \
  || err "utilitaires Tailwind absents (directive ou content)"
grep -q "color-ivory:" /tmp/audit-all.css \
  && ok "primitives de couleur definies" \
  || err "--color-ivory non defini : tokens.css non charge"
grep -q "bg-page:" /tmp/audit-all.css \
  && ok "tokens semantiques definis" || err "--bg-page non defini"
grep -qi "fraunces" /tmp/audit-all.css \
  && ok "police Fraunces presente" || err "police Fraunces absente du CSS"
echo "  data-theme dans le CSS : $(grep -o 'data-theme' /tmp/audit-all.css | wc -l)"

sec "9. VARIABLES UTILISEES MAIS JAMAIS DEFINIES"
grep -rhoE "var\(--[a-zA-Z0-9_-]+" src --include=*.css --include=*.tsx \
  --include=*.ts | sed 's/var(//' | sort -u > /tmp/audit-used.txt
grep -rhoE "^[[:space:]]*--[a-zA-Z0-9_-]+[[:space:]]*:" src --include=*.css \
  | tr -d ' \t:' | sort -u > /tmp/audit-def.txt
comm -23 /tmp/audit-used.txt /tmp/audit-def.txt > /tmp/audit-undef.txt
n=$(wc -l < /tmp/audit-undef.txt)
if [ "$n" -eq 0 ]; then ok "toutes les variables sont definies"
else warn "$n variables sans definition dans les .css (styles inline possibles)"
fi
head -40 /tmp/audit-undef.txt | sed 's/^/     /'

sec "10. COULEURS EN DUR (hors tokens et themes)"
grep -rnE "#[0-9a-fA-F]{6}\b" src --include=*.tsx --include=*.ts \
  --include=*.css | grep -vE "styles/(tokens|theme-)" \
  | grep -v "^src/index.css" > /tmp/audit-hex.txt
echo "  total : $(wc -l < /tmp/audit-hex.txt) occurrences"
cut -d: -f1 /tmp/audit-hex.txt | sort | uniq -c | sort -rn | head -12 \
  | sed 's/^/     /'

sec "11. THEME : ou est applique quoi"
echo "  pages qui importent theme-app.css :"
grep -rln "styles/theme-app.css" src --include=*.tsx --include=*.ts \
  | sed 's/^/     /'
echo "  data-theme poses dans le code :"
grep -rn "data-theme" src --include=*.tsx --include=*.ts | head -8 \
  | cut -c1-100 | sed 's/^/     /'

sec "12. TYPESCRIPT"
npx tsc --noEmit > /tmp/audit-tsc.log 2>&1
n=$(grep -c "error TS" /tmp/audit-tsc.log)
[ "$n" -eq 0 ] && ok "aucune erreur TypeScript" \
  || err "$n erreurs TypeScript (voir /tmp/audit-tsc.log)"
grep "error TS" /tmp/audit-tsc.log | head -10 | cut -c1-110 | sed 's/^/     /'

sec "13. LINT"
if grep -q '"lint"' package.json; then
  npm run lint > /tmp/audit-lint.log 2>&1
  [ $? -eq 0 ] && ok "lint sans erreur" \
    || warn "lint signale des problemes (voir /tmp/audit-lint.log)"
else
  echo "  pas de script lint dans package.json"
fi

sec "14. SERVICE WORKER ET SERVEUR DE DEV"
[ -f dist/sw.js ] && warn "dist/sw.js present : tester en navigation privee"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:5173/)
if [ "$code" = "200" ]; then
  ok "serveur de dev actif (port 5173)"
  curl -s --max-time 5 http://localhost:5173/src/index.css > /tmp/audit-dev.css
  grep -qE "box-sizing: ?border-box" /tmp/audit-dev.css \
    && ok "dev : preflight present" || err "dev : preflight absent"
  grep -qE '\.flex ?\{|\.flex,' /tmp/audit-dev.css \
    && ok "dev : utilitaires presents" || err "dev : utilitaires absents"
else
  warn "serveur de dev non lance (npm run dev) : controle ignore"
fi

sec "RESUME"
echo "  erreurs : $E | alertes : $A"
if [ "$E" -eq 0 ]; then echo "  Verdict : aucune erreur bloquante detectee."
else echo "  Verdict : $E erreur(s). Lire les lignes [ERREUR] ci-dessus."; fi
