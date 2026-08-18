import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'de' | 'en'

const LANG_KEY = 'pc_lang_v1'

const de = {
  // General
  back: 'Zurück',
  openMenu: 'Menü öffnen',
  pleaseWait: 'Bitte warten…',

  // Home
  tagline: 'Trainiere dein Preis-Gespür',
  importDeck: '+ Deck importieren',
  accountRequired: 'Konto nötig',
  notPlayedYet: 'Noch nicht gespielt',
  accuracyShort: 'Genau.',
  rounds: 'Runden',
  deckOptions: 'Deck-Optionen',
  edit: 'Bearbeiten',
  rename: 'Umbenennen',
  delete: 'Löschen',

  // Game
  quit: 'Beenden',
  table: 'Tisch',
  decklist: 'Deckliste',
  active: 'Aktiv',
  hand: 'Hand',
  deck: 'Deck',
  activeLabel: 'AKTIV',
  confirm: 'Bestätigen',
  raised: 'angehoben',
  less: 'Weniger',
  more: 'Mehr',

  // Reveal
  perfectRead: 'Perfekte Lesung',
  strongRead: 'Starke Lesung',
  keepPracticing: 'Weiter trainieren',
  time: 'Zeit',
  hits: 'Treffer',
  accuracy: 'Genauigkeit',
  hit: 'Treffer',
  partial: 'Teilweise',
  wrong: 'Falsch',
  missed: 'Verpasst',
  picked: 'Gewählt',
  inPrizes: 'in Preisen',
  playAgain: 'Nochmal',
  decks: 'Decks',
  stats: 'Statistik',

  // Import
  editDeck: 'Deck bearbeiten',
  importDeckTitle: 'Deck importieren',
  deckName: 'Deckname',
  pokemon: 'Pokémon',
  trainer: 'Trainer',
  energy: 'Energie',
  tooMany: '– zu viele',
  line: 'Zeile',
  saveChanges: 'Änderungen speichern',
  saveDeck: 'Deck speichern',

  // DeckBuilder
  createDeck: 'Deck erstellen',
  searchFailed: 'Suche fehlgeschlagen',
  noCardsFound: 'Keine Karten gefunden. Nutze „Liste einfügen".',
  apiUnavailable: 'Karten-API nicht erreichbar. Nutze stattdessen „Liste einfügen".',
  pasteHelp: 'Füge deine Deckliste ein (eine Karte pro Zeile, z.\u00A0B. „4 Beldum CRI 59"). Kopfzeilen wie „Pokémon: 19" werden ignoriert.',
  applyCards: 'Karten übernehmen',
  linesNotRecognized: (n: number) => `${n} Zeile${n > 1 ? 'n' : ''} nicht erkannt:`,
  searchPlaceholder: 'Karte suchen (z. B. Dragapult)',
  searchHint: 'Suche nach einzelnen Karten, oder nutze „Liste einfügen".',
  noCardsInDeck: 'Noch keine Karten im Deck.',
  listTab: 'Liste',
  searchTab: 'Suche',
  save: 'Speichern',

  // Stats
  allDecks: 'Alle Decks',
  avgTime: 'Ø Zeit',
  avgAccuracy: 'Ø Genauigkeit',
  bestTime: 'Beste Zeit',
  recentRounds: 'Letzte Runden',
  noRoundsYet: 'Noch keine Runden gespielt.',

  // Login
  signIn: 'Anmelden',
  register: 'Registrieren',
  forgotPassword: 'Passwort vergessen',
  createAccount: 'Konto erstellen',
  sendLink: 'Link senden',
  nameOptional: 'Name (optional)',
  email: 'E-Mail',
  passwordMin8: 'Passwort (min. 8 Zeichen)',
  forgotPasswordQ: 'Passwort vergessen?',
  backToLogin: '‹ Zurück zur Anmeldung',
  or: 'ODER',
  signInWithGoogle: 'Mit Google anmelden',

  // Account
  accountSettings: 'Kontoeinstellungen',
  name: 'Name',
  changePassword: 'Passwort ändern',
  newPassword: 'Neues Passwort',
  confirmNewPassword: 'Neues Passwort bestätigen',
  passwordUpdated: 'Passwort aktualisiert.',
  signOut: 'Abmelden',
  pwMin8Error: 'Passwort muss mindestens 8 Zeichen haben.',
  pwMismatchError: 'Passwörter stimmen nicht überein.',

  // Reset Password
  newPasswordTitle: 'Neues Passwort',
  newPasswordHint: 'Wähle ein neues Passwort für dein Konto.',
  newPasswordPlaceholder: 'Neues Passwort (min. 8 Zeichen)',
  confirmPassword: 'Passwort bestätigen',
  savePassword: 'Passwort speichern',

  // Paywall
  premium: 'Premium',
  playAllDecks: 'Spiele mit all deinen Decks',
  premiumDesc: 'Mit Premium schaltest du das Spielen eigener und importierter Decks frei. Das Demo-Deck bleibt immer kostenlos.',
  comingSoon: 'Bald verfügbar',
  loginForSub: 'Melde dich an, um dein Abo mit deinem Konto zu verknüpfen.',

  // Onboarding
  skip: 'Überspringen',
  letsGo: "Los geht's",
  next: 'Weiter',
  onboarding: [
    { t: 'Was sind Preiskarten?', b: 'Zu Beginn jedes Spiels werden 6 deiner 60 Karten verdeckt als Preise beiseitegelegt. Zu wissen, welche das sind, ist ein echter kompetitiver Vorteil.' },
    { t: 'Ausschlussprinzip', b: 'Schau dir deine Hand an und blättere durch dein Deck. Jede Karte, die du siehst, ist NICHT in den Preisen — was übrig bleibt, muss dort liegen.' },
    { t: 'Blättern & Auswählen', b: 'Wische durch den Kartenfächer und tippe Karten an, um sie anzuheben und zu zählen. Wähle dann in der Deckliste die 6 Karten, die du in den Preisen vermutest.' },
    { t: 'Dein Deck, dein Tempo', b: 'Importiere deine eigene Deckliste und trainiere damit. Zeit und Genauigkeit werden festgehalten, damit du deinen Fortschritt verfolgen kannst.' },
  ] as { t: string; b: string }[],

  // Drawer
  menu: 'Menü',
  close: 'Schließen',
  loggedInAs: 'Angemeldet als',
  guestNotLoggedIn: 'Nicht angemeldet – als Gast unterwegs.',
  guestNoAccount: 'Gast-Modus (kein Konto konfiguriert).',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  impressum: 'Impressum',
  datenschutz: 'Datenschutz',
  nutzungsbedingungen: 'Nutzungsbedingungen',
  footerNote: 'Prized · inoffizielles Fan-Projekt',

  // Ago (time)
  justNow: 'gerade eben',
  hoursAgo: (h: number) => `${h}h her`,
  daysAgo: (d: number) => `${d}d her`,

  // Parse error
  parseExpected: '— erwartet "4 Name SET 123"',
  throttleWait: (s: number) => `Zu viele Versuche. Bitte warte ${s}s.`,
}

const en: typeof de = {
  back: 'Back',
  openMenu: 'Open menu',
  pleaseWait: 'Please wait…',

  tagline: 'Train your prize card sense',
  importDeck: '+ Import deck',
  accountRequired: 'Account required',
  notPlayedYet: 'Not played yet',
  accuracyShort: 'Acc.',
  rounds: 'Rounds',
  deckOptions: 'Deck options',
  edit: 'Edit',
  rename: 'Rename',
  delete: 'Delete',

  quit: 'Quit',
  table: 'Table',
  decklist: 'Deck list',
  active: 'Active',
  hand: 'Hand',
  deck: 'Deck',
  activeLabel: 'ACTIVE',
  confirm: 'Confirm',
  raised: 'raised',
  less: 'Less',
  more: 'More',

  perfectRead: 'Perfect read',
  strongRead: 'Strong read',
  keepPracticing: 'Keep practicing',
  time: 'Time',
  hits: 'Hits',
  accuracy: 'Accuracy',
  hit: 'Hit',
  partial: 'Partial',
  wrong: 'Wrong',
  missed: 'Missed',
  picked: 'Picked',
  inPrizes: 'in prizes',
  playAgain: 'Play again',
  decks: 'Decks',
  stats: 'Stats',

  editDeck: 'Edit deck',
  importDeckTitle: 'Import deck',
  deckName: 'Deck name',
  pokemon: 'Pokémon',
  trainer: 'Trainer',
  energy: 'Energy',
  tooMany: '– too many',
  line: 'Line',
  saveChanges: 'Save changes',
  saveDeck: 'Save deck',

  createDeck: 'Create deck',
  searchFailed: 'Search failed',
  noCardsFound: 'No cards found. Try "Paste list".',
  apiUnavailable: 'Card API unavailable. Try "Paste list" instead.',
  pasteHelp: 'Paste your deck list (one card per line, e.g. "4 Beldum CRI 59"). Headers like "Pokémon: 19" are ignored.',
  applyCards: 'Apply cards',
  linesNotRecognized: (n: number) => `${n} line${n > 1 ? 's' : ''} not recognized:`,
  searchPlaceholder: 'Search card (e.g. Dragapult)',
  searchHint: 'Search for individual cards, or use "Paste list".',
  noCardsInDeck: 'No cards in deck yet.',
  listTab: 'List',
  searchTab: 'Search',
  save: 'Save',

  allDecks: 'All decks',
  avgTime: 'Avg time',
  avgAccuracy: 'Avg accuracy',
  bestTime: 'Best time',
  recentRounds: 'Recent rounds',
  noRoundsYet: 'No rounds played yet.',

  signIn: 'Sign in',
  register: 'Register',
  forgotPassword: 'Forgot password',
  createAccount: 'Create account',
  sendLink: 'Send link',
  nameOptional: 'Name (optional)',
  email: 'Email',
  passwordMin8: 'Password (min. 8 characters)',
  forgotPasswordQ: 'Forgot password?',
  backToLogin: '‹ Back to sign in',
  or: 'OR',
  signInWithGoogle: 'Sign in with Google',

  accountSettings: 'Account settings',
  name: 'Name',
  changePassword: 'Change password',
  newPassword: 'New password',
  confirmNewPassword: 'Confirm new password',
  passwordUpdated: 'Password updated.',
  signOut: 'Sign out',
  pwMin8Error: 'Password must be at least 8 characters.',
  pwMismatchError: 'Passwords do not match.',

  newPasswordTitle: 'New password',
  newPasswordHint: 'Choose a new password for your account.',
  newPasswordPlaceholder: 'New password (min. 8 characters)',
  confirmPassword: 'Confirm password',
  savePassword: 'Save password',

  premium: 'Premium',
  playAllDecks: 'Play with all your decks',
  premiumDesc: 'With Premium you unlock playing your own and imported decks. The demo deck stays free forever.',
  comingSoon: 'Coming soon',
  loginForSub: 'Sign in to link your subscription to your account.',

  skip: 'Skip',
  letsGo: "Let's go",
  next: 'Next',
  onboarding: [
    { t: 'What are prize cards?', b: 'At the start of every game, 6 of your 60 cards are set aside face-down as prizes. Knowing which ones they are is a real competitive edge.' },
    { t: 'Process of elimination', b: 'Look at your hand and flip through your deck. Every card you see is NOT in your prizes — whatever is left must be there.' },
    { t: 'Browse & select', b: 'Swipe through the card fan and tap cards to raise and count them. Then pick the 6 cards in the deck list that you think are in the prizes.' },
    { t: 'Your deck, your pace', b: 'Import your own deck list and practice with it. Time and accuracy are tracked so you can follow your progress.' },
  ],

  menu: 'Menu',
  close: 'Close',
  loggedInAs: 'Signed in as',
  guestNotLoggedIn: 'Not signed in – browsing as guest.',
  guestNoAccount: 'Guest mode (no account configured).',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  impressum: 'Imprint',
  datenschutz: 'Privacy Policy',
  nutzungsbedingungen: 'Terms of Use',
  footerNote: 'Prized · unofficial fan project',

  justNow: 'just now',
  hoursAgo: (h: number) => `${h}h ago`,
  daysAgo: (d: number) => `${d}d ago`,

  parseExpected: '— expected "4 Name SET 123"',
  throttleWait: (s: number) => `Too many attempts. Please wait ${s}s.`,
}

export type Translations = typeof de

const translations: Record<Lang, Translations> = { de, en }

function detectLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY)
  if (stored === 'de' || stored === 'en') return stored
  const nav = navigator.language?.slice(0, 2)
  return nav === 'de' ? 'de' : 'en'
}

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'de',
  setLang: () => {},
  t: de,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = (l: Lang) => {
    localStorage.setItem(LANG_KEY, l)
    setLangState(l)
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export function useT() {
  return useContext(I18nContext).t
}
