// cursor-watch.mjs - live local dashboard for watching Channel B Cursor runs.
//
// Zero-dependency filesystem + git watcher with an embedded SSE dashboard.
// Dev tooling only - never imported by client or server runtime.
//
// Usage:
//   node scripts/cursor-watch.mjs [--lane <dir>] [--port <n>] [--log <file>]
//     [--open] [--open-on-activity] [--open-cmd <command>]
//     [--notify] [--notify-cmd <command>]
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
  const out = {
    lane: DEFAULT_LANE,
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
  console.log(`Usage: node scripts/cursor-watch.mjs [--lane <dir>] [--port <n>] [--log <file>]
                        [--open] [--open-on-activity] [--open-cmd <command>]
                        [--notify] [--notify-cmd <command>]
Defaults: lane ${DEFAULT_LANE}, port ${DEFAULT_PORT}
Binds 127.0.0.1 only. Open the printed URL in a browser.
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
    autoOpen: null, // set in main when --open-on-activity
    notify: null, // set in main when --notify
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
  // Fully embedded. No external URLs. Relative EventSource to /events.
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CURSOR WATCH - waiting</title>
<link rel="icon" id="favicon" href="">
<style>
  :root {
    --bg: #07090d;
    --bg-elev: #0e131a;
    --bg-panel: #0b1016;
    --stroke: rgba(255, 255, 255, 0.06);
    --shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
    --text: #e4ebf2;
    --muted: #8494a6;
    --dim: #525e6c;
    --add: #3dff9a;
    --del: #ff5c7a;
    --warn: #ffc14a;
    --accent: #6b7a8a;
    --accent-rgb: 107, 122, 138;
    --accent-glow: rgba(107, 122, 138, 0.28);
    --ease: ease-out;
    --mono: "Cascadia Code", "JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace;
    --sans: "Segoe UI", system-ui, sans-serif;
    --radius: 8px;
  }
  html[data-phase="WAITING"] {
    --accent: #6b7a8a;
    --accent-rgb: 107, 122, 138;
    --accent-glow: rgba(107, 122, 138, 0.22);
  }
  html[data-phase="WORKING"] {
    --accent: #3dff9a;
    --accent-rgb: 61, 255, 154;
    --accent-glow: rgba(61, 255, 154, 0.28);
  }
  html[data-phase="DELIVERY"] {
    --accent: #5cc8ff;
    --accent-rgb: 92, 200, 255;
    --accent-glow: rgba(92, 200, 255, 0.32);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; height: 100%;
    background: var(--bg); color: var(--text);
    font-family: var(--sans);
  }
  body {
    background:
      radial-gradient(980px 520px at 12% -8%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 58%),
      radial-gradient(820px 460px at 100% 0%, rgba(40, 70, 110, 0.18) 0%, transparent 52%),
      radial-gradient(700px 400px at 50% 120%, rgba(20, 30, 45, 0.5) 0%, transparent 60%),
      var(--bg);
    background-attachment: fixed;
    transition: background 250ms var(--ease);
  }
  .shell {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100vh;
    max-height: 100vh;
    position: relative;
  }
  .wash {
    pointer-events: none;
    position: fixed;
    inset: 0;
    z-index: 40;
    opacity: 0;
    background: radial-gradient(circle at 50% 30%,
      rgba(var(--accent-rgb), 0.55) 0%,
      rgba(var(--accent-rgb), 0.18) 35%,
      transparent 70%);
  }
  .wash.go {
    animation: washSweep 600ms var(--ease) forwards;
  }
  @keyframes washSweep {
    0% { opacity: 0; }
    35% { opacity: 1; }
    100% { opacity: 0; }
  }
  header.bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    margin: 12px 12px 0;
    border-radius: var(--radius);
    background: var(--bg-elev);
    box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke);
    transition: background 250ms var(--ease), box-shadow 250ms var(--ease);
    position: relative;
    z-index: 2;
  }
  header.bar.delivery-lockup {
    flex-wrap: wrap;
    padding: 20px 24px;
    gap: 12px 20px;
    background: linear-gradient(180deg, #0f2433, #0a1822);
    box-shadow: var(--shadow), inset 0 0 0 1px rgba(92, 200, 255, 0.22),
      0 0 40px rgba(92, 200, 255, 0.12);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .presence {
    width: 28px; height: 28px;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;
  }
  .presence .orb {
    position: absolute; inset: 4px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 12px var(--accent-glow);
    transition: background 250ms var(--ease), box-shadow 250ms var(--ease);
  }
  .presence .ring {
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(var(--accent-rgb), 0.45);
    opacity: 0.7;
  }
  html[data-phase="WORKING"] .presence .orb {
    animation: orbPulse var(--pulse-ms, 1800ms) ease-in-out infinite;
  }
  html[data-phase="WORKING"] .presence .ring {
    animation: ringPulse var(--pulse-ms, 1800ms) ease-in-out infinite;
  }
  @keyframes orbPulse {
    0%, 100% { transform: scale(1); opacity: 0.85; }
    50% { transform: scale(1.12); opacity: 1; }
  }
  @keyframes ringPulse {
    0%, 100% { transform: scale(1); opacity: 0.35; }
    50% { transform: scale(1.35); opacity: 0; }
  }
  .brand-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .brand .who {
    font-family: var(--mono);
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: 0.1em;
    color: var(--accent);
    text-shadow: 0 0 18px var(--accent-glow);
    transition: color 250ms var(--ease), text-shadow 250ms var(--ease);
  }
  .brand .unit {
    font-family: var(--mono);
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .delivery-hero {
    display: none;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  header.bar.delivery-lockup .brand { display: none; }
  header.bar.delivery-lockup .delivery-hero { display: flex; }
  .delivery-hero .ready {
    font-family: var(--mono);
    font-weight: 700;
    font-size: 1.35rem;
    letter-spacing: 0.08em;
    color: var(--accent);
    text-shadow: 0 0 22px var(--accent-glow);
  }
  .delivery-hero .summary {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
  }
  .delivery-hero .summary strong { color: var(--text); font-weight: 500; }
  .phase {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(var(--accent-rgb), 0.35);
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.08);
    transition: color 250ms var(--ease), border-color 250ms var(--ease), background 250ms var(--ease);
  }
  .phase .dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent-glow);
  }
  html[data-phase="WORKING"] .phase .dot {
    animation: dotBlink var(--pulse-ms, 1800ms) ease-in-out infinite;
  }
  @keyframes dotBlink {
    0%, 100% { opacity: 0.45; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.15); }
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-left: auto;
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
  }
  .meta strong { color: var(--text); font-weight: 500; }
  .meta .elapsed strong { font-variant-numeric: tabular-nums; }
  .chip {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
    box-shadow: inset 0 0 0 1px var(--stroke);
  }
  .chip .a { color: var(--add); }
  .chip .d { color: var(--del); }
  .spark {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 22px;
    width: 96px;
    padding: 2px 4px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
    box-shadow: inset 0 0 0 1px var(--stroke);
  }
  .spark i {
    display: block;
    flex: 1;
    min-width: 2px;
    border-radius: 1px 1px 0 0;
    background: var(--accent);
    opacity: 0.7;
    height: 2px;
    transition: height 200ms var(--ease), background 250ms var(--ease);
  }
  .mute-btn {
    font-family: var(--mono);
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    color: var(--muted);
    background: transparent;
    border: 1px solid var(--stroke);
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
  }
  .mute-btn:hover { color: var(--text); border-color: rgba(var(--accent-rgb), 0.35); }
  .conn {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--dim);
    transition: background 200ms var(--ease), box-shadow 200ms var(--ease);
  }
  .conn.on { background: var(--accent); box-shadow: 0 0 8px var(--accent-glow); }
  .conn.bad { background: var(--del); box-shadow: none; }
  .grid {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1.15fr;
    grid-template-rows: 1fr auto;
    gap: 12px;
    padding: 12px;
    min-height: 0;
  }
  @media (max-width: 1100px) {
    .grid { grid-template-columns: 1fr; grid-template-rows: auto; overflow: auto; }
  }
  .panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--bg-panel);
    border-radius: var(--radius);
    box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke);
    overflow: hidden;
  }
  .panel h2 {
    margin: 0;
    padding: 12px 16px;
    font-family: var(--mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 1px solid var(--stroke);
    background: rgba(255, 255, 255, 0.02);
  }
  .panel-body {
    flex: 1;
    overflow: auto;
    padding: 8px;
    min-height: 0;
  }
  .feed-card {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    gap: 8px 10px;
    align-items: start;
    padding: 10px 12px;
    margin-bottom: 6px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.025);
    box-shadow: inset 0 0 0 1px var(--stroke);
    font-family: var(--mono);
    font-size: 0.78rem;
  }
  .feed-card.enter {
    animation: cardIn 180ms var(--ease) both;
    box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.45),
      0 0 16px rgba(var(--accent-rgb), 0.12);
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .feed-card .glyph {
    width: 28px; height: 28px;
    border-radius: 6px;
    display: grid; place-items: center;
    font-size: 0.85rem;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.1);
    box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.2);
  }
  .feed-card .glyph.unlink { color: var(--del); background: rgba(255, 92, 122, 0.1);
    box-shadow: inset 0 0 0 1px rgba(255, 92, 122, 0.25); }
  .feed-card .glyph.add { color: var(--add); background: rgba(61, 255, 154, 0.1);
    box-shadow: inset 0 0 0 1px rgba(61, 255, 154, 0.25); }
  .feed-card .glyph.delivery { color: #5cc8ff; background: rgba(92, 200, 255, 0.1);
    box-shadow: inset 0 0 0 1px rgba(92, 200, 255, 0.25); }
  .feed-card .name { color: var(--text); word-break: break-all; font-weight: 600; }
  .feed-card .name .base { color: var(--accent); }
  .feed-card .meta-line {
    grid-column: 2 / 3;
    font-size: 0.65rem;
    color: var(--dim);
  }
  .feed-card .ts {
    font-size: 0.65rem;
    color: var(--dim);
    font-variant-numeric: tabular-nums;
  }
  .empty {
    padding: 20px 12px;
    color: var(--dim);
    font-family: var(--mono);
    font-size: 0.78rem;
  }
  .stat-totals {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    margin-bottom: 6px;
    border-radius: 6px;
    background: rgba(var(--accent-rgb), 0.06);
    box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.18);
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    position: sticky;
    top: 0;
    z-index: 1;
    backdrop-filter: blur(6px);
  }
  .stat-totals .a { color: var(--add); }
  .stat-totals .d { color: var(--del); }
  .stat-row {
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    box-shadow: inset 0 0 0 1px var(--stroke);
  }
  .stat-row .name {
    font-family: var(--mono);
    font-size: 0.75rem;
    margin-bottom: 6px;
    word-break: break-all;
  }
  .stat-row .name .base { color: var(--accent); font-weight: 600; }
  .bars {
    display: flex;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.04);
    margin-bottom: 4px;
  }
  .bars .a, .bars .d {
    height: 100%;
    width: 0;
    transition: width 200ms var(--ease);
  }
  .bars .a { background: var(--add); }
  .bars .d { background: var(--del); }
  .counts {
    font-family: var(--mono);
    font-size: 0.68rem;
    color: var(--muted);
  }
  .counts .a { color: var(--add); }
  .counts .d { color: var(--del); }
  .file-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    border-bottom: 1px solid var(--stroke);
    background: rgba(255, 255, 255, 0.02);
    min-height: 40px;
  }
  .file-tab .tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 6px 6px 0 0;
    background: rgba(var(--accent-rgb), 0.08);
    box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.2);
    color: var(--text);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-tab .tab .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent); flex-shrink: 0;
  }
  .excerpt-wrap {
    font-family: var(--mono);
    font-size: 0.74rem;
    line-height: 1.45;
    padding: 12px 14px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .ln-add { color: #9dffc4; }
  .ln-del { color: #ff9aab; }
  .ln-meta { color: var(--dim); }
  .ln-hunk { color: #5cc8ff; }
  .caret {
    display: inline-block;
    width: 0.55ch;
    margin-left: 1px;
    background: var(--accent);
    animation: blink 1s steps(1) infinite;
    vertical-align: -1px;
    height: 1em;
    transition: background 250ms var(--ease);
  }
  @keyframes blink {
    0%, 50% { opacity: 1; }
    50.01%, 100% { opacity: 0; }
  }
  .log-panel {
    grid-column: 1 / -1;
    max-height: 22vh;
  }
  .log-body {
    font-family: var(--mono);
    font-size: 0.7rem;
    padding: 8px 14px 12px;
    color: var(--muted);
    overflow: auto;
    max-height: calc(22vh - 2.5rem);
  }
  .log-body div { white-space: pre-wrap; word-break: break-all; }
  .log-body .fresh { color: var(--text); }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    .wash.go { animation: none; opacity: 0; }
    .feed-card.enter { animation: none; }
  }
</style>
</head>
<body>
<div class="wash" id="wash"></div>
<div class="shell">
  <header class="bar" id="bar">
    <div class="brand">
      <div class="presence" id="presence" aria-hidden="true">
        <span class="ring"></span>
        <span class="orb"></span>
      </div>
      <div class="brand-text">
        <span class="who">CURSOR</span>
        <span class="unit" id="unitName">WATCH</span>
      </div>
    </div>
    <div class="delivery-hero" id="deliveryHero">
      <div class="ready">DELIVERY READY</div>
      <div class="summary" id="deliverySummary"></div>
    </div>
    <div class="phase" id="phase"><span class="dot"></span><span id="phaseText">WAITING</span></div>
    <div class="conn" id="conn" title="SSE"></div>
    <div class="meta">
      <div class="spark" id="spark" title="Activity (last 2 min)" aria-hidden="true"></div>
      <div class="chip" id="totalsChip"><span class="a">+0</span> / <span class="d">-0</span> · 0 files</div>
      <div class="elapsed">elapsed <strong id="elapsed">0:00</strong></div>
      <button type="button" class="mute-btn" id="muteBtn" title="Toggle delivery chime">CHIME OFF</button>
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
    <section class="panel" id="writePanel">
      <h2>Now writing</h2>
      <div class="file-tab" id="fileTab"><span class="ln-meta">Idle</span></div>
      <div class="panel-body" id="excerptScroll"><div class="excerpt-wrap" id="excerpt"><span class="ln-meta">Idle — watching the lane.</span><span class="caret"></span></div></div>
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
  const phaseText = document.getElementById('phaseText');
  const barEl = document.getElementById('bar');
  const unitEl = document.getElementById('unitName');
  const elapsedEl = document.getElementById('elapsed');
  const feedEl = document.getElementById('feed');
  const statsEl = document.getElementById('stats');
  const excerptEl = document.getElementById('excerpt');
  const excerptScroll = document.getElementById('excerptScroll');
  const fileTab = document.getElementById('fileTab');
  const logPanel = document.getElementById('logPanel');
  const logBody = document.getElementById('logBody');
  const connEl = document.getElementById('conn');
  const sparkEl = document.getElementById('spark');
  const totalsChip = document.getElementById('totalsChip');
  const washEl = document.getElementById('wash');
  const muteBtn = document.getElementById('muteBtn');
  const deliverySummary = document.getElementById('deliverySummary');
  const faviconEl = document.getElementById('favicon');
  const root = document.documentElement;

  const LS_MUTE = 'cursor-watch-chime-muted';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  const SPARK_BARS = 24;
  const SPARK_WINDOW_MS = 120000;

  let phase = 'WAITING';
  let branch = '';
  let unitName = 'WATCH';
  let firstActivityAt = null;
  let deliveryAt = null;
  let clockSkew = 0;
  let revealTimer = null;
  let revealTarget = '';
  let revealPos = 0;
  let files = [];
  /** @type {number[]} */
  let eventTimes = [];
  /** @type {Map<string, number>} */
  const lastTouched = new Map();
  let sweepPlayed = false;
  let userInteracted = false;
  let chimeMuted = true;
  try {
    chimeMuted = localStorage.getItem(LS_MUTE) !== '0';
  } catch (e) { chimeMuted = true; }
  let audioCtx = null;

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

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseUnit(b) {
    if (!b || b === '(unknown)' || b === '(no-git)') return 'WATCH';
    if (b.indexOf('cursor/') === 0) return b.slice(7) || 'WATCH';
    return b;
  }

  function fileParts(p) {
    if (!p) return { dir: '', base: '' };
    const parts = p.split('/');
    const base = parts.pop();
    return { dir: parts.join('/'), base: base };
  }

  function fileLabel(p) {
    const parts = fileParts(p);
    return (parts.dir ? '<span class="dir">' + esc(parts.dir) + '/</span>' : '') +
      '<span class="base">' + esc(parts.base) + '</span>';
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
  }

  function glyphFor(kind) {
    if (kind === 'add' || kind === 'rename') return '+';
    if (kind === 'unlink') return '×';
    if (kind === 'delivery') return '✓';
    return '✎';
  }

  function updateMuteBtn() {
    muteBtn.textContent = chimeMuted ? 'CHIME OFF' : 'CHIME ON';
  }
  updateMuteBtn();

  muteBtn.addEventListener('click', function () {
    userInteracted = true;
    chimeMuted = !chimeMuted;
    try { localStorage.setItem(LS_MUTE, chimeMuted ? '1' : '0'); } catch (e) {}
    updateMuteBtn();
  });
  document.addEventListener('pointerdown', function () { userInteracted = true; }, { once: false });
  document.addEventListener('keydown', function () { userInteracted = true; }, { once: false });

  function setFavicon(kind) {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 32, 32);
    if (kind === 'delivery') {
      ctx.fillStyle = '#5cc8ff';
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#07090d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(9, 16);
      ctx.lineTo(14, 21);
      ctx.lineTo(23, 11);
      ctx.stroke();
    } else if (kind === 'working') {
      ctx.fillStyle = '#3dff9a';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#6b7a8a';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    faviconEl.href = canvas.toDataURL('image/png');
  }

  function updateTitle() {
    if (phase === 'WORKING') {
      document.title = '● CURSOR WORKING - ' + unitName;
    } else if (phase === 'DELIVERY') {
      document.title = '✓ DELIVERY READY - ' + unitName;
    } else {
      document.title = 'CURSOR WATCH - waiting';
    }
  }

  function playChime() {
    if (chimeMuted || !userInteracted) return;
    if (!reduceMotion.matches) {
      /* still allow chime under reduced motion - audio is not visual */
    }
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach(function (freq, i) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.02 + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35 + i * 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t0 + i * 0.08);
        osc.stop(t0 + 0.4 + i * 0.08);
      });
    } catch (e) { /* ignore */ }
  }

  function triggerSweepOnce() {
    if (sweepPlayed) return;
    sweepPlayed = true;
    if (reduceMotion.matches) {
      washEl.classList.remove('go');
      void washEl.offsetWidth;
      washEl.classList.add('go');
    }
    playChime();
  }

  function setPhase(p) {
    const prev = phase;
    phase = p;
    root.setAttribute('data-phase', p);
    barEl.classList.toggle('delivery-lockup', p === 'DELIVERY');
    if (p === 'WAITING') {
      phaseText.textContent = 'WAITING';
      setFavicon('waiting');
    } else if (p === 'WORKING') {
      phaseText.textContent = 'WORKING';
      setFavicon('working');
    } else {
      phaseText.textContent = 'DELIVERY';
      setFavicon('delivery');
      updateDeliverySummary();
      if (prev !== 'DELIVERY') triggerSweepOnce();
    }
    updateTitle();
  }

  function updateDeliverySummary() {
    const tot = sumFiles(files);
    const el = firstActivityAt
      ? fmtElapsed((deliveryAt || now()) - firstActivityAt)
      : '0:00';
    deliverySummary.innerHTML =
      'elapsed <strong>' + esc(el) + '</strong> · ' +
      '<strong>' + tot.n + '</strong> files · ' +
      '<span class="a">+' + tot.a + '</span> / <span class="d">-' + tot.d + '</span>';
  }

  function sumFiles(list) {
    let a = 0, d = 0, n = (list && list.length) || 0;
    (list || []).forEach(function (f) {
      a += f.additions || 0;
      d += f.deletions || 0;
    });
    return { a: a, d: d, n: n };
  }

  function updateTotalsChip() {
    const tot = sumFiles(files);
    totalsChip.innerHTML =
      '<span class="a">+' + tot.a + '</span> / <span class="d">-' + tot.d + '</span> · ' +
      tot.n + ' file' + (tot.n === 1 ? '' : 's');
    if (phase === 'DELIVERY') updateDeliverySummary();
  }

  function noteEventTs(ts) {
    const t = ts || now();
    eventTimes.push(t);
    const cutoff = now() - SPARK_WINDOW_MS;
    while (eventTimes.length && eventTimes[0] < cutoff) eventTimes.shift();
    updateSparkAndPulse();
  }

  function updateSparkAndPulse() {
    const cutoff = now() - SPARK_WINDOW_MS;
    const bucket = SPARK_WINDOW_MS / SPARK_BARS;
    const counts = new Array(SPARK_BARS).fill(0);
    for (let i = 0; i < eventTimes.length; i++) {
      const t = eventTimes[i];
      if (t < cutoff) continue;
      let idx = Math.floor((t - cutoff) / bucket);
      if (idx < 0) idx = 0;
      if (idx >= SPARK_BARS) idx = SPARK_BARS - 1;
      counts[idx]++;
    }
    const max = Math.max(1, ...counts);
    let html = '';
    for (let i = 0; i < SPARK_BARS; i++) {
      const h = Math.max(2, Math.round((counts[i] / max) * 18));
      html += '<i style="height:' + h + 'px"></i>';
    }
    sparkEl.innerHTML = html;

    const recent = eventTimes.filter(function (t) { return t >= now() - 8000; }).length;
    // Idle ~1800ms pulse; busy down toward ~500ms
    const pulseMs = Math.max(500, 1800 - recent * 180);
    root.style.setProperty('--pulse-ms', pulseMs + 'ms');
  }

  // Seed empty sparkline
  updateSparkAndPulse();

  function tickElapsed() {
    if (!firstActivityAt) {
      elapsedEl.textContent = '0:00';
      return;
    }
    const end = phase === 'DELIVERY' && deliveryAt ? deliveryAt : now();
    elapsedEl.textContent = fmtElapsed(end - firstActivityAt);
  }
  setInterval(tickElapsed, 250);
  setInterval(updateSparkAndPulse, 1000);

  function prependFeed(item, animate) {
    const empty = feedEl.querySelector('.empty');
    if (empty) empty.remove();
    if (item.path) lastTouched.set(item.path, item.ts || now());
    noteEventTs(item.ts);
    const row = document.createElement('div');
    const k = item.kind || 'change';
    row.className = 'feed-card' + (animate && reduceMotion.matches ? ' enter' : '');
    const parts = fileParts(item.path);
    row.innerHTML =
      '<span class="glyph ' + esc(k) + '">' + esc(glyphFor(k)) + '</span>' +
      '<span class="name">' + (parts.base ? esc(parts.base) : esc(item.path || '')) + '</span>' +
      '<span class="ts">' + esc(fmtTime(item.ts)) + '</span>' +
      '<span class="meta-line">' +
        (parts.dir ? esc(parts.dir) + ' · ' : '') + esc(k) +
      '</span>';
    feedEl.insertBefore(row, feedEl.firstChild);
    if (animate && reduceMotion.matches) {
      setTimeout(function () { row.classList.remove('enter'); }, 220);
    }
    while (feedEl.children.length > 80) {
      feedEl.removeChild(feedEl.lastChild);
    }
    if (files.length) renderStats(files);
  }

  function renderStats(list) {
    files = list || [];
    updateTotalsChip();
    if (!files.length) {
      statsEl.innerHTML = '<div class="empty">No uncommitted changes yet.</div>';
      return;
    }
    const sorted = files.slice().sort(function (a, b) {
      const ta = lastTouched.get(a.path) || 0;
      const tb = lastTouched.get(b.path) || 0;
      if (tb !== ta) return tb - ta;
      return a.path.localeCompare(b.path);
    });
    const max = Math.max(
      1,
      ...sorted.map(function (f) { return (f.additions || 0) + (f.deletions || 0); })
    );
    const tot = sumFiles(files);
    let html = '<div class="stat-totals"><span>Totals</span><span>' +
      '<span class="a">+' + tot.a + '</span> / <span class="d">-' + tot.d + '</span> · ' +
      tot.n + ' files</span></div>';
    html += sorted.map(function (f) {
      const a = f.additions || 0;
      const d = f.deletions || 0;
      const totLines = a + d;
      const aw = totLines ? (a / max) * 100 : 0;
      const dw = totLines ? (d / max) * 100 : 0;
      return '<div class="stat-row">' +
        '<div class="name">' + fileLabel(f.path) + '</div>' +
        '<div class="bars"><div class="a" data-w="' + aw + '"></div>' +
        '<div class="d" data-w="' + dw + '"></div></div>' +
        '<div class="counts"><span class="a">+' + a + '</span> / <span class="d">-' + d + '</span>' +
        (f.untracked ? ' · untracked' : '') + '</div></div>';
    }).join('');
    statsEl.innerHTML = html;
    requestAnimationFrame(function () {
      statsEl.querySelectorAll('.bars .a, .bars .d').forEach(function (el) {
        el.style.width = (el.getAttribute('data-w') || '0') + '%';
      });
    });
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

  function scrollToCaret() {
    excerptScroll.scrollTop = excerptScroll.scrollHeight;
  }

  function startReveal(text) {
    revealTarget = text || '';
    revealPos = 0;
    if (revealTimer) clearInterval(revealTimer);
    if (!revealTarget) {
      excerptEl.innerHTML = '<span class="ln-meta">No diff yet for this file.</span><span class="caret"></span>';
      return;
    }
    if (!reduceMotion.matches) {
      excerptEl.innerHTML = colorizeDiff(revealTarget) + '<span class="caret"></span>';
      scrollToCaret();
      return;
    }
    const chunk = Math.max(8, Math.floor(revealTarget.length / 60));
    revealTimer = setInterval(function () {
      revealPos = Math.min(revealTarget.length, revealPos + chunk);
      const slice = revealTarget.slice(0, revealPos);
      excerptEl.innerHTML = colorizeDiff(slice) + '<span class="caret"></span>';
      scrollToCaret();
      if (revealPos >= revealTarget.length) {
        clearInterval(revealTimer);
        revealTimer = null;
      }
    }, 28);
  }

  function applyExcerpt(excerpt) {
    if (!excerpt || !excerpt.path) {
      fileTab.innerHTML = '<span class="ln-meta">Idle</span>';
      excerptEl.innerHTML = '<span class="ln-meta">Idle — watching the lane.</span><span class="caret"></span>';
      return;
    }
    const parts = fileParts(excerpt.path);
    fileTab.innerHTML = '<span class="tab"><span class="dot"></span>' +
      esc(parts.base || excerpt.path) +
      (excerpt.kind ? ' · ' + esc(excerpt.kind) : '') + '</span>';
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

  function setBranch(b) {
    branch = b || '';
    unitName = parseUnit(branch);
    unitEl.textContent = unitName;
    updateTitle();
  }

  function applySnapshot(s) {
    if (s.serverNow) clockSkew = s.serverNow - Date.now();
    setBranch(s.branch);
    firstActivityAt = s.firstActivityAt;
    deliveryAt = s.deliveryAt;
    if (s.phase === 'DELIVERY') sweepPlayed = true; // mid-attach: no sweep replay
    setPhase(s.phase || 'WAITING');
    tickElapsed();
    feedEl.innerHTML = '';
    eventTimes = [];
    lastTouched.clear();
    if (s.activity && s.activity.length) {
      for (let i = s.activity.length - 1; i >= 0; i--) {
        prependFeed(s.activity[i], false);
      }
    } else {
      feedEl.innerHTML = '<div class="empty">Waiting for file events…</div>';
      updateSparkAndPulse();
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
      if (ev.branch) setBranch(ev.branch);
      renderStats(ev.files || []);
      if (ev.firstActivityAt) firstActivityAt = ev.firstActivityAt;
      if (ev.deliveryAt) deliveryAt = ev.deliveryAt;
      if (ev.phase) setPhase(ev.phase);
      return;
    }
    if (ev.type === 'state') {
      if (ev.branch) setBranch(ev.branch);
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
  root.setAttribute('data-phase', 'WAITING');
  setFavicon('waiting');
  updateTitle();
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
  const url = `http://127.0.0.1:${args.port}`;

  if (args.openOnActivity) {
    state.autoOpen = createAutoOpenController({
      openOnActivity: true,
      openCmd: args.openCmd,
      url,
    });
  }

  if (args.notify) {
    state.notify = createNotifyController({
      notify: true,
      notifyCmd: args.notifyCmd,
    });
  }

  startFileWatch(state);
  startGitPoll(state);
  startLogTail(state);

  console.log(`cursor-watch: watching ${lane}`);
  if (logPath) console.log(`cursor-watch: tailing log ${logPath}`);
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
