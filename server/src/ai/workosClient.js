const WORKOS_COMPLETE_URL = "https://api.workos.com/authkit/oauth2/complete";

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

module.exports = {
  completeConnectorAuthorization,
};
