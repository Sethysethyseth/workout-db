import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../../api/http.js";
import * as blockTemplateApi from "../../../api/blockTemplateApi.js";
import { getCoachStatus } from "../../../api/coachApi.js";
import { loadCoachKey } from "../../../lib/coachKeyPref.js";
import { loadWeightUnit } from "../../../lib/weightUnitPref.js";
import { ErrorMessage } from "../../ErrorMessage.jsx";
import { LoadingState } from "../../LoadingState.jsx";
import { AiWait } from "../../coach/AiWait.jsx";
import { CoachPanel } from "../../coach/CoachPanel.jsx";
import { Chip } from "../ui/Chip.jsx";
import { DayPicker } from "../ui/DayPicker.jsx";
import { SectionRule } from "../ui/SectionRule.jsx";
import { Segmented } from "../ui/Segmented.jsx";
import { StickyHeader } from "../ui/StickyHeader.jsx";
import { WeekStrip } from "../ui/WeekStrip.jsx";
import { ImportPreviewStep } from "../import/ImportPreviewStep.jsx";
import "../../../styles/blocks/bk-builder.css";
import "../../../styles/blocks/bk-import.css";
import {
  addDay,
  addExercise,
  addSet,
  addWeekCopy,
  clearWeek,
  convertUnits,
  copyForward,
  createEmptyExercise,
  createInitialState,
  dayHasExercises,
  deleteDay,
  deleteExercise,
  deleteSet,
  deleteWeek,
  deviceUnitToFormat,
  duplicateDay,
  duplicateExercise,
  duplicateWeek,
  fillAllFromSet1,
  hydrateFromApi,
  MAX_DAYS,
  moveDay,
  moveExercise,
  moveWeek,
  renameDay,
  removeEmptyDays,
  replaceExercise,
  serializeToPayload,
  setDescription,
  setEffort,
  setIsPublic,
  setName,
  setWeekLabel,
  toggleRange,
  toggleTimed,
  updateExercise,
  validateState,
  weekHasExercises,
  clearDraftFlag,
} from "./blockBuilderState.js";
import { BlockSettingsSheet, EFFORT_OPTIONS } from "./BlockSettingsSheet.jsx";
import { BuilderSheet, useOverlayFocus } from "./BuilderSheet.jsx";
import { BuilderToast } from "./BuilderToast.jsx";
import { CoachDraftCard } from "./CoachDraftCard.jsx";
import { CopyForwardSheet } from "./CopyForwardSheet.jsx";
import { DraftBanner } from "./DraftBanner.jsx";
import { ExerciseCard } from "./ExerciseCard.jsx";
import { ExercisePicker } from "./ExercisePicker.jsx";
import { ProgressionView } from "./ProgressionView.jsx";
import { AddExerciseToLibrarySheet } from "../../workout/AddExerciseToLibrarySheet.jsx";
import {
  clearBuilderDraft,
  readBuilderDraft,
  writeBuilderDraft,
} from "./builderDraftStorage.js";

const BLOCK_COACH_SUGGESTIONS = [
  "Is the volume balanced?",
  "Where should the deload go?",
  "Are the effort caps realistic?",
];

function countDaySets(day) {
  return (day?.exercises || []).reduce((n, ex) => n + (ex.sets?.length || 0), 0);
}

function slugifyBlockName(name) {
  const s = String(name || "block")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "block";
}

/** Hide coach/import "Week N" labels that duplicate the WEEK N title. */
function weekSubLabel(weekNum, label) {
  const t = String(label || "").trim();
  if (!t) return null;
  const m = t.match(/^weeks?\s*[-:]?\s*(\d+)$/i);
  if (m && Number(m[1]) === weekNum) return null;
  return t;
}

function downloadJson(filename, obj) {
  const json = JSON.stringify(obj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return json;
}

/** Map server 400 wording to plain user-facing copy (no "Template"). */
function plainSaveError(err) {
  const raw =
    (err instanceof ApiError && err.message) ||
    (err instanceof Error && err.message) ||
    "Couldn't save. Try again.";
  return String(raw)
    .replace(/\bTemplates\b/g, "Blocks")
    .replace(/\btemplates\b/g, "blocks")
    .replace(/\bTemplate\b/g, "Block")
    .replace(/\btemplate\b/g, "block");
}

function parseEmptyDayPath(path) {
  const m = String(path || "").match(/^weeks\[(\d+)\]\.days\[(\d+)\]$/);
  if (!m) return null;
  return { weekIdx: Number(m[1]), dayIdx: Number(m[2]) };
}

function weekLabelPlural(n) {
  const count = Number(n) || 0;
  return count === 1 ? "Drafted 1 week" : `Drafted ${count} weeks`;
}

/**
 * Phone-first block builder (BK5).
 * @param {"create"|"edit"} mode
 * @param {number} [templateId] required for edit
 */
export function BlockBuilder({ mode = "create", templateId, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = mode === "create";
  const nameInputRef = useRef(null);
  const dayPanelRef = useRef(null);
  const savedSnapshotRef = useRef(null);
  const discardLeavingRef = useRef(false);
  const lastExportedJsonRef = useRef(null);

  const [loading, setLoading] = useState(!isCreate);
  const [error, setError] = useState(null);
  const [state, setState] = useState(() => createInitialState());
  const [blockId, setBlockId] = useState(isCreate ? null : templateId);
  const [weekIdx, setWeekIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  // create + never saved: no status; "unsaved" once edited; "saved" after a successful save
  const [saveStatus, setSaveStatus] = useState(isCreate ? "clean" : "saved");
  const [dirty, setDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [emptyDayBanner, setEmptyDayBanner] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("add"); // add | replace
  const [replaceExIdx, setReplaceExIdx] = useState(null);
  // Library sheet from picker or card: { name, mode: "add"|"update", exIdx? }
  const [librarySheet, setLibrarySheet] = useState(null);
  const [weekActionsOpen, setWeekActionsOpen] = useState(false);
  const [dayActionsOpen, setDayActionsOpen] = useState(false);
  const [effortSheetOpen, setEffortSheetOpen] = useState(false);
  const [copyForwardOpen, setCopyForwardOpen] = useState(false);
  const [panelMode, setPanelMode] = useState("edit"); // edit | progression
  const [weekLabelDraft, setWeekLabelDraft] = useState("");
  const [dayNameDraft, setDayNameDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportCopyOpen, setExportCopyOpen] = useState(false);
  const undoRef = useRef(null);

  // BK12 coach assist (optional - hidden when coach unavailable)
  const [coachStatus, setCoachStatus] = useState(null);
  const [coachAskOpen, setCoachAskOpen] = useState(false);
  const [coachPreview, setCoachPreview] = useState(null);
  const [coachRenames, setCoachRenames] = useState({});
  const [coachBlockName, setCoachBlockName] = useState("");
  const [coachPreviewBusy, setCoachPreviewBusy] = useState(false);
  const [coachCreating, setCoachCreating] = useState(false);
  const [coachIncludeWarmups, setCoachIncludeWarmups] = useState(true);
  const [draftOffer, setDraftOffer] = useState(null); // { state } | null
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [nameEditing, setNameEditing] = useState(isCreate);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);
  const [confirmDeleteWeek, setConfirmDeleteWeek] = useState(false);
  const draftCheckedRef = useRef(false);
  const cancelDiscardRef = useRef(null);
  const cancelDeleteDayRef = useRef(null);
  const cancelDeleteWeekRef = useRef(null);

  const deviceUnit = loadWeightUnit();
  const displayUnit = deviceUnitToFormat(deviceUnit);
  const isNewEmpty =
    isCreate &&
    blockId == null &&
    !(state.weeks || []).some((w) => weekHasExercises(w));
  const draftKey = blockId ?? templateId ?? (isCreate ? "new" : null);

  // Hide the In-progress bar on builder routes (roominess).
  useEffect(() => {
    document.documentElement.classList.add("bk-builder-route");
    return () => {
      document.documentElement.classList.remove("bk-builder-route");
      document.documentElement.classList.remove("bk-builder-kbd");
    };
  }, []);

  // While any builder input has focus: hide bottom nav + in-progress bar,
  // collapse sticky chrome (CSS), and keep the focused field clear.
  useEffect(() => {
    function onFocusIn(e) {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.tagName !== "INPUT" && t.tagName !== "TEXTAREA") return;
      if (!t.closest(".bk-builder")) return;
      document.documentElement.classList.add("bk-builder-kbd");
    }
    function onFocusOut() {
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA") &&
          active.closest(".bk-builder")
        ) {
          return;
        }
        document.documentElement.classList.remove("bk-builder-kbd");
      });
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.documentElement.classList.remove("bk-builder-kbd");
    };
  }, []);

  useOverlayFocus({
    open: confirmDiscard,
    onClose: () => setConfirmDiscard(false),
    focusRef: cancelDiscardRef,
  });
  useOverlayFocus({
    open: confirmDeleteDay,
    onClose: () => setConfirmDeleteDay(false),
    focusRef: cancelDeleteDayRef,
  });
  useOverlayFocus({
    open: confirmDeleteWeek,
    onClose: () => setConfirmDeleteWeek(false),
    focusRef: cancelDeleteWeekRef,
  });

  useEffect(() => {
    if (!isCreate && blockId == null && templateId == null) return undefined;
    const savedId = blockId ?? templateId;
    if (savedId == null && !isNewEmpty) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoachStatus({ byoKey: loadCoachKey() });
        if (!cancelled) setCoachStatus(data);
      } catch {
        if (!cancelled) setCoachStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCreate, blockId, templateId, isNewEmpty]);

  // Toast from import navigation
  useEffect(() => {
    const msg = location.state?.importToast;
    if (!msg) return undefined;
    setToast({ message: String(msg) });
    navigate(location.pathname, { replace: true, state: {} });
    return undefined;
  }, [location.state, location.pathname, navigate]);

  const applyState = useCallback((updater, { markDirty = true } = {}) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
    if (markDirty) {
      setDirty(true);
      setSaveStatus("unsaved");
      setValidationErrors([]);
      setEmptyDayBanner(null);
    }
  }, []);

  const closeLibrarySheet = useCallback(() => {
    setLibrarySheet(null);
  }, []);

  // Load for edit
  useEffect(() => {
    if (isCreate) {
      savedSnapshotRef.current = JSON.stringify(serializeToPayload(createInitialState()));
      if (!draftCheckedRef.current) {
        draftCheckedRef.current = true;
        const draft = readBuilderDraft("new");
        if (draft?.state) {
          const snap = JSON.stringify(serializeToPayload(draft.state));
          if (snap !== savedSnapshotRef.current) {
            setDraftOffer({ state: draft.state, key: "new" });
          }
        }
      }
      return undefined;
    }
    let cancelled = false;
    async function run() {
      const id = Number(templateId);
      if (!Number.isInteger(id) || id <= 0) {
        setError(new Error("Invalid block template id."));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await blockTemplateApi.getBlockTemplate(id);
        if (cancelled) return;
        const hydrated = hydrateFromApi(data.blockTemplate);
        setState(hydrated);
        setBlockId(id);
        const snap = JSON.stringify(serializeToPayload(hydrated));
        savedSnapshotRef.current = snap;
        setDirty(false);
        setSaveStatus("saved");
        if (!draftCheckedRef.current) {
          draftCheckedRef.current = true;
          const draft = readBuilderDraft(id);
          if (draft?.state) {
            const draftSnap = JSON.stringify(serializeToPayload(draft.state));
            if (draftSnap !== snap) {
              setDraftOffer({ state: draft.state, key: id });
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [isCreate, templateId]);

  // Focus name when the inline editor opens (create, or tap-to-edit).
  useEffect(() => {
    if (!nameEditing || loading) return;
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [nameEditing, loading]);

  // Persist dirty drafts so in-app nav (BrowserRouter) cannot erase them.
  useEffect(() => {
    if (!dirty || draftKey == null) return undefined;
    const t = window.setTimeout(() => {
      writeBuilderDraft(draftKey, state);
    }, 250);
    return () => window.clearTimeout(t);
  }, [dirty, draftKey, state]);

  // beforeunload guard
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      if (discardLeavingRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const weeks = useMemo(() => state.weeks || [], [state.weeks]);
  const safeWeekIdx = Math.min(weekIdx, Math.max(0, weeks.length - 1));
  const currentWeek = weeks[safeWeekIdx] || null;
  const days = useMemo(() => currentWeek?.days || [], [currentWeek]);
  const safeDayIdx = Math.min(dayIdx, Math.max(0, days.length - 1));
  const currentDay = days[safeDayIdx] || null;

  useEffect(() => {
    if (weekIdx !== safeWeekIdx) setWeekIdx(safeWeekIdx);
  }, [weekIdx, safeWeekIdx]);

  useEffect(() => {
    if (dayIdx !== safeDayIdx) setDayIdx(safeDayIdx);
  }, [dayIdx, safeDayIdx]);

  /** Apply a library-linked name to the day (picker add) or an existing card. */
  const commitLibraryExercise = useCallback(
    (libraryName) => {
      const name = String(libraryName || "").trim();
      if (!name || !librarySheet) return;
      const ex = createEmptyExercise({
        exerciseName: name,
        notInLibrary: false,
      });
      if (librarySheet.mode === "update" && librarySheet.exIdx != null) {
        applyState(
          updateExercise(state, safeWeekIdx, safeDayIdx, librarySheet.exIdx, {
            exerciseName: name,
            notInLibrary: false,
          })
        );
      } else if (pickerMode === "replace" && replaceExIdx != null) {
        const next = replaceExercise(
          state,
          safeWeekIdx,
          safeDayIdx,
          replaceExIdx,
          ex
        );
        applyState(next);
        const replaced =
          next.weeks[safeWeekIdx]?.days[safeDayIdx]?.exercises?.[replaceExIdx];
        if (replaced) {
          setExpandedIds((ids) => new Set([...ids, replaced.id]));
        }
      } else {
        const next = addExercise(state, safeWeekIdx, safeDayIdx, ex);
        applyState(next);
        const list =
          next.weeks[safeWeekIdx]?.days[safeDayIdx]?.exercises || [];
        const last = list[list.length - 1];
        if (last) {
          setExpandedIds((ids) => new Set([...ids, last.id]));
        }
      }
    },
    [
      librarySheet,
      applyState,
      state,
      safeWeekIdx,
      safeDayIdx,
      pickerMode,
      replaceExIdx,
    ]
  );

  const isNarrow = useCallback(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(max-width: 719px)").matches;
  }, []);

  function toggleExpanded(exId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) {
        next.delete(exId);
        return next;
      }
      if (isNarrow()) return new Set([exId]);
      next.add(exId);
      return next;
    });
  }

  const weekStripItems = useMemo(
    () =>
      weeks.map((w, i) => ({
        key: w.id || String(i),
        short: `W${i + 1}`,
        progress: 0,
        ariaLabel: w.label ? `Week ${i + 1}, ${w.label}` : `Week ${i + 1}`,
      })),
    [weeks]
  );

  const dayPickerItems = useMemo(
    () =>
      days.map((d, i) => ({
        key: d.id || String(i),
        top: `Day ${i + 1}`,
        name: d.name || `Day ${i + 1}`,
        progress: null,
      })),
    [days]
  );

  // Local draft already survives leaving (Restore banner). No in-app confirm.
  // beforeunload stays: it covers hard refresh / tab close before the draft
  // debounce writes, which would lose data if removed.
  function handleExit() {
    discardLeavingRef.current = true;
    if (onBack) onBack();
    else navigate("/templates");
  }

  function showToast(message, undoState) {
    undoRef.current = undoState ?? null;
    setToast({
      message,
      onUndo: undoState
        ? () => {
            applyState(undoState, { markDirty: true });
            setToast(null);
            undoRef.current = null;
          }
        : null,
    });
  }

  async function handleCoachDrafted(data) {
    setCoachPreviewBusy(true);
    setError(null);
    try {
      const preview = await blockTemplateApi.previewBlockImport({
        text: JSON.stringify(data.block),
        kind: "json",
        options: { unit: displayUnit },
      });
      setCoachPreview(preview);
      setCoachRenames({});
      // Keep a name the user already typed over the coach's suggested name.
      const userName = String(state.name || "").trim();
      const aiName = preview?.block?.name ? String(preview.block.name) : "";
      setCoachBlockName(userName || aiName);
      setCoachIncludeWarmups(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError(new Error("The coach's draft didn't pass import checks. Tweak the description and try again."));
      } else {
        setError(err instanceof Error ? err : new Error("Couldn't preview the coach draft."));
      }
    } finally {
      setCoachPreviewBusy(false);
    }
  }

  async function handleCoachCreate() {
    if (!coachPreview?.block) return;
    setCoachCreating(true);
    setError(null);
    try {
      const block = {
        ...coachPreview.block,
        name: coachBlockName.trim() || coachPreview.block.name,
      };
      const data = await blockTemplateApi.importBlock({
        block,
        renames: Object.keys(coachRenames).length ? coachRenames : undefined,
      });
      const id = data?.blockTemplate?.id;
      const weeks = coachPreview?.stats?.weeks ?? block?.weeks?.length ?? 0;
      if (id) {
        clearBuilderDraft("new");
        navigate(`/blocks/${id}/edit`, {
          state: {
            importToast: `${weekLabelPlural(weeks)} - review and tweak anything`,
          },
        });
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? new Error(err.message || "Couldn't create the block. Try again.")
          : new Error("Couldn't reach the server. Check your connection and try again.")
      );
    } finally {
      setCoachCreating(false);
    }
  }

  function openAskCoach() {
    setSettingsOpen(false);
    setCoachAskOpen(true);
  }

  function openWeekActions() {
    setWeekLabelDraft(currentWeek?.label || "");
    setWeekActionsOpen(true);
  }

  function openDayActions() {
    setDayNameDraft(currentDay?.name || "");
    setDayActionsOpen(true);
  }

  function selectWeek(key) {
    const idx = weeks.findIndex((w, i) => (w.id || String(i)) === key);
    if (idx < 0) return;
    if (idx === safeWeekIdx) {
      openWeekActions();
      return;
    }
    setWeekIdx(idx);
    setDayIdx(0);
    setExpandedIds(new Set());
  }

  function selectDay(key) {
    const idx = days.findIndex((d, i) => (d.id || String(i)) === key);
    if (idx < 0) return;
    if (idx === safeDayIdx) {
      openDayActions();
      return;
    }
    setDayIdx(idx);
    setExpandedIds(new Set());
  }

  function effortChipLabel(effort) {
    if (effort === "rpe") return "RPE";
    if (effort === "rir") return "RIR";
    return "Effort: off";
  }

  function handleAddWeek() {
    const prev = state;
    const next = addWeekCopy(state);
    if (next === state) return;
    applyState(next);
    setWeekIdx(next.weeks.length - 1);
    setDayIdx(0);
    setExpandedIds(new Set());
    const n = next.weeks.length;
    showToast(`Week ${n} added as a copy of week ${n - 1}`, prev);
  }

  async function handleSave() {
    const result = validateState(state);
    if (!result.ok) {
      setValidationErrors(result.errors);
      const empty = result.errors.find((e) => parseEmptyDayPath(e.path));
      if (empty) {
        const loc = parseEmptyDayPath(empty.path);
        setEmptyDayBanner(empty.message);
        setError(null);
        if (loc) {
          setWeekIdx(loc.weekIdx);
          setDayIdx(loc.dayIdx);
          setExpandedIds(new Set());
        }
        window.requestAnimationFrame(() => {
          dayPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }
      setEmptyDayBanner(null);
      const first = result.errors[0];
      setError(new Error(first?.message || "Fix the highlighted problems before saving."));
      window.requestAnimationFrame(() => {
        const el =
          document.querySelector(".bk-ex-card--invalid") ||
          document.querySelector(".bk-builder-name-input") ||
          document.querySelector("[data-invalid='true']");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setEmptyDayBanner(null);
    setSaveStatus("saving");
    setError(null);
    const payload = serializeToPayload(state);
    try {
      if (isCreate && blockId == null) {
        const data = await blockTemplateApi.createBlockTemplate(payload);
        const id = data?.blockTemplate?.id;
        savedSnapshotRef.current = JSON.stringify(payload);
        setDirty(false);
        setSaveStatus("saved");
        setValidationErrors([]);
        clearBuilderDraft("new");
        if (id != null) {
          clearBuilderDraft(id);
          setBlockId(id);
          discardLeavingRef.current = true;
          navigate(`/blocks/${id}/edit`, { replace: true });
        }
      } else {
        const id = blockId ?? templateId;
        await blockTemplateApi.updateBlockTemplate(id, payload);
        savedSnapshotRef.current = JSON.stringify(payload);
        setDirty(false);
        setSaveStatus("saved");
        setValidationErrors([]);
        clearBuilderDraft(id);
      }
    } catch (err) {
      setSaveStatus("unsaved");
      if (err instanceof ApiError && err.status === 400) {
        setError(new Error(plainSaveError(err)));
      } else {
        setError(err instanceof Error ? err : new Error(plainSaveError(err)));
      }
    }
  }

  function handleRemoveEmptyDays() {
    const prev = state;
    const next = removeEmptyDays(state);
    applyState(next);
    setEmptyDayBanner(null);
    const weeks = next.weeks || [];
    setWeekIdx((wi) => Math.min(wi, Math.max(0, weeks.length - 1)));
    setDayIdx(0);
    showToast("Removed empty days", prev);
  }

  async function handleAcceptDraft() {
    const id = blockId ?? templateId;
    if (id == null) return;
    setAccepting(true);
    setError(null);
    try {
      // Save pending edits first
      const result = validateState(state);
      if (!result.ok) {
        setValidationErrors(result.errors);
        setError(new Error(result.errors[0]?.message || "Fix problems before saving."));
        setAccepting(false);
        return;
      }
      const payload = serializeToPayload(state);
      await blockTemplateApi.updateBlockTemplate(id, payload);
      await blockTemplateApi.acceptBlockTemplate(id);
      applyState(clearDraftFlag(state), { markDirty: false });
      setDirty(false);
      setSaveStatus("saved");
      savedSnapshotRef.current = JSON.stringify(payload);
      showToast("Saved to your library");
    } catch (err) {
      setError(err);
    } finally {
      setAccepting(false);
    }
  }

  async function handleDiscardDraft() {
    const id = blockId ?? templateId;
    if (id == null) return;
    try {
      await blockTemplateApi.deleteBlockTemplate(id);
      discardLeavingRef.current = true;
      navigate("/templates");
    } catch (err) {
      setError(err);
    }
  }

  function requestDiscardDraft() {
    setConfirmDiscard(true);
  }

  async function handleDeleteBlock() {
    const id = blockId ?? templateId;
    if (id == null) return;
    try {
      await blockTemplateApi.deleteBlockTemplate(id);
      discardLeavingRef.current = true;
      navigate("/templates");
    } catch (err) {
      setError(err);
    }
  }

  async function handleExportBlock() {
    const id = blockId ?? templateId;
    if (id == null) return;
    setExporting(true);
    setError(null);
    try {
      const data = await blockTemplateApi.exportBlock(id, displayUnit);
      const block = data?.block;
      if (!block) throw new Error("Export returned nothing.");
      const filename = `${slugifyBlockName(block.name || state.name)}.logchamp.json`;
      const json = downloadJson(filename, block);
      lastExportedJsonRef.current = json;
      setSettingsOpen(false);
      setExportCopyOpen(true);
    } catch (err) {
      setError(err);
    } finally {
      setExporting(false);
    }
  }

  function invalidPaths() {
    return new Set(validationErrors.map((e) => e.path));
  }

  function exerciseInvalid(exIdx) {
    const paths = invalidPaths();
    const prefix = `weeks[${safeWeekIdx}].days[${safeDayIdx}].exercises[${exIdx}]`;
    for (const p of paths) {
      if (p === prefix || p.startsWith(`${prefix}.`) || p === `${prefix}.name`) return true;
    }
    return false;
  }

  const nameInvalid = validationErrors.some((e) => e.path === "name");

  // Honest save state: never "Saved" while a local draft differs from the server.
  const displaySaveStatus =
    saveStatus === "saving"
      ? "saving"
      : saveStatus === "clean" && !dirty && !draftOffer
        ? "clean"
        : dirty || draftOffer || saveStatus === "unsaved"
          ? "unsaved"
          : saveStatus;

  const headerRight = (
    <div className="bk-builder-save">
      {displaySaveStatus === "clean" ? null : (
        <span
          className={`bk-builder-save__status bk-builder-save__status--${displaySaveStatus}`}
          aria-live="polite"
        >
          <span className="bk-builder-save__dot" aria-hidden="true" />
          {displaySaveStatus === "unsaved"
            ? "Unsaved"
            : displaySaveStatus === "saving"
              ? "Saving…"
              : "Saved"}
        </span>
      )}
      <button
        type="button"
        className="btn bk-builder-save__btn"
        disabled={displaySaveStatus === "saving"}
        onClick={() => void handleSave()}
      >
        Save
      </button>
      <div className="bk-builder-header-menu">
        <button
          type="button"
          className="bk-builder-header-menu__btn"
          aria-label="Builder menu"
          aria-haspopup="dialog"
          aria-expanded={headerMenuOpen}
          onClick={() => setHeaderMenuOpen(true)}
        >
          …
        </button>
      </div>
    </div>
  );

  const effortValue = state.effort || "none";
  const effortActive = effortValue === "rpe" || effortValue === "rir";
  const dayActionsLabel = currentDay?.name || `Day ${safeDayIdx + 1}`;

  // A span, not a div: StickyHeader renders the eyebrow inside a <p>.
  const nameNode = (
    <span className="bk-builder-header-name">
      {nameEditing ? (
        <input
          ref={nameInputRef}
          className="bk-builder-name-input"
          value={state.name}
          placeholder="Name this block"
          maxLength={120}
          data-invalid={nameInvalid ? "true" : undefined}
          aria-invalid={nameInvalid || undefined}
          onChange={(e) => applyState(setName(state, e.target.value))}
          onClick={(e) => e.stopPropagation()}
          onBlur={() => {
            if (!(isCreate && blockId == null)) setNameEditing(false);
          }}
        />
      ) : (
        <span
          role="button"
          tabIndex={0}
          className="bk-builder-name-tap"
          title={state.name || "Untitled block"}
          onClick={() => setNameEditing(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setNameEditing(true);
            }
          }}
        >
          {state.name || "Untitled block"}
        </span>
      )}
      <button
        type="button"
        className={`bk-builder-effort-chip${effortActive ? " bk-builder-effort-chip--on" : ""}`}
        aria-label="Effort scale"
        aria-haspopup="dialog"
        aria-expanded={effortSheetOpen}
        onClick={() => setEffortSheetOpen(true)}
      >
        <span>{effortChipLabel(effortValue)}</span>
        <span className="bk-builder-effort-chip__caret" aria-hidden="true">
          ▾
        </span>
      </button>
    </span>
  );

  if (loading) {
    return (
      <LoadingState
        tone="skeleton"
        variant="session"
        rows={3}
        slowLabel="Taking longer than usual…"
      />
    );
  }

  if (coachPreview) {
    return (
      <div className="bk bk-import">
        <div className="bk-shell">
          <StickyHeader title="COACH DRAFT" />
          <ImportPreviewStep
            preview={coachPreview}
            renames={coachRenames}
            onRename={(from, to) => {
              setCoachRenames((prev) => {
                const next = { ...prev };
                if (!to) delete next[from];
                else next[from] = to;
                return next;
              });
            }}
            onLibraryMatched={(from, libraryName) => {
              const to = String(libraryName || "").trim();
              const fromName = String(from || "").trim();
              if (!fromName || !to) return;
              setCoachPreview((prev) => {
                if (!prev) return prev;
                const exercises = Array.isArray(prev.exercises)
                  ? prev.exercises.map((ex) =>
                      ex?.name === fromName
                        ? { ...ex, resolved: true, matchedName: to }
                        : ex
                    )
                  : prev.exercises;
                return { ...prev, exercises };
              });
              if (to !== fromName) {
                setCoachRenames((prev) => ({ ...prev, [fromName]: to }));
              }
            }}
            includeWarmups={coachIncludeWarmups}
            onIncludeWarmupsChange={setCoachIncludeWarmups}
            blockName={coachBlockName}
            onBlockNameChange={setCoachBlockName}
            onBack={() => {
              setCoachPreview(null);
              setError(null);
            }}
            onCreate={() => void handleCoachCreate()}
            creating={coachCreating}
            unit={displayUnit}
          />
          <ErrorMessage error={error} />
        </div>
      </div>
    );
  }

  if (!isCreate && !currentWeek && error) {
    return (
      <div className="bk bk-shell">
        <ErrorMessage error={error} />
        <button type="button" className="btn" onClick={handleExit}>
          Back
        </button>
      </div>
    );
  }

  const exCount = currentDay?.exercises?.length || 0;
  const setCount = countDaySets(currentDay);
  const weekExtraLabel = weekSubLabel(safeWeekIdx + 1, currentWeek?.label);

  return (
    <div className="bk bk-builder">
      <div className="bk-shell">
        <StickyHeader
          className="bk-builder-sticky"
          eyebrow={nameNode}
          right={headerRight}
        />

        {draftOffer ? (
          <div className="bk-builder-draft-offer" role="status">
            <p className="bk-builder-draft-offer__msg">You have unsaved changes from last time.</p>
            <div className="bk-builder-draft-offer__actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  applyState(draftOffer.state, { markDirty: true });
                  setDraftOffer(null);
                }}
              >
                Restore unsaved changes
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  clearBuilderDraft(draftOffer.key);
                  setDraftOffer(null);
                }}
              >
                Discard
              </button>
            </div>
          </div>
        ) : null}

        <div className="bk-builder__weeks">
          <div className="bk-builder__week-label">
            <span className="bk-builder__week-title">
              WEEK {safeWeekIdx + 1}
              {weekExtraLabel ? (
                <span className="bk-builder__week-sub">{weekExtraLabel}</span>
              ) : null}
            </span>
            <button
              type="button"
              className="bk-ex-card__menu-btn bk-builder__row-menu-btn"
              aria-label={`Week ${safeWeekIdx + 1} actions`}
              aria-haspopup="dialog"
              aria-expanded={weekActionsOpen}
              onClick={openWeekActions}
            >
              …
            </button>
          </div>
          <WeekStrip
            weeks={weekStripItems}
            selectedKey={currentWeek?.id || String(safeWeekIdx)}
            onSelect={selectWeek}
            trailing={
              <button
                type="button"
                className="bk-week-add"
                aria-label="Add week"
                onClick={handleAddWeek}
                disabled={weeks.length >= 52}
              >
                +
              </button>
            }
          />
        </div>

        {state.isDraft ? (
          <DraftBanner
            sourceUnit={state.sourceUnit}
            deviceUnit={deviceUnit}
            accepting={accepting}
            onAccept={() => void handleAcceptDraft()}
            onDiscard={() => requestDiscardDraft()}
            onConvert={() => applyState(convertUnits(state, displayUnit))}
          />
        ) : null}

        <ErrorMessage error={error} />

        {emptyDayBanner ? (
          <div className="bk-builder-empty-days" role="alert">
            <p className="bk-builder-empty-days__msg">{emptyDayBanner}</p>
            <button
              type="button"
              className="btn btn-secondary bk-builder-empty-days__action"
              onClick={handleRemoveEmptyDays}
            >
              Remove empty days
            </button>
          </div>
        ) : null}

        {isNewEmpty ? (
          <CoachDraftCard
            unit={displayUnit}
            onDrafted={(data) => void handleCoachDrafted(data)}
          />
        ) : null}
        {coachPreviewBusy ? (
          <AiWait variant="block" verb="Previewing coach draft..." />
        ) : null}

        <div className="bk-builder__days">
          <DayPicker
            days={dayPickerItems}
            selectedKey={currentDay?.id || String(safeDayIdx)}
            onSelect={selectDay}
            trailing={
              <button
                type="button"
                className="bk-day-add"
                aria-label={days.length >= MAX_DAYS ? "7 days max" : "Add day"}
                disabled={days.length >= MAX_DAYS}
                onClick={() => {
                  const next = addDay(state, safeWeekIdx);
                  applyState(next);
                  const newDays = next.weeks[safeWeekIdx]?.days || [];
                  setDayIdx(Math.max(0, newDays.length - 1));
                  setExpandedIds(new Set());
                }}
              >
                {days.length >= MAX_DAYS ? "7 days max" : "+ Day"}
              </button>
            }
          />
        </div>

        {currentDay ? (
          <div className="bk-builder__panel" ref={dayPanelRef}>
            <div className="bk-builder__panel-head">
              <SectionRule
                label={dayActionsLabel}
                chip={
                  <span className="bk-builder__chips">
                    <Chip>
                      {exCount} exercise{exCount === 1 ? "" : "s"}
                    </Chip>
                    <Chip>
                      {setCount} set{setCount === 1 ? "" : "s"}
                    </Chip>
                    <button
                      type="button"
                      className="bk-ex-card__menu-btn bk-builder__row-menu-btn"
                      aria-label={`${dayActionsLabel} actions`}
                      aria-haspopup="dialog"
                      aria-expanded={dayActionsOpen}
                      onClick={openDayActions}
                    >
                      …
                    </button>
                  </span>
                }
              />
              <Segmented
                className="bk-builder__mode"
                label="Day panel mode"
                value={panelMode}
                onChange={setPanelMode}
                options={[
                  { value: "edit", label: "Edit" },
                  { value: "progression", label: "Progression" },
                ]}
              />
            </div>

            {panelMode === "progression" ? (
              <ProgressionView
                weeks={weeks}
                dayPosition={safeDayIdx}
                orderWeekIdx={safeWeekIdx}
                unit={displayUnit === "kg" ? "kg" : "lb"}
                onSelectCell={({ weekIdx, exerciseId, exerciseName }) => {
                  setWeekIdx(weekIdx);
                  setPanelMode("edit");
                  const day = weeks[weekIdx]?.days?.[safeDayIdx];
                  const match =
                    (day?.exercises || []).find((ex) => ex.id === exerciseId) ||
                    (day?.exercises || []).find(
                      (ex) => String(ex.exerciseName || "").trim() === exerciseName
                    );
                  if (match?.id) {
                    setExpandedIds(new Set([match.id]));
                  } else {
                    setExpandedIds(new Set());
                  }
                }}
              />
            ) : (
              <>
                <div className="bk-builder__exercises">
                  {(currentDay.exercises || []).map((ex, ei) => (
                    <ExerciseCard
                      key={ex.id || ei}
                      exercise={ex}
                      index={ei}
                      effort={state.effort}
                      unit={displayUnit === "kg" ? "kg" : "lb"}
                      expanded={expandedIds.has(ex.id)}
                      invalid={exerciseInvalid(ei)}
                      canMoveUp={ei > 0}
                      canMoveDown={ei < (currentDay.exercises || []).length - 1}
                      onToggle={() => toggleExpanded(ex.id)}
                      onChange={(patch) =>
                        applyState(updateExercise(state, safeWeekIdx, safeDayIdx, ei, patch))
                      }
                      onAddSet={() => applyState(addSet(state, safeWeekIdx, safeDayIdx, ei))}
                      onDeleteSet={(si) =>
                        applyState(deleteSet(state, safeWeekIdx, safeDayIdx, ei, si))
                      }
                      onFillAll={() =>
                        applyState(fillAllFromSet1(state, safeWeekIdx, safeDayIdx, ei))
                      }
                      onToggleTimed={(timed) =>
                        applyState(toggleTimed(state, safeWeekIdx, safeDayIdx, ei, timed))
                      }
                      onToggleRange={(enabled) =>
                        applyState(toggleRange(state, safeWeekIdx, safeDayIdx, ei, enabled))
                      }
                      onMoveUp={() =>
                        applyState(moveExercise(state, safeWeekIdx, safeDayIdx, ei, -1))
                      }
                      onMoveDown={() =>
                        applyState(moveExercise(state, safeWeekIdx, safeDayIdx, ei, 1))
                      }
                      onDuplicate={() =>
                        applyState(duplicateExercise(state, safeWeekIdx, safeDayIdx, ei))
                      }
                      onReplace={() => {
                        setPickerMode("replace");
                        setReplaceExIdx(ei);
                        setPickerOpen(true);
                      }}
                      onAddToLibrary={
                        ex.notInLibrary
                          ? () => {
                              setLibrarySheet({
                                name: ex.exerciseName || "",
                                mode: "update",
                                exIdx: ei,
                              });
                            }
                          : undefined
                      }
                      onDelete={() => {
                        const prev = state;
                        applyState(deleteExercise(state, safeWeekIdx, safeDayIdx, ei));
                        setExpandedIds((ids) => {
                          const n = new Set(ids);
                          n.delete(ex.id);
                          return n;
                        });
                        showToast("Exercise deleted", prev);
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="bk-builder__add-ex"
                  onClick={() => {
                    setPickerMode("add");
                    setReplaceExIdx(null);
                    setPickerOpen(true);
                  }}
                >
                  + Add exercise
                </button>
              </>
            )}
          </div>
        ) : null}

        <div className="bk-builder__exit">
          <button type="button" className="btn btn-secondary" onClick={handleExit}>
            {isCreate ? "Back" : "Close"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </div>
      </div>

      <BuilderSheet
        open={headerMenuOpen}
        title="Block"
        onClose={() => setHeaderMenuOpen(false)}
        className="bk-sheet--ex-actions"
      >
        <div className="bk-ex-actions">
          <button
            type="button"
            className="bk-ex-actions__row"
            onClick={() => {
              setHeaderMenuOpen(false);
              setSettingsOpen(true);
            }}
          >
            <span className="bk-ex-actions__label">Settings</span>
          </button>
          <button
            type="button"
            className="bk-ex-actions__row"
            onClick={() => {
              setHeaderMenuOpen(false);
              handleExit();
            }}
          >
            <span className="bk-ex-actions__label">{isCreate ? "Back" : "Close"}</span>
          </button>
        </div>
      </BuilderSheet>

      <BlockSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        state={state}
        mode={blockId != null || !isCreate ? "edit" : "create"}
        onChange={(patch) => {
          let next = state;
          if (patch.name !== undefined) next = setName(next, patch.name);
          if (patch.description !== undefined) next = setDescription(next, patch.description);
          if (patch.effort !== undefined) next = setEffort(next, patch.effort);
          if (patch.isPublic !== undefined) next = setIsPublic(next, patch.isPublic);
          applyState(next);
        }}
        onToast={(message) => setToast({ message })}
        onExport={
          blockId != null || (!isCreate && templateId != null)
            ? () => void handleExportBlock()
            : undefined
        }
        exporting={exporting}
        onAskCoach={
          coachStatus?.available && (blockId != null || (!isCreate && templateId != null))
            ? () => openAskCoach()
            : undefined
        }
        onDelete={
          blockId != null || !isCreate
            ? () => {
                setSettingsOpen(false);
                void handleDeleteBlock();
              }
            : undefined
        }
      />

      <BuilderSheet
        open={effortSheetOpen}
        title="Effort scale"
        onClose={() => setEffortSheetOpen(false)}
      >
        <p className="bk-builder-effort-sheet__copy">
          How you rate effort on every set in this block.
        </p>
        <Segmented
          label="Effort scale"
          options={EFFORT_OPTIONS}
          value={effortValue}
          onChange={(effort) => {
            applyState(setEffort(state, effort));
            setEffortSheetOpen(false);
          }}
        />
      </BuilderSheet>

      <BuilderSheet
        open={coachAskOpen}
        title="Ask the coach"
        onClose={() => setCoachAskOpen(false)}
        wide
      >
        <CoachPanel
          mode="ask"
          focus={{
            type: "block",
            blockId: Number(blockId ?? templateId),
          }}
          suggestions={BLOCK_COACH_SUGGESTIONS}
          collapsedLabel="Ask about this block"
          defaultOpen
        />
      </BuilderSheet>
      <BuilderSheet
        open={exportCopyOpen}
        title="Export ready"
        onClose={() => setExportCopyOpen(false)}
        wide
      >
        <p className="bk-settings__hint">
          Downloaded as JSON. You can also copy it to paste elsewhere or re-import via File.
        </p>
        <div className="bk-actions-list">
          <button
            type="button"
            className="bk-actions-list__btn"
            onClick={async () => {
              const json = lastExportedJsonRef.current;
              if (!json) return;
              try {
                await navigator.clipboard.writeText(json);
                setExportCopyOpen(false);
                setToast({ message: "JSON copied" });
              } catch {
                setError(new Error("Couldn't copy. Try downloading again."));
              }
            }}
          >
            Copy JSON
          </button>
        </div>
      </BuilderSheet>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={pickerMode === "replace" ? "Replace exercise" : "Add exercise"}
        onAddToLibrary={(name) => {
          setPickerOpen(false);
          setLibrarySheet({
            name,
            mode: "add",
          });
        }}
        onPick={(ex) => {
          if (pickerMode === "replace" && replaceExIdx != null) {
            const next = replaceExercise(
              state,
              safeWeekIdx,
              safeDayIdx,
              replaceExIdx,
              ex
            );
            applyState(next);
            const replaced =
              next.weeks[safeWeekIdx]?.days[safeDayIdx]?.exercises?.[replaceExIdx];
            if (replaced) toggleExpanded(replaced.id);
          } else {
            const next = addExercise(state, safeWeekIdx, safeDayIdx, ex);
            applyState(next);
            const list =
              next.weeks[safeWeekIdx]?.days[safeDayIdx]?.exercises || [];
            const last = list[list.length - 1];
            if (last) toggleExpanded(last.id);
          }
        }}
      />

      <AddExerciseToLibrarySheet
        open={Boolean(librarySheet)}
        initialName={librarySheet?.name ?? ""}
        context="library"
        onClose={closeLibrarySheet}
        onLink={async ({ name }) => {
          commitLibraryExercise(name);
        }}
        onCreateCommitted={async ({ name }) => {
          commitLibraryExercise(name);
        }}
      />

      <BuilderSheet
        open={weekActionsOpen}
        title={`Week ${safeWeekIdx + 1}`}
        onClose={() => setWeekActionsOpen(false)}
      >
        <label className="bk-settings__field">
          <span className="bk-settings__label">Label</span>
          <input
            className="bk-settings__input"
            value={weekLabelDraft}
            maxLength={40}
            placeholder="e.g. Deload"
            onChange={(e) => setWeekLabelDraft(e.target.value)}
            onBlur={() =>
              applyState(setWeekLabel(state, safeWeekIdx, weekLabelDraft))
            }
          />
        </label>
        <div className="bk-actions-list">
          <button
            type="button"
            className="bk-actions-list__btn"
            onClick={() => {
              let next = setWeekLabel(state, safeWeekIdx, weekLabelDraft);
              next = duplicateWeek(next, safeWeekIdx);
              applyState(next);
              setWeekIdx(safeWeekIdx + 1);
              setWeekActionsOpen(false);
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="bk-actions-list__btn"
            disabled={safeWeekIdx >= 51}
            onClick={() => {
              applyState(setWeekLabel(state, safeWeekIdx, weekLabelDraft));
              setWeekActionsOpen(false);
              setCopyForwardOpen(true);
            }}
          >
            Copy forward...
          </button>
          <button
            type="button"
            className="bk-actions-list__btn"
            disabled={safeWeekIdx === 0}
            onClick={() => {
              applyState(moveWeek(state, safeWeekIdx, -1));
              setWeekIdx(safeWeekIdx - 1);
              setWeekActionsOpen(false);
            }}
          >
            Move earlier
          </button>
          <button
            type="button"
            className="bk-actions-list__btn"
            disabled={safeWeekIdx >= weeks.length - 1}
            onClick={() => {
              applyState(moveWeek(state, safeWeekIdx, 1));
              setWeekIdx(safeWeekIdx + 1);
              setWeekActionsOpen(false);
            }}
          >
            Move later
          </button>
          <button
            type="button"
            className="bk-actions-list__btn"
            onClick={() => {
              applyState(clearWeek(state, safeWeekIdx));
              setWeekActionsOpen(false);
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="bk-actions-list__btn bk-actions-list__btn--danger"
            disabled={weeks.length <= 1}
            onClick={() => {
              if (weekHasExercises(currentWeek)) {
                setWeekActionsOpen(false);
                setConfirmDeleteWeek(true);
                return;
              }
              applyState(deleteWeek(state, safeWeekIdx));
              setWeekIdx(Math.max(0, safeWeekIdx - 1));
              setWeekActionsOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      </BuilderSheet>

      <BuilderSheet
        open={dayActionsOpen}
        title={currentDay?.name || `Day ${safeDayIdx + 1}`}
        onClose={() => setDayActionsOpen(false)}
      >
        <label className="bk-settings__field">
          <span className="bk-settings__label">Rename</span>
          <input
            className="bk-settings__input"
            value={dayNameDraft}
            maxLength={60}
            onChange={(e) => setDayNameDraft(e.target.value)}
            onBlur={() =>
              applyState(renameDay(state, safeWeekIdx, safeDayIdx, dayNameDraft))
            }
          />
        </label>
        <div className="bk-actions-list">
          <button
            type="button"
            className="bk-actions-list__btn"
            disabled={days.length >= MAX_DAYS}
            onClick={() => {
              let next = renameDay(state, safeWeekIdx, safeDayIdx, dayNameDraft);
              next = duplicateDay(next, safeWeekIdx, safeDayIdx);
              applyState(next);
              setDayIdx(safeDayIdx + 1);
              setDayActionsOpen(false);
            }}
          >
            {days.length >= MAX_DAYS ? "7 days max" : "Duplicate"}
          </button>
          <button
            type="button"
            className="bk-actions-list__btn"
            disabled={safeDayIdx === 0}
            onClick={() => {
              applyState(moveDay(state, safeWeekIdx, safeDayIdx, -1));
              setDayIdx(safeDayIdx - 1);
              setDayActionsOpen(false);
            }}
          >
            Move left
          </button>
          <button
            type="button"
            className="bk-actions-list__btn"
            disabled={safeDayIdx >= days.length - 1}
            onClick={() => {
              applyState(moveDay(state, safeWeekIdx, safeDayIdx, 1));
              setDayIdx(safeDayIdx + 1);
              setDayActionsOpen(false);
            }}
          >
            Move right
          </button>
          <button
            type="button"
            className="bk-actions-list__btn bk-actions-list__btn--danger"
            disabled={days.length <= 1}
            onClick={() => {
              if (dayHasExercises(currentDay)) {
                setDayActionsOpen(false);
                setConfirmDeleteDay(true);
                return;
              }
              applyState(deleteDay(state, safeWeekIdx, safeDayIdx));
              setDayIdx(Math.max(0, safeDayIdx - 1));
              setDayActionsOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      </BuilderSheet>

      <CopyForwardSheet
        key={copyForwardOpen ? `cf-${safeWeekIdx}` : "cf-closed"}
        open={copyForwardOpen}
        onClose={() => setCopyForwardOpen(false)}
        fromWeek={safeWeekIdx + 1}
        state={state}
        unit={displayUnit}
        onApply={({ fromWeek, throughWeek, loadStep, unit, overwriteDeload }) => {
          const prev = state;
          const result = copyForward(state, {
            fromWeek,
            throughWeek,
            loadStep,
            unit,
            overwriteDeload,
          });
          if (result.error) {
            setError(new Error(result.error));
            return;
          }
          applyState(result.state);
          setCopyForwardOpen(false);
          showToast(
            `Copied week ${fromWeek} forward through week ${throughWeek}${
              loadStep ? ` (+${loadStep} ${unit}/wk)` : ""
            }`,
            prev
          );
        }}
      />

      {confirmDiscard ? (
        <div className="bk-builder-confirm" role="presentation">
          <button
            type="button"
            className="bk-sheet__backdrop"
            aria-label="Cancel"
            onClick={() => setConfirmDiscard(false)}
          />
          <div
            className="stack session-discard-confirm bk-builder-confirm__panel"
            role="alertdialog"
            aria-labelledby="bk-discard-draft-title"
          >
            <p id="bk-discard-draft-title" className="session-discard-confirm__title">
              Discard this draft?
            </p>
            <p className="muted small session-discard-confirm__body">
              It will be deleted. This cannot be undone.
            </p>
            <div className="row session-discard-confirm__actions">
              <button
                type="button"
                className="session-discard-confirm__discard"
                onClick={() => {
                  setConfirmDiscard(false);
                  void handleDiscardDraft();
                }}
              >
                Discard draft
              </button>
              <button
                ref={cancelDiscardRef}
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDiscard(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteDay ? (
        <div className="bk-builder-confirm" role="presentation">
          <button
            type="button"
            className="bk-sheet__backdrop"
            aria-label="Cancel"
            onClick={() => setConfirmDeleteDay(false)}
          />
          <div
            className="stack session-discard-confirm bk-builder-confirm__panel"
            role="alertdialog"
            aria-labelledby="bk-delete-day-title"
          >
            <p id="bk-delete-day-title" className="session-discard-confirm__title">
              Delete this day?
            </p>
            <p className="muted small session-discard-confirm__body">
              This day and its exercises will be removed from the block.
            </p>
            <div className="row session-discard-confirm__actions">
              <button
                type="button"
                className="session-discard-confirm__discard"
                onClick={() => {
                  applyState(deleteDay(state, safeWeekIdx, safeDayIdx));
                  setDayIdx(Math.max(0, safeDayIdx - 1));
                  setConfirmDeleteDay(false);
                }}
              >
                Delete day
              </button>
              <button
                ref={cancelDeleteDayRef}
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteDay(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteWeek ? (
        <div className="bk-builder-confirm" role="presentation">
          <button
            type="button"
            className="bk-sheet__backdrop"
            aria-label="Cancel"
            onClick={() => setConfirmDeleteWeek(false)}
          />
          <div
            className="stack session-discard-confirm bk-builder-confirm__panel"
            role="alertdialog"
            aria-labelledby="bk-delete-week-title"
          >
            <p id="bk-delete-week-title" className="session-discard-confirm__title">
              Delete this week?
            </p>
            <p className="muted small session-discard-confirm__body">
              This week and all its exercises will be removed from the block.
            </p>
            <div className="row session-discard-confirm__actions">
              <button
                type="button"
                className="session-discard-confirm__discard"
                onClick={() => {
                  applyState(deleteWeek(state, safeWeekIdx));
                  setWeekIdx(Math.max(0, safeWeekIdx - 1));
                  setConfirmDeleteWeek(false);
                }}
              >
                Delete week
              </button>
              <button
                ref={cancelDeleteWeekRef}
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteWeek(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BuilderToast
        message={toast?.message}
        onUndo={toast?.onUndo}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
