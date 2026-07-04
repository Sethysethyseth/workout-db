const { getStimulusMultiplier } = require("../../src/analytics");

describe("getStimulusMultiplier", () => {
  test.each([
    [0, 1.0],
    [1, 1.0],
    [2, 0.95],
    [3, 0.85],
    [4, 0.6],
    [5, 0.3],
    [10, 0.3],
  ])("rir %p -> multiplier %p", (rir, expected) => {
    expect(getStimulusMultiplier(rir)).toBe(expected);
  });

  test("null rir -> null (unweighted)", () => {
    expect(getStimulusMultiplier(null)).toBe(null);
  });

  test("undefined rir -> null (unweighted)", () => {
    expect(getStimulusMultiplier(undefined)).toBe(null);
  });
});
