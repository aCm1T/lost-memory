#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const indexPath = resolve(root, 'src/data/case-index.json');
const casesDir = resolve(root, 'src/data/cases');
const validationUrl = pathToFileURL(resolve(root, 'src/js/utils/validation.js')).href;

const { validateCaseData } = await import(validationUrl);

function fail(message) {
  console.error(`validate-case-data: ${message}`);
  process.exit(1);
}

let index;
try {
  index = JSON.parse(readFileSync(indexPath, 'utf8'));
} catch (error) {
  fail(`cannot read case-index.json (${error.message})`);
}

if (!Array.isArray(index) || index.length === 0) {
  fail('case-index.json must be a non-empty array');
}

const indexIds = new Set(index.map((item) => item.id));
const files = readdirSync(casesDir).filter((name) => name.endsWith('.json'));

if (files.length === 0) fail('no case JSON files found in src/data/cases');

let errorCount = 0;

for (const file of files) {
  const fullPath = join(casesDir, file);
  let data;
  try {
    data = JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch (error) {
    console.error(`- ${file}: invalid JSON (${error.message})`);
    errorCount += 1;
    continue;
  }

  if (!indexIds.has(data.id)) {
    console.error(`- ${file}: id "${data.id}" is not registered in case-index.json`);
    errorCount += 1;
  }

  const result = validateCaseData(data);
  if (!result.ok) {
    console.error(`- ${file}: FAIL`);
    result.errors.forEach((message) => console.error(`    • ${message}`));
    errorCount += 1;
  } else {
    console.log(`- ${file}: ok (${data.clues.length} clues, ${data.locations.length} locations)`);
  }
}

for (const item of index) {
  const expected = `${item.id}.json`;
  if (!files.includes(expected)) {
    console.error(`- index entry ${item.id}: missing file ${expected}`);
    errorCount += 1;
  }
}

if (errorCount > 0) fail(`${errorCount} problem(s) found`);
console.log(
  `validate-case-data: ok (${files.length} case file(s), ${index.length} index entr${index.length === 1 ? 'y' : 'ies'})`,
);
