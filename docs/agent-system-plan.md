# Prized — Agent-System-Plan

Ziel: Ein Agentensystem das als Solo-Indie-Dev den operativen Overhead minimiert — Käufe tracken, E-Mails verwalten, Buchhaltung vorbereiten, Feedback und Social Media im Blick behalten, TODOs generieren.

## Architektur-Übersicht

```
Claude Code (Zentrale)
  |
  |-- MCP Server: Stripe (offiziell)     → Käufe, Abos, Refunds
  |-- MCP Server: Gmail (Google)          → Kaufbenachrichtigungen, Support-Mails
  |-- MCP Server: Google Sheets           → Revenue-Tracking, Buchhaltungs-Rohdaten
  |-- MCP Server: Notion (offiziell)      → Feedback-DB, Roadmap, Docs
  |-- MCP Server: Apple Notes             → Schnelle lokale Notizen
  |-- MCP Server: Apple Reminders         → TODOs, Deadlines
  |-- MCP Server: sevDesk / BuchPilot     → Rechnungen, EÜR, ELSTER
  |-- MCP Server: Twitter/X              → Mentions, Engagement
  |-- MCP Server: Sentry (bereits aktiv)  → Error-Tracking
  |-- MCP Server: Railway (bereits aktiv) → Deployment, Logs
  |
  |-- Cloud Routines (geplant)
  |     |-- Täglicher Revenue-Digest
  |     |-- Wöchentlicher Ops-Report
  |     |-- Social Media Monitoring
  |
  |-- n8n (optional, auf Railway)
        |-- Stripe Webhook → Google Sheet + Notification
        |-- Gmail Filter → Feedback-Notion-DB
        |-- Social Mention → TODO erstellen
```

## MCP-Server im Detail

### Tier 1 — Sofort einrichten (stabil, offiziell)

| Dienst | MCP Server | Auth | Was es tut |
|--------|-----------|------|------------|
| **Stripe** | `mcp.stripe.com` (Remote, offiziell) | OAuth | Käufe einsehen, Abo-Status, Refunds, Balance. Revenue-Tracking direkt aus Claude. |
| **Gmail** | Google Official oder `GongRzhe/Gmail-MCP-Server` | OAuth 2.0 | Mails nach Stripe-Receipts filtern, Support-Mails lesen, Labels verwalten. |
| **Google Sheets** | Google Official | OAuth 2.0 | Revenue-Sheet automatisch befüllen (Datum, Betrag, Kunde). Monatliche Zusammenfassung. |
| **Notion** | `makenotion/notion-mcp-server` (offiziell) | OAuth | Feedback-Datenbank, Roadmap, Feature-Requests, Bug-Reports als strukturierte DB. |

### Tier 2 — macOS-nativ (Beta, für lokalen Workflow)

| Dienst | MCP Server | Auth | Was es tut |
|--------|-----------|------|------------|
| **Apple Notes** | `Siddhant-K-code/mcp-apple-notes` | Lokal (AppleScript) | Schnelle Notizen, Ideen, Meeting-Notes. iCloud-synced. |
| **Apple Reminders** | `justinhaaheim/apple-reminders-mcp` | Lokal (EventKit) | TODOs mit Deadlines. Agent erstellt Reminder aus Feedback/Errors. |
| **Apple iWork** | `reichenbach/iwork_mcp` | Lokal (JXA) | Numbers für lokale Tabellen, Pages für Dokumente. 117 Tools. |

### Tier 3 — Wenn Prized wächst

| Dienst | MCP Server | Auth | Was es tut |
|--------|-----------|------|------------|
| **sevDesk** | `codestra/sevdesk-mcp` (76 Tools) | API Key | Rechnungen, Ausgaben, Kontakte, Bank-Integration. GoBD-konform. |
| **BuchPilot** | `buchpilot-mcp` | API Key | Deckt sevDesk UND Lexoffice ab. Für n8n/AI-Workflows optimiert. |
| **Twitter/X** | `vidhupv/x-mcp` | API Key | Mentions tracken, Engagement messen, auf Kommentare reagieren. |
| **Discord** | `tolgasumer/discord-mcp` | Bot Token | Community-Feedback in Echtzeit (messageCreated Events). |
| **n8n** | `czlonkowski/n8n-mcp` | Lokal | Workflow-Automatisierung: Stripe→Sheet, Gmail→Notion, Social→TODO. |

## Geplante `.mcp.json` Konfiguration

```json
{
  "mcpServers": {
    "stripe": {
      "type": "url",
      "url": "https://mcp.stripe.com",
      "note": "Offizieller Stripe MCP, OAuth-Auth"
    },
    "gmail": {
      "type": "stdio",
      "command": "npx",
      "args": ["gmail-mcp-server"],
      "note": "Gmail via OAuth 2.0"
    },
    "google-sheets": {
      "type": "stdio",
      "command": "npx",
      "args": ["@anthropic/google-sheets-mcp"],
      "note": "Revenue-Tracking Sheet"
    },
    "notion": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": { "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer <NOTION_TOKEN>\"}" }
    },
    "apple-notes": {
      "type": "stdio",
      "command": "npx",
      "args": ["mcp-apple-notes"],
      "note": "Nur macOS"
    },
    "apple-reminders": {
      "type": "stdio",
      "command": "npx",
      "args": ["apple-reminders-mcp"],
      "note": "Nur macOS, EventKit"
    },
    "sentry": { "note": "Bereits konfiguriert" },
    "railway": { "note": "Bereits konfiguriert" }
  }
}
```

## Automatisierte Workflows (Cloud Routines)

### 1. Täglicher Revenue-Digest (Cron: 09:00)
```
1. Stripe MCP → Gestrige Zahlungen abrufen
2. Google Sheets → Neue Zeilen ins Revenue-Sheet
3. Gmail → Stripe-Receipts labeln als "Verbucht"
4. Apple Notes → Tages-Zusammenfassung (Umsatz, neue Kunden, Refunds)
```

### 2. Wöchentlicher Ops-Report (Cron: Montag 09:00)
```
1. Stripe → Wochen-Revenue, MRR, Churn
2. Sentry → Neue/ungelöste Errors
3. Railway → Deployment-Status, Uptime
4. Notion → Offene Feature-Requests + Bug-Reports zählen
5. → Zusammenfassung in Apple Notes + Apple Reminder für Action Items
```

### 3. Feedback-Pipeline (On-Demand oder täglich)
```
1. Gmail → Ungelesene Mails mit Label "Feedback" lesen
2. Discord → Neue Nachrichten in #feedback Channel
3. → In Notion-Feedback-DB eintragen (Quelle, Text, Sentiment, Priorität)
4. → Bei hoher Priorität: Apple Reminder erstellen
```

### 4. Social Media Monitoring (Täglich)
```
1. Twitter/X → Mentions von "prized" oder "prize checker pokemon"
2. → Engagement-Metriken (Likes, Retweets, Replies) loggen
3. → Neue Mentions in Notion-DB "Social Tracking"
4. → Bei negativem Sentiment oder Fragen: TODO erstellen
```

## Buchhaltung (DE / Kleinunternehmer)

### Empfohlenes Tool: Norman oder Papierkram

| Kriterium | Norman | Papierkram |
|-----------|--------|------------|
| Preis | Ab 9 EUR/Monat | Kostenlos (Basis) |
| EÜR | Automatisch | Automatisch |
| ELSTER | Direkt | Nein (Export) |
| AI-Kategorisierung | Ja | Nein |
| API / Automation | Ja | Begrenzt |

### Buchhaltungs-Workflow
```
1. Stripe Webhook → n8n → sevDesk/Norman: Einnahme verbuchen
2. Monatlich: Claude Routine → sevDesk MCP → EÜR-Entwurf generieren
3. Quartalsweise: Prüfen + an Steuerberater (oder direkt ELSTER)
```

### Kleinunternehmer-Regeln (§19 UStG)
- Keine USt auf Rechnungen ausweisen
- Grenze: 25.000 EUR Vorjahresumsatz (ab 2025)
- EÜR am Jahresende = fertig
- GoBD-Pflicht: Belege digital aufbewahren (10 Jahre)

## Notion-Datenbank-Struktur

### Feedback-DB
| Feld | Typ | Beschreibung |
|------|-----|-------------|
| Quelle | Select | Discord / Email / Twitter / App Store |
| Text | Text | Original-Feedback |
| Sentiment | Select | Positiv / Neutral / Negativ / Bug |
| Priorität | Select | Hoch / Mittel / Niedrig |
| Status | Select | Neu / In Bearbeitung / Erledigt / Abgelehnt |
| Datum | Date | Eingangsdatum |

### Social-Tracking-DB
| Feld | Typ | Beschreibung |
|------|-----|-------------|
| Plattform | Select | Twitter / Instagram / LinkedIn / Discord |
| Typ | Select | Mention / Retweet / Reply / Post |
| Link | URL | Direktlink |
| Engagement | Number | Likes + Shares + Replies |
| Datum | Date | |

### Revenue-Sheet (Google Sheets)
| Spalte | Beschreibung |
|--------|-------------|
| Datum | Zahlungsdatum |
| Betrag (EUR) | Netto nach Stripe-Gebühren |
| Typ | Abo / Einmalkauf / Refund |
| Kunde | Stripe Customer ID |
| Status | Bezahlt / Refunded / Disputed |
| Monat | Für monatliche Pivot-Tabelle |

## Umsetzungs-Reihenfolge

### Phase 1 — Basis (wenn Stripe live geht)
1. Stripe MCP aktivieren
2. Gmail MCP einrichten (Kaufbenachrichtigungen filtern)
3. Google Sheets MCP → Revenue-Sheet anlegen
4. Notion MCP → Feedback-DB erstellen

### Phase 2 — Lokaler Workflow
5. Apple Notes MCP installieren
6. Apple Reminders MCP installieren
7. Tägliche Revenue-Routine einrichten (Claude Cloud Routine oder lokaler Cron)

### Phase 3 — Buchhaltung
8. sevDesk oder Norman Account erstellen
9. sevDesk MCP oder BuchPilot MCP einrichten
10. Stripe → sevDesk Automatisierung (via n8n oder direkte Routine)

### Phase 4 — Social Media & Community
11. Twitter/X MCP einrichten
12. Discord MCP für Community-Server
13. Social-Monitoring-Routine aktivieren

### Phase 5 — Vollautomatisierung
14. n8n auf Railway deployen (Docker-Service)
15. n8n-MCP einrichten → Claude kann Workflows erstellen/ändern
16. Alle Einzelroutinen in n8n konsolidieren
