const { deriveEffortRir } = require("../../src/analytics");

describe("deriveEffortRir", () => {
  test("explicit RIR wins over a coexisting RPE", () => {
    expect(deriveEffortRir({ rir: 2, rpe: 8 })).toBe(2);
  });

  test("explicit RIR 0 wins even against an inconsistent RPE", () => {
    expect(deriveEffortRir({ rir: 0, rpe: 5 })).toBe(0);
  });

  test("RPE alone converts as RIR = 10 - RPE", () => {
    expect(deriveEffortRir({ rir: null, rpe: 8 })).toBe(2);
  });

  test("fractional RPE yields fractional RIR, not rounded", () => {
    expect(deriveEffortRir({ rir: null, rpe: 8.5 })).toBe(1.5);
  });

  test("RPE above 10 clamps to 0 RIR", () => {
    expect(deriveEffortRir({ rir: null, rpe: 11 })).toBe(0);
  });

  test("RPE 10 (true failure) maps to 0 RIR", () => {
    expect(deriveEffortRir({ rir: null, rpe: 10 })).toBe(0);
  });

  test("neither signal -> null", () => {
    expect(deriveEffortRir({ rir: null, rpe: null })).toBeNull();
    expect(deriveEffortRir({ rir: undefined, rpe: undefined })).toBeNull();
    expect(deriveEffortRir({})).toBeNull();
  });
});
