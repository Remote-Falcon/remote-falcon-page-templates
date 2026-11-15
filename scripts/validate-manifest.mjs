#!/usr/bin/env node
// Checks that templates.json matches the templates/ folder.
// The control panel reads templates.json from main, so a broken manifest
// breaks the template picker for every show. No dependencies on purpose.
//
// Usage: node scripts/validate-manifest.mjs [repo-root]

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
const manifestPath = join(root, 'templates.json');
const templatesDir = join(root, 'templates');

const SUPPORTED_VERSION = 1;
const SEASONS = ['halloween', 'christmas'];
const ENTRY_KEYS = ['file', 'title', 'author', 'season'];

const errors = [];

function fail(message) {
  errors.push(message);
}

function finish() {
  if (errors.length > 0) {
    console.error(`templates.json check failed with ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// 1. Parse.
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (err) {
  fail(err.code === 'ENOENT'
    ? `templates.json not found at ${manifestPath}`
    : `templates.json is not valid JSON: ${err.message}`);
  finish();
}

// 2. Top-level shape.
if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
  fail('templates.json must be an object like { "version": 1, "templates": [...] }');
  finish();
}
if (manifest.version !== SUPPORTED_VERSION) {
  fail(`"version" must be ${SUPPORTED_VERSION}, got ${JSON.stringify(manifest.version)}`);
}
if (!Array.isArray(manifest.templates)) {
  fail('"templates" must be an array');
  finish();
}
if (manifest.templates.length === 0) {
  fail('"templates" must list at least one template');
}

// 3. Entries.
const seenFiles = new Map();
const seenTitles = new Map();
const validFiles = new Set();

manifest.templates.forEach((entry, i) => {
  const where = `templates[${i}]`;
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    fail(`${where} must be an object`);
    return;
  }
  const label = isNonEmptyString(entry.file) ? `${where} (${entry.file})` : where;

  for (const key of ['file', 'title', 'author']) {
    if (!isNonEmptyString(entry[key])) {
      fail(`${label}: "${key}" must be a non-empty string`);
    }
  }
  if ('season' in entry && !SEASONS.includes(entry.season)) {
    fail(`${label}: "season" must be one of ${SEASONS.join(', ')} (or left out for all-season), got ${JSON.stringify(entry.season)}`);
  }
  for (const key of Object.keys(entry)) {
    if (!ENTRY_KEYS.includes(key)) {
      fail(`${label}: unknown field "${key}" (allowed: ${ENTRY_KEYS.join(', ')})`);
    }
  }

  if (isNonEmptyString(entry.file)) {
    if (entry.file.includes('/') || entry.file.includes('\\') || !entry.file.endsWith('.html')) {
      fail(`${label}: "file" must be a plain .html file name inside templates/, e.g. "my-template.html"`);
    } else if (!existsSync(join(templatesDir, entry.file))) {
      fail(`${label}: templates/${entry.file} does not exist`);
    }
    if (seenFiles.has(entry.file)) {
      fail(`${label}: duplicate file, already listed at templates[${seenFiles.get(entry.file)}]`);
    } else {
      seenFiles.set(entry.file, i);
    }
    validFiles.add(entry.file);
  }

  if (isNonEmptyString(entry.title)) {
    const key = entry.title.trim().toLowerCase();
    if (seenTitles.has(key)) {
      fail(`${label}: duplicate title "${entry.title}", already used by templates[${seenTitles.get(key)}]`);
    } else {
      seenTitles.set(key, i);
    }
  }
});

// 4. Orphans: every templates/*.html must be listed.
let htmlFiles = [];
try {
  htmlFiles = readdirSync(templatesDir).filter((f) => f.endsWith('.html'));
} catch (err) {
  fail(`cannot read templates/ folder: ${err.message}`);
}
for (const f of htmlFiles.sort()) {
  if (!validFiles.has(f)) {
    fail(`templates/${f} is not listed in templates.json. Add an entry for it, or remove the file.`);
  }
}

finish();
console.log(`templates.json OK: ${manifest.templates.length} templates, all files present, no orphans.`);
