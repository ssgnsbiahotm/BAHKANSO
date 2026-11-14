#!/usr/bin/env node
/*
 * scripts/audit-forms.mjs
 * Audit réutilisable des formulaires BAHKANSO.
 *
 * Objectif : scanner le code source pour lister les formulaires,
 * détecter s'ils utilisent une validation Zod, et relever les écarts
 * potentiels (champs sans schéma, statut, source_id, isolation site).
 *
 * Lecture seule : ne modifie aucun fichier, n'accède pas à la base distante.
 *
 * Usage:
 *   node scripts/audit-forms.mjs [racine=src]
 *
 * Sortie : tableau JSON sur stdout + résumé texte.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] ?? 'src';
const OUT = {};

const TS_EXT = ['.ts', '.tsx', '.js', '.jsx'];

function isTsFile(file) {
  return TS_EXT.includes(path.extname(file));
}

function readFileSafe(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (isTsFile(full)) files.push(full);
  }
  return files;
}

function scanFile(file) {
  const src = readFileSafe(file);
  if (!src) return null;

  const rel = path.relative(ROOT, file);
  const result = {
    file: rel,
    hasZod: false,
    zodSchemaName: null,
    hasManualValidation: false,
    manualValidationLines: [],
    usesSupabaseMutations: false,
    hasConfirmDeleteModal: false,
    sourceIdBug: false,
    rotatingCardLabelProp: false,
    rotatingCardFlipBackProps: false,
    lines: [],
  };

  const zodSchemaRegex = /(?:const|export\s+const)\s+(\w+Schema)\s*=\s*z\.object\(/;
  const zodMatch = src.match(zodSchemaRegex);
  if (zodMatch) {
    result.hasZod = true;
    result.zodSchemaName = zodMatch[1];
  }

  // Validation manuelle : if (!champ) / toast.show(... 'error')
  const manualLines = [];
  src.split('\n').forEach((line, i) => {
    const n = i + 1;
    if (/if\s*\(\s*![\w.]+\s*\)/.test(line)) manualLines.push(n);
    if (/toast\.show\(.*'error'/.test(line)) manualLines.push(n);
  });
  if (manualLines.length) {
    result.hasManualValidation = true;
    result.manualValidationLines = [...new Set(manualLines)];
  }

  // Mutations Supabase
  if (/\.from\('.*?'\)\.(insert|update|delete)\(/.test(src)) {
    result.usesSupabaseMutations = true;
  }

  // ConfirmDeleteModal
  if (/(ConfirmDeleteModal|setConfirm\w*\(null\))/.test(src)) {
    result.hasConfirmDeleteModal = true;
  }

  // Bug source_id : source_id: siteId
  if (/source_id:\s*siteId/.test(src)) {
    result.sourceIdBug = true;
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (/source_id:\s*siteId/.test(line)) result.lines.push(`${i + 1}: ${line.trim()}`);
    });
  }

  // RotatingCard label (fantôme) vs flipLabel/backLabel
  if (/label\s*=/.test(src) && /RotatingCard/.test(src)) {
    result.rotatingCardLabelProp = true;
  }
  if (/flipLabel=/.test(src) || /backLabel=/.test(src)) {
    result.rotatingCardFlipBackProps = true;
  }

  return result;
}

const files = walk(ROOT);
const results = [];
for (const file of files) {
  const r = scanFile(file);
  if (r) results.push(r);
}

// Résumé
const withZod = results.filter(r => r.hasZod).length;
const manualOnly = results.filter(r => r.hasManualValidation && !r.hasZod).length;
const withMutations = results.filter(r => r.usesSupabaseMutations).length;
const sourceBugs = results.filter(r => r.sourceIdBug);
const labelProps = results.filter(r => r.rotatingCardLabelProp);
const flipBack = results.filter(r => r.rotatingCardFlipBackProps);

console.log(JSON.stringify({
  root: ROOT,
  filesScanned: results.length,
  withZod,
  manualOnly,
  withMutations,
  sourceIdBugs: sourceBugs.length,
  labelPropFiles: labelProps.length,
  flipBackPropFiles: flipBack.length,
  results,
}, null, 2));

console.log(`\n=== RÉSUMÉ ===`);
console.log(`Fichiers scannés : ${results.length}`);
console.log(`Avec schéma Zod : ${withZod}`);
console.log(`Validation manuelle uniquement (sans Zod) : ${manualOnly}`);
console.log(`Avec mutations Supabase : ${withMutations}`);
console.log(`Bug source_id = siteId : ${sourceBugs.length}`);
console.log(`Prop label RotatingCard (fantôme) : ${labelProps.length}`);
console.log(`Props flipLabel/backLabel : ${flipBack.length}`);

if (sourceBugs.length) {
  console.log(`\n--- Fichiers avec bug source_id ---`);
  for (const r of sourceBugs) {
    console.log(`  ${r.file}:`);
    for (const line of r.lines) console.log(`    ${line}`);
  }
}

if (labelProps.length) {
  console.log(`\n--- Fichiers avec prop label RotatingCard ---`);
  for (const r of labelProps) console.log(`  ${r.file}`);
}
