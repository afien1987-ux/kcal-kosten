# Kalorien & Kosten – Deployment auf Cloudflare Workers

Kalorienzähler kombiniert mit finanzieller Kalkulation: jede Zutat wird mit
Nährwerten und Einkaufspreis erfasst, Rezepte und Log-Einträge zeigen kcal
und Kosten pro Portion.

## Stand dieses Prototyps
- Zutaten, Rezepte, Log und Bilanz-Dashboard sind funktionsfähig.
- **Persistenz über Supabase**, mit Login (E-Mail + Passwort, offenes
  Sign-up). Jeder Account sieht nur seine eigenen Daten (Row Level Security).
  Setup siehe Abschnitt "Supabase einrichten" unten.
- **Kassenzettel-Scan ist aktiv** (Zutaten-Tab → "Kassenzettel fotografieren").
  Foto geht über `/api/claude` in `worker.js` an Claude, Artikel+Preis werden
  erkannt und gegen bestehende Zutaten abgeglichen; Ergebnis erst nach
  Bestätigung in einer Review-Liste übernommen. Fotos werden nicht
  gespeichert. Braucht den Anthropic API-Key aus Abschnitt 5 – ohne den
  zeigt der Scan-Button einen Fehler.

## 1. Supabase einrichten
1. Auf https://supabase.com registrieren/einloggen, neues Projekt anlegen
   (Name z. B. `kcal-kosten`, Region z. B. Frankfurt).
2. Im Projekt: **SQL Editor** → neue Query → Inhalt von `supabase/schema.sql`
   aus diesem Repo einfügen → **Run**. Das legt die vier Tabellen
   (`zutaten`, `rezepte`, `rezept_zutaten`, `log_eintraege`) inkl.
   Row-Level-Security an, sodass jeder Account nur seine eigenen Daten sieht.
3. **Project Settings → API**: `Project URL` und `anon public`-Key kopieren.
4. In `public/index.html` ganz oben im Script die beiden Konstanten
   `SUPABASE_URL` und `SUPABASE_ANON_KEY` mit diesen Werten ersetzen. Der
   anon-Key ist bewusst öffentlich nutzbar (kein Geheimnis) – die
   Row-Level-Security-Policies aus Schritt 2 schützen die Daten pro Account.
5. **Authentication → Sign In / Providers → Email**: Standardmäßig ist
   "Confirm email" aktiviert – neue Accounts müssen die Bestätigungsmail
   anklicken, bevor sie sich einloggen können. Das ist bei offenem Sign-up
   sinnvoll und muss nicht geändert werden.
6. **Authentication → URL Configuration → Site URL**: auf die Worker-URL
   setzen (z. B. `https://kcal-kosten.<dein-subdomain>.workers.dev`),
   sonst landen Bestätigungs-/Login-Links auf `localhost:3000`.

## 1a. Google-Login aktivieren (optional)
Die App hat schon einen "Mit Google anmelden"-Button — der funktioniert erst,
wenn der Google-Provider in Supabase eingerichtet ist:

1. In der [Google Cloud Console](https://console.cloud.google.com/) ein
   Projekt anlegen (oder ein bestehendes nutzen).
2. **APIs & Services → OAuth consent screen**: Typ "External", App-Name
   z. B. "Kalorien & Kosten", eigene E-Mail als Support-/Kontaktadresse.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   Typ "Web application":
   - **Authorized JavaScript origins**: die Worker-URL (z. B.
     `https://kcal-kosten.<dein-subdomain>.workers.dev`)
   - **Authorized redirect URIs**: `https://<dein-projekt>.supabase.co/auth/v1/callback`
     (Projekt-Ref aus Schritt 1, Abschnitt "Supabase einrichten")
4. Client-ID und Client-Secret kopieren.
5. Supabase Dashboard → **Authentication → Providers → Google** → aktivieren,
   Client-ID + Secret einfügen → Speichern.

## 1b. Eigenen E-Mail-Versand einrichten (wichtig für echten Betrieb)
Ohne diesen Schritt nutzt Supabase seinen eingebauten Test-Mailer mit einem
sehr niedrigen Limit (nur wenige E-Mails pro Stunde) – das reicht nicht für
echte Registrierungen und führt schnell zu "email rate limit exceeded".

Variante ohne eigene Domain: Gmail als SMTP-Server.

1. Auf dem Gmail-Konto, das als Absender dienen soll: 2-Faktor-Authentifizierung
   aktivieren (falls noch nicht aktiv) unter
   [myaccount.google.com/security](https://myaccount.google.com/security).
2. Dort ein **App-Passwort** erzeugen: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   → App "Mail", Gerät z. B. "Supabase kcal-kosten" → Generieren → das 16-stellige
   Passwort kopieren (nicht das normale Gmail-Passwort).
3. Supabase Dashboard → **Authentication → Emails → SMTP Settings** (oder
   Authentication → Settings, Abschnitt "SMTP Settings") → **Enable Custom SMTP**:
   - Sender email: die Gmail-Adresse
   - Sender name: z. B. `Kalorien & Kosten`
   - Host: `smtp.gmail.com`
   - Port: `465`
   - Username: die volle Gmail-Adresse
   - Password: das App-Passwort aus Schritt 2
4. Speichern. Danach hat der Versand Gmails reguläres Limit (500 E-Mails/Tag)
   statt Supabase's Test-Limit – für eine private App mehr als genug.

## 1c. Konto-Löschung aktivieren (Menü → Profileinstellungen → Konto löschen)
Nutzer können sich nicht selbst über den normalen Supabase-Client löschen –
das braucht den Service-Role-Key, der **niemals** im Frontend landen darf.
Der Worker stellt dafür die Route `/api/delete-account` bereit, die den
Service-Role-Key nur serverseitig nutzt.

1. Supabase Dashboard → **Project Settings → API** → Abschnitt "Project API
   keys" → `service_role`-Key kopieren (⚠️ nicht mit dem `anon`-Key
   verwechseln – dieser Key umgeht Row Level Security komplett).
2. Cloudflare Worker-Projekt → **Settings → Variables and Secrets** → neues
   Secret:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Wert: der Key aus Schritt 1
   - Typ: **Secret**
3. Speichern, ggf. einmal manuell redeployen (Deployments → Retry/Redeploy).

Ohne diesen Schritt zeigt "Konto endgültig löschen" einen Fehler an, der
Rest der App funktioniert trotzdem normal.

## 1d. Ko-fi-Link eintragen
Im Menü gibt es "Kaffee spendieren (Ko-fi)". In `public/index.html` ganz
oben im Script die Konstante `KOFI_URL` durch den eigenen Ko-fi-Link
ersetzen (z. B. `https://ko-fi.com/deinname`).

## 2. Repo auf GitHub anlegen
1. Neues Repo erstellen, z. B. `kcal-kosten`.
2. Diese Dateien/Ordner hochladen (flach, ohne `.git`):
   - `worker.js`
   - `wrangler.jsonc`
   - `public/index.html` (mit eingetragenen Supabase-Werten aus Schritt 1)

## 3. Cloudflare Worker einrichten
1. Im Cloudflare Dashboard: **Workers & Pages → Create → Import a repository**.
2. Das GitHub-Repo auswählen und verbinden.
3. Cloudflare erkennt `wrangler.jsonc` automatisch (Build-Command bleibt leer,
   es gibt keinen Build-Schritt).
4. Deploy anstoßen.

## 4. Testen
Die Worker-URL öffnen (z. B. `kcal-kosten.<dein-subdomain>.workers.dev`),
Account registrieren, Bestätigungsmail anklicken, anmelden.

## 5. API-Key für Kassenzettel-Scan
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
