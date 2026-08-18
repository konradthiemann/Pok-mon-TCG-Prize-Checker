import { type ReactNode } from 'react'
import { useT } from '../i18n'

export type LegalDoc = 'impressum' | 'datenschutz' | 'agb'

interface Props {
  doc: LegalDoc
  onBack: () => void
}

const OPERATOR = {
  name: 'Konrad Thiemann',
  street: '[Straße und Hausnummer]',
  city: '[PLZ und Ort]',
  email: 'konrad.gruss@t-online.de',
}

export function Legal({ doc, onBack }: Props) {
  const t = useT()
  const TITLES: Record<LegalDoc, string> = {
    impressum: t.impressum,
    datenschutz: t.datenschutz,
    agb: t.nutzungsbedingungen,
  }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '18px 16px 10px' }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ padding: '4px 10px', color: 'var(--ink)' }}
          aria-label={t.back}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
          {TITLES[doc]}
        </h1>
      </header>

      <div className="pc-scroll" style={{ padding: '6px 18px 28px', color: 'var(--ink)' }}>
        {doc === 'impressum' && <Impressum />}
        {doc === 'datenschutz' && <Datenschutz />}
        {doc === 'agb' && <Agb />}
        <Disclaimer />
      </div>
    </div>
  )
}

function H({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 700, margin: '20px 0 6px', color: 'var(--ink)' }}>
      {children}
    </h2>
  )
}

function P({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.6, color: 'var(--sub)' }}>
      {children}
    </p>
  )
}

function Impressum() {
  return (
    <>
      <P>Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).</P>
      <H>Diensteanbieter</H>
      <P>
        {OPERATOR.name}
        <br />
        {OPERATOR.street}
        <br />
        {OPERATOR.city}
      </P>
      <H>Kontakt</H>
      <P>
        E-Mail:{' '}
        <a href={`mailto:${OPERATOR.email}`} style={{ color: 'var(--accentInk)' }}>
          {OPERATOR.email}
        </a>
      </P>
      <H>Verantwortlich für den Inhalt</H>
      <P>{OPERATOR.name} (Anschrift wie oben)</P>
      <H>Haftung für Inhalte</H>
      <P>
        Prized ist ein privates, nicht-kommerzielles Hobbyprojekt. Die Inhalte wurden mit
        größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der
        Inhalte kann jedoch keine Gewähr übernommen werden.
      </P>
      <H>Streitschlichtung</H>
      <P>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit. Wir
        sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </P>
    </>
  )
}

function Datenschutz() {
  return (
    <>
      <P>
        Der Schutz deiner Daten ist uns wichtig. Prized ist so gebaut, dass so wenig
        personenbezogene Daten wie möglich verarbeitet werden.
      </P>

      <H>Verantwortlicher</H>
      <P>
        {OPERATOR.name}, {OPERATOR.email}
      </P>

      <H>Lokale Speicherung (ohne Konto)</H>
      <P>
        Ohne Anmeldung läuft Prized eingeschränkt in deinem Browser. Demo-Decks, Einstellungen und
        temporär importierte Decklisten werden ausschließlich lokal per <em>localStorage</em> auf
        deinem Gerät gespeichert. Diese Daten verlassen dein Gerät nicht. Du kannst sie jederzeit
        über die Browser-Einstellungen löschen.
      </P>

      <H>Konto & Datenbank-Speicherung</H>
      <P>
        Meldest du dich an, werden folgende Daten bei unserem Dienstleister Supabase (Supabase Inc.,
        USA; Serverstandort je nach Projektkonfiguration) gespeichert:
      </P>
      <ul style={{ margin: '0 0 10px', paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: 'var(--sub)' }}>
        <li>Deine <strong>E-Mail-Adresse</strong> zur Authentifizierung.</li>
        <li>Deine <strong>importierten Decklisten</strong> (Kartennamen, Set-Kürzel, Mengen) — pro Benutzer gespeichert, nur für dich sichtbar.</li>
        <li>Dein <strong>Spielverlauf</strong> (Deck-ID, Treffer, Zeit, Zeitstempel) zur Fortschrittsverfolgung.</li>
      </ul>
      <P>
        Rechtsgrundlage ist die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Die
        Daten sind per Row Level Security (RLS) ausschließlich deinem Konto zugeordnet und für
        andere Nutzer nicht einsehbar.
      </P>

      <H>Löschung deiner Daten</H>
      <P>
        Du kannst dein Konto und alle zugehörigen Daten (Decks, Spielverlauf) jederzeit in den
        Kontoeinstellungen löschen. Die Löschung erfolgt unwiderruflich — eine Wiederherstellung
        ist nicht möglich. Bei Löschung des Kontos werden auch alle verknüpften Datenbankeinträge
        automatisch entfernt (ON DELETE CASCADE).
      </P>

      <H>Kartenbilder von Drittanbietern</H>
      <P>
        Kartenbilder werden von <em>images.pokemontcg.io</em> und als Fallback von{' '}
        <em>limitlesstcg.nyc3.cdn.digitaloceanspaces.com</em> geladen. Deck-Hintergrundgrafiken
        stammen von <em>pokeapi.co</em> und <em>r2.limitlesstcg.net</em>. Dabei wird deine
        IP-Adresse technisch bedingt an diese Anbieter übertragen. Rechtsgrundlage ist unser
        berechtigtes Interesse an der Darstellung der Karten (Art. 6 Abs. 1 lit. f DSGVO).
      </P>

      <H>Schriftarten</H>
      <P>
        Prized bindet die Schriftart „Sora" über Google Fonts (fonts.googleapis.com /
        fonts.gstatic.com) ein. Dabei wird deine IP-Adresse an Google übertragen. Rechtsgrundlage
        ist unser berechtigtes Interesse an einer einheitlichen Darstellung (Art. 6 Abs. 1 lit. f
        DSGVO).
      </P>

      <H>Hosting</H>
      <P>
        Die App wird bei Railway (Railway Corp., USA) gehostet. Beim Aufruf werden technisch
        notwendige Server-Logs (u. a. IP-Adresse, Zeitpunkt, abgerufene Ressource) verarbeitet,
        um den Betrieb und die Sicherheit zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO).
      </P>

      <H>Keine Werbung, kein Tracking</H>
      <P>
        Prized setzt keine Werbe- oder Analyse-Cookies und bindet keine Tracking-Dienste ein.
      </P>

      <H>Deine Rechte</H>
      <P>
        Dir stehen die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit und Widerspruch zu. Wende dich dazu an die oben genannte
        Kontaktadresse. Zudem hast du ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.
      </P>
    </>
  )
}

function Agb() {
  return (
    <>
      <H>1. Geltungsbereich</H>
      <P>
        Diese Bedingungen gelten für die Nutzung der Web-App Prized („die App"). Mit der Nutzung
        erklärst du dich mit ihnen einverstanden.
      </P>

      <H>2. Leistung</H>
      <P>
        Prized ist ein kostenloses Trainings-Minispiel, mit dem du das Erschließen der verdeckten
        Preiskarten im Sammelkartenspiel üben kannst. Ein Anspruch auf ständige Verfügbarkeit oder
        einen bestimmten Funktionsumfang besteht nicht.
      </P>

      <H>3. Gast-Modus & Konto</H>
      <P>
        Ohne Konto kannst du die Demo-Decks ausprobieren und Decklisten importieren. Um importierte
        Decks zu spielen und deinen Fortschritt zu speichern, ist ein kostenloses Konto erforderlich.
        Deine Decks und dein Spielverlauf werden dann in einer Datenbank pro Benutzer gespeichert. Du
        bist für die Geheimhaltung deiner Zugangsdaten selbst verantwortlich. Wir behalten uns vor,
        Konten bei Missbrauch zu sperren.
      </P>

      <H>4. Datenspeicherung</H>
      <P>
        Bei der Registrierung werden deine importierten Decklisten und dein Spielverlauf in einer
        Datenbank gespeichert und deinem Konto zugeordnet. Die Daten sind nur für dich sichtbar.
        Du kannst dein Konto und alle zugehörigen Daten jederzeit in den Kontoeinstellungen
        unwiderruflich löschen. Details findest du in unserer Datenschutzerklärung.
      </P>

      <H>5. Inhalte & geistiges Eigentum</H>
      <P>
        Von dir eingegebene Decklisten verbleiben bei dir. Kartennamen und Kartenbilder sind
        Eigentum der jeweiligen Rechteinhaber (siehe Hinweis unten).
      </P>

      <H>6. Haftung</H>
      <P>
        Die App wird „wie besehen" und ohne Gewähr bereitgestellt. Für Schäden haften wir nur bei
        Vorsatz oder grober Fahrlässigkeit sowie bei Verletzung wesentlicher Vertragspflichten,
        begrenzt auf den vorhersehbaren, typischen Schaden. Die Haftung für Datenverlust ist auf den
        Aufwand beschränkt, der bei regelmäßiger Sicherung entstanden wäre.
      </P>

      <H>7. Änderungen</H>
      <P>Wir können diese Bedingungen anpassen. Die jeweils aktuelle Fassung gilt.</P>

      <H>8. Anwendbares Recht</H>
      <P>Es gilt das Recht der Bundesrepublik Deutschland.</P>
    </>
  )
}

function Disclaimer() {
  return (
    <div
      style={{
        marginTop: 24,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'var(--accentSoft)',
        color: 'var(--accentInk)',
        fontSize: 12,
        lineHeight: 1.55,
      }}
    >
      Prized ist ein inoffizielles Fan-Projekt und steht in keiner Verbindung zu Nintendo, The
      Pokémon Company, Creatures Inc. oder GAME FREAK. Alle Kartennamen, Bilder und Marken sind
      Eigentum der jeweiligen Rechteinhaber.
    </div>
  )
}
