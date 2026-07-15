// cursor-watch.mjs - live local dashboard for watching Channel B Cursor runs.
//
// Zero-dependency filesystem + git watcher with an embedded SSE dashboard.
// Dev tooling only - never imported by client or server runtime.
//
// Usage:
//   node scripts/cursor-watch.mjs [--lane <dir>] [--port <n>] [--log <file>]
//
// Defaults: lane C:\dev\worktrees\cursor-lane, port 4646.
// Binds 127.0.0.1 only. Node built-ins only.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEFAULT_LANE = 'C:\\dev\\worktrees\\cursor-lane';
const DEFAULT_PORT = 4646;
const GIT_POLL_MS = 3000;
const WATCH_DEBOUNCE_MS = 180;
const ACTIVITY_FEED_CAP = 80;
const LOG_TAIL_CAP = 200;
const DIFF_EXCERPT_MAX = 4000;

const IGNORE_DIR_NAMES = new Set([
  '.git',
  'node_modules',
  '.hg',
  '.svn',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.cache',
]);

const IGNORE_FILE_RE =
  /(?:^|[\\/])(?:\.DS_Store|Thumbs\.db|.*\.(?:swp|swo|tmp|temp|bak|orig)|~)$/i;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { lane: DEFAULT_LANE, port: DEFAULT_PORT, log: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lane') {
      out.lane = argv[++i];
      if (!out.lane) throw new Error('--lane requires a path');
    } else if (a === '--port') {
      const raw = argv[++i];
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 65535) {
        throw new Error(`--port requires an integer 1-65535, got: ${raw}`);
      }
      out.port = n;
    } else if (a === '--log') {
      out.log = argv[++i];
      if (!out.log) throw new Error('--log requires a file path');
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage: node scripts/cursor-watch.mjs [--lane <dir>] [--port <n>] [--log <file>]
Defaults: lane ${DEFAULT_LANE}, port ${DEFAULT_PORT}
Binds 127.0.0.1 only. Open the printed URL in a browser.`);
}

// ---------------------------------------------------------------------------
// Ignore / path helpers
// ---------------------------------------------------------------------------

function shouldIgnore(absPath, laneRoot) {
  const rel = path.relative(laneRoot, absPath);
  if (!rel || rel.startsWith('..')) return true;
  const parts = rel.split(/[\\/]/);
  for (const p of parts) {
    if (IGNORE_DIR_NAMES.has(p)) return true;
  }
  if (IGNORE_FILE_RE.test(rel)) return true;
  return false;
}

function toPosixRel(absPath, laneRoot) {
  return path.relative(laneRoot, absPath).split(path.sep).join('/');
}

// ---------------------------------------------------------------------------
// Git helpers (cwd = lane)
// ---------------------------------------------------------------------------

function runGit(lane, args) {
  return new Promise((resolve) => {
    const child = spawn('git', args, {
      cwd: lane,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString('utf8');
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString('utf8');
    });
    child.on('error', (err) => {
      resolve({ code: -1, stdout: '', stderr: err.message });
    });
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function collectGitSnapshot(lane) {
  const [branchRes, numstatRes, statusRes] = await Promise.all([
    runGit(lane, ['rev-parse', '--abbrev-ref', 'HEAD']),
    runGit(lane, ['diff', '--numstat', 'HEAD']),
    runGit(lane, ['status', '--porcelain', '-uall']),
  ]);

  const branch =
    branchRes.code === 0 ? branchRes.stdout.trim() || '(unknown)' : '(no-git)';

  /** @type {Map<string, {path: string, additions: number, deletions: number, untracked?: boolean}>} */
  const files = new Map();

  if (numstatRes.code === 0) {
    for (const line of numstatRes.stdout.split('\n')) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const addRaw = parts[0];
      const delRaw = parts[1];
      const filePath = parts.slice(2).join('\t');
      // Binary files show as "-"
      const additions = addRaw === '-' ? 0 : Number(addRaw) || 0;
      const deletions = delRaw === '-' ? 0 : Number(delRaw) || 0;
      files.set(filePath, { path: filePath, additions, deletions });
    }
  }

  if (statusRes.code === 0) {
    for (const line of statusRes.stdout.split('\n')) {
      if (line.length < 3) continue;
      const xy = line.slice(0, 2);
      let filePath = line.slice(3);
      // rename: "R  old -> new"
      if (filePath.includes(' -> ')) {
        filePath = filePath.split(' -> ').pop();
      }
      const isUntracked = xy === '??';
      if (isUntracked && !files.has(filePath)) {
        let additions = 0;
        try {
          const abs = path.join(lane, filePath);
          const st = fs.statSync(abs);
          if (st.isFile()) {
            const text = fs.readFileSync(abs, 'utf8');
            additions = text.length === 0 ? 0 : text.split(/\r?\n/).length;
          }
        } catch {
          additions = 0;
        }
        files.set(filePath, {
          path: filePath,
          additions,
          deletions: 0,
          untracked: true,
        });
      } else if (!files.has(filePath) && xy.trim()) {
        files.set(filePath, {
          path: filePath,
          additions: 0,
          deletions: 0,
        });
      }
    }
  }

  const list = [...files.values()].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  return { branch, files: list };
}

async function collectFileDiffExcerpt(lane, relPath) {
  if (!relPath) return { path: null, text: '', kind: 'none' };
  const abs = path.join(lane, relPath);
  // Prefer git diff for tracked changes
  const diffRes = await runGit(lane, [
    'diff',
    '--no-color',
    'HEAD',
    '--',
    relPath,
  ]);
  if (diffRes.code === 0 && diffRes.stdout.trim()) {
    let text = diffRes.stdout;
    if (text.length > DIFF_EXCERPT_MAX) {
      text = text.slice(0, DIFF_EXCERPT_MAX) + '\n… (truncated)';
    }
    return { path: relPath, text, kind: 'diff' };
  }
  // Untracked / new: show file contents as an all-additions excerpt
  try {
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      let text = fs.readFileSync(abs, 'utf8');
      if (text.length > DIFF_EXCERPT_MAX) {
        text = text.slice(0, DIFF_EXCERPT_MAX) + '\n… (truncated)';
      }
      const lines = text.split(/\r?\n/).map((l) => `+${l}`).join('\n');
      return { path: relPath, text: lines, kind: 'new' };
    }
  } catch {
    /* ignore */
  }
  return { path: relPath, text: '', kind: 'empty' };
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

function createState(lane, logPath) {
  return {
    lane,
    logPath,
    branch: '(unknown)',
    phase: 'WAITING', // WAITING | WORKING | DELIVERY
    firstActivityAt: null,
    deliveryAt: null,
    activity: [],
    files: [],
    lastChangedPath: null,
    excerpt: { path: null, text: '', kind: 'none' },
    logLines: [],
    clients: new Set(),
  };
}

function deliveryExists(lane) {
  try {
    return fs.existsSync(path.join(lane, 'DELIVERY.md'));
  } catch {
    return false;
  }
}

function derivePhase(state) {
  if (deliveryExists(state.lane)) return 'DELIVERY';
  if (state.firstActivityAt || state.files.length > 0 || state.activity.length > 0) {
    return 'WORKING';
  }
  return 'WAITING';
}

function snapshotPayload(state) {
  return {
    type: 'snapshot',
    lane: state.lane,
    branch: state.branch,
    phase: state.phase,
    firstActivityAt: state.firstActivityAt,
    deliveryAt: state.deliveryAt,
    serverNow: Date.now(),
    activity: state.activity,
    files: state.files,
    lastChangedPath: state.lastChangedPath,
    excerpt: state.excerpt,
    logLines: state.logLines,
    logPath: state.logPath,
  };
}

function broadcast(state, event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of state.clients) {
    try {
      res.write(data);
    } catch {
      state.clients.delete(res);
    }
  }
}

function pushActivity(state, entry) {
  state.activity.unshift(entry);
  if (state.activity.length > ACTIVITY_FEED_CAP) {
    state.activity.length = ACTIVITY_FEED_CAP;
  }
}

function noteActivity(state, now = Date.now()) {
  if (!state.firstActivityAt) state.firstActivityAt = now;
  const prev = state.phase;
  state.phase = derivePhase(state);
  if (state.phase === 'DELIVERY' && !state.deliveryAt) {
    state.deliveryAt = now;
  }
  if (prev !== state.phase) {
    broadcast(state, {
      type: 'state',
      phase: state.phase,
      firstActivityAt: state.firstActivityAt,
      deliveryAt: state.deliveryAt,
      serverNow: Date.now(),
      branch: state.branch,
    });
  }
}

// ---------------------------------------------------------------------------
// Watchers
// ---------------------------------------------------------------------------

function startFileWatch(state) {
  let timer = null;
  /** @type {Map<string, string>} */
  const pending = new Map();

  const flush = () => {
    timer = null;
    const batch = [...pending.entries()];
    pending.clear();
    const now = Date.now();
    for (const [rel, kind] of batch) {
      pushActivity(state, { ts: now, path: rel, kind });
      state.lastChangedPath = rel;
      broadcast(state, {
        type: 'file',
        ts: now,
        path: rel,
        kind,
      });
    }
    noteActivity(state, now);
    // Refresh excerpt for the most recent path asynchronously
    const target = state.lastChangedPath;
    if (target) {
      collectFileDiffExcerpt(state.lane, target).then((excerpt) => {
        if (state.lastChangedPath !== target) return;
        state.excerpt = excerpt;
        broadcast(state, { type: 'excerpt', excerpt });
      });
    }
  };

  const onChange = (eventType, filename) => {
    if (!filename) return;
    const abs = path.isAbsolute(filename)
      ? filename
      : path.join(state.lane, filename);
    if (shouldIgnore(abs, state.lane)) return;
    let rel;
    try {
      rel = toPosixRel(abs, state.lane);
    } catch {
      return;
    }
    if (!rel || rel.startsWith('..')) return;

    let kind = eventType === 'rename' ? 'rename' : 'change';
    try {
      if (!fs.existsSync(abs)) kind = 'unlink';
      else if (eventType === 'rename') kind = 'add';
    } catch {
      kind = 'change';
    }
    // Special-case delivery appearance
    if (rel === 'DELIVERY.md' || rel.endsWith('/DELIVERY.md')) {
      kind = fs.existsSync(path.join(state.lane, 'DELIVERY.md'))
        ? 'delivery'
        : 'unlink';
    }
    pending.set(rel, kind);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, WATCH_DEBOUNCE_MS);
  };

  // Recursive watch (supported on Windows and macOS; Linux may need poll fallback)
  let watcher;
  try {
    watcher = fs.watch(
      state.lane,
      { recursive: true },
      (eventType, filename) => {
        onChange(eventType, filename);
      },
    );
  } catch (err) {
    console.error(`cursor-watch: fs.watch failed: ${err.message}`);
    console.error('Falling back to directory poll only (git poll still active).');
    return null;
  }
  watcher.on('error', (err) => {
    console.error(`cursor-watch: watch error: ${err.message}`);
  });
  return watcher;
}

function startGitPoll(state) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const snap = await collectGitSnapshot(state.lane);
      const branchChanged = snap.branch !== state.branch;
      state.branch = snap.branch;

      const prevKey = JSON.stringify(state.files);
      state.files = snap.files;
      const filesChanged = JSON.stringify(state.files) !== prevKey;

      const hadFiles = snap.files.length > 0;
      if (hadFiles) noteActivity(state);

      // Delivery check even without file events (poll-side)
      const prevPhase = state.phase;
      state.phase = derivePhase(state);
      if (state.phase === 'DELIVERY' && !state.deliveryAt) {
        state.deliveryAt = Date.now();
      }

      if (filesChanged || branchChanged || prevPhase !== state.phase) {
        broadcast(state, {
          type: 'diff',
          branch: state.branch,
          files: state.files,
          phase: state.phase,
          firstActivityAt: state.firstActivityAt,
          deliveryAt: state.deliveryAt,
          serverNow: Date.now(),
        });
      }
      if (prevPhase !== state.phase) {
        broadcast(state, {
          type: 'state',
          phase: state.phase,
          firstActivityAt: state.firstActivityAt,
          deliveryAt: state.deliveryAt,
          serverNow: Date.now(),
          branch: state.branch,
        });
      }
    } finally {
      running = false;
    }
  };
  tick();
  return setInterval(tick, GIT_POLL_MS);
}

function startLogTail(state) {
  if (!state.logPath) return null;
  if (!fs.existsSync(state.logPath)) {
    // Wait for the file to appear; poll existence lightly
    const wait = setInterval(() => {
      if (fs.existsSync(state.logPath)) {
        clearInterval(wait);
        attachLogWatcher(state);
      }
    }, 1000);
    return wait;
  }
  return attachLogWatcher(state);
}

function attachLogWatcher(state) {
  let offset = 0;
  try {
    offset = fs.statSync(state.logPath).size;
  } catch {
    offset = 0;
  }

  const readNew = () => {
    let st;
    try {
      st = fs.statSync(state.logPath);
    } catch {
      return;
    }
    if (st.size < offset) offset = 0; // truncated
    if (st.size === offset) return;
    const len = st.size - offset;
    const buf = Buffer.alloc(len);
    const fd = fs.openSync(state.logPath, 'r');
    try {
      fs.readSync(fd, buf, 0, len, offset);
    } finally {
      fs.closeSync(fd);
    }
    offset = st.size;
    const chunk = buf.toString('utf8');
    const lines = chunk.split(/\r?\n/).filter((l) => l.length > 0);
    for (const line of lines) {
      state.logLines.push(line);
      if (state.logLines.length > LOG_TAIL_CAP) {
        state.logLines.splice(0, state.logLines.length - LOG_TAIL_CAP);
      }
      broadcast(state, { type: 'log', line, ts: Date.now() });
    }
  };

  // Seed last few lines if file already has content and we started mid-file
  // (offset starts at EOF so we only stream appends - intentional)

  let watch;
  try {
    watch = fs.watch(state.logPath, () => readNew());
  } catch {
    watch = null;
  }
  const poll = setInterval(readNew, 500);
  return { watch, poll };
}

// ---------------------------------------------------------------------------
// HTTP + embedded page
// ---------------------------------------------------------------------------

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function dashboardHtml() {
  // Fully embedded. No external URLs. Relative EventSource to /events.
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CURSOR WATCH</title>
<style>
  :root {
    --bg: #0b0f14;
    --bg-elev: #121820;
    --bg-panel: #0e141c;
    --line: #1e2a38;
    --text: #d7e0ea;
    --muted: #7a8b9c;
    --dim: #4a5a6a;
    --cursor: #3dff9a;
    --cursor-dim: #1a4d35;
    --add: #3dff9a;
    --del: #ff5c7a;
    --warn: #ffc14a;
    --delivery: #5cc8ff;
    --delivery-bg: #0a2030;
    --hl: rgba(61, 255, 154, 0.18);
    --mono: "Cascadia Code", "JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace;
    --sans: "Segoe UI", system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; height: 100%;
    background: var(--bg); color: var(--text);
    font-family: var(--sans);
  }
  body {
    background:
      radial-gradient(1200px 600px at 10% -10%, #132218 0%, transparent 55%),
      radial-gradient(900px 500px at 100% 0%, #0e1a28 0%, transparent 50%),
      var(--bg);
  }
  .shell {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100vh;
    max-height: 100vh;
  }
  header.bar {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid var(--line);
    background: linear-gradient(180deg, #101820, #0b1016);
    transition: background 200ms ease-out, border-color 200ms ease-out;
  }
  header.bar.delivery {
    background: linear-gradient(180deg, #0f2433, #0a1822);
    border-bottom-color: #1e4a66;
  }
  .brand {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    min-width: 11rem;
  }
  .brand .who {
    font-family: var(--mono);
    font-weight: 700;
    font-size: 1.15rem;
    letter-spacing: 0.08em;
    color: var(--cursor);
    text-shadow: 0 0 18px rgba(61, 255, 154, 0.35);
  }
  header.bar.delivery .brand .who {
    color: var(--delivery);
    text-shadow: 0 0 18px rgba(92, 200, 255, 0.35);
  }
  .brand .tag {
    font-family: var(--mono);
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.12em;
  }
  .phase {
    font-family: var(--mono);
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    padding: 0.35rem 0.7rem;
    border-radius: 4px;
    border: 1px solid var(--cursor-dim);
    color: var(--cursor);
    background: rgba(61, 255, 154, 0.06);
    transition: color 200ms ease-out, border-color 200ms ease-out, background 200ms ease-out;
  }
  .phase.waiting { color: var(--muted); border-color: var(--line); background: transparent; }
  .phase.working {
    color: var(--cursor);
    border-color: var(--cursor-dim);
    animation: pulsePhase 2.2s ease-in-out infinite;
  }
  .phase.delivery {
    color: var(--delivery);
    border-color: #2a6a8a;
    background: rgba(92, 200, 255, 0.1);
    animation: none;
  }
  @keyframes pulsePhase {
    0%, 100% { box-shadow: 0 0 0 0 rgba(61, 255, 154, 0); }
    50% { box-shadow: 0 0 12px 0 rgba(61, 255, 154, 0.25); }
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-left: auto;
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
  }
  .meta strong { color: var(--text); font-weight: 500; }
  .meta .branch strong { color: var(--warn); }
  .grid {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1.15fr;
    grid-template-rows: 1fr auto;
    gap: 0;
    min-height: 0;
  }
  @media (max-width: 1100px) {
    .grid { grid-template-columns: 1fr; grid-template-rows: auto; overflow: auto; }
  }
  .panel {
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--bg-panel);
  }
  .panel:last-of-type { border-right: none; }
  .panel h2 {
    margin: 0;
    padding: 0.65rem 1rem;
    font-family: var(--mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 1px solid var(--line);
    background: var(--bg-elev);
  }
  .panel-body {
    flex: 1;
    overflow: auto;
    padding: 0.5rem 0;
    min-height: 0;
  }
  .feed-item {
    display: grid;
    grid-template-columns: 4.5rem 3.5rem 1fr;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    font-family: var(--mono);
    font-size: 0.78rem;
    border-left: 2px solid transparent;
    transition: background 220ms ease-out, border-color 220ms ease-out;
  }
  .feed-item.flash {
    background: var(--hl);
    border-left-color: var(--cursor);
  }
  .feed-item .t { color: var(--dim); }
  .feed-item .k {
    color: var(--muted);
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    padding-top: 0.12rem;
  }
  .feed-item .k.delivery { color: var(--delivery); }
  .feed-item .k.add { color: var(--add); }
  .feed-item .k.unlink { color: var(--del); }
  .feed-item .p {
    color: var(--text);
    word-break: break-all;
  }
  .feed-item .p .base { color: var(--cursor); font-weight: 600; }
  .empty {
    padding: 1.25rem 1rem;
    color: var(--dim);
    font-family: var(--mono);
    font-size: 0.78rem;
  }
  .stat-row {
    padding: 0.45rem 1rem 0.55rem;
    border-bottom: 1px solid rgba(30, 42, 56, 0.6);
  }
  .stat-row .name {
    font-family: var(--mono);
    font-size: 0.75rem;
    margin-bottom: 0.3rem;
    word-break: break-all;
  }
  .stat-row .name .base { color: var(--cursor); font-weight: 600; }
  .bars {
    display: flex;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    background: #16202a;
    margin-bottom: 0.25rem;
  }
  .bars .a { background: var(--add); height: 100%; transition: width 220ms ease-out; }
  .bars .d { background: var(--del); height: 100%; transition: width 220ms ease-out; }
  .counts {
    font-family: var(--mono);
    font-size: 0.68rem;
    color: var(--muted);
  }
  .counts .a { color: var(--add); }
  .counts .d { color: var(--del); }
  .excerpt-wrap {
    font-family: var(--mono);
    font-size: 0.74rem;
    line-height: 1.45;
    padding: 0.75rem 1rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .excerpt-path {
    font-family: var(--mono);
    font-size: 0.7rem;
    color: var(--muted);
    padding: 0.5rem 1rem 0;
  }
  .excerpt-path span { color: var(--warn); }
  .ln-add { color: #9dffc4; }
  .ln-del { color: #ff9aab; }
  .ln-meta { color: var(--dim); }
  .ln-hunk { color: var(--delivery); }
  .caret {
    display: inline-block;
    width: 0.55ch;
    margin-left: 1px;
    background: var(--cursor);
    animation: blink 1s steps(1) infinite;
    vertical-align: -1px;
    height: 1em;
  }
  @keyframes blink {
    0%, 50% { opacity: 1; }
    50.01%, 100% { opacity: 0; }
  }
  .log-panel {
    grid-column: 1 / -1;
    border-top: 1px solid var(--line);
    border-right: none;
    max-height: 22vh;
    background: #080c11;
  }
  .log-body {
    font-family: var(--mono);
    font-size: 0.7rem;
    padding: 0.4rem 1rem 0.7rem;
    color: var(--muted);
    overflow: auto;
    max-height: calc(22vh - 2rem);
  }
  .log-body div { white-space: pre-wrap; word-break: break-all; }
  .log-body .fresh { color: var(--text); }
  .conn {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--dim);
    transition: background 200ms ease-out;
  }
  .conn.on { background: var(--cursor); box-shadow: 0 0 8px var(--cursor); }
  .conn.bad { background: var(--del); }
</style>
</head>
<body>
<div class="shell">
  <header class="bar" id="bar">
    <div class="brand">
      <span class="who">CURSOR</span>
      <span class="tag">WATCH</span>
    </div>
    <div class="phase waiting" id="phase">WAITING</div>
    <div class="conn" id="conn" title="SSE"></div>
    <div class="meta">
      <div class="branch">branch <strong id="branch">—</strong></div>
      <div>lane <strong id="lane">—</strong></div>
      <div>elapsed <strong id="elapsed">0:00</strong></div>
    </div>
  </header>
  <div class="grid">
    <section class="panel">
      <h2>Live activity</h2>
      <div class="panel-body" id="feed"><div class="empty">Waiting for file events…</div></div>
    </section>
    <section class="panel">
      <h2>Diff stats</h2>
      <div class="panel-body" id="stats"><div class="empty">No uncommitted changes yet.</div></div>
    </section>
    <section class="panel">
      <h2>Now writing</h2>
      <div class="excerpt-path" id="excerptPath"></div>
      <div class="panel-body"><div class="excerpt-wrap" id="excerpt"><span class="ln-meta">Idle — watching the lane.</span><span class="caret"></span></div></div>
    </section>
    <section class="panel log-panel" id="logPanel" hidden>
      <h2>CLI log</h2>
      <div class="log-body" id="logBody"></div>
    </section>
  </div>
</div>
<script>
(function () {
  const phaseEl = document.getElementById('phase');
  const barEl = document.getElementById('bar');
  const branchEl = document.getElementById('branch');
  const laneEl = document.getElementById('lane');
  const elapsedEl = document.getElementById('elapsed');
  const feedEl = document.getElementById('feed');
  const statsEl = document.getElementById('stats');
  const excerptEl = document.getElementById('excerpt');
  const excerptPathEl = document.getElementById('excerptPath');
  const logPanel = document.getElementById('logPanel');
  const logBody = document.getElementById('logBody');
  const connEl = document.getElementById('conn');

  let phase = 'WAITING';
  let firstActivityAt = null;
  let deliveryAt = null;
  let clockSkew = 0;
  let revealTimer = null;
  let revealTarget = '';
  let revealPos = 0;

  function fmtElapsed(ms) {
    if (ms == null || ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const ss = String(s % 60).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return h > 0 ? h + ':' + mm + ':' + ss : m + ':' + ss;
  }

  function now() { return Date.now() + clockSkew; }

  function setPhase(p) {
    phase = p;
    phaseEl.className = 'phase';
    barEl.classList.remove('delivery');
    if (p === 'WAITING') {
      phaseEl.classList.add('waiting');
      phaseEl.textContent = 'WAITING';
    } else if (p === 'WORKING') {
      phaseEl.classList.add('working');
      phaseEl.textContent = 'CURSOR IS WORKING';
    } else {
      phaseEl.classList.add('delivery');
      phaseEl.textContent = 'DELIVERY READY';
      barEl.classList.add('delivery');
    }
  }

  function tickElapsed() {
    if (!firstActivityAt) {
      elapsedEl.textContent = '0:00';
      return;
    }
    const end = phase === 'DELIVERY' && deliveryAt ? deliveryAt : now();
    elapsedEl.textContent = fmtElapsed(end - firstActivityAt);
  }
  setInterval(tickElapsed, 250);

  function fileLabel(p) {
    if (!p) return '';
    const parts = p.split('/');
    const base = parts.pop();
    const dir = parts.join('/');
    return (dir ? '<span class="dir">' + esc(dir) + '/</span>' : '') +
      '<span class="base">' + esc(base) + '</span>';
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
  }

  function prependFeed(item, flash) {
    const empty = feedEl.querySelector('.empty');
    if (empty) empty.remove();
    const row = document.createElement('div');
    row.className = 'feed-item' + (flash ? ' flash' : '');
    const k = item.kind || 'change';
    row.innerHTML =
      '<span class="t">' + esc(fmtTime(item.ts)) + '</span>' +
      '<span class="k ' + esc(k) + '">' + esc(k) + '</span>' +
      '<span class="p">' + fileLabel(item.path) + '</span>';
    feedEl.insertBefore(row, feedEl.firstChild);
    if (flash) {
      setTimeout(function () { row.classList.remove('flash'); }, 700);
    }
    while (feedEl.children.length > 80) {
      feedEl.removeChild(feedEl.lastChild);
    }
  }

  function renderStats(files) {
    if (!files || !files.length) {
      statsEl.innerHTML = '<div class="empty">No uncommitted changes yet.</div>';
      return;
    }
    const max = Math.max(
      1,
      ...files.map(function (f) { return (f.additions || 0) + (f.deletions || 0); })
    );
    statsEl.innerHTML = files.map(function (f) {
      const a = f.additions || 0;
      const d = f.deletions || 0;
      const tot = a + d;
      const aw = tot ? (a / max) * 100 : 0;
      const dw = tot ? (d / max) * 100 : 0;
      return '<div class="stat-row">' +
        '<div class="name">' + fileLabel(f.path) + '</div>' +
        '<div class="bars"><div class="a" style="width:' + aw + '%"></div>' +
        '<div class="d" style="width:' + dw + '%"></div></div>' +
        '<div class="counts"><span class="a">+' + a + '</span> / <span class="d">-' + d + '</span>' +
        (f.untracked ? ' · untracked' : '') + '</div></div>';
    }).join('');
  }

  function colorizeDiff(text) {
    return text.split('\\n').map(function (line) {
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ')) {
        return '<span class="ln-meta">' + esc(line) + '</span>';
      }
      if (line.startsWith('@@')) {
        return '<span class="ln-hunk">' + esc(line) + '</span>';
      }
      if (line.startsWith('+')) {
        return '<span class="ln-add">' + esc(line) + '</span>';
      }
      if (line.startsWith('-')) {
        return '<span class="ln-del">' + esc(line) + '</span>';
      }
      return esc(line);
    }).join('\\n');
  }

  function startReveal(text) {
    revealTarget = text || '';
    revealPos = 0;
    if (revealTimer) clearInterval(revealTimer);
    if (!revealTarget) {
      excerptEl.innerHTML = '<span class="ln-meta">No diff yet for this file.</span><span class="caret"></span>';
      return;
    }
    // Reveal in chunks for a typing feel without being sluggish on large diffs
    const chunk = Math.max(8, Math.floor(revealTarget.length / 60));
    revealTimer = setInterval(function () {
      revealPos = Math.min(revealTarget.length, revealPos + chunk);
      const slice = revealTarget.slice(0, revealPos);
      excerptEl.innerHTML = colorizeDiff(slice) + '<span class="caret"></span>';
      if (revealPos >= revealTarget.length) {
        clearInterval(revealTimer);
        revealTimer = null;
      }
    }, 28);
  }

  function applyExcerpt(excerpt) {
    if (!excerpt || !excerpt.path) {
      excerptPathEl.textContent = '';
      excerptEl.innerHTML = '<span class="ln-meta">Idle — watching the lane.</span><span class="caret"></span>';
      return;
    }
    excerptPathEl.innerHTML = 'file <span>' + esc(excerpt.path) + '</span>' +
      (excerpt.kind ? ' · ' + esc(excerpt.kind) : '');
    startReveal(excerpt.text || '');
  }

  function appendLog(line, fresh) {
    logPanel.hidden = false;
    const div = document.createElement('div');
    if (fresh) div.className = 'fresh';
    div.textContent = line;
    logBody.appendChild(div);
    while (logBody.children.length > 200) {
      logBody.removeChild(logBody.firstChild);
    }
    logBody.scrollTop = logBody.scrollHeight;
  }

  function applySnapshot(s) {
    if (s.serverNow) clockSkew = s.serverNow - Date.now();
    laneEl.textContent = s.lane || '—';
    branchEl.textContent = s.branch || '—';
    firstActivityAt = s.firstActivityAt;
    deliveryAt = s.deliveryAt;
    setPhase(s.phase || 'WAITING');
    tickElapsed();
    feedEl.innerHTML = '';
    if (s.activity && s.activity.length) {
      // activity is newest-first
      for (let i = s.activity.length - 1; i >= 0; i--) {
        prependFeed(s.activity[i], false);
      }
    } else {
      feedEl.innerHTML = '<div class="empty">Waiting for file events…</div>';
    }
    renderStats(s.files || []);
    applyExcerpt(s.excerpt);
    if (s.logPath) logPanel.hidden = false;
    if (s.logLines && s.logLines.length) {
      logBody.innerHTML = '';
      s.logLines.forEach(function (l) { appendLog(l, false); });
    }
  }

  function onEvent(ev) {
    if (!ev || !ev.type) return;
    if (ev.type === 'snapshot') {
      applySnapshot(ev);
      return;
    }
    if (ev.type === 'file') {
      prependFeed(ev, true);
      if (!firstActivityAt) firstActivityAt = ev.ts || now();
      if (phase === 'WAITING') setPhase('WORKING');
      return;
    }
    if (ev.type === 'diff') {
      if (ev.branch) branchEl.textContent = ev.branch;
      renderStats(ev.files || []);
      if (ev.firstActivityAt) firstActivityAt = ev.firstActivityAt;
      if (ev.deliveryAt) deliveryAt = ev.deliveryAt;
      if (ev.phase) setPhase(ev.phase);
      return;
    }
    if (ev.type === 'state') {
      if (ev.branch) branchEl.textContent = ev.branch;
      firstActivityAt = ev.firstActivityAt;
      deliveryAt = ev.deliveryAt;
      setPhase(ev.phase);
      return;
    }
    if (ev.type === 'excerpt') {
      applyExcerpt(ev.excerpt);
      return;
    }
    if (ev.type === 'log') {
      appendLog(ev.line, true);
    }
  }

  function connect() {
    const es = new EventSource('/events');
    es.onopen = function () {
      connEl.className = 'conn on';
    };
    es.onerror = function () {
      connEl.className = 'conn bad';
    };
    es.onmessage = function (msg) {
      try {
        onEvent(JSON.parse(msg.data));
      } catch (e) { /* ignore */ }
    };
  }
  connect();
})();
</script>
</body>
</html>`;
}

function createServer(state, port) {
  const html = dashboardHtml();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/') {
      send(res, 200, html, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/snapshot') {
      send(res, 200, JSON.stringify(snapshotPayload(state)), {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      res.write(`data: ${JSON.stringify(snapshotPayload(state))}\n\n`);
      state.clients.add(res);
      // Heartbeat keeps proxies / browsers from timing out
      const hb = setInterval(() => {
        try {
          res.write(': ping\n\n');
        } catch {
          clearInterval(hb);
        }
      }, 15000);
      req.on('close', () => {
        clearInterval(hb);
        state.clients.delete(res);
      });
      return;
    }
    send(res, 404, 'not found\n', { 'Content-Type': 'text/plain' });
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`cursor-watch: ${err.message}`);
    process.exit(1);
  }
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const lane = path.resolve(args.lane);
  if (!fs.existsSync(lane) || !fs.statSync(lane).isDirectory()) {
    console.error(
      `cursor-watch: lane directory does not exist: ${lane}`,
    );
    process.exit(1);
  }

  let logPath = args.log ? path.resolve(args.log) : null;
  if (!logPath) {
    const defaultLog = path.join(lane, 'cursor-run.log');
    if (fs.existsSync(defaultLog)) logPath = defaultLog;
  }

  const state = createState(lane, logPath);
  // Seed phase from existing DELIVERY.md (e.g. mid-audit attach)
  if (deliveryExists(lane)) {
    state.phase = 'DELIVERY';
    state.deliveryAt = Date.now();
    state.firstActivityAt = state.firstActivityAt || Date.now();
  }

  const server = await createServer(state, args.port);
  startFileWatch(state);
  startGitPoll(state);
  startLogTail(state);

  const url = `http://127.0.0.1:${args.port}`;
  console.log(`cursor-watch: watching ${lane}`);
  if (logPath) console.log(`cursor-watch: tailing log ${logPath}`);
  console.log(`cursor-watch: open ${url}`);

  const shutdown = () => {
    console.log('\ncursor-watch: shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(`cursor-watch: ${err.message}`);
  process.exit(1);
});
