import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/http.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import {
  coachErrorMessage,
  coachImportMap,
  getCoachStatus,
} from "../api/coachApi.js";
import { loadCoachKey } from "../lib/coachKeyPref.js";
import { loadWeightUnit } from "../lib/weightUnitPref.js";
import { StickyHeader } from "../components/blocks/ui/StickyHeader.jsx";
import {
  AiLayoutOffer,
  ImportErrorCard,
  ImportPreviewStep,
  ImportSourceStep,
  formatImportToast,
} from "../components/blocks/import/index.js";
import { deviceUnitToFormat } from "../components/blocks/builder/blockBuilderState.js";
import "../styles/blocks/bk-import.css";

function kindForSource(source) {
  if (source === "oldapp") return "history";
  if (source === "ai") return "json";
  return "auto";
}

function hasIgnoredColumnWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return false;
  return warnings.some((w) => {
    const msg = w && w.message != null ? String(w.message) : "";
    return /column '.*' was ignored/i.test(msg) || /unrecognised|unrecognized/i.test(msg);
  });
}

/**
 * Import a block - paste, file, old app, or any AI (BK6 / bks1).
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
  const [mappingLayout, setMappingLayout] = useState(false);
  const [coachStatus, setCoachStatus] = useState(null);
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

  // Coach status for the AI-layout consent gate (same as convert).
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
      recipe,
      recipeSourceText,
      text,
    ]
  );

  const runPreview = useCallback(
    async (warmupOverride, recipeOverride) => {
      setFileError(null);
      setNetworkError(null);
      setErrors(null);
      setSubmittedForErrors(null);
      setPreviewing(true);
      try {
        const body = {
          text,
          kind: kindForSource(source),
          options: buildOptions(warmupOverride, recipeOverride),
        };
        const data = await blockTemplateApi.previewBlockImport(body);
        setPreview(data);
        setRenames({});
        setBlockName(data?.block?.name ? String(data.block.name) : "");
        setStep(2);
        return data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          const body = err.body || {};
          setErrors(Array.isArray(body.errors) ? body.errors : [{ path: "", message: err.message }]);
          let submitted = null;
          try {
            const trimmed = String(text || "").trim();
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
    [text, source, buildOptions]
  );

  async function onAiReadLayout() {
    const trimmed = String(text || "").trim();
    if (!trimmed || mappingLayout || previewing) return;
    setNetworkError(null);
    setMappingLayout(true);
    // Capture the deterministic preview OR the error card before AI replaces it.
    const savedPreview = preview;
    const savedErrors = errors;
    const savedSubmitted = submittedForErrors;
    // Error-card offer is only on step 1; preview offer is only on step 2.
    const fromError = step === 1 && Boolean(savedErrors?.length);
    setErrors(null);
    try {
      const unit = sourceUnit || deviceUnit || "lb";
      const data = await coachImportMap({
        text: trimmed,
        unit,
        byoKey,
      });
      const nextRecipe = data?.recipe;
      if (!nextRecipe) {
        setErrors([{ path: "", message: "The coach didn't return a layout recipe." }]);
        setStep(1);
        return;
      }
      setRecipe(nextRecipe);
      setRecipeSourceText(trimmed);
      // Refresh remaining count after a successful 3-question charge.
      try {
        const status = await getCoachStatus({ byoKey });
        setCoachStatus(status);
      } catch {
        /* keep prior status */
      }
      const nextPreview = await runPreview(undefined, nextRecipe);
      if (nextPreview?.ok && fromError) {
        setPriorPreview(null);
        setPriorErrors(savedErrors);
        setPriorSubmittedForErrors(savedSubmitted);
        setAiReadCompare({
          origin: "error",
          current: nextPreview.stats || {},
        });
      } else if (savedPreview?.ok && nextPreview?.ok) {
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
      setMappingLayout(false);
    }
  }

  /**
   * Restore the pre-AI deterministic preview or error card and clear the recipe.
   * Does not call /coach/import-map (no coach questions).
   */
  function onUseOriginalRead() {
    if (!aiReadCompare) return;
    clearRecipe();
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
      priorPreview?.block?.name ? String(priorPreview.block.name) : ""
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

  const showAiOnErrors = delimitedSource && Boolean(errors?.length);
  const showAiOnPreview =
    delimitedSource &&
    step === 2 &&
    !recipe &&
    hasIgnoredColumnWarnings(preview?.warnings);

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
                invalidateAiLayout();
              }}
              text={text}
              onTextChange={(v) => {
                setText(v);
                setFileError(null);
                invalidateAiLayout();
              }}
              onTextInvalidate={invalidateAiLayout}
              oldApp={oldApp}
              onOldAppChange={setOldApp}
              historyWeeks={historyWeeks}
              onHistoryWeeksChange={setHistoryWeeks}
              sourceUnit={sourceUnit}
              onSourceUnitChange={setSourceUnit}
              deviceUnit={deviceUnit}
              fileError={fileError}
              onFileError={setFileError}
              previewing={previewing || mappingLayout}
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
            {showAiOnErrors ? (
              <AiLayoutOffer
                coachStatus={coachStatus}
                mapping={mappingLayout}
                disabled={previewing || !String(text || "").trim()}
                onMap={() => void onAiReadLayout()}
              />
            ) : null}
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
              aiLayoutOffer={
                showAiOnPreview ? (
                  <AiLayoutOffer
                    coachStatus={coachStatus}
                    mapping={mappingLayout}
                    disabled={previewing || creating}
                    onMap={() => void onAiReadLayout()}
                  />
                ) : null
              }
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
