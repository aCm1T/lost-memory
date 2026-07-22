#!/usr/bin/env node
/**
 * Placeholder for Phase 3+ case JSON validation.
 * Phase 2 only confirms the script entry exists.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(__dirname, '../src/data/case-index.json');

try {
  const data = JSON.parse(readFileSync(indexPath, 'utf8'));
  if (!Array.isArray(data) || data.length === 0) {
    console.error('case-index.json must be a non-empty array');
    process.exit(1);
  }
  console.log(`validate-case-data: ok (${data.length} case(s) in index)`);
} catch (error) {
  console.error('validate-case-data failed:', error.message);
  process.exit(1);
}
