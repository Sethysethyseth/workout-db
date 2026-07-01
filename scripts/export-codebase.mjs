import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function isProbablyBinary(buf) {
  // Heuristic: if the buffer contains a NUL byte, treat as binary.
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function normalizeRel(p) {
  return p.replaceAll("\\", "/");
}

function shouldExcludeFromDump(relPath) {
  const rp = normalizeRel(relPath);

  // Never export real env files (secrets). Keep examples.
  if (
    /(^|\/)\.env($|\/)/.test(rp) ||
    /(^|\/)\.env\./.test(rp)
  ) {
    return !rp.endsWith(".env.example");
  }

  // Keep the export folder out of itself if re-run.
  if (rp.startsWith("ai-export/")) return true;

  // Avoid massive/irrelevant local artifacts if they ever get tracked.
  if (rp.includes("/node_modules/")) return true;
  if (rp.includes("/dist/") || rp.includes("/build/") || rp.includes("/coverage/"))
    return true;

  return false;
}

function collectGitTrackedFiles(repoRoot) {
  const out = execSync("git ls-files -z", {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return out
    .toString("utf8")
    .split("\0")
    .map((s) => s.trim())
    .filter(Boolean);
}

function collectUntrackedNotIgnored(repoRoot) {
  // -uall includes untracked. Exclude ignored.
  const raw = sh('git status --porcelain=v1 -uall --ignored=no');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const out = [];
  for (const line of lines) {
    // Format: "?? path"
    if (!line.startsWith("?? ")) continue;
    out.push(line.slice(3));
  }
  return out;
}

function toTreeLines(filePaths) {
  const dirs = new Set();
  for (const fp of filePaths) {
    const parts = normalizeRel(fp).split("/");
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join("/"));
    }
  }

  const entries = [
    ...Array.from(dirs).map((d) => ({ type: "dir", p: d })),
    ...filePaths.map((f) => ({ type: "file", p: normalizeRel(f) })),
  ].sort((a, b) => a.p.localeCompare(b.p));

  const lines = [];
  for (const e of entries) {
    const depth = e.p.split("/").length - 1;
    const indent = "  ".repeat(depth);
    const name = e.p.split("/").at(-1);
    lines.push(`${indent}${e.type === "dir" ? "[D]" : "[F]"} ${name}`);
  }
  return lines.join("\n") + "\n";
}

function scanEnvVars(text) {
  const vars = new Set();

  // process.env.FOO
  for (const m of text.matchAll(/\bprocess\.env\.([A-Z0-9_]+)\b/g)) {
    vars.add(m[1]);
  }

  // import.meta.env.VITE_FOO
  for (const m of text.matchAll(/\bimport\.meta\.env\.([A-Z0-9_]+)\b/g)) {
    vars.add(m[1]);
  }

  // prisma env("FOO")
  for (const m of text.matchAll(/\benv\(\"([A-Z0-9_]+)\"\)/g)) {
    vars.add(m[1]);
  }

  return vars;
}

function readJsonIfExists(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function hashFile(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function main() {
  const repoRoot = sh("git rev-parse --show-toplevel").trim();
  const exportDir = path.join(repoRoot, "ai-export");
  ensureDir(exportDir);

  const tracked = collectGitTrackedFiles(repoRoot);
  const untracked = collectUntrackedNotIgnored(repoRoot);
  const allCandidates = Array.from(new Set([...tracked, ...untracked]));

  const included = allCandidates.filter((p) => !shouldExcludeFromDump(p));

  // STRUCTURE.txt (based on included paths)
  fs.writeFileSync(
    path.join(exportDir, "STRUCTURE.txt"),
    toTreeLines(included),
    "utf8"
  );

  // Gather dependencies from known package.json files (root may not have one).
  const clientPkg = readJsonIfExists(path.join(repoRoot, "client", "package.json"));
  const serverPkg = readJsonIfExists(path.join(repoRoot, "server", "package.json"));
  const dependencies = {
    client: clientPkg
      ? {
          name: clientPkg.name,
          version: clientPkg.version,
          dependencies: clientPkg.dependencies ?? {},
          devDependencies: clientPkg.devDependencies ?? {},
        }
      : null,
    server: serverPkg
      ? {
          name: serverPkg.name,
          version: serverPkg.version,
          dependencies: serverPkg.dependencies ?? {},
          devDependencies: serverPkg.devDependencies ?? {},
        }
      : null,
  };

  const envVars = new Set();
  const fileIndex = [];

  // CODEBASE_DUMP.txt: full contents for every included *text* file.
  const dumpPath = path.join(exportDir, "CODEBASE_DUMP.txt");
  const dumpStream = fs.createWriteStream(dumpPath, { encoding: "utf8" });

  dumpStream.write(
    [
      "WORKOUT-DB EXPORT",
      `Generated: ${new Date().toISOString()}`,
      `Repo root: ${repoRoot}`,
      "",
      "NOTE: Real .env files are intentionally excluded to avoid leaking secrets.",
      "",
    ].join("\n") + "\n"
  );

  for (const rel of included) {
    const abs = path.join(repoRoot, rel);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;

    const buf = fs.readFileSync(abs);
    const binary = isProbablyBinary(buf);
    const size = buf.length;
    const sha256 = hashFile(buf);

    fileIndex.push({
      path: normalizeRel(rel),
      size,
      sha256,
      binary,
    });

    dumpStream.write("\n" + "=".repeat(88) + "\n");
    dumpStream.write(`FILE: ${abs}\n`);
    dumpStream.write(`RELATIVE: ${normalizeRel(rel)}\n`);
    dumpStream.write(`SIZE: ${size}\n`);
    dumpStream.write(`SHA256: ${sha256}\n`);
    dumpStream.write(`BINARY: ${binary}\n`);
    dumpStream.write("CONTENT:\n");

    if (binary) {
      dumpStream.write("[[binary file omitted from inline dump]]\n");
      continue;
    }

    const text = buf.toString("utf8");
    for (const v of scanEnvVars(text)) envVars.add(v);
    dumpStream.write(text);
    if (!text.endsWith("\n")) dumpStream.write("\n");
  }

  dumpStream.end();

  // Add env vars from .env.example files too (names-only).
  for (const rel of included) {
    if (!normalizeRel(rel).endsWith(".env.example")) continue;
    const abs = path.join(repoRoot, rel);
    const text = fs.readFileSync(abs, "utf8");
    for (const m of text.matchAll(/^\s*([A-Z0-9_]+)\s*=/gm)) {
      envVars.add(m[1]);
    }
  }

  const envVarList = Array.from(envVars).sort();
  fs.writeFileSync(
    path.join(exportDir, "ENV_VARS.txt"),
    envVarList.join("\n") + "\n",
    "utf8"
  );

  // Migrations / schema index (paths only; content is in CODEBASE_DUMP.txt).
  const migrationPaths = included
    .map(normalizeRel)
    .filter((p) => p.startsWith("server/prisma/migrations/"));
  const schemaPaths = included
    .map(normalizeRel)
    .filter((p) => p === "server/prisma/schema.prisma" || p.endsWith(".sql"));

  fs.writeFileSync(
    path.join(exportDir, "DB_FILES.txt"),
    [
      "Prisma schema / DB files (content included in CODEBASE_DUMP.txt):",
      "",
      ...schemaPaths,
      "",
      "Prisma migrations:",
      "",
      ...migrationPaths,
      "",
    ].join("\n"),
    "utf8"
  );

  // Basic "how to run" doc (derived from README + scripts).
  const runMd = [
    "# How to run locally",
    "",
    "## Prereqs",
    "- Node.js (current LTS recommended)",
    "- Postgres database (local Docker or installed locally)",
    "",
    "## Server",
    "```bash",
    "cd server",
    "npm install",
    "copy .env.example .env   # Windows PowerShell: Copy-Item .env.example .env",
    "npm run prisma:generate",
    "npm run prisma:migrate",
    "npm run dev",
    "```",
    "",
    "## Client",
    "```bash",
    "cd client",
    "npm install",
    "npm run dev",
    "```",
    "",
    "By default, the client uses `http://localhost:3000` in dev.",
    "",
    "## Tests (server)",
    "```bash",
    "cd server",
    "npm test",
    "```",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(exportDir, "RUN.md"), runMd, "utf8");

  // Report
  const report = {
    generatedAt: new Date().toISOString(),
    repoRoot,
    includedFileCount: included.length,
    includedFiles: included.map(normalizeRel).sort(),
    excludedNotes: [
      "Real .env files excluded (secrets). Use *.env.example and ENV_VARS.txt.",
      "ai-export folder excluded from itself.",
      "Binary files are indexed but not inlined in CODEBASE_DUMP.txt.",
    ],
    envVarNames: envVarList,
    dependencies,
    gitignoredNotes: [
      "See .gitignore files in repo for full patterns.",
      "Common ignored: node_modules/, dist/, build/, coverage/, .env, .cursor/.",
    ],
    dbFiles: {
      schemaPaths,
      migrationPaths,
    },
    fileIndex,
  };

  fs.writeFileSync(
    path.join(exportDir, "REPORT.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  // Convenience: list ignored patterns and currently untracked files.
  fs.writeFileSync(
    path.join(exportDir, "UNTRACKED_FILES.txt"),
    (untracked.map(normalizeRel).sort().join("\n") + "\n") || "\n",
    "utf8"
  );

  const ignoreFiles = [
    path.join(repoRoot, ".gitignore"),
    path.join(repoRoot, "client", ".gitignore"),
    path.join(repoRoot, "server", ".gitignore"),
  ].filter((p) => fs.existsSync(p));

  const ignoreDump = [];
  for (const ig of ignoreFiles) {
    ignoreDump.push("=".repeat(88));
    ignoreDump.push(`FILE: ${ig}`);
    ignoreDump.push("CONTENT:");
    ignoreDump.push(fs.readFileSync(ig, "utf8"));
    if (!ignoreDump.at(-1)?.endsWith("\n")) ignoreDump.push("\n");
  }
  fs.writeFileSync(
    path.join(exportDir, "GITIGNORE_RULES.txt"),
    ignoreDump.join("\n"),
    "utf8"
  );

  process.stdout.write(
    `Export complete: ${exportDir}\n- Files in dump: ${included.length}\n`
  );
}

main();

