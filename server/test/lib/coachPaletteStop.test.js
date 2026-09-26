const { getCoachConfig } = require("../../src/coach/config");
const { paletteErrorForStopReason } = require("../../src/controllers/coachController");

describe("paletteErrorForStopReason - truncation is not palette_invalid", () => {
  test("max_tokens returns a distinct 422 before any JSON.parse", () => {
    expect(paletteErrorForStopReason("max_tokens")).toEqual({
      status: 422,
      body: {
        error: "palette_truncated",
        message: "The model ran out of room.",
      },
    });
  });

  test("refusal keeps the existing palette_refused shape", () => {
    expect(paletteErrorForStopReason("refusal")).toEqual({
      status: 422,
      body: { error: "palette_refused" },
    });
  });

  test("a finished turn is not an error, so JSON.parse may proceed", () => {
    expect(paletteErrorForStopReason("end_turn")).toBeNull();
    expect(paletteErrorForStopReason(null)).toBeNull();
    expect(paletteErrorForStopReason(undefined)).toBeNull();
  });

  test("the truncated code is never palette_invalid", () => {
    const err = paletteErrorForStopReason("max_tokens");
    expect(err.body.error).not.toBe("palette_invalid");
  });
});

describe("getCoachConfig token ceiling", () => {
  test("MAX_TOKENS is 8000 so adaptive thinking shares the budget with the answer", () => {
    expect(getCoachConfig({}).maxTokens).toBe(8000);
  });
});

describe("coachTruncationNotice - the client one-liner", () => {
  // Mirrors the named export in CoachPanel.jsx so the unit lane can pin
  // the contract without loading JSX. The source pin below keeps them
  // from drifting.
  function coachTruncationNotice(stopReason) {
    return stopReason === "max_tokens" ? "This answer was cut short." : null;
  }

  test("only max_tokens surfaces the cut-short notice", () => {
    expect(coachTruncationNotice("max_tokens")).toBe("This answer was cut short.");
    expect(coachTruncationNotice("end_turn")).toBeNull();
    expect(coachTruncationNotice(null)).toBeNull();
    expect(coachTruncationNotice(undefined)).toBeNull();
  });

  test("CoachPanel.jsx exports the same helper body", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.join(__dirname, "../../../client/src/components/coach/CoachPanel.jsx"),
      "utf8"
    );
    expect(src).toMatch(
      /export function coachTruncationNotice\(stopReason\) \{\s*return stopReason === "max_tokens" \? "This answer was cut short\." : null;\s*\}/
    );
  });
});
