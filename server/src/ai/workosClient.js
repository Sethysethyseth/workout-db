const WORKOS_COMPLETE_URL = "https://api.workos.com/authkit/oauth2/complete";
const WORKOS_API_BASE = "https://api.workos.com";
const WORKOS_LIST_LIMIT = 100;

function requireWorkosApiKey() {
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) {
    throw new Error("WorkOS connector authentication is not configured");
  }
  return apiKey;
}

function workosError(message, status, counts) {
  const error = new Error(message);
  error.status = status;
  if (counts) {
    error.sessionsRevoked = counts.sessionsRevoked;
    error.applicationsRemoved = counts.applicationsRemoved;
  }
  return error;
}

async function readBody(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function authorizedApplicationId(entry) {
  if (!entry || typeof entry !== "object") return null;
  if (entry.application && typeof entry.application.id === "string") {
    return entry.application.id;
  }
  if (typeof entry.application?.client_id === "string") {
    return entry.application.client_id;
  }
  if (typeof entry.id === "string") return entry.id;
  return null;
}

async function workosJson(fetchImpl, url, init, counts) {
  const response = await fetchImpl(url, init);
  if (!response.ok) {
    const body = await readBody(response);
    throw workosError(
      `WorkOS request failed (${response.status}): ${body}`,
      response.status,
      counts
    );
  }
  if (response.status === 204) return null;
  const text = await readBody(response);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw workosError(
      "WorkOS returned invalid JSON",
      response.status,
      counts
    );
  }
}

async function listAllPages(fetchImpl, apiKey, path, counts) {
  const items = [];
  const seenCursors = new Set();
  let after = null;

  for (;;) {
    const url = new URL(`${WORKOS_API_BASE}${path}`);
    url.searchParams.set("limit", String(WORKOS_LIST_LIMIT));
    if (after) url.searchParams.set("after", after);

    const payload = await workosJson(
      fetchImpl,
      url.toString(),
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      counts
    );
    const data = Array.isArray(payload?.data) ? payload.data : [];
    items.push(...data);

    const nextAfter = payload?.list_metadata?.after;
    if (!nextAfter || seenCursors.has(nextAfter)) break;
    seenCursors.add(nextAfter);
    after = nextAfter;
  }

  return items;
}

async function completeConnectorAuthorization(user, externalAuthId) {
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) {
    throw new Error("WorkOS connector authentication is not configured");
  }

  const response = await fetch(WORKOS_COMPLETE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_auth_id: externalAuthId,
      user: {
        id: user.id,
        email: user.email,
      },
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    const error = new Error(
      `WorkOS connector completion failed (${response.status}): ${body}`
    );
    error.status = response.status;
    error.responseBody = body;
    throw error;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error("WorkOS connector completion returned invalid JSON");
  }
  if (typeof payload.redirect_uri !== "string" || !payload.redirect_uri) {
    throw new Error("WorkOS connector completion omitted the redirect URI");
  }
  return payload.redirect_uri;
}

/**
 * Look up the WorkOS user for a LogChamp User.id (stored as external_id),
 * revoke every AuthKit session, and delete every authorized Connect app.
 * fetchImpl is injectable for unit tests (same seam as streamAnthropic).
 */
async function revokeWorkosConnectorBinding(
  externalId,
  { fetchImpl = fetch } = {}
) {
  const apiKey = requireWorkosApiKey();
  const counts = { sessionsRevoked: 0, applicationsRemoved: 0 };

  const lookupUrl = `${WORKOS_API_BASE}/user_management/users/external_id/${encodeURIComponent(
    externalId
  )}`;
  const lookupResponse = await fetchImpl(lookupUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (lookupResponse.status === 404) {
    return { found: false, sessionsRevoked: 0, applicationsRemoved: 0 };
  }
  if (!lookupResponse.ok) {
    const body = await readBody(lookupResponse);
    throw workosError(
      `WorkOS user lookup failed (${lookupResponse.status}): ${body}`,
      lookupResponse.status,
      counts
    );
  }
  const userText = await readBody(lookupResponse);
  let user;
  try {
    user = JSON.parse(userText);
  } catch {
    throw workosError("WorkOS user lookup returned invalid JSON", 502, counts);
  }
  if (!user || typeof user.id !== "string" || !user.id) {
    throw workosError("WorkOS user lookup omitted the user id", 502, counts);
  }

  const workosUserId = user.id;
  const encodedUserId = encodeURIComponent(workosUserId);

  const sessions = await listAllPages(
    fetchImpl,
    apiKey,
    `/user_management/users/${encodedUserId}/sessions`,
    counts
  );
  for (const session of sessions) {
    if (!session || typeof session.id !== "string") continue;
    await workosJson(
      fetchImpl,
      `${WORKOS_API_BASE}/user_management/sessions/revoke`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: session.id }),
      },
      counts
    );
    counts.sessionsRevoked += 1;
  }

  const applications = await listAllPages(
    fetchImpl,
    apiKey,
    `/user_management/users/${encodedUserId}/authorized_applications`,
    counts
  );
  for (const entry of applications) {
    const applicationId = authorizedApplicationId(entry);
    if (!applicationId) continue;
    await workosJson(
      fetchImpl,
      `${WORKOS_API_BASE}/user_management/users/${encodedUserId}/authorized_applications/${encodeURIComponent(
        applicationId
      )}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      counts
    );
    counts.applicationsRemoved += 1;
  }

  return {
    found: true,
    sessionsRevoked: counts.sessionsRevoked,
    applicationsRemoved: counts.applicationsRemoved,
  };
}

module.exports = {
  completeConnectorAuthorization,
  revokeWorkosConnectorBinding,
};
