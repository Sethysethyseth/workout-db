/**
 * Owner-scoped access to coach conversations. Every query filters on userId.
 * Another user's id is a miss (callers return 404). No provider calls.
 */

const PAGE_SIZE = 20;

function focusTypeOf(focus) {
  if (!focus || typeof focus !== "object" || Array.isArray(focus)) return null;
  return typeof focus.type === "string" ? focus.type : null;
}

function findOwned(client, userId, id) {
  return client.coachConversation.findFirst({
    where: { userId, id },
    select: { id: true },
  });
}

/**
 * After a successful ask: create the conversation when needed, store the
 * question and the marker-stripped answer, then bump updatedAt.
 * Returns the conversation id, or null when the id is not this user's.
 */
async function saveSuccessfulExchange(
  client,
  { userId, conversationId, question, answer, title, focus }
) {
  return client.$transaction(async (tx) => {
    let id = conversationId ?? null;
    if (id == null) {
      const created = await tx.coachConversation.create({
        data: {
          userId,
          title,
          focus: focus ?? null,
        },
        select: { id: true },
      });
      id = created.id;
    } else {
      const owned = await tx.coachConversation.findFirst({
        where: { userId, id },
        select: { id: true },
      });
      if (!owned) return null;
    }

    await tx.coachMessage.create({
      data: { conversationId: id, role: "user", content: question },
    });
    await tx.coachMessage.create({
      data: { conversationId: id, role: "coach", content: answer },
    });
    await tx.coachConversation.updateMany({
      where: { userId, id },
      data: { updatedAt: new Date() },
    });
    return id;
  });
}

async function listConversations(client, { userId, before }) {
  const rows = await client.coachConversation.findMany({
    where: before ? { userId, updatedAt: { lt: before } } : { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      title: true,
      focus: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = page[page.length - 1];
  return {
    items: page.map((row) => ({
      id: row.id,
      title: row.title,
      focusType: focusTypeOf(row.focus),
      updatedAt: row.updatedAt.toISOString(),
      messageCount: row._count.messages,
    })),
    nextBefore: hasMore && last ? last.updatedAt.toISOString() : null,
  };
}

async function getConversation(client, userId, id) {
  const row = await client.coachConversation.findFirst({
    where: { userId, id },
    select: {
      id: true,
      title: true,
      focus: true,
      messages: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { role: true, content: true, createdAt: true },
      },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    focus: row.focus ?? null,
    messages: row.messages.map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

function deleteConversation(client, userId, id) {
  return client.coachConversation.deleteMany({
    where: { userId, id },
  });
}

function deleteAllConversations(client, userId) {
  return client.coachConversation.deleteMany({
    where: { userId },
  });
}

module.exports = {
  PAGE_SIZE,
  findOwned,
  saveSuccessfulExchange,
  listConversations,
  getConversation,
  deleteConversation,
  deleteAllConversations,
};
