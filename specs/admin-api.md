# Spec: Admin-API für control-plane-Anbindung

## Problem/Ziel

Prized hat aktuell keinen eigenen Backend/API-Layer — `server/index.js` liefert
nur die gebaute SPA aus, alle Account-Daten leben ausschließlich in Supabase
und werden vom Client direkt (RLS-geschützt, nur pro eingeloggtem User)
gelesen/geschrieben. Damit das `control-plane`-Backend eine CRM-Ansicht
("wie viele Accounts gibt es, welche, Bearbeitung von außen") und eine
Nutzungs-Auswertung (Spiele/Tag, Ø Spieldauer, Aktivität) bauen kann, braucht
es einen serverseitigen Weg, an diese Daten zu kommen und Accounts zu
moderieren — analog zu Doewes `/api/admin/*`-Endpoints
(`DOEWE_SERVICE_TOKEN`).

Dieser Layer läuft **in Prized**, nicht in control-plane, damit der mächtige
Supabase `service_role`-Key (umgeht RLS vollständig) nur in einer App liegt
und Prized selbst bestimmt, was "sperren"/"löschen" bedeutet.

## User Stories

- Als Betreiber will ich im control-plane sehen, wie viele Prized-Accounts es
  gibt, wann sie sich registriert haben und wann sie zuletzt aktiv waren.
- Als Betreiber will ich einen Account von außen sperren oder löschen können,
  ohne in die Supabase-Konsole zu müssen.
- Als Betreiber will ich sehen, wie viele Runden pro Tag gespielt werden, wie
  lang eine Runde im Schnitt dauert, und welche Decks am meisten genutzt
  werden — um die App gezielt zu verbessern.

## Akzeptanzkriterien

Alle Endpoints unter `/api/admin/*`, Auth: `Authorization: Bearer <PRIZED_SERVICE_TOKEN>`
(neue Env-Var, analog `DOEWE_SERVICE_TOKEN`). Fehlt/falsch → `401`. Diese
Endpoints laufen serverseitig gegen Supabase mit dem `service_role`-Key
(neue Env-Var `SUPABASE_SERVICE_ROLE_KEY`, **niemals** `VITE_`-Prefix — darf
nicht ins Client-Bundle).

**Demo-Accounts ausschließen:** Prized hat keine Demo-Account-Falle wie Doewe
(keine öffentliche Seed-Route) — die beiden Demo-Decks (`dragapult`,
`ragingbolt`) sind rein clientseitig und gehören zu keinem echten Account,
tauchen also in Supabase-Auswertungen nicht auf. Kein Ausschluss nötig.

**Offline-Runden** (`public.rounds.m = 'offline'`, Migration
`supabase/004_add_round_mode.sql`): Runden mit echten Karten. Die Zeit stoppt
die App, die Treffer trägt der Spieler selbst ein. Sie zählen in allen
**Rundenzahlen** mit (Aktivität). In **Ø-Dauer und Ø-Genauigkeit** fließen nur
digitale Runden (`m is null`) ein, weil Offline-Werte damit nicht vergleichbar
sind. Die Offline-Zähler sind additive Felder; bestehende Felder behalten ihren
Namen und Typ.

1. **`GET /api/admin/stats`**
   Given ein gültiger Service-Token,
   When der Endpoint aufgerufen wird,
   Then liefert er `{ totalUsers, totalDecks, totalRounds, totalOfflineRounds, newUsersLast7d, newUsersLast30d }`
   (`totalRounds` inkl. Offline-Runden).

2. **`GET /api/admin/users?page=1&pageSize=200`**
   Given ein gültiger Service-Token,
   When der Endpoint aufgerufen wird,
   Then liefert er eine Liste von Accounts mit je
   `{ id, email, createdAt, lastSignInAt, banned, deckCount, roundCount, lastRoundAt }`
   (deck-/round-Zahlen aus `public.decks`/`public.rounds` je `user_id`,
   `banned` aus Supabase Auth `banned_until`), sortiert nach `createdAt` absteigend,
   plus `{ page, pageSize, total }`.

3. **`POST /api/admin/users/:id/suspend`** — Body `{ suspended: boolean }`
   Given ein gültiger Service-Token und eine existierende User-ID,
   When `suspended: true` gesendet wird,
   Then setzt der Endpoint über die Supabase Admin-API `banned_until` weit in
   die Zukunft (Login sofort verweigert), bei `suspended: false` wird der
   Ban aufgehoben. Antwort `200` bei Erfolg, `404` wenn User nicht existiert.

4. **`POST /api/admin/users/:id/delete`**
   Given ein gültiger Service-Token und eine existierende User-ID,
   When der Endpoint aufgerufen wird,
   Then löscht er den Account über die Supabase Admin-API
   (`auth.admin.deleteUser`) — kaskadiert per bestehendem
   `on delete cascade` in `supabase/schema.sql` automatisch auf `decks` und
   `rounds`. **Echtes Hard-Delete**, kein Soft-Delete wie bei Doewe (Prized
   hat keine Multi-User-Haushalte, keine geteilten Daten, die ein Löschen
   für andere sichtbar/kaputt machen könnten — die Doewe-Vorsicht greift
   hier nicht). Idempotent: erneuter Aufruf auf bereits gelöschten User gibt
   `200` zurück, kein Fehler.

5. **`GET /api/admin/usage?days=30`**
   Given ein gültiger Service-Token,
   When der Endpoint aufgerufen wird,
   Then liefert er pro Tag der letzten `days` Tage
   `{ date, roundsPlayed, offlineRounds, avgDurationSec, avgAccuracy, newUsers, activeUsers }`
   aus `public.rounds` (`t` = Dauer, `h` = Treffer von 6 → Genauigkeit,
   `ts` = Zeitstempel, `m` = Modus) sowie `auth.users.created_at` für Signups.
   `roundsPlayed` und `activeUsers` zählen alle Runden, `offlineRounds` den
   Offline-Anteil davon. `avgDurationSec`/`avgAccuracy` nur aus digitalen
   Runden; `0`, wenn es an dem Tag keine digitale Runde gab.
   `activeUsers` = distinct `user_id` mit mindestens einer Runde an dem Tag.

6. **`GET /api/admin/decks-summary`**
   Given ein gültiger Service-Token,
   When der Endpoint aufgerufen wird,
   Then liefert er die meistgespielten Decks/Archetypen aggregiert über alle
   Accounts (`archetype` oder `name` aus `public.decks`, gejoint über
   `d`-Feld in `public.rounds`), je `{ label, roundCount, offlineRoundCount, avgAccuracy }`
   (`roundCount` inkl. Offline-Runden; `avgAccuracy` nur aus digitalen Runden,
   `0` ohne digitale Runde), nach `roundCount` absteigend sortiert, limitiert auf Top 20.

## Out of Scope

- Echtes Session-/Funnel-Tracking (z. B. "Nutzer hat Onboarding gesehen, aber
  nie ein Deck importiert" oder "Spiel gestartet, aber nie beendet") — dafür
  gibt es aktuell keine Instrumentierung, `rounds` speichert nur
  *abgeschlossene* Runden. Wäre ein eigenes Event-Tracking-Feature (neue
  Tabelle + Client-Instrumentierung), nicht Teil dieser Spec.
- UI/Frontend — das entsteht in control-plane, eigene Spec dort
  (`control-plane/specs/prized-crm.md`).
- Rate-Limiting/Pagination-UI über 200 Accounts hinaus (aktueller Stand:
  kleine Nutzerzahl, analog Doewes v1-CRM-Board-Kommentar).
- Passwort-Reset/E-Mail-Änderung von außen — nur sperren/löschen.

## Offene Fragen

- `PRIZED_SERVICE_TOKEN`/`SUPABASE_SERVICE_ROLE_KEY` müssen als Railway-Envs
  bei Prized gesetzt werden, bevor control-plane sie nutzen kann — Konrad
  muss das nach Merge manuell in beiden Railway-Projekten eintragen.
