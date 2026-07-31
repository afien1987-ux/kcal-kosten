# Kalorien & Kosten – Deployment auf Cloudflare Workers

Kalorienzähler kombiniert mit finanzieller Kalkulation: jede Zutat wird mit
Nährwerten und Einkaufspreis erfasst, Rezepte und Log-Einträge zeigen kcal
und Kosten pro Portion.

## Stand dieses Prototyps
- Zutaten, Rezepte, Log und Bilanz-Dashboard sind funktionsfähig.
- **Keine Persistenz.** Der Zustand lebt nur im Browser-Tab (React State) und
  geht beim Neuladen verloren. Das ist der nächste Ausbauschritt (Supabase
  oder ähnliches).
- **Kein Kassenzettel-Scan.** Preise werden aktuell manuell eingegeben. Die
  `/api/claude`-Route in `worker.js` ist bereits vorbereitet (gleiches Muster
  wie bei der Vorratsküche-App), wird aber noch nicht vom Frontend
  aufgerufen. Ein Anthropic API-Key ist deshalb **derzeit nicht nötig** –
  Schritt 4 kann übersprungen werden, bis der Scan-Import gebaut ist.

## 1. Repo auf GitHub anlegen
1. Neues Repo erstellen, z. B. `kalorien-kosten-tracker`.
2. Diese drei Dateien/Ordner hochladen (flach, ohne `.git`):
   - `worker.js`
   - `wrangler.jsonc`
   - `public/index.html`

## 2. Cloudflare Worker einrichten
1. Im Cloudflare Dashboard: **Workers & Pages → Create → Import a repository**.
2. Das GitHub-Repo auswählen und verbinden.
3. Cloudflare erkennt `wrangler.jsonc` automatisch (Build-Command bleibt leer,
   es gibt keinen Build-Schritt).
4. Deploy anstoßen.

## 3. Testen
Die Worker-URL öffnen (z. B. `kalorien-kosten-tracker.<dein-subdomain>.workers.dev`).

## 4. Später: API-Key für Kassenzettel-Scan (noch nicht benötigt)
Sobald der Scan-Import gebaut ist:
1. Auf https://console.anthropic.com registrieren/einloggen (eigenes Konto,
   getrennt vom claude.ai-Abo, mit eigenem Guthaben/Abrechnung).
2. Unter **API Keys** einen neuen Key erstellen.
3. Im Worker-Projekt: **Settings → Variables and Secrets** → neues Secret:
   - Name: `ANTHROPIC_API_KEY`
   - Wert: der Key aus Schritt 1
   - Typ: **Secret** (nicht Text/Klartext-Variable)
4. Speichern, ggf. einmal manuell redeployen (Deployments → Retry/Redeploy).

## Hinweise
- Alle künftigen KI-Aufrufe laufen über die Route `/api/claude`, die
  `worker.js` serverseitig an die Anthropic API weiterreicht – der Key
  bleibt dadurch auf dem Server und landet nie im Browser.
- Kein Build-Schritt: `public/index.html` lädt React, Babel Standalone
  (für JSX im Browser) und Tailwind über CDN.
