const { deriveConversationTitle } = require("../../src/coach/conversationTitle");

describe("deriveConversationTitle", () => {
  test("cuts a 120-character question to at most 80 characters plus ellipsis, on a word boundary", () => {
    const question = "word ".repeat(24);
    expect(question).toHaveLength(120);
    const title = deriveConversationTitle(question);
    expect(title.endsWith("...")).toBe(true);
    const body = title.slice(0, -3);
    expect(body.length).toBeLessThanOrEqual(80);
    expect(body.length).toBeGreaterThan(0);
    expect(question.startsWith(body)).toBe(true);
    expect(question.charAt(body.length)).toBe(" ");
    expect(body.endsWith(" ")).toBe(false);
  });

  test("collapses whitespace", () => {
    expect(deriveConversationTitle("  how   do I  ")).toBe("how do I");
  });

  test("uses a fallback for an empty question", () => {
    expect(deriveConversationTitle("")).toBe("Coach conversation");
    expect(deriveConversationTitle("   ")).toBe("Coach conversation");
  });
});
