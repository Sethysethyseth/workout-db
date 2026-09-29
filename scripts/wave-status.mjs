#!/usr/bin/env node
// wave-status.mjs - one-line wave checklist for the Claude Code status line.
//
// Stand-in for the TaskCreate/TaskUpdate wave task list (dispatch-unit
// section 2b-2) in sessions where those tools are not available. Reads the
// FIRST wave under "## Active" in docs/tasks/QUEUE.md - the durable ledger
// the relay already keeps current - so it needs no bookkeeping of its own
// and survives session restarts.
//
// Usage: node scripts/wave-status.mjs [repoRoot]   (prints nothing when no
// active wave is found; never throws)
//
//   BK 6/13  ✓BK1 ✓BK2 ▶BK10 ◆BK9 ·BK6 ✗BK8 · smoke · gate
//   ✓ landed   ▶ dispatched (Cursor working)   ◆ awaiting review
//   ✗ bounced  · queued

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ENTRY_RE =
  /^(DRAFT|QUEUED|DISPATCHED|AWAITING-REVIEW|LANDED|BOUNCED)\b[^|]*\|\s*([a-z]+)(\d+)([a-z]*)-[^|\s]*\.md\s*\|/;
const WAVE_HEADER_RE = /^\*\*[^*]*\bwave\b/i;

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const MARK = {
  LANDED: `${C.green}✓`,
  DISPATCHED: `${C.yellow}▶`,
  'AWAITING-REVIEW': `${C.magenta}◆`,
  BOUNCED: `${C.red}✗`,
  QUEUED: `${C.dim}·`,
};

function unitId(prefix, num, suffix) {
  return `${prefix.toUpperCase()}${num}${suffix}`;
}

export function parseActiveWave(queueText) {
  const lines = queueText.split(/\r?\n/);
  const active = lines.findIndex((l) => /^##\s+Active\b/.test(l));
  if (active < 0) return null;

  let label = null;
  const units = [];
  for (let i = active + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) break;
    if (WAVE_HEADER_RE.test(line)) {
      if (label) break; // next wave's header ends the first wave
      const paren = line.match(/\(([A-Z][A-Z0-9]*)\)/);
      label = paren ? paren[1] : line.replace(/\*/g, '').trim().split(/\s+/)[0];
      continue;
    }
    const m = line.match(ENTRY_RE);
    if (m && label) {
      units.push({ status: m[1], id: unitId(m[2], m[3], m[4]) });
    }
  }
  if (!label || units.length === 0) return null;
  return { label, units };
}

export function formatWaveLine(wave, { color = true } = {}) {
  const paint = (s) => (color ? s : s.replace(/\x1b\[\d+m/g, ''));
  const counted = wave.units.filter((u) => u.status !== 'DRAFT');
  const landed = counted.filter((u) => u.status === 'LANDED').length;
  const total = counted.length;
  const parts = counted.map((u) => `${MARK[u.status] || '·'}${u.id}${C.reset}`);
  const drafts = wave.units.filter((u) => u.status === 'DRAFT').map((u) => u.id);
  const draftNote = drafts.length ? ` ${C.dim}(+${drafts.join(', ')} draft)${C.reset}` : '';
  const done = landed === total;
  const head = done
    ? `${C.bold}${C.cyan}${wave.label} ${landed}/${total} complete${C.reset}`
    : `${C.bold}${C.cyan}${wave.label} ${landed}/${total}${C.reset}`;
  const tail = done
    ? ` ${C.yellow}▶ smoke${C.reset} ${C.dim}· gate${C.reset}`
    : ` ${C.dim}· smoke · gate${C.reset}`;
  return paint(`${head}  ${parts.join(' ')}${draftNote}${tail}`);
}

function main() {
  try {
    const root = process.argv[2] || process.cwd();
    const text = readFileSync(join(root, 'docs', 'tasks', 'QUEUE.md'), 'utf8');
    const wave = parseActiveWave(text);
    if (wave) process.stdout.write(formatWaveLine(wave));
  } catch {
    // status line must never error - print nothing
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
