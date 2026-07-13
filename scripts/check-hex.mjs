#!/usr/bin/env node
// check-hex.mjs - tokens-only tripwire for the review lane.
//
// Scans a git diff for raw colors (hex / rgb() / hsl()) ADDED to files
// under client/src/, excluding client/src/index.css (where tokens live).
// Hits are a review signal to judge, not an auto-fail - some additions
// (e.g. inside index.css-adjacent tooling, SVG fixtures) may be fine.
//
// Usage:
//   node scripts/check-hex.mjs              # diff vs HEAD (working tree + staged)
//   node scripts/check-hex.mjs main...HEAD  # a landed range
//
// Exit codes: 0 = clean, 1 = hits found, 2 = script error.

import { execSync } from 'node:child_process';

const range = process.argv[2] ?? 'HEAD';
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;
const EXCLUDE = new Set(['client/src/index.css']);

let diff;
try {
  diff = execSync(`git diff ${range} -- client/src`, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
} catch (err) {
  console.error(`check-hex: git diff failed: ${err.message}`);
  process.exit(2);
}

let file = null;
let newLine = 0;
const hits = [];

for (const line of diff.split('\n')) {
  if (line.startsWith('+++ b/')) {
    file = line.slice(6).trim();
    continue;
  }
  const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
  if (hunk) {
    newLine = parseInt(hunk[1], 10);
    continue;
  }
  if (line.startsWith('+') && !line.startsWith('+++')) {
    if (file && !EXCLUDE.has(file) && COLOR_RE.test(line)) {
      hits.push(`${file}:${newLine}  ${line.slice(1).trim()}`);
    }
    newLine++;
  } else if (!line.startsWith('-') && !line.startsWith('\\')) {
    newLine++;
  }
}

if (hits.length === 0) {
  console.log(`check-hex: clean - no raw colors added outside index.css (diff: ${range})`);
  process.exit(0);
}

console.log(`check-hex: ${hits.length} raw color(s) added outside client/src/index.css (diff: ${range}):`);
for (const h of hits) console.log(`  ${h}`);
console.log('Tokens-only rule: new colors go through the CSS custom properties in client/src/index.css.');
process.exit(1);
