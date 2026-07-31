export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/claude" && request.method === "POST") {
      return handleClaude(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleClaude(request, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: "ANTHROPIC_API_KEY ist auf dem Worker nicht gesetzt. Siehe README." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Ungültiger Request-Body." }, 400);
  }

  if (!payload || !Array.isArray(payload.messages)) {
    return json({ error: "Feld 'messages' fehlt oder ist ungültig." }, 400);
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: payload.max_tokens || 1000,
      system: payload.system,
      messages: payload.messages,
    }),
  });

  const text = await anthropicRes.text();
  return new Response(text, {
    status: anthropicRes.status,
    headers: { "content-type": "application/json" },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
