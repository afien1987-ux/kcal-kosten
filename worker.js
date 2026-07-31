const SUPABASE_URL = "https://gmhhadgakqlohcbjbdhi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9aaWLSI1aH40TuRD5aH2xQ_uMVt5cL-";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/claude" && request.method === "POST") {
      return handleClaude(request, env);
    }

    if (url.pathname === "/api/delete-account" && request.method === "POST") {
      return handleDeleteAccount(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleDeleteAccount(request, env) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY ist auf dem Worker nicht gesetzt. Siehe README." }, 500);
  }

  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) {
    return json({ error: "Nicht angemeldet." }, 401);
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) {
    return json({ error: "Sitzung ungültig oder abgelaufen." }, 401);
  }
  const user = await userRes.json();

  const delRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!delRes.ok) {
    const text = await delRes.text();
    return json({ error: "Löschen fehlgeschlagen: " + text }, 500);
  }

  return json({ ok: true });
}

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
