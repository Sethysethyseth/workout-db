const { validateBlockDraft, MAX_DAYS_PER_WEEK } = require("../../../src/blocks/blockFormat");
const { parseDelimited } = require("../../../src/blocks/parseDelimited");
const { historyToBlock } = require("../../../src/blocks/historyToBlock");

const HEADER =
  "Date,Workout Name,Exercise Name,Set Order,Weight,Reps,Seconds,RPE";

/**
 * Strong history rows. Each entry is one session (one date) for a title.
 * @param {{ title: string, date: string, weight?: number }[]} sessions
 */
function strongCsv(sessions) {
  const lines = [HEADER];
  for (const session of sessions) {
    const weight = session.weight != null ? session.weight : 100;
    lines.push(
      `${session.date} 10:00:00,${session.title},Squat,1,${weight},5,0,8`
    );
  }
  return lines.join("\n");
}

function datesEnding(lastIsoDate, count) {
  const last = new Date(`${lastIsoDate}T10:00:00Z`);
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(last.getTime() - i * 24 * 60 * 60 * 1000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function sessionsFor(title, isoDates, weight) {
  return isoDates.map((date, i) => ({
    title,
    date,
    weight: weight != null ? weight : 100 + i,
  }));
}

function capWarning(result) {
  return (result.warnings || []).find(
    (w) => w && typeof w.message === "string" && w.message.startsWith("Kept your ")
  );
}

describe("historyToBlock title cap", () => {
  test("9 titles keeps the 7 most-logged and warns with skipped titles in rank order", () => {
    const sessions = [
      ...sessionsFor("Nine", datesEnding("2026-03-09", 9)),
      ...sessionsFor("Eight", datesEnding("2026-03-08", 8)),
      ...sessionsFor("Seven", datesEnding("2026-03-07", 7)),
      ...sessionsFor("Six", datesEnding("2026-03-06", 6)),
      ...sessionsFor("Five", datesEnding("2026-03-05", 5)),
      ...sessionsFor("Four", datesEnding("2026-03-04", 4)),
      ...sessionsFor("Three", datesEnding("2026-03-03", 3)),
      // Both count 2. Zebra's last date is later, so it ranks ahead of Arms.
      ...sessionsFor("Zebra", ["2026-03-01", "2026-03-20"]),
      ...sessionsFor("Arms", ["2026-03-01", "2026-03-10"]),
    ];

    const result = historyToBlock(parseDelimited(strongCsv(sessions)), {
      historyWeeks: 1,
      sourceUnit: "lb",
    });

    expect(result).not.toBeNull();
    expect(result.block.weeks[0].days).toHaveLength(MAX_DAYS_PER_WEEK);
    expect(result.block.weeks[0].days.map((d) => d.name)).toEqual([
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ]);

    const warning = capWarning(result);
    expect(warning).toBeTruthy();
    expect(warning.message).toBe(
      "Kept your 7 most-logged workouts. Skipped: Zebra, Arms."
    );
    expect(
      (result.warnings || []).filter((w) =>
        String(w.message || "").startsWith("Kept your ")
      )
    ).toHaveLength(1);

    const validated = validateBlockDraft(result.block, { targetUnit: "lb" });
    const weekCap = (validated.errors || []).filter((e) =>
      String(e.message || "").includes("a week holds at most 7")
    );
    expect(weekCap).toEqual([]);
  });

  test("exactly 7 titles adds no warning and keeps the pre-cap day output", () => {
    const titles = ["Push", "Pull", "Legs", "Upper", "Lower", "Arms", "Full"];
    const sessions = titles.flatMap((title, index) => {
      const older = `2026-04-${String(index + 1).padStart(2, "0")}`;
      const newer = `2026-04-${String(index + 10).padStart(2, "0")}`;
      return [
        { title, date: older, weight: 100 + index },
        { title, date: newer, weight: 200 + index },
      ];
    });

    const result = historyToBlock(parseDelimited(strongCsv(sessions)), {
      historyWeeks: 2,
      sourceUnit: "lb",
    });

    expect(capWarning(result)).toBeUndefined();
    expect(result.warnings).toEqual([]);

    // Pre-cap contract: one day per title, most recent session only,
    // days oldest-first (these dates increase with title index).
    const expectedNames = titles;
    expect(result.block.weeks).toHaveLength(2);
    expect(result.block.weeks[0]).toEqual(result.block.weeks[1]);
    expect(result.block.weeks[0].days.map((d) => d.name)).toEqual(expectedNames);
    result.block.weeks[0].days.forEach((day, index) => {
      expect(day.exercises).toEqual([
        { name: "Squat", sets: [{ reps: 5, weight: 200 + index, rpe: 8 }] },
      ]);
    });
    expect(result.notices.sessionsUsed).toBe(7);
  });

  test("tie on count and date is broken by title ascending", () => {
    const high = ["One", "Two", "Three", "Four", "Five", "Six"].flatMap(
      (title, index) => sessionsFor(title, datesEnding("2026-05-10", 3 + index))
    );
    // Same count (1) and the same date. Apple sorts before Mango.
    const tied = [
      { title: "Mango", date: "2026-05-20", weight: 50 },
      { title: "Apple", date: "2026-05-20", weight: 60 },
    ];

    const result = historyToBlock(parseDelimited(strongCsv([...high, ...tied])), {
      historyWeeks: 1,
      sourceUnit: "lb",
    });

    const names = result.block.weeks[0].days.map((d) => d.name);
    expect(names).toContain("Apple");
    expect(names).not.toContain("Mango");
    expect(names).toHaveLength(7);
    expect(capWarning(result).message).toBe(
      "Kept your 7 most-logged workouts. Skipped: Mango."
    );

    const apple = result.block.weeks[0].days.find((d) => d.name === "Apple");
    expect(apple.exercises[0].sets[0].weight).toBe(60);
  });
});
