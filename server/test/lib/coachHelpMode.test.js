const { getAppGuide } = require("../../src/coach/appGuide");
const { parseCoachRequest } = require("../../src/coach/coachRequest");
const { APP_GUIDE_LEAD, buildCoachSystemBlocks } = require("../../src/coach/prompt");

const base = {
  primary: { workoutCount: 4, secret: "should-not-appear" },
  unit: "kg",
  today: "2026-10-08",
  weeks: 4,
  fromLabel: "2026-09-11",
  toLabel: "2026-10-08",
};

describe("getAppGuide", () => {
  test("is non-empty and under 12,000 characters", () => {
    const guide = getAppGuide();
    expect(guide.length).toBeGreaterThan(0);
    expect(guide.length).toBeLessThan(12000);
  });
});

describe("coachRequest help and general focus", () => {
  test("accepts help and general, rejects nope", () => {
    expect(parseCoachRequest({ question: "How do I start a block?", focus: { type: "help" } }).value.focus).toEqual({
      type: "help",
    });
    expect(parseCoachRequest({ question: "How is bench?", focus: { type: "general" } }).value.focus).toEqual({
      type: "general",
    });
    const rejected = parseCoachRequest({ question: "q", focus: { type: "nope" } });
    expect(rejected.ok).toBe(false);
    expect(rejected.error).toMatch(/focus\.type/);
  });
});

describe("buildCoachSystemBlocks help and general", () => {
  test("help contains the guide and no data block, even when a summary is passed", () => {
    const blocks = buildCoachSystemBlocks({ ...base, focus: { type: "help" } });
    const joined = blocks.map((block) => block.text).join("\n");
    expect(joined).toContain(APP_GUIDE_LEAD);
    expect(joined).toContain(getAppGuide().slice(0, 80));
    expect(joined).not.toContain("should-not-appear");
    expect(joined).not.toContain("workoutCount");
    expect(joined).not.toContain("Training data");
    expect(blocks.some((block) => block.text.startsWith("Training data"))).toBe(false);
    expect(blocks).toHaveLength(3);
  });

  test("general contains the guide and the training data", () => {
    const blocks = buildCoachSystemBlocks({ ...base, focus: { type: "general" } });
    const joined = blocks.map((block) => block.text).join("\n");
    expect(joined).toContain(APP_GUIDE_LEAD);
    expect(joined).toContain(getAppGuide().slice(0, 80));
    expect(joined).toContain("should-not-appear");
    expect(joined).toContain("Training data for the lifter's selected window");
    expect(blocks).toHaveLength(4);
  });
});
