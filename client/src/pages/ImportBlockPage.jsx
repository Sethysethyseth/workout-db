import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/http.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import { loadWeightUnit } from "../lib/weightUnitPref.js";
import { StickyHeader } from "../components/blocks/ui/StickyHeader.jsx";
import {
  ImportErrorCard,
  ImportPreviewStep,
  ImportSourceStep,
} from "../components/blocks/import/index.js";
import { deviceUnitToFormat } from "../components/blocks/builder/blockBuilderState.js";
import "../styles/blocks/bk-import.css";

function kindForSource(source) {
  if (source === "oldapp") return "history";
  if (source === "ai") return "json";
  return "auto";
}

/**
 * Import a block - paste, file, old app, or any AI (BK6).
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

  const buildOptions = useCallback(
    (warmupOverride) => {
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
      return options;
    },
    [deviceUnit, includeWarmups, source, historyWeeks, oldApp, sourceUnit]
  );

  const runPreview = useCallback(
    async (warmupOverride) => {
      setFileError(null);
      setNetworkError(null);
      setErrors(null);
      setSubmittedForErrors(null);
      setPreviewing(true);
      try {
        const body = {
          text,
          kind: kindForSource(source),
          options: buildOptions(warmupOverride),
        };
        const data = await blockTemplateApi.previewBlockImport(body);
        setPreview(data);
        setRenames({});
        setBlockName(data?.block?.name ? String(data.block.name) : "");
        setStep(2);
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          const body = err.body || {};
          setErrors(Array.isArray(body.errors) ? body.errors : [{ path: "", message: err.message }]);
          // Prefer a JSON object from the paste for path name lookup
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
      } finally {
        setPreviewing(false);
      }
    },
    [text, source, buildOptions]
  );

  function onRename(from, to) {
    setRenames((prev) => {
      const next = { ...prev };
      if (!to) delete next[from];
      else next[from] = to;
      return next;
    });
  }

  async function onCreate() {
    if (!preview?.block) return;
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
            importToast: `Imported ${weeks} weeks - review and tweak anything`,
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
              }}
              text={text}
              onTextChange={(v) => {
                setText(v);
                setFileError(null);
              }}
              oldApp={oldApp}
              onOldAppChange={setOldApp}
              historyWeeks={historyWeeks}
              onHistoryWeeksChange={setHistoryWeeks}
              sourceUnit={sourceUnit}
              onSourceUnitChange={setSourceUnit}
              deviceUnit={deviceUnit}
              fileError={fileError}
              onFileError={setFileError}
              previewing={previewing}
              onPreview={() => void runPreview()}
            />
            {errors ? (
              <ImportErrorCard
                errors={errors}
                submitted={submittedForErrors}
              />
            ) : null}
            {networkError ? (
              <div className="bk-import-network" role="alert">
                <p>{networkError}</p>
                <button type="button" className="btn btn-secondary" onClick={() => void runPreview()}>
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
                setStep(1);
                setErrors(null);
                setNetworkError(null);
              }}
              onCreate={() => void onCreate()}
              creating={creating}
              unit={deviceUnit}
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
