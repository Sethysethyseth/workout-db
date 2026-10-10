param(
  [Parameter(Mandatory)] [string] $Lane,     # cursor-lane | cursor-lane-2 | cursor-lane-3
  [Parameter(Mandatory)] [string] $Unit,     # task file name under docs/tasks, without .md
  [string] $Model = 'auto',                  # ALWAYS explicit - the CLI remembers the last model
  [int] $TimeoutMin = 40,
  [string] $LogDir = $env:TEMP,
  [string] $Resume = ''                      # chat/session id to continue (stream log's session_id)
)
# Headless Cursor run for the dispatch-unit skill (Channel B), with its OWN
# hard kill. Run it as a background task from Claude Code:
#   pwsh -File scripts/run-lane.ps1 -Lane cursor-lane -Unit <unit> -Model auto
# The lane must already be on the right branch (git checkout -B ...).
#
# Why this shape (Oct 7, 2026):
# - stream-json output goes to a FILE, so a stall before the model's first
#   event is visible in minutes, not at the kill.
# - Output is redirected by Start-Process, never through PowerShell event
#   callbacks: those run on pool threads with no runspace and crash the
#   runner, orphaning the agent.
# - The CLI can hang AFTER writing DELIVERY.md (print mode never exits).
#   Watch for the report file and, once it lands, kill THIS run's PID tree
#   (printed below) - never kill Cursor processes by name or pattern.
$ErrorActionPreference = 'Stop'
$wt = "C:\dev\worktrees\$Lane"
$log = Join-Path $LogDir "$Unit.stream.log"
$err = Join-Path $LogDir "$Unit.stderr.log"
$prompt = "Read docs/tasks/$Unit.md and execute it exactly. It is the complete task; do not ask for the task in chat. Write the delivery report to DELIVERY.md in this directory and make NO git operations."
# The key lives in the User registry; $env: can be stale in an agent shell.
$env:CURSOR_API_KEY = [Environment]::GetEnvironmentVariable('CURSOR_API_KEY', 'User')
$cli = 'C:\Users\Sethy\AppData\Local\cursor-agent\cursor-agent.ps1'
$argLine = "-NoProfile -File `"$cli`" -p `"$prompt`" --force --model $Model --output-format stream-json"
# A resumed run keeps the earlier chat's recon in context (cheaper than a cold start).
if ($Resume) { $argLine += " --resume $Resume" }

$p = Start-Process -FilePath (Get-Command pwsh).Source -ArgumentList $argLine `
  -WorkingDirectory $wt -RedirectStandardOutput $log -RedirectStandardError $err `
  -NoNewWindow -PassThru
"started pid=$($p.Id) unit=$Unit lane=$Lane model=$Model log=$log at $(Get-Date -Format o)"
if (-not $p.WaitForExit($TimeoutMin * 60 * 1000)) {
  "TIMEOUT after $TimeoutMin min - killing tree pid=$($p.Id)"
  taskkill /PID $p.Id /T /F | Out-Null
} else {
  "exit code $($p.ExitCode) at $(Get-Date -Format o)"
}
$d = Join-Path $wt 'DELIVERY.md'
if (Test-Path $d) { "DELIVERY.md $((Get-Item $d).LastWriteTime.ToString('o'))" } else { 'NO DELIVERY.md' }
