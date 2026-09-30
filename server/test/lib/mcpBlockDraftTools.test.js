const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = require("@modelcontextprotocol/sdk/inMemory.js");
const {
  createMcpServerForUser,
} = require("../../src/ai/mcpServer");

const BOUND_EMAIL = "seth@example.com";
const CLOSURE_USER_ID = "user-closure";

function parseToolPayload(result) {
  const text = result?.content?.[0]?.text;
  expect(typeof text).toBe("string");
  return JSON.parse(text);
}

async function withMcpClient(deps, fn) {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const server = createMcpServerForUser(CLOSURE_USER_ID, BOUND_EMAIL, deps);
  const client = new Client({ name: "bk11-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    return await fn(client);
  } finally {
    try {
      await client.close();
    } catch {
      // ignore
    }
    try {
      await server.close();
    } catch {
      // ignore
    }
  }
}

describe("MCP block draft tools", () => {
  test("both tools are listed with the required annotations", async () => {
    await withMcpClient({}, async (client) => {
      const listed = await client.listTools();
      const byName = Object.fromEntries(
        (listed.tools || []).map((t) => [t.name, t])
      );

      expect(byName.get_block_format).toBeTruthy();
      expect(byName.get_block_format.annotations).toEqual(
        expect.objectContaining({ readOnlyHint: true })
      );

      expect(byName.create_block_draft).toBeTruthy();
      expect(byName.create_block_draft.annotations).toEqual({
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      });
    });
  });

  test("create_block_draft ignores argument userId and uses the closure userId", async () => {
    const createDraftForUser = jest.fn(async () => ({
      error: "block_drafts_off",
    }));

    await withMcpClient({ createDraftForUser }, async (client) => {
      await client.callTool({
        name: "create_block_draft",
        arguments: {
          block: {
            format: "logchamp.block",
            version: 1,
            name: "X",
            unit: "lb",
            weeks: [
              {
                days: [
                  {
                    name: "A",
                    exercises: [{ name: "Squat", sets: [{ reps: 5 }] }],
                  },
                ],
              },
            ],
          },
          userId: "someone-else",
        },
      });

      expect(createDraftForUser).toHaveBeenCalledTimes(1);
      expect(createDraftForUser.mock.calls[0][0]).toBe(CLOSURE_USER_ID);
      expect(createDraftForUser.mock.calls[0][0]).not.toBe("someone-else");
    });
  });

  test("block_drafts_off comes back as an MCP error mentioning Profile -> AI access", async () => {
    const createDraftForUser = jest.fn(async () => ({
      error: "block_drafts_off",
    }));

    await withMcpClient({ createDraftForUser }, async (client) => {
      const result = await client.callTool({
        name: "create_block_draft",
        arguments: {
          block: {
            format: "logchamp.block",
            version: 1,
            name: "X",
            unit: "lb",
            weeks: [
              {
                days: [
                  {
                    name: "A",
                    exercises: [{ name: "Squat", sets: [{ reps: 5 }] }],
                  },
                ],
              },
            ],
          },
        },
      });

      expect(result.isError).toBe(true);
      const payload = parseToolPayload(result);
      expect(String(payload.error)).toContain("Profile -> AI access");
      expect(payload.boundAccount).toEqual({ email: BOUND_EMAIL });
    });
  });

  test("every response carries boundAccount", async () => {
    const createDraftForUser = jest.fn(async () => ({
      blockId: 7,
      name: "Draft",
      stats: { weeks: 1, days: 1, exercises: 1, sets: 1, timedSets: 0 },
      unmatchedExercises: [],
    }));

    await withMcpClient({ createDraftForUser }, async (client) => {
      const formatResult = await client.callTool({
        name: "get_block_format",
        arguments: {},
      });
      expect(formatResult.isError).not.toBe(true);
      const formatPayload = parseToolPayload(formatResult);
      expect(formatPayload.boundAccount).toEqual({ email: BOUND_EMAIL });
      expect(formatPayload.instructions).toEqual(expect.any(String));
      expect(formatPayload.example).toEqual(expect.any(Object));
      expect(formatPayload.jsonSchema).toEqual(expect.any(Object));

      const createResult = await client.callTool({
        name: "create_block_draft",
        arguments: {
          block: {
            format: "logchamp.block",
            version: 1,
            name: "X",
            unit: "kg",
            weeks: [
              {
                days: [
                  {
                    name: "A",
                    exercises: [{ name: "Squat", sets: [{ reps: 5 }] }],
                  },
                ],
              },
            ],
          },
        },
      });
      expect(createResult.isError).not.toBe(true);
      const createPayload = parseToolPayload(createResult);
      expect(createPayload.boundAccount).toEqual({ email: BOUND_EMAIL });
      expect(createPayload.blockId).toBe(7);
      expect(createPayload.message).toContain("Draft saved");
    });
  });
});
