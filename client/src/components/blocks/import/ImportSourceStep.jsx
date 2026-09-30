import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/http.js";
import {
  coachBlockDraft,
  coachErrorMessage,
  getCoachStatus,
} from "../../../api/coachApi.js";
import { loadCoachKey } from "../../../lib/coachKeyPref.js";
import { Disclosure } from "../ui/Disclosure.jsx";
import { Segmented } from "../ui/Segmented.jsx";
import { Stepper } from "../ui/Stepper.jsx";
import * as blockTemplateApi from "../../../api/blockTemplateApi.js";

const SOURCE_OPTIONS = [
  { value: "paste", label: "Paste" },
  { value: "file", label: "File" },
  { value: "oldapp", label: "Old app" },
  { value: "ai", label: "Any AI" },
];

const APP_OPTIONS = [
  { value: "strong", label: "Strong" },
  { value: "hevy", label: "Hevy" },
];

const UNIT_OPTIONS = [
  { value: "lb", label: "lb" },
  { value: "kg", label: "kg" },
];

const COLUMN_HEADERS = [
  "Week",
  "Day",
  "Exercise",
  "Sets",
  "Reps",
  "Load",
  "RPE or RIR",
  "Rest",
  "Notes",
];

const EXAMPLE_ROWS = [
  "1\tUpper A\tBench Press\t3\t8\t185\t7\t2:00\t",
  "1\tUpper A\tBarbell Row\t3\t8-10\t135\t\t90\t",
  "1\tLower A\tBack Squat\t4\t5\t225\t8\t3:00\tPause",
];

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatNextQuestionTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${weekday} at ${time}`;
}

function weeklyCapUsedCopy(weeklyCap) {
  if (!weeklyCap || weeklyCap.remaining > 0) return null;
  const when = formatNextQuestionTime(weeklyCap.nextAvailableAt);
  if (when) return `You've used this week's questions. Your next question frees up ${when}.`;
  return "You've used this week's questions.";
}

/**
 * Step 1 — pick a source and supply text / a file.
 */
export function ImportSourceStep({
  source,
  onSourceChange,
  text,
  onTextChange,
  oldApp,
  onOldAppChange,
  historyWeeks,
  onHistoryWeeksChange,
  sourceUnit,
  onSourceUnitChange,
  deviceUnit,
  fileError,
  onFileError,
  onPreview,
  previewing,
}) {
  const [copied, setCopied] = useState(false);
  const [formatLoading, setFormatLoading] = useState(false);
  const [coachStatus, setCoachStatus] = useState(null);
  const [coachConverting, setCoachConverting] = useState(false);
  const [coachError, setCoachError] = useState(null);
  const pendingCoachJsonRef = useRef(null);
  const empty = !String(text || "").trim();
  const coachSources = source === "paste" || source === "ai";
  const byoKey = loadCoachKey();

  useEffect(() => {
    if (!copied) return undefined;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  // Load coach status only on Paste / Any AI - entry stays hidden when unavailable.
  useEffect(() => {
    if (!coachSources) {
      setCoachStatus(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoachStatus({ byoKey });
        if (!cancelled) setCoachStatus(data);
      } catch {
        if (!cancelled) setCoachStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coachSources, byoKey]);

  // After coach convert updates parent text, run the same Preview path as paste.
  useEffect(() => {
    const pending = pendingCoachJsonRef.current;
    if (!pending) return;
    if (String(text || "") !== pending) return;
    pendingCoachJsonRef.current = null;
    onPreview?.();
  }, [text, onPreview]);

  function readFile(file) {
    onFileError?.(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      onFileError?.("That file is larger than 2 MB. Split it or paste the cells instead.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      onTextChange?.(result);
    };
    reader.onerror = () => {
      onFileError?.("Couldn't read that file. Try again or paste the contents.");
    };
    reader.readAsText(file);
  }

  async function copyInstructions() {
    setFormatLoading(true);
    try {
      const data = await blockTemplateApi.getBlockFormat();
      const instructions =
        data && typeof data.instructions === "string" ? data.instructions : "";
      if (!instructions) {
        onFileError?.("Couldn't load the instructions. Try again.");
        return;
      }
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
    } catch {
      onFileError?.("Couldn't load the instructions. Try again.");
    } finally {
      setFormatLoading(false);
    }
  }

  async function onCoachConvert() {
    const trimmed = String(text || "").trim();
    if (!trimmed || coachConverting || previewing) return;
    setCoachError(null);
    onFileError?.(null);
    const weeklyCap = coachStatus?.weeklyCap;
    if (weeklyCap && weeklyCap.remaining <= 0) {
      setCoachError(weeklyCapUsedCopy(weeklyCap));
      return;
    }
    setCoachConverting(true);
    try {
      const unit = sourceUnit || deviceUnit || "lb";
      const data = await coachBlockDraft({
        mode: "convert",
        text: trimmed,
        unit,
        byoKey,
      });
      const json = JSON.stringify(data.block, null, 2);
      pendingCoachJsonRef.current = json;
      onTextChange?.(json);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body || {};
        const code = body.reason || body.error || "provider_error";
        if (code === "weekly_limit") {
          setCoachStatus((prev) => ({
            ...(prev || {}),
            weeklyCap: {
              limit: body.limit ?? prev?.weeklyCap?.limit ?? null,
              used: body.used ?? prev?.weeklyCap?.used ?? null,
              remaining: 0,
              nextAvailableAt: body.nextAvailableAt ?? prev?.weeklyCap?.nextAvailableAt ?? null,
            },
          }));
          setCoachError(weeklyCapUsedCopy({ remaining: 0, nextAvailableAt: body.nextAvailableAt }));
        } else {
          setCoachError(coachErrorMessage(code, err.message));
        }
      } else {
        setCoachError(coachErrorMessage("network"));
      }
    } finally {
      setCoachConverting(false);
    }
  }

  const coachAvailable = Boolean(coachStatus?.available);
  const coachCapped = Boolean(
    coachStatus?.weeklyCap && coachStatus.weeklyCap.remaining <= 0
  );
  const cappedCopy = weeklyCapUsedCopy(coachStatus?.weeklyCap);

  return (
    <div className="bk-import-source">
      <Segmented
        label="Import source"
        options={SOURCE_OPTIONS}
        value={source}
        onChange={onSourceChange}
      />

      {source === "paste" ? (
        <div className="bk-import-panel">
          <label className="bk-import-label" htmlFor="bk-import-paste">
            Paste cells from Excel, Google Sheets or Numbers. Include the header row.
          </label>
          <textarea
            id="bk-import-paste"
            className="bk-import-textarea"
            value={text}
            onChange={(e) => onTextChange?.(e.target.value)}
            rows={12}
            spellCheck={false}
            placeholder={"Week\tDay\tExercise\tSets\tReps\tLoad\n1\tUpper A\tBench Press\t3\t8\t185"}
          />
          <Disclosure summary="What columns work?">
            <p className="bk-import-hint">
              Main headers: {COLUMN_HEADERS.join(", ")}.
            </p>
            <pre className="bk-import-examples">{EXAMPLE_ROWS.join("\n")}</pre>
          </Disclosure>
        </div>
      ) : null}

      {source === "file" ? (
        <div className="bk-import-panel">
          <label className="bk-import-label" htmlFor="bk-import-file">
            Choose a .csv, .tsv, .txt or .json file (max 2 MB).
          </label>
          <input
            id="bk-import-file"
            className="bk-import-file"
            type="file"
            accept=".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              readFile(file);
            }}
          />
          {text ? (
            <p className="bk-import-hint">
              Loaded {text.length.toLocaleString()} characters. Ready to preview.
            </p>
          ) : null}
        </div>
      ) : null}

      {source === "oldapp" ? (
        <div className="bk-import-panel">
          <Segmented
            label="Old app"
            options={APP_OPTIONS}
            value={oldApp}
            onChange={onOldAppChange}
          />
          {oldApp === "strong" ? (
            <p className="bk-import-howto">
              Strong: Settings → Export Strong Data.
            </p>
          ) : (
            <p className="bk-import-howto">
              Hevy: Profile → Settings → Export &amp; Import Data → Export Workouts.
            </p>
          )}
          <label className="bk-import-label" htmlFor="bk-import-history-file">
            Choose the export file
          </label>
          <input
            id="bk-import-history-file"
            className="bk-import-file"
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              readFile(file);
            }}
          />
          <div className="bk-import-field-row">
            <span className="bk-import-label">Weeks to build</span>
            <Stepper
              label="Weeks to build"
              value={historyWeeks}
              min={1}
              max={12}
              onChange={onHistoryWeeksChange}
            />
          </div>
          {oldApp === "strong" ? (
            <div className="bk-import-field-row">
              <span className="bk-import-label">Unit you logged in</span>
              <Segmented
                label="Unit you logged in"
                options={UNIT_OPTIONS}
                value={sourceUnit || deviceUnit}
                onChange={onSourceUnitChange}
              />
            </div>
          ) : null}
          <p className="bk-import-hint">
            We rebuild your recent workouts as one week, repeated - then you shape the
            progression.
          </p>
        </div>
      ) : null}

      {source === "ai" ? (
        <div className="bk-import-panel">
          <ol className="bk-import-steps">
            <li>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void copyInstructions()}
                disabled={formatLoading}
              >
                {copied ? "Copied" : "Copy the instructions"}
              </button>
            </li>
            <li>
              Paste them into ChatGPT, Gemini, Claude or any AI, with your program or a
              description of what you want.
            </li>
            <li>
              <label className="bk-import-label" htmlFor="bk-import-ai">
                Paste the AI&apos;s answer here
              </label>
              <textarea
                id="bk-import-ai"
                className="bk-import-textarea"
                value={text}
                onChange={(e) => onTextChange?.(e.target.value)}
                rows={12}
                spellCheck={false}
                placeholder='{ "format": "logchamp.block", … }'
              />
            </li>
          </ol>
          <p className="bk-import-hint">
            The AI&apos;s answer is checked the same way as any import - you review
            everything before it&apos;s saved.
          </p>
        </div>
      ) : null}

      {fileError ? <p className="bk-import-inline-error" role="alert">{fileError}</p> : null}
      {coachError ? <p className="bk-import-inline-error" role="alert">{coachError}</p> : null}

      <div className="bk-import-actions">
        <button
          type="button"
          className="btn"
          disabled={empty || previewing || coachConverting}
          onClick={onPreview}
        >
          {previewing ? "Previewing…" : "Preview"}
        </button>
        {coachSources && coachAvailable ? (
          coachCapped ? (
            <p className="bk-import-hint" role="status">
              {cappedCopy}
            </p>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={empty || previewing || coachConverting}
              onClick={() => void onCoachConvert()}
            >
              {coachConverting ? "Converting…" : "Let the coach convert it"}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
