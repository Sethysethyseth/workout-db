// cursor-watch.mjs - live local dashboard for watching Channel B Cursor runs.
//
// Zero-dependency filesystem + git watcher with an embedded SSE dashboard.
// Dev tooling only - never imported by client or server runtime.
//
// Usage:
//   node scripts/cursor-watch.mjs [--lane <dir>]... [--port <n>] [--log <file>]
//     [--open] [--open-on-activity] [--open-cmd <command>]
//     [--notify] [--notify-cmd <command>]
//
// Defaults: every existing lane in the v5.2 pool (cursor-lane, -2, -3),
// port 4646. `--lane` may repeat to pin an explicit set.
// One server, one tab, all lanes - the wave rail comes from QUEUE.md.
// Binds 127.0.0.1 only. Node built-ins only.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const DEFAULT_LANE = 'C:\\dev\\worktrees\\cursor-lane';
// v5.2 fan-out pool - width cap 3, one agent per worktree.
const LANE_POOL = [
  DEFAULT_LANE,
  'C:\\dev\\worktrees\\cursor-lane-2',
  'C:\\dev\\worktrees\\cursor-lane-3',
];
// This script lives in <repo>/scripts, so QUEUE.md is one level up.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_PATH = path.join(REPO_ROOT, 'docs', 'tasks', 'QUEUE.md');
const QUEUE_POLL_MS = 5000;
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
  const out = {
    lanes: [],
    port: DEFAULT_PORT,
    log: null,
    open: false,
    openOnActivity: false,
    openCmd: null,
    notify: false,
    notifyCmd: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lane') {
      const laneArg = argv[++i];
      if (!laneArg) throw new Error('--lane requires a path');
      out.lanes.push(laneArg);
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
    } else if (a === '--open') {
      out.open = true;
    } else if (a === '--open-on-activity') {
      out.openOnActivity = true;
    } else if (a === '--open-cmd') {
      out.openCmd = argv[++i];
      if (!out.openCmd) throw new Error('--open-cmd requires a command');
    } else if (a === '--notify') {
      out.notify = true;
    } else if (a === '--notify-cmd') {
      out.notifyCmd = argv[++i];
      if (!out.notifyCmd) throw new Error('--notify-cmd requires a command');
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage: node scripts/cursor-watch.mjs [--lane <dir>]... [--port <n>] [--log <file>]
                        [--open] [--open-on-activity] [--open-cmd <command>]
                        [--notify] [--notify-cmd <command>]
Defaults: every existing lane in the pool, port ${DEFAULT_PORT}
Pool: ${LANE_POOL.join(', ')}
Binds 127.0.0.1 only. Open the printed URL in a browser.
  --lane <dir>        Pin one lane; repeat for several. Omit to auto-discover
                      the pool. All lanes share ONE server and ONE tab.
  --open              Launch the default browser once after the server binds
  --open-on-activity  Launch on first run activity (re-arms when DELIVERY.md
                      disappears or the lane branch changes)
  --open-cmd <cmd>    Override opener; <cmd> runs with the dashboard URL as
                      the final argument (for tests / custom browsers)
  --notify            OS notify once when phase becomes DELIVERY (re-arms when
                      DELIVERY.md disappears or the lane branch changes)
  --notify-cmd <cmd>  Override notifier; <cmd> runs with a short message as
                      the final argument (for tests / custom notifiers)`);
}

// ---------------------------------------------------------------------------
// Browser auto-open (non-blocking; failure never kills the server)
// ---------------------------------------------------------------------------

function quoteShellArg(arg) {
  // Double-quote and escape embedded quotes for cmd.exe / sh.
  return `"${String(arg).replace(/"/g, '\\"')}"`;
}

/**
 * Launch the dashboard URL via --open-cmd override or the platform default.
 * Never throws into the caller; logs and resolves on failure.
 */
function openDashboard(url, openCmd) {
  let child;
  try {
    if (openCmd) {
      // Override is a shell command string; append URL as the final argument.
      child = spawn(`${openCmd} ${quoteShellArg(url)}`, {
        shell: true,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
    } else if (process.platform === 'win32') {
      // `start` title must be present so the URL is not treated as the title.
      child = spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
    } else if (process.platform === 'darwin') {
      child = spawn('open', [url], {
        detached: true,
        stdio: 'ignore',
      });
    } else {
      child = spawn('xdg-open', [url], {
        detached: true,
        stdio: 'ignore',
      });
    }
  } catch (err) {
    console.error(`cursor-watch: failed to open browser: ${err.message}`);
    return;
  }

  child.on('error', (err) => {
    console.error(`cursor-watch: failed to open browser: ${err.message}`);
  });
  child.on('close', (code) => {
    if (code && code !== 0) {
      console.error(
        `cursor-watch: open command exited with code ${code}`,
      );
    }
  });
  try {
    child.unref();
  } catch {
    /* ignore */
  }
}

function createAutoOpenController(opts) {
  // armed: may fire on the next non-DELIVERY activity. Starts true so the
  // first WORKING signal pops the browser; re-arm resets this to true.
  return {
    enabled: Boolean(opts.openOnActivity),
    openCmd: opts.openCmd,
    url: opts.url,
    armed: true,
  };
}

function tryOpenOnActivity(ctrl, state) {
  if (!ctrl || !ctrl.enabled) return;
  if (!ctrl.armed) return;
  if (state.phase === 'DELIVERY') return;
  // DELIVERY.md lifecycle itself is not "run activity" for auto-open -
  // re-arm on its removal must not consume the once-per-run slot.
  const p = state.lastChangedPath;
  if (p === 'DELIVERY.md' || (p && p.endsWith('/DELIVERY.md'))) return;
  ctrl.armed = false;
  openDashboard(ctrl.url, ctrl.openCmd);
}

function rearmAutoOpen(ctrl, reason) {
  if (!ctrl || !ctrl.enabled) return;
  if (ctrl.armed) return;
  ctrl.armed = true;
  console.log(`cursor-watch: auto-open re-armed (${reason})`);
}

// ---------------------------------------------------------------------------
// OS notify on DELIVERY (non-blocking; failure never kills the server)
// ---------------------------------------------------------------------------

function createNotifyController(opts) {
  // armed: may fire on the next WAITING/WORKING -> DELIVERY transition.
  // Re-arm resets this (DELIVERY.md removal or branch change), mirroring CW2.
  return {
    enabled: Boolean(opts.notify),
    notifyCmd: opts.notifyCmd,
    armed: true,
  };
}

/**
 * Fire an OS notification (or --notify-cmd override). Never throws into the
 * caller; logs and resolves on failure.
 */
function fireDeliveryNotify(message, notifyCmd) {
  let child;
  try {
    if (notifyCmd) {
      child = spawn(`${notifyCmd} ${quoteShellArg(message)}`, {
        shell: true,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
    } else if (process.platform === 'win32') {
      // Tray balloon via System.Windows.Forms - no deps, no files written.
      const ps = [
        "Add-Type -AssemblyName System.Windows.Forms;",
        "$n = New-Object System.Windows.Forms.NotifyIcon;",
        "$n.Icon = [System.Drawing.SystemIcons]::Information;",
        "$n.Visible = $true;",
        "$n.BalloonTipTitle = 'Cursor Watch';",
        `$n.BalloonTipText = ${JSON.stringify(message)};`,
        "$n.ShowBalloonTip(4000);",
        "Start-Sleep -Seconds 5;",
        "$n.Dispose();",
      ].join(' ');
      child = spawn(
        'powershell',
        ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', ps],
        {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        },
      );
    } else if (process.platform === 'darwin') {
      const script = `display notification ${JSON.stringify(message)} with title "Cursor Watch"`;
      child = spawn('osascript', ['-e', script], {
        detached: true,
        stdio: 'ignore',
      });
    } else {
      child = spawn('notify-send', ['Cursor Watch', message], {
        detached: true,
        stdio: 'ignore',
      });
    }
  } catch (err) {
    console.error(`cursor-watch: failed to notify: ${err.message}`);
    return;
  }

  child.on('error', (err) => {
    console.error(`cursor-watch: failed to notify: ${err.message}`);
  });
  child.on('close', (code) => {
    if (code && code !== 0) {
      console.error(
        `cursor-watch: notify command exited with code ${code}`,
      );
    }
  });
  try {
    child.unref();
  } catch {
    /* ignore */
  }
}

function unitLabelFromBranch(branch) {
  if (!branch || branch === '(unknown)' || branch === '(no-git)') return 'run';
  if (branch.startsWith('cursor/')) return branch.slice('cursor/'.length);
  return branch;
}

function tryNotifyOnDelivery(ctrl, prevPhase, state) {
  if (!ctrl || !ctrl.enabled) return;
  if (!ctrl.armed) return;
  if (state.phase !== 'DELIVERY') return;
  if (prevPhase === 'DELIVERY') return;
  ctrl.armed = false;
  const unit = unitLabelFromBranch(state.branch);
  const msg = `DELIVERY READY - ${unit} is done`;
  console.log(`cursor-watch: notifying (${msg})`);
  fireDeliveryNotify(msg, ctrl.notifyCmd);
}

function rearmNotify(ctrl, reason) {
  if (!ctrl || !ctrl.enabled) return;
  if (ctrl.armed) return;
  ctrl.armed = true;
  console.log(`cursor-watch: notify re-armed (${reason})`);
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

/**
 * The hub owns everything shared across lanes: the SSE client set, the wave
 * rail parsed from QUEUE.md, and the SINGLE auto-open / notify controller.
 * Sharing those controllers is what keeps three busy lanes from opening
 * three tabs - the armed flag is consumed once, by whichever lane stirs first.
 */
function createHub() {
  return {
    lanes: [],
    clients: new Set(),
    wave: { name: null, units: [], landed: 0, total: 0 },
    autoOpen: null,
    notify: null,
  };
}

function createState(lane, logPath, id, hub) {
  return {
    id,
    hub,
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
    // clients / autoOpen / notify live on the hub - see createHub.
    get clients() {
      return this.hub.clients;
    },
    get autoOpen() {
      return this.hub.autoOpen;
    },
    get notify() {
      return this.hub.notify;
    },
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

function lanePayload(state) {
  return {
    id: state.id,
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

function snapshotPayload(hub) {
  return {
    type: 'snapshot',
    serverNow: Date.now(),
    wave: hub.wave,
    lanes: hub.lanes.map(lanePayload),
  };
}

function broadcastHub(hub, event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of hub.clients) {
    try {
      res.write(data);
    } catch {
      hub.clients.delete(res);
    }
  }
}

/** Lane-scoped broadcast - stamps the lane id so the client can route it. */
function broadcast(state, event) {
  broadcastHub(state.hub, { ...event, id: state.id });
}

// ---------------------------------------------------------------------------
// Wave rail (QUEUE.md)
// ---------------------------------------------------------------------------

const UNIT_LINE_RE =
  /^(DRAFT|QUEUED|DISPATCHED|AWAITING-REVIEW|LANDED|BOUNCED)\b[^|]*\|\s*([A-Za-z0-9._-]+\.md)\s*\|\s*(.*)$/;

/**
 * Parse the CURRENT wave out of QUEUE.md's `## Active` section.
 *
 * `## Active` accumulates landed units from older waves too, so "current
 * wave" is the CONTIGUOUS leading run of units sharing the first unit's
 * id prefix (`ai1-...` -> `ai`). The run stops at the first foreign prefix,
 * which is what keeps the AI-wave at five units instead of swallowing the
 * F-wave below it.
 */
function parseWave(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+Active\b/.test(l));
  if (start === -1) return { name: null, units: [], landed: 0, total: 0 };

  let name = null;
  const units = [];
  let prefix = null;

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) break;
    if (!name) {
      const m = line.match(/^([A-Za-z0-9-]*[Ww]ave\b[^,(]*)/);
      if (m) name = m[1].trim();
    }
    const m = line.match(UNIT_LINE_RE);
    if (!m) continue;

    const [, status, file, scope] = m;
    const id = (file.match(/^([a-z]+\d+)/i) || [, file.replace(/\.md$/, '')])[1];
    const unitPrefix = (id.match(/^([a-z]+)/i) || [, id])[1].toLowerCase();
    if (prefix === null) prefix = unitPrefix;
    if (unitPrefix !== prefix) break; // next wave down - stop the run

    units.push({
      id: id.toUpperCase(),
      file,
      status,
      scope: scope.trim().slice(0, 120),
    });
  }

  return {
    name,
    units,
    landed: units.filter((u) => u.status === 'LANDED').length,
    total: units.length,
  };
}

function readWave() {
  try {
    return parseWave(fs.readFileSync(QUEUE_PATH, 'utf8'));
  } catch {
    return { name: null, units: [], landed: 0, total: 0 };
  }
}

function startWavePoll(hub) {
  const tick = () => {
    const next = readWave();
    if (JSON.stringify(next) !== JSON.stringify(hub.wave)) {
      hub.wave = next;
      broadcastHub(hub, { type: 'wave', wave: next, serverNow: Date.now() });
    }
  };
  tick();
  const t = setInterval(tick, QUEUE_POLL_MS);
  t.unref?.();
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
    tryNotifyOnDelivery(state.notify, prev, state);
  }
  // Open-on-activity: fire once per run while not DELIVERY READY.
  tryOpenOnActivity(state.autoOpen, state);
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
    let deliveryRemoved = false;
    for (const [rel, kind] of batch) {
      if (
        (rel === 'DELIVERY.md' || rel.endsWith('/DELIVERY.md')) &&
        kind === 'unlink'
      ) {
        deliveryRemoved = true;
      }
      pushActivity(state, { ts: now, path: rel, kind });
      state.lastChangedPath = rel;
      broadcast(state, {
        type: 'file',
        ts: now,
        path: rel,
        kind,
      });
    }
    // Activity first (while still disarmed) so DELIVERY.md unlink does not
    // consume the re-armed slot; re-arm after so the next write can fire.
    noteActivity(state, now);
    if (deliveryRemoved) {
      rearmAutoOpen(state.autoOpen, 'DELIVERY.md removed');
      rearmNotify(state.notify, 'DELIVERY.md removed');
    }
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
    // Special-case delivery appearance / disappearance
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
      if (branchChanged) {
        rearmAutoOpen(state.autoOpen, `branch -> ${snap.branch}`);
        rearmNotify(state.notify, `branch -> ${snap.branch}`);
      }
      state.branch = snap.branch;

      const prevKey = JSON.stringify(state.files);
      state.files = snap.files;
      const filesChanged = JSON.stringify(state.files) !== prevKey;

      const prevPhase = state.phase;
      const hadFiles = snap.files.length > 0;
      if (hadFiles) noteActivity(state);

      // Delivery check even without file events (poll-side)
      state.phase = derivePhase(state);
      if (state.phase === 'DELIVERY' && !state.deliveryAt) {
        state.deliveryAt = Date.now();
      }
      // Leaving DELIVERY (e.g. DELIVERY.md removed without a watch event) re-arms
      if (prevPhase === 'DELIVERY' && state.phase !== 'DELIVERY') {
        rearmAutoOpen(state.autoOpen, 'left DELIVERY phase');
        rearmNotify(state.notify, 'left DELIVERY phase');
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
        tryNotifyOnDelivery(state.notify, prevPhase, state);
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
  // One self-contained page. No external fetches - this runs offline on
  // 127.0.0.1 and must never depend on a CDN. No backticks or template
  // literals inside the client script: this whole file IS a template
  // literal, and string concatenation keeps the escaping honest.
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Relay - lane watch</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='none' stroke='%238b9bff' stroke-width='2'/%3E%3C/svg%3E" />
<style>
  :root {
    /* Pulled from LogChamp's dark champ palette so the tool reads as part
       of the same world - periwinkle signal, amber ready, forest landed. */
    --ink: #05070f;
    --panel: #0a0f1e;
    --panel-2: #0d1426;
    --edge: #1a2440;
    --edge-hot: #2b3a63;
    --txt: #e8edff;
    --dim: #8494b4;
    --signal: #8b9bff;
    --ready: #f5a623;
    --landed: #4ade80;
    --bounced: #f87171;
    --idle: #3a4a6b;

    --display: "Bahnschrift", "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif;
    --mono: "Cascadia Mono", "Cascadia Code", Consolas, ui-monospace, monospace;

    --gap: 18px;
    --radius: 3px;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    background: var(--ink);
    color: var(--txt);
    font-family: var(--mono);
    font-size: 13px;
    line-height: 1.5;
  }

  body {
    min-height: 100vh;
    padding: var(--gap);
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    /* A single faint vignette, not a gradient wash - the canvas is the
       only thing allowed to glow. */
    background-image: radial-gradient(120% 80% at 50% 0%, #0a1122 0%, var(--ink) 62%);
  }

  h2 {
    font-family: var(--display);
    font-variation-settings: "wght" 600, "wdth" 75;
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--dim);
    margin: 0 0 10px;
  }

  .panel {
    background: var(--panel);
    border: 1px solid var(--edge);
    border-radius: var(--radius);
  }

  /* ---------------------------------------------------------------- bar */

  .bar {
    display: flex;
    align-items: baseline;
    gap: 16px;
    padding: 12px 16px;
    background: var(--panel);
    border: 1px solid var(--edge);
    border-radius: var(--radius);
  }

  .mark {
    font-family: var(--display);
    font-variation-settings: "wght" 700, "wdth" 75;
    font-size: 20px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }
  .mark span { color: var(--signal); }

  .wavename {
    font-size: 12px;
    color: var(--dim);
    letter-spacing: 0.05em;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    font-family: var(--display);
    font-variation-settings: "wght" 700, "wdth" 75;
    font-size: 26px;
    line-height: 1;
    letter-spacing: 0.02em;
  }
  .count b { color: var(--landed); font-weight: inherit; }
  .count span { color: var(--dim); font-size: 16px; }

  .conn {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dim);
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .conn::before {
    content: "";
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--landed);
  }
  .conn[data-live="0"] { color: var(--bounced); }
  .conn[data-live="0"]::before { background: var(--bounced); }

  /* --------------------------------------------------------------- rail */

  .rail {
    padding: 20px 22px 16px;
    overflow-x: auto;
  }

  .units {
    display: flex;
    align-items: flex-start;
    min-width: min-content;
  }

  .unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    flex: 0 0 auto;
    width: 108px;
    text-align: center;
  }

  .dot {
    width: 15px; height: 15px;
    border-radius: 50%;
    border: 1.5px solid var(--idle);
    background: transparent;
    position: relative;
  }
  .unit[data-status="LANDED"] .dot { background: var(--landed); border-color: var(--landed); }
  .unit[data-status="DISPATCHED"] .dot,
  .unit[data-status="AWAITING-REVIEW"] .dot {
    border-color: var(--signal);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--signal) 18%, transparent);
    animation: breathe 2.4s ease-in-out infinite;
  }
  .unit[data-status="BOUNCED"] .dot { border-color: var(--bounced); background: var(--bounced); }
  .unit[data-status="DRAFT"] .dot { border-style: dashed; }

  @keyframes breathe {
    0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--signal) 14%, transparent); }
    50%      { box-shadow: 0 0 0 7px color-mix(in srgb, var(--signal) 4%, transparent); }
  }

  /* The connector is the wave's sequence made literal: solid behind
     landed work, dotted ahead of it. */
  .link {
    flex: 1 1 auto;
    height: 1px;
    margin-top: 7px;
    min-width: 12px;
    background: var(--idle);
  }
  .link[data-done="0"] {
    background: none;
    border-top: 1px dashed var(--edge-hot);
  }

  .uid {
    font-family: var(--display);
    font-variation-settings: "wght" 600, "wdth" 75;
    font-size: 13px;
    letter-spacing: 0.12em;
  }
  .ustatus {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--dim);
  }
  .unit[data-status="LANDED"] .ustatus { color: var(--landed); }
  .unit[data-status="DISPATCHED"] .ustatus,
  .unit[data-status="AWAITING-REVIEW"] .ustatus { color: var(--signal); }
  .unit[data-status="BOUNCED"] .ustatus { color: var(--bounced); }

  .uscope {
    font-size: 10px;
    color: var(--dim);
    opacity: 0.62;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ------------------------------------------------------------ synapse */

  .synapse {
    position: relative;
    height: 210px;
    overflow: hidden;
    background: var(--panel);
  }
  .synapse canvas { display: block; width: 100%; height: 100%; }

  .legend {
    position: absolute;
    left: 16px; bottom: 12px;
    display: flex;
    gap: 16px;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--dim);
    pointer-events: none;
  }
  .legend i {
    font-style: normal;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .legend i::before {
    content: "";
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
  }
  .legend .w { color: var(--signal); }
  .legend .r { color: var(--ready); }
  .legend .i { color: var(--idle); }

  /* -------------------------------------------------------------- lanes */

  .lanes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--gap);
  }

  .lane {
    padding: 14px 16px;
    border-left: 2px solid var(--idle);
    cursor: pointer;
    transition: background 180ms ease-out, border-color 180ms ease-out;
  }
  .lane:hover { background: var(--panel-2); }
  .lane[aria-selected="true"] { background: var(--panel-2); border-color: var(--signal); }
  .lane[data-phase="WORKING"] { border-left-color: var(--signal); }
  .lane[data-phase="DELIVERY"] { border-left-color: var(--ready); }

  .lane-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }
  .lane-id {
    font-family: var(--display);
    font-variation-settings: "wght" 700, "wdth" 75;
    font-size: 15px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .phase {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dim);
  }
  .lane[data-phase="WORKING"] .phase { color: var(--signal); }
  .lane[data-phase="DELIVERY"] .phase { color: var(--ready); }

  .lane-branch {
    margin-top: 8px;
    font-size: 11px;
    color: var(--dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lane-stats {
    margin-top: 10px;
    display: flex;
    gap: 18px;
    font-size: 11px;
    color: var(--dim);
  }
  .lane-stats b {
    color: var(--txt);
    font-weight: 400;
    font-family: var(--display);
    font-variation-settings: "wght" 600, "wdth" 75;
    font-size: 14px;
  }
  .lane-last {
    margin-top: 9px;
    font-size: 10px;
    color: var(--dim);
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* -------------------------------------------------------------- split */

  .split {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(0, 1.5fr);
    gap: var(--gap);
    flex: 1;
    min-height: 260px;
  }
  .split > section { padding: 14px 16px; overflow: hidden; display: flex; flex-direction: column; }

  ol.feed {
    list-style: none;
    margin: 0; padding: 0;
    overflow-y: auto;
    flex: 1;
  }
  ol.feed li {
    display: flex;
    gap: 10px;
    padding: 3px 0;
    font-size: 11px;
    border-bottom: 1px solid color-mix(in srgb, var(--edge) 45%, transparent);
  }
  ol.feed .t { color: var(--dim); opacity: 0.6; flex: 0 0 auto; }
  ol.feed .k {
    flex: 0 0 46px;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--signal);
  }
  ol.feed .k[data-kind="unlink"] { color: var(--bounced); }
  ol.feed .k[data-kind="add"] { color: var(--landed); }
  ol.feed .p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  ol.feed .lane-tag { color: var(--dim); opacity: 0.55; flex: 0 0 auto; }

  pre.scope {
    margin: 0;
    overflow: auto;
    flex: 1;
    font-size: 11px;
    line-height: 1.55;
    color: var(--dim);
    white-space: pre-wrap;
    word-break: break-word;
  }
  pre.scope .add { color: var(--landed); }
  pre.scope .del { color: var(--bounced); }
  pre.scope .hdr { color: var(--signal); }

  .tabs { display: flex; gap: 14px; margin: 0 0 10px; }
  .tabs button {
    background: none;
    border: none;
    padding: 0 0 4px;
    cursor: pointer;
    font-family: var(--display);
    font-variation-settings: "wght" 600, "wdth" 75;
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--dim);
    border-bottom: 1px solid transparent;
  }
  .tabs button[aria-selected="true"] { color: var(--txt); border-bottom-color: var(--signal); }
  .tabs button:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }

  .empty { color: var(--dim); opacity: 0.55; font-size: 11px; }

  @media (max-width: 860px) {
    .split { grid-template-columns: 1fr; }
    .synapse { height: 150px; }
  }

  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
</style>
</head>
<body>

<header class="bar">
  <div class="mark">Re<span>l</span>ay</div>
  <div class="wavename" id="wavename">reading QUEUE.md...</div>
  <div class="count"><b id="landed">0</b><span id="total">/0</span></div>
  <div class="conn" id="conn" data-live="1">live</div>
</header>

<section class="panel rail">
  <h2>Wave</h2>
  <div class="units" id="units"></div>
</section>

<section class="panel synapse">
  <canvas id="cv"></canvas>
  <div class="legend">
    <i class="w">working</i>
    <i class="r">delivery ready</i>
    <i class="i">idle</i>
  </div>
</section>

<section class="lanes" id="lanes"></section>

<section class="split">
  <section class="panel">
    <h2>Activity</h2>
    <ol class="feed" id="feed"><li class="empty">Nothing yet. Lanes are quiet.</li></ol>
  </section>
  <section class="panel">
    <div class="tabs">
      <button id="tabDiff" aria-selected="true">Excerpt</button>
      <button id="tabLog" aria-selected="false">Agent log</button>
    </div>
    <pre class="scope" id="scope"><span class="empty">Select a lane to inspect its latest change.</span></pre>
  </section>
</section>

<script>
(function () {
  'use strict';

  var lanes = [];          // server order; id -> index via laneIndex()
  var wave = { name: null, units: [], landed: 0, total: 0 };
  var selected = null;     // lane id being inspected
  var tab = 'diff';
  var feed = [];           // merged cross-lane activity
  var FEED_CAP = 120;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var el = {
    wavename: document.getElementById('wavename'),
    landed: document.getElementById('landed'),
    total: document.getElementById('total'),
    conn: document.getElementById('conn'),
    units: document.getElementById('units'),
    lanes: document.getElementById('lanes'),
    feed: document.getElementById('feed'),
    scope: document.getElementById('scope'),
    tabDiff: document.getElementById('tabDiff'),
    tabLog: document.getElementById('tabLog'),
    cv: document.getElementById('cv')
  };

  function laneIndex(id) {
    for (var i = 0; i < lanes.length; i++) if (lanes[i].id === id) return i;
    return -1;
  }
  function laneById(id) {
    var i = laneIndex(id);
    return i === -1 ? null : lanes[i];
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function clock(ts) {
    var d = new Date(ts);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function elapsed(from) {
    if (!from) return '--';
    var s = Math.max(0, Math.round((Date.now() - from) / 1000));
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ' + (s % 60) + 's';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }
  function shortLane(p) {
    var parts = String(p).split(/[\\\\/]/);
    return parts[parts.length - 1] || p;
  }

  /* ------------------------------------------------------------- render */

  function renderWave() {
    el.wavename.textContent = wave.name || 'no active wave in QUEUE.md';
    el.landed.textContent = wave.landed;
    el.total.textContent = '/' + wave.total;

    if (!wave.units.length) {
      el.units.innerHTML = '<span class="empty">No units parsed from the Active section.</span>';
      return;
    }
    var html = '';
    for (var i = 0; i < wave.units.length; i++) {
      var u = wave.units[i];
      if (i > 0) {
        var done = wave.units[i - 1].status === 'LANDED' ? '1' : '0';
        html += '<div class="link" data-done="' + done + '"></div>';
      }
      html += '<div class="unit" data-status="' + esc(u.status) + '" title="' + esc(u.scope) + '">'
        + '<span class="dot"></span>'
        + '<span class="uid">' + esc(u.id) + '</span>'
        + '<span class="ustatus">' + esc(u.status) + '</span>'
        + '<span class="uscope">' + esc(u.scope) + '</span>'
        + '</div>';
    }
    el.units.innerHTML = html;
  }

  function renderLanes() {
    if (!lanes.length) {
      el.lanes.innerHTML = '<div class="panel lane"><span class="empty">No lanes.</span></div>';
      return;
    }
    var html = '';
    for (var i = 0; i < lanes.length; i++) {
      var L = lanes[i];
      var since = L.phase === 'DELIVERY' ? L.deliveryAt : L.firstActivityAt;
      html += '<div class="panel lane" data-id="' + esc(L.id) + '" data-phase="' + esc(L.phase) + '"'
        + ' role="button" tabindex="0" aria-selected="' + (selected === L.id) + '">'
        + '<div class="lane-top"><span class="lane-id">' + esc(L.id) + '</span>'
        + '<span class="phase">' + esc(L.phase) + '</span></div>'
        + '<div class="lane-branch">' + esc(L.branch || '(unknown)') + '</div>'
        + '<div class="lane-stats">'
        + '<span><b>' + (L.files ? L.files.length : 0) + '</b> files</span>'
        + '<span><b>' + elapsed(since) + '</b> ' + (L.phase === 'DELIVERY' ? 'ready' : 'active') + '</span>'
        + '</div>'
        + '<div class="lane-last">' + esc(shortLane(L.lane)) + (L.lastChangedPath ? ' - ' + esc(L.lastChangedPath) : '') + '</div>'
        + '</div>';
    }
    el.lanes.innerHTML = html;
  }

  function renderFeed() {
    if (!feed.length) {
      el.feed.innerHTML = '<li class="empty">Nothing yet. Lanes are quiet.</li>';
      return;
    }
    var html = '';
    for (var i = 0; i < feed.length; i++) {
      var e = feed[i];
      html += '<li><span class="t">' + clock(e.ts) + '</span>'
        + '<span class="lane-tag">' + esc(e.id) + '</span>'
        + '<span class="k" data-kind="' + esc(e.kind) + '">' + esc(e.kind) + '</span>'
        + '<span class="p">' + esc(e.path) + '</span></li>';
    }
    el.feed.innerHTML = html;
  }

  function renderScope() {
    var L = selected ? laneById(selected) : null;
    if (!L) {
      el.scope.innerHTML = '<span class="empty">Select a lane to inspect its latest change.</span>';
      return;
    }
    if (tab === 'log') {
      var lines = L.logLines || [];
      if (!lines.length) {
        el.scope.innerHTML = '<span class="empty">No agent log for ' + esc(L.id)
          + '. Channel B writes cursor-run.log into the lane.</span>';
        return;
      }
      el.scope.textContent = lines.join('\\n');
      el.scope.scrollTop = el.scope.scrollHeight;
      return;
    }
    var ex = L.excerpt || {};
    if (!ex.text) {
      el.scope.innerHTML = '<span class="empty">No excerpt yet for ' + esc(L.id) + '.</span>';
      return;
    }
    // Colourise a unified diff without a highlighter dependency.
    var out = ex.text.split('\\n').map(function (line) {
      var cls = '';
      if (/^\\+/.test(line) && !/^\\+\\+\\+/.test(line)) cls = 'add';
      else if (/^-/.test(line) && !/^---/.test(line)) cls = 'del';
      else if (/^(@@|diff |index |\\+\\+\\+|---)/.test(line)) cls = 'hdr';
      return cls ? '<span class="' + cls + '">' + esc(line) + '</span>' : esc(line);
    }).join('\\n');
    el.scope.innerHTML = '<span class="hdr">' + esc(ex.path || '') + '</span>\\n' + out;
  }

  /* ------------------------------------------------------ synapse canvas
     The signature. Each lane is an axon running left to right. Every REAL
     filesystem event injects a travelling pulse on that lane's axon - the
     motion is data, not decoration, so a still canvas genuinely means a
     still agent. Idle lanes keep a slow carrier wave so "connected but
     quiet" is visibly different from "dead". */

  var ctx = el.cv.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  var pulses = [];   // { row, x, born, strength }
  var t0 = performance.now();

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    var r = el.cv.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    el.cv.width = Math.round(W * DPR);
    el.cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);

  function laneColor(phase) {
    if (phase === 'DELIVERY') return [245, 166, 35];
    if (phase === 'WORKING') return [139, 155, 255];
    return [58, 74, 107];
  }
  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  function rowY(i, n) {
    var pad = 44;
    if (n === 1) return H / 2;
    return pad + (i * (H - pad * 2)) / (n - 1);
  }

  function axonY(i, n, x, t) {
    // A shallow travelling wave keeps the line alive without reading as noise.
    var base = rowY(i, n);
    var amp = reduced ? 0 : 5;
    return base + Math.sin(x * 0.012 + t * 0.0009 + i * 1.7) * amp;
  }

  function draw(now) {
    var t = now - t0;
    ctx.clearRect(0, 0, W, H);
    var n = Math.max(1, lanes.length);

    // Cross-connections: an X-lattice between adjacent axons, one cell per
    // station gap. This is the "network" - it never carries data, so it
    // stays at the very bottom of the contrast stack.
    var stations = 9;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(43,58,99,0.5)';
    for (var s = 0; s < stations; s++) {
      var xa = (W * s) / stations;
      var xb = (W * (s + 1)) / stations;
      for (var i = 0; i < n - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(xa, axonY(i, n, xa, t));
        ctx.lineTo(xb, axonY(i + 1, n, xb, t));
        ctx.moveTo(xa, axonY(i + 1, n, xa, t));
        ctx.lineTo(xb, axonY(i, n, xb, t));
        ctx.stroke();
      }
    }

    for (var r = 0; r < n; r++) {
      var L = lanes[r] || { phase: 'WAITING' };
      var c = laneColor(L.phase);

      // Axon
      ctx.beginPath();
      for (var x = 0; x <= W; x += 6) {
        var y = axonY(r, n, x, t);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(c, L.phase === 'WAITING' ? 0.42 : 0.62);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Stations. A station brightens as a pulse crosses it - that flash is
      // what makes a lane look like it is firing rather than just drawn.
      for (var s2 = 0; s2 <= stations; s2++) {
        var nx = (W * s2) / stations;
        var ny = axonY(r, n, nx, t);
        var near = Infinity;
        for (var q = 0; q < pulses.length; q++) {
          if (pulses[q].row !== r) continue;
          var d = Math.abs(pulses[q].x - nx);
          if (d < near) near = d;
        }
        var hit = near < 55 ? 1 - near / 55 : 0;
        ctx.beginPath();
        ctx.arc(nx, ny, 2 + hit * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = rgba(c, (L.phase === 'WAITING' ? 0.5 : 0.85) + hit * 0.15);
        ctx.fill();
      }

      // A delivery-ready lane holds a standing glow at its terminus - the
      // one thing on this canvas that does not move, because it is done.
      if (L.phase === 'DELIVERY') {
        var ty = axonY(r, n, W - 14, t);
        var pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0035);
        var g = ctx.createRadialGradient(W - 14, ty, 0, W - 14, ty, 26);
        g.addColorStop(0, rgba(c, 0.55 + 0.2 * pulse));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(W - 14, ty, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      // Idle carrier: one slow, dim traveller so a connected-but-quiet
      // lane is distinguishable from a dead page.
      if (!reduced && L.phase === 'WAITING') {
        var cx = ((t * 0.02 + r * 140) % (W + 120)) - 60;
        var cy = axonY(r, n, cx, t);
        ctx.beginPath();
        ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = rgba(c, 0.5);
        ctx.fill();
      }
    }

    // Travelling pulses - one per real file event.
    for (var p = pulses.length - 1; p >= 0; p--) {
      var P = pulses[p];
      var age = now - P.born;
      var speed = reduced ? 0 : 0.19;
      P.x = age * speed;
      if (P.x > W + 40) { pulses.splice(p, 1); continue; }

      var pr = Math.min(P.row, n - 1);
      var py = axonY(pr, n, P.x, t);
      var pc = laneColor((lanes[pr] || {}).phase);
      var fade = Math.max(0, 1 - P.x / (W + 40));

      // Comet tail reads as direction of travel: left is behind.
      var grad = ctx.createLinearGradient(P.x - 70, py, P.x, py);
      grad.addColorStop(0, rgba(pc, 0));
      grad.addColorStop(1, rgba(pc, 0.5 * fade));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(P.x - 70, py);
      ctx.lineTo(P.x, py);
      ctx.stroke();

      var head = ctx.createRadialGradient(P.x, py, 0, P.x, py, 13);
      head.addColorStop(0, rgba(pc, 0.95 * fade));
      head.addColorStop(1, rgba(pc, 0));
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(P.x, py, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  function firePulse(id) {
    var i = laneIndex(id);
    if (i === -1) i = 0;
    if (pulses.length > 90) pulses.shift();
    pulses.push({ row: i, x: 0, born: performance.now() });
  }

  /* --------------------------------------------------------------- wire */

  el.lanes.addEventListener('click', function (ev) {
    var card = ev.target.closest('.lane');
    if (!card || !card.dataset.id) return;
    selected = card.dataset.id;
    renderLanes();
    renderScope();
  });
  el.lanes.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var card = ev.target.closest('.lane');
    if (!card || !card.dataset.id) return;
    ev.preventDefault();
    selected = card.dataset.id;
    renderLanes();
    renderScope();
  });

  function setTab(next) {
    tab = next;
    el.tabDiff.setAttribute('aria-selected', String(next === 'diff'));
    el.tabLog.setAttribute('aria-selected', String(next === 'log'));
    renderScope();
  }
  el.tabDiff.addEventListener('click', function () { setTab('diff'); });
  el.tabLog.addEventListener('click', function () { setTab('log'); });

  function applyLane(id, patch) {
    var L = laneById(id);
    if (!L) return null;
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) L[k] = patch[k];
    return L;
  }

  function handle(ev) {
    if (ev.type === 'snapshot') {
      lanes = ev.lanes || [];
      wave = ev.wave || wave;
      if (!selected && lanes.length) selected = lanes[0].id;
      // Seed the feed from whatever each lane already recorded.
      feed = [];
      for (var i = 0; i < lanes.length; i++) {
        var acts = lanes[i].activity || [];
        for (var j = 0; j < acts.length; j++) {
          feed.push({ ts: acts[j].ts, path: acts[j].path, kind: acts[j].kind, id: lanes[i].id });
        }
      }
      feed.sort(function (a, b) { return b.ts - a.ts; });
      feed = feed.slice(0, FEED_CAP);
      renderWave(); renderLanes(); renderFeed(); renderScope();
      return;
    }
    if (ev.type === 'wave') {
      wave = ev.wave;
      renderWave();
      return;
    }
    if (ev.type === 'file') {
      feed.unshift({ ts: ev.ts, path: ev.path, kind: ev.kind, id: ev.id });
      if (feed.length > FEED_CAP) feed.length = FEED_CAP;
      applyLane(ev.id, { lastChangedPath: ev.path });
      firePulse(ev.id);
      renderFeed(); renderLanes();
      return;
    }
    if (ev.type === 'state' || ev.type === 'diff') {
      applyLane(ev.id, {
        phase: ev.phase,
        branch: ev.branch,
        files: ev.files,
        firstActivityAt: ev.firstActivityAt,
        deliveryAt: ev.deliveryAt
      });
      renderLanes();
      return;
    }
    if (ev.type === 'excerpt') {
      applyLane(ev.id, { excerpt: ev.excerpt });
      if (selected === ev.id) renderScope();
      return;
    }
    if (ev.type === 'log') {
      var L = laneById(ev.id);
      if (!L) return;
      L.logLines = (L.logLines || []).concat([ev.line]).slice(-200);
      if (selected === ev.id && tab === 'log') renderScope();
      return;
    }
  }

  function connect() {
    var src = new EventSource('/events');
    src.onmessage = function (m) {
      try { handle(JSON.parse(m.data)); } catch (e) { /* ignore malformed frame */ }
    };
    src.onopen = function () { el.conn.dataset.live = '1'; el.conn.textContent = 'live'; };
    src.onerror = function () {
      el.conn.dataset.live = '0';
      el.conn.textContent = 'reconnecting';
    };
  }

  resize();
  requestAnimationFrame(draw);
  connect();
  // Elapsed counters are derived from timestamps, so a cheap tick is enough.
  setInterval(renderLanes, 1000);
})();
</script>
</body>
</html>`;
}

function createServer(hub, port) {
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
      send(res, 200, JSON.stringify(snapshotPayload(hub)), {
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
      res.write(`data: ${JSON.stringify(snapshotPayload(hub))}\n\n`);
      hub.clients.add(res);
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
        hub.clients.delete(res);
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

  // Explicit --lane wins; otherwise take every pool lane that exists on disk.
  const requested = args.lanes.length ? args.lanes : LANE_POOL;
  const lanes = requested
    .map((l) => path.resolve(l))
    .filter((l) => fs.existsSync(l) && fs.statSync(l).isDirectory());

  if (!lanes.length) {
    console.error(
      args.lanes.length
        ? `cursor-watch: none of the given lanes exist: ${requested.join(', ')}`
        : `cursor-watch: no lane worktrees found in the pool: ${LANE_POOL.join(', ')}`,
    );
    process.exit(1);
  }

  const hub = createHub();
  const url = `http://127.0.0.1:${args.port}`;

  // ONE controller for the whole hub - three busy lanes still open one tab.
  if (args.openOnActivity) {
    hub.autoOpen = createAutoOpenController({
      openOnActivity: true,
      openCmd: args.openCmd,
      url,
    });
  }
  if (args.notify) {
    hub.notify = createNotifyController({
      notify: true,
      notifyCmd: args.notifyCmd,
    });
  }

  lanes.forEach((lane, i) => {
    // --log pins the first lane's log only; the rest use their own default.
    let logPath = i === 0 && args.log ? path.resolve(args.log) : null;
    if (!logPath) {
      const defaultLog = path.join(lane, 'cursor-run.log');
      if (fs.existsSync(defaultLog)) logPath = defaultLog;
    }

    const state = createState(lane, logPath, `lane${i + 1}`, hub);
    // Seed phase from an existing DELIVERY.md (e.g. mid-audit attach)
    if (deliveryExists(lane)) {
      state.phase = 'DELIVERY';
      state.deliveryAt = Date.now();
      state.firstActivityAt = Date.now();
    }
    hub.lanes.push(state);

    startFileWatch(state);
    startGitPoll(state);
    startLogTail(state);

    console.log(`cursor-watch: watching ${state.id} ${lane}`);
    if (logPath) console.log(`cursor-watch: tailing log ${logPath}`);
  });

  startWavePoll(hub);
  const server = await createServer(hub, args.port);

  if (hub.wave.total) {
    console.log(
      `cursor-watch: wave ${hub.wave.name || '(unnamed)'} ${hub.wave.landed}/${hub.wave.total}`,
    );
  }
  console.log(`cursor-watch: open ${url}`);

  // --open: launch once after bind. Failure must not kill the server.
  // Only invoke an opener when --open or --open-on-activity is set; --open-cmd
  // alone never fires (CW1 default stays quiet).
  if (args.open) {
    openDashboard(url, args.openCmd);
  }

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
