import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/http.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import {
  AI_CALL_TIMEOUT_MS,
  AI_TIMEOUT_MESSAGE,
  coachErrorMessage,
  coachImportFix,
  getCoachStatus,
} from "../api/coachApi.js";
import { loadCoachKey } from "../lib/coachKeyPref.js";
import { loadWeightUnit } from "../lib/weightUnitPref.js";
import { AiWait, AiWaitButtonLabel } from "../components/coach/AiWait.jsx";
import { StickyHeader } from "../components/blocks/ui/StickyHeader.jsx";
import {
  AiFileFixOffer,
  ImportErrorCard,
  ImportPreviewStep,
  ImportSourceStep,
  formatImportToast,
} from "../components/blocks/import/index.js";
import { deviceUnitToFormat } from "../components/blocks/builder/blockBuilderState.js";
import "../styles/blocks/bk-import.css";

const IMPORT_FIX_VERB = "Fixing your file...";

function kindForSource(source) {
  if (source === "oldapp") return "history";
  if (source === "ai") return "json";
  return "auto";
}

function collectImportProblems(errors, warnings) {
  const out = [];
  const push = (item) => {
    const msg =
      item && item.message != null
        ? String(item.message)
        : item != null
          ? String(item)
          : "";
    const trimmed = msg.trim();
    if (!trimmed) return;
    const row = item && item.row != null ? `Row ${item.row}: ` : "";
    out.push(`${row}${trimmed}`);
  };
  if (Array.isArray(errors)) {
    for (const e of errors) {
      push(e);
      if (out.length >= 20) return out;
    }
  }
  if (Array.isArray(warnings)) {
    for (const w of warnings) {
      push(w);
      if (out.length >= 20) return out;
    }
  }
  return out;
}

function pickBlockName(serverName, importFileName) {
  const name = serverName != null ? String(serverName).trim() : "";
  if (name && name !== "Imported block") return name;
  if (importFileName) return importFileName;
  return name;
}

/**
 * Import a block - paste, file, old app, or any AI (BK6 / bks1 / bkr3).
 * Route: /blocks/import
 */
export function ImportBlockPage() {
  const navigate = useNavigate();
  const devicePref = loadWeightUnit();
  const deviceUnit = deviceUnitToFormat(devicePref);

  const [step, setStep] = useState(1);
  const [source, setSource] = useState("paste");
  const [text, setText] = useState("");
  const [oldApp, setOldApp] = useState("strong");
  const [historyWeeks, setHistoryWeeks] = useState(4);
  const [sourceUnit, setSourceUnit] = useState(deviceUnit);
  const [includeWarmups, setIncludeWarmups] = useState(true);
  const [fileError, setFileError] = useState(null);
  const [importFileName, setImportFileName] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [renames, setRenames] = useState({});
  const [blockName, setBlockName] = useState("");
  const [errors, setErrors] = useState(null);
  const [submittedForErrors, setSubmittedForErrors] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  // Recipe is only valid for the exact text it was computed from, and only
  // while the user stays on the preview that recipe produced.
  const [recipe, setRecipe] = useState(null);
  const [recipeSourceText, setRecipeSourceText] = useState(null);
  const [fixingFile, setFixingFile] = useState(false);
  const [aiFixCost, setAiFixCost] = useState(null);
  const [coachStatus, setCoachStatus] = useState(null);
  const aliveRef = useRef(true);
  const abortRef = useRef(null);
  // Deterministic preview / error card kept after a successful AI read (undo).
  const [priorPreview, setPriorPreview] = useState(null);
  const [priorErrors, setPriorErrors] = useState(null);
  const [priorSubmittedForErrors, setPriorSubmittedForErrors] = useState(null);
  const [aiReadCompare, setAiReadCompare] = useState(null);

  const delimitedSource = source === "paste" || source === "file";
  const byoKey = loadCoachKey();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Coach status for the AI-fix consent gate.
  useEffect(() => {
    if (!delimitedSource) {
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
  }, [delimitedSource, byoKey]);

  const clearAiReadSnapshot = useCallback(() => {
    setPriorPreview(null);
    setPriorErrors(null);
    setPriorSubmittedForErrors(null);
    setAiReadCompare(null);
  }, []);

  const clearRecipe = useCallback(() => {
    setRecipe(null);
    setRecipeSourceText(null);
  }, []);

  /** Drop AI layout memory - any return to source / text change / re-paste / file. */
  const invalidateAiLayout = useCallback(() => {
    clearRecipe();
    clearAiReadSnapshot();
    setAiFixCost(null);
  }, [clearRecipe, clearAiReadSnapshot]);

  const buildOptions = useCallback(
    (warmupOverride, recipeOverride) => {
      const options = {
        unit: deviceUnit,
        skipWarmups: !(warmupOverride ?? includeWarmups),
      };
      if (source === "oldapp") {
        options.historyWeeks = historyWeeks;
        if (oldApp === "strong") {
          options.sourceUnit = sourceUnit || deviceUnit;
        }
      }
      if (source === "file" && importFileName) {
        options.name = importFileName;
      }
      let activeRecipe;
      if (recipeOverride !== undefined) {
        activeRecipe = recipeOverride;
      } else if (recipe && recipeSourceText === text) {
        activeRecipe = recipe;
      } else {
        activeRecipe = null;
      }
      if (activeRecipe) options.recipe = activeRecipe;
      return options;
    },
    [
      deviceUnit,
      includeWarmups,
      source,
      historyWeeks,
      oldApp,
      sourceUnit,
      importFileName,
      recipe,
      recipeSourceText,
      text,
    ]
  );

  const runPreview = useCallback(
    async (warmupOverride, recipeOverride, textOverride) => {
      setFileError(null);
      setNetworkError(null);
      setErrors(null);
      setSubmittedForErrors(null);
      setPreviewing(true);
      const previewText = textOverride != null ? textOverride : text;
      try {
        const body = {
          text: previewText,
          kind: kindForSource(source),
          options: buildOptions(warmupOverride, recipeOverride),
        };
        // Converted JSON from AI fix should parse as json even on paste/file.
        if (
          textOverride != null &&
          String(previewText).trim().startsWith("{")
        ) {
          body.kind = "json";
        }
        const data = await blockTemplateApi.previewBlockImport(body);
        setPreview(data);
        setRenames({});
        setBlockName(
          pickBlockName(data?.block?.name, source === "file" ? importFileName : null)
        );
        setStep(2);
        return data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          const body = err.body || {};
          setErrors(Array.isArray(body.errors) ? body.errors : [{ path: "", message: err.message }]);
          let submitted = null;
          try {
            const trimmed = String(previewText || "").trim();
            if (trimmed.startsWith("{")) submitted = JSON.parse(trimmed);
          } catch {
            submitted = null;
          }
          setSubmittedForErrors(submitted);
          setStep(1);
        } else if (err instanceof ApiError) {
          setNetworkError(err.message || "Something went wrong. Try again.");
        } else {
          setNetworkError("Couldn't reach the server. Check your connection and try again.");
        }
        return null;
      } finally {
        setPreviewing(false);
      }
    },
    [text, source, buildOptions, importFileName]
  );

  async function onAiFixFile() {
    const trimmed = String(text || "").trim();
    if (!trimmed || fixingFile || previewing) return;
    setNetworkError(null);
    setFixingFile(true);
    const savedPreview = preview;
    const savedErrors = errors;
    const savedSubmitted = submittedForErrors;
    const fromError = step === 1 && Boolean(savedErrors?.length);
    const problems = collectImportProblems(
      savedErrors,
      savedPreview?.warnings
    );
    setErrors(null);
    const controller = new AbortController();
    abortRef.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, AI_CALL_TIMEOUT_MS);
    try {
      const unit = sourceUnit || deviceUnit || "lb";
      const data = await coachImportFix({
        text: trimmed,
        unit,
        problems: problems.length ? problems : undefined,
        byoKey,
        signal: controller.signal,
      });
      if (!aliveRef.current) return;
      const cost =
        data && typeof data.cost === "number" ? data.cost : null;
      if (cost != null) setAiFixCost(cost);
      if (typeof data?.remaining === "number") {
        setCoachStatus((prev) => ({
          ...(prev || {}),
          weeklyCap: {
            ...(prev?.weeklyCap || {}),
            remaining: data.remaining,
            limit: prev?.weeklyCap?.limit ?? null,
            used: prev?.weeklyCap?.used ?? null,
            nextAvailableAt: prev?.weeklyCap?.nextAvailableAt ?? null,
          },
        }));
      } else {
        try {
          const status = await getCoachStatus({ byoKey });
          if (aliveRef.current) setCoachStatus(status);
        } catch {
          /* keep prior status */
        }
      }
      if (!aliveRef.current) return;

      if (data?.kind === "recipe") {
        const nextRecipe = data.recipe;
        if (!nextRecipe) {
          setErrors([{ path: "", message: "The coach didn't return a layout recipe." }]);
          setStep(1);
          return;
        }
        setRecipe(nextRecipe);
        setRecipeSourceText(trimmed);
        const nextPreview = await runPreview(undefined, nextRecipe);
        if (!aliveRef.current) return;
        if (nextPreview != null && fromError) {
          setPriorPreview(null);
          setPriorErrors(savedErrors);
          setPriorSubmittedForErrors(savedSubmitted);
          setAiReadCompare({
            origin: "error",
            current: nextPreview.stats || {},
          });
        } else if (savedPreview != null && nextPreview != null) {
          setPriorErrors(null);
          setPriorSubmittedForErrors(null);
          setPriorPreview(savedPreview);
          setAiReadCompare({
            origin: "preview",
            prior: savedPreview.stats || {},
            current: nextPreview.stats || {},
          });
        } else {
          clearAiReadSnapshot();
        }
        return;
      }

      if (data?.kind === "block" && data.block) {
        const json = JSON.stringify(data.block, null, 2);
        setText(json);
        clearRecipe();
        const nextPreview = await runPreview(undefined, null, json);
        if (!aliveRef.current) return;
        if (nextPreview != null && fromError) {
          setPriorPreview(null);
          setPriorErrors(savedErrors);
          setPriorSubmittedForErrors(savedSubmitted);
          setAiReadCompare({
            origin: "error",
            current: nextPreview.stats || data.stats || {},
          });
        } else if (savedPreview != null && nextPreview != null) {
          setPriorErrors(null);
          setPriorSubmittedForErrors(null);
          setPriorPreview(savedPreview);
          setAiReadCompare({
            origin: "preview",
            prior: savedPreview.stats || {},
            current: nextPreview.stats || data.stats || {},
          });
        } else {
          clearAiReadSnapshot();
        }
        return;
      }

      setErrors([{ path: "", message: "The coach didn't return a fix." }]);
      setStep(1);
    } catch (err) {
      if (!aliveRef.current) return;
      if (err && err.name === "AbortError") {
        if (timedOut) {
          setErrors([{ path: "", message: AI_TIMEOUT_MESSAGE }]);
          setStep(1);
        }
        return;
      }
      if (err instanceof ApiError) {
        const body = err.body || {};
        const code = body.reason || body.error || "provider_error";
        if (code === "weekly_limit") {
          setCoachStatus((prev) => ({
            ...(prev || {}),
            weeklyCap: {
              limit: body.limit ?? prev?.weeklyCap?.limit ?? null,
              used: body.used ?? prev?.weeklyCap?.used ?? null,
              remaining: body.remaining ?? 0,
              nextAvailableAt: body.nextAvailableAt ?? prev?.weeklyCap?.nextAvailableAt ?? null,
            },
          }));
          setErrors([
            {
              path: "",
              message: coachErrorMessage("weekly_limit", err.message),
            },
          ]);
        } else if (Array.isArray(body.errors) && body.errors.length > 0) {
          setErrors(body.errors);
        } else {
          setErrors([
            {
              path: "",
              message: coachErrorMessage(code, err.message),
            },
          ]);
        }
        setStep(1);
      } else {
        setErrors([{ path: "", message: coachErrorMessage("network") }]);
        setStep(1);
      }
    } finally {
      clearTimeout(timer);
      if (abortRef.current === controller) abortRef.current = null;
      if (aliveRef.current) setFixingFile(false);
    }
  }

  /**
   * Restore the pre-AI deterministic preview or error card and clear the recipe.
   * Does not call the coach (no coach questions).
   */
  function onUseOriginalRead() {
    if (!aiReadCompare) return;
    clearRecipe();
    setAiFixCost(null);
    setRenames({});
    setNetworkError(null);
    if (aiReadCompare.origin === "error" && priorErrors) {
      setPreview(null);
      setBlockName("");
      setErrors(priorErrors);
      setSubmittedForErrors(priorSubmittedForErrors);
      setStep(1);
      clearAiReadSnapshot();
      return;
    }
    if (!priorPreview) return;
    setPreview(priorPreview);
    setBlockName(
      pickBlockName(
        priorPreview?.block?.name,
        source === "file" ? importFileName : null
      )
    );
    setErrors(null);
    setSubmittedForErrors(null);
    setStep(2);
    clearAiReadSnapshot();
  }

  function onRename(from, to) {
    setRenames((prev) => {
      const next = { ...prev };
      if (!to) delete next[from];
      else next[from] = to;
      return next;
    });
  }

  async function onCreate() {
    if (!preview?.block || creating) return;
    setCreating(true);
    setNetworkError(null);
    try {
      const block = {
        ...preview.block,
        name: blockName.trim() || preview.block.name,
      };
      const data = await blockTemplateApi.importBlock({
        block,
        renames: Object.keys(renames).length ? renames : undefined,
      });
      const id = data?.blockTemplate?.id;
      const weeks = preview?.stats?.weeks ?? block?.weeks?.length ?? 0;
      if (id) {
        navigate(`/blocks/${id}/edit`, {
          state: {
            importToast: formatImportToast(weeks),
          },
        });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body || {};
        setErrors(Array.isArray(body.errors) ? body.errors : [{ path: "", message: err.message }]);
        setSubmittedForErrors(preview.block);
        setStep(1);
      } else {
        setNetworkError(
          err instanceof ApiError
            ? err.message || "Couldn't create the block. Try again."
            : "Couldn't reach the server. Check your connection and try again."
        );
      }
    } finally {
      setCreating(false);
    }
  }

  const previewHasProblems =
    Array.isArray(preview?.warnings) && preview.warnings.length > 0;
  const showAiOnErrors = delimitedSource && Boolean(errors?.length);
  const showAiOnPreview =
    delimitedSource && step === 2 && !recipe && !aiFixCost && previewHasProblems;

  const fixButtonLabel = (
    <AiWaitButtonLabel
      busy={fixingFile}
      idle="Have AI fix this file"
      verb={IMPORT_FIX_VERB}
    />
  );

  const aiFixOffer = (show) =>
    show ? (
      <>
        <AiFileFixOffer
          coachStatus={coachStatus}
          fixing={fixingFile}
          disabled={previewing || creating || !String(text || "").trim()}
          onFix={() => void onAiFixFile()}
          buttonLabel={fixButtonLabel}
        />
        {fixingFile ? <AiWait variant="status" verb={IMPORT_FIX_VERB} /> : null}
      </>
    ) : null;

  return (
    <div className="bk bk-import">
      <div className="bk-shell">
        <StickyHeader title="IMPORT A BLOCK" />

        {step === 1 ? (
          <>
            <ImportSourceStep
              source={source}
              onSourceChange={(v) => {
                setSource(v);
                setFileError(null);
                setErrors(null);
                setNetworkError(null);
                setImportFileName(null);
                invalidateAiLayout();
              }}
              text={text}
              onTextChange={(v) => {
                setText(v);
                setFileError(null);
                invalidateAiLayout();
              }}
              onTextInvalidate={invalidateAiLayout}
              onImportFileNameChange={setImportFileName}
              oldApp={oldApp}
              onOldAppChange={setOldApp}
              historyWeeks={historyWeeks}
              onHistoryWeeksChange={setHistoryWeeks}
              sourceUnit={sourceUnit}
              onSourceUnitChange={setSourceUnit}
              deviceUnit={deviceUnit}
              fileError={fileError}
              onFileError={setFileError}
              previewing={previewing || fixingFile}
              onPreview={() => {
                // Source-step Preview is always deterministic.
                invalidateAiLayout();
                void runPreview(undefined, null);
              }}
            />
            {errors ? (
              <ImportErrorCard
                errors={errors}
                submitted={submittedForErrors}
              />
            ) : null}
            {aiFixOffer(showAiOnErrors)}
            {networkError ? (
              <div className="bk-import-network" role="alert">
                <p>{networkError}</p>
                <button type="button" className="btn btn-secondary" onClick={() => void runPreview(undefined, null)}>
                  Retry
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <ImportPreviewStep
              preview={preview}
              renames={renames}
              onRename={onRename}
              includeWarmups={includeWarmups}
              onIncludeWarmupsChange={(checked) => {
                setIncludeWarmups(checked);
                void runPreview(checked);
              }}
              blockName={blockName}
              onBlockNameChange={setBlockName}
              onBack={() => {
                // Return to source clears the recipe so the next Preview is deterministic.
                invalidateAiLayout();
                setPreview(null);
                setStep(1);
                setErrors(null);
                setNetworkError(null);
              }}
              onCreate={() => void onCreate()}
              creating={creating}
              unit={deviceUnit}
              aiReadCompare={aiReadCompare}
              onUseOriginalRead={onUseOriginalRead}
              aiFixCost={aiFixCost}
              aiLayoutOffer={aiFixOffer(showAiOnPreview)}
            />
            {networkError ? (
              <div className="bk-import-network" role="alert">
                <p>{networkError}</p>
                <button type="button" className="btn btn-secondary" onClick={() => void onCreate()}>
                  Retry
                </button>
              </div>
            ) : null}
          </>
        )}

        <div className="bk-import-exit">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/templates")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
