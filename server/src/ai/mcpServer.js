const { z } = require("zod");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const {
  loadSummary,
  loadExerciseDetail,
  loadExerciseRoster,
  loadRecentSessions,
} = require("./analyticsAccess");
const {
  DEFAULT_MAX_EXERCISES,
  estimatePayloadSize,
  fitSummaryForTool,
  withHonestyNote,
  MAX_TOOL_PAYLOAD_CHARS,
} = require("./toolPayloads");

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function toolText(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

function toolError(message) {
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
  };
}

function parseRequiredDate(raw, name, endOfDay = false) {
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      ok: false,
      error: `${name} is required (a date or ISO 8601 datetime)`,
    };
  }
  const trimmed = raw.trim();
  const date =
    endOfDay && DATE_ONLY_RE.test(trimmed)
      ? new Date(`${trimmed}T23:59:59.999Z`)
      : new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return {
      ok: false,
      error: `${name} must be a valid date or ISO 8601 datetime`,
    };
  }
  return { ok: true, date };
}

function parseOptionalDate(raw, name, endOfDay = false) {
  if (raw == null || raw === "") return { ok: true, date: null };
  if (typeof raw !== "string") {
    return { ok: false, error: `${name} must be a date or ISO 8601 datetime` };
  }
  const trimmed = raw.trim();
  const date =
    endOfDay && DATE_ONLY_RE.test(trimmed)
      ? new Date(`${trimmed}T23:59:59.999Z`)
      : new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return {
      ok: false,
      error: `${name} must be a valid date or ISO 8601 datetime`,
    };
  }
  return { ok: true, date };
}

function guardPayloadSize(payload) {
  const size = estimatePayloadSize(payload);
  if (size <= MAX_TOOL_PAYLOAD_CHARS) return payload;
  const shrunk = {
    error: "payload_too_large",
    message: `Result was ${size} characters after trimming; refusing to return over the ${MAX_TOOL_PAYLOAD_CHARS} character tool budget.`,
    truncation: payload.truncation ?? null,
  };
  return shrunk;
}

/**
 * Fresh McpServer per call, closed over connectorUserId so tool handlers
 * never read identity from model-supplied arguments.
 */
function createMcpServerForUser(connectorUserId) {
  const server = new McpServer({
    name: "logchamp",
    version: "1.0.0",
  });

  server.registerTool(
    "get_training_summary",
    {
      title: "Training summary",
      description:
        "Returns LogChamp's already-computed training summary for a required date range (from and to). " +
        "The payload includes per-muscle and per-exercise metrics, balance, execution fidelity, PRs, and " +
        "meta.effortCoverage / meta.honestyNotes. Every number is precomputed by LogChamp's deterministic " +
        "analytics engine — do not recalculate volume, e1RM, trends, or ratios from this data. " +
        "Surface coverage caveats and honesty notes to the user rather than smoothing them over.",
      inputSchema: {
        from: z
          .string()
          .describe("Range start: date (YYYY-MM-DD) or ISO 8601 datetime"),
        to: z
          .string()
          .describe(
            "Range end: date (YYYY-MM-DD, inclusive through end of day) or ISO 8601 datetime"
          ),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ from: rawFrom, to: rawTo }) => {
      const fromParsed = parseRequiredDate(rawFrom, "from");
      if (!fromParsed.ok) return toolError(fromParsed.error);
      const toParsed = parseRequiredDate(rawTo, "to", true);
      if (!toParsed.ok) return toolError(toParsed.error);
      if (fromParsed.date.getTime() > toParsed.date.getTime()) {
        return toolError("from must not be after to");
      }

      const summary = await loadSummary(connectorUserId, {
        from: fromParsed.date,
        to: toParsed.date,
      });
      const trimmed = fitSummaryForTool(summary, {
        maxExercises: DEFAULT_MAX_EXERCISES,
      });
      return toolText(guardPayloadSize(trimmed));
    }
  );

  server.registerTool(
    "get_exercise_detail",
    {
      title: "Exercise detail",
      description:
        "Returns LogChamp's already-computed detail for one exercise (PRs, top sets, matched-effort trend, " +
        "rep targets, weekly volume). Pass exactly one of exerciseId or userExerciseId; from/to are optional. " +
        "Numbers are precomputed — do not re-derive e1RM, trends, or volume. Coverage caveats travel with the " +
        "payload (effortCoverage from the same window when available); surface them to the user instead of " +
        "presenting bare numbers as high-confidence.",
      inputSchema: {
        exerciseId: z
          .string()
          .optional()
          .describe("Catalog exercise id (mutually exclusive with userExerciseId)"),
        userExerciseId: z
          .union([z.string(), z.number()])
          .optional()
          .describe("User-defined exercise id (mutually exclusive with exerciseId)"),
        from: z
          .string()
          .optional()
          .describe("Optional range start: date or ISO 8601 datetime"),
        to: z
          .string()
          .optional()
          .describe(
            "Optional range end: date (inclusive end-of-day) or ISO 8601 datetime"
          ),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async (args) => {
      const rawExerciseId = args.exerciseId;
      const rawUserExerciseId =
        args.userExerciseId == null ? undefined : String(args.userExerciseId);
      const hasExerciseId =
        typeof rawExerciseId === "string" && rawExerciseId.trim() !== "";
      const hasUserExerciseId =
        typeof rawUserExerciseId === "string" && rawUserExerciseId.trim() !== "";

      if (hasExerciseId === hasUserExerciseId) {
        return toolError(
          "exactly one of exerciseId or userExerciseId is required"
        );
      }

      let userExerciseId;
      if (hasUserExerciseId) {
        userExerciseId = Number(rawUserExerciseId.trim());
        if (!Number.isInteger(userExerciseId)) {
          return toolError("userExerciseId must be an integer");
        }
      }

      const fromParsed = parseOptionalDate(args.from, "from");
      if (!fromParsed.ok) return toolError(fromParsed.error);
      const toParsed = parseOptionalDate(args.to, "to", true);
      if (!toParsed.ok) return toolError(toParsed.error);
      if (
        fromParsed.date &&
        toParsed.date &&
        fromParsed.date.getTime() > toParsed.date.getTime()
      ) {
        return toolError("from must not be after to");
      }

      const detail = await loadExerciseDetail(connectorUserId, {
        exerciseId: hasExerciseId ? rawExerciseId.trim() : undefined,
        userExerciseId,
        from: fromParsed.date ?? undefined,
        to: toParsed.date ?? undefined,
      });

      if (detail === null) {
        return toolError("No logged sets for that exercise");
      }

      // buildExerciseDetail has no meta - attach coverage from the same window.
      let payload = detail;
      if (fromParsed.date && toParsed.date) {
        try {
          const summary = await loadSummary(connectorUserId, {
            from: fromParsed.date,
            to: toParsed.date,
          });
          const coverage = summary?.meta?.effortCoverage;
          if (coverage !== undefined) {
            payload = {
              ...payload,
              meta: {
                effortCoverage: coverage,
                honestyNotes: Array.isArray(summary.meta?.honestyNotes)
                  ? summary.meta.honestyNotes.slice()
                  : [],
              },
            };
          } else {
            payload = withHonestyNote(
              payload,
              "Effort coverage is unknown for this view."
            );
          }
        } catch {
          payload = withHonestyNote(
            payload,
            "Effort coverage is unknown for this view."
          );
        }
      } else {
        payload = withHonestyNote(
          payload,
          "Effort coverage is unknown for this view (no from/to window was provided to align with a summary)."
        );
      }

      return toolText(guardPayloadSize(payload));
    }
  );

  server.registerTool(
    "list_exercises",
    {
      title: "Exercise roster",
      description:
        "Returns the user's exercise roster from LogChamp analytics, most-recently-trained first. " +
        "With activeOnly true (default), only exercises trained in the trailing 8 weeks are included. " +
        "Session counts and last-performed dates are precomputed — do not recalculate them. " +
        "If the roster is empty or sparse, say so plainly rather than inventing history.",
      inputSchema: {
        activeOnly: z
          .boolean()
          .optional()
          .describe(
            "When true (default), only exercises trained in the last 8 weeks"
          ),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ activeOnly }) => {
      const roster = await loadExerciseRoster(connectorUserId, {
        activeOnly: activeOnly !== false,
      });
      return toolText(guardPayloadSize(roster));
    }
  );

  server.registerTool(
    "get_recent_sessions",
    {
      title: "Recent sessions",
      description:
        "Returns recent workout session headers only: date, name, exercise count, and set count. " +
        "It never returns individual sets. Counts are precomputed from stored sessions — do not " +
        "re-derive them. Prefer this for 'what did I train lately' questions; use get_training_summary " +
        "for computed metrics. Do not invent set-level detail that is not in the payload.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max sessions to return (default 10, max 50)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ limit }) => {
      const capped =
        limit == null ? 10 : Math.min(50, Math.max(1, Number(limit) || 10));
      const result = await loadRecentSessions(connectorUserId, {
        limit: capped,
      });
      return toolText(guardPayloadSize(result));
    }
  );

  return server;
}

/**
 * Express handler for POST/GET/DELETE /mcp. Builds a fresh server+transport
 * per request (stateless Streamable HTTP) so identity never leaks across users.
 */
async function handleMcpRequest(req, res) {
  const connectorUserId = req.connectorUserId;
  if (!connectorUserId) {
    return res.status(401).json({
      error: "unauthorized",
      error_description: "Authorization needed",
    });
  }

  const server = createMcpServerForUser(connectorUserId);
  const transport = new StreamableHTTPServerTransport({
    // Stateless: no shared session map across tenants. Fresh instance per request.
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[mcp] request failed", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  } finally {
    try {
      await transport.close();
    } catch {
      // ignore close errors
    }
  }
}

module.exports = {
  handleMcpRequest,
  createMcpServerForUser,
};
