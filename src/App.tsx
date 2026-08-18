import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type Deck,
  type GameState,
  type Result,
  type Round,
  cardsOf,
  deal,
  isDeckFree,
  parseImport,
  score,
} from './game'
import { loadDecks, loadHistory, saveDecks, saveHistory } from './storage'
import { resolveDeckImages } from './cardImages'
import { cloudInsertRound, cloudLoadDecks, cloudLoadHistory, cloudUpsertDeck } from './sync'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { ImportScreen } from './screens/ImportScreen'
import { GameScreen } from './screens/GameScreen'
import { Reveal } from './screens/Reveal'
import { Stats } from './screens/Stats'
import { Login } from './screens/Login'
import { AccountSettings } from './screens/AccountSettings'
import { ResetPassword } from './screens/ResetPassword'
import { Paywall } from './screens/Paywall'
import { Legal } from './screens/Legal'
import { Drawer } from './components/Drawer'
import { useAuth } from './auth/AuthProvider'

export type Screen =
  | 'onboarding'
  | 'home'
  | 'import'
  | 'game'
  | 'reveal'
  | 'stats'
  | 'login'
  | 'account'
  | 'paywall'
  | 'impressum'
  | 'datenschutz'
  | 'agb'
type Theme = 'light' | 'dark'

const ONBOARDED_KEY = 'pc_onboarded_v1'
const THEME_KEY = 'pc_theme_v1'

export function App() {
  const { recovery, user, ready, configured } = useAuth()
  const [screen, setScreen] = useState<Screen>(() =>
    localStorage.getItem(ONBOARDED_KEY) ? 'home' : 'onboarding',
  )
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) || 'light',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const [decks, setDecks] = useState<Deck[]>(() => loadDecks())
  const [history, setHistory] = useState<Round[]>(() => loadHistory())
  const [game, setGame] = useState<GameState | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  // Community-Test: aktuell alles kostenlos, Paywall deaktiviert. Zahlung folgt später.
  const [premium] = useState(true)

  // Aktueller Speicherort: Cloud, sobald ein User eingeloggt ist, sonst localStorage.
  const cloud = configured && !!user
  const cloudRef = useRef(cloud)
  cloudRef.current = cloud

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Daten laden/wechseln, wenn sich der Login-Status ändert.
  useEffect(() => {
    if (!ready) return
    let alive = true
    if (configured && user) {
      void (async () => {
        const [cd, ch] = await Promise.all([cloudLoadDecks(), cloudLoadHistory()])
        if (!alive) return
        // Erstanmeldung: leere Cloud mit den lokalen Daten befüllen (Migration).
        if (cd.length === 0) {
          const local = loadDecks()
          await Promise.all(local.map((d) => cloudUpsertDeck(user.id, d)))
          if (alive) setDecks(local)
        } else {
          setDecks(cd)
        }
        if (ch.length === 0) {
          const localH = loadHistory()
          await Promise.all(localH.map((r) => cloudInsertRound(user.id, r)))
          if (alive) setHistory(localH)
        } else {
          setHistory(ch)
        }
      })()
    } else {
      setDecks(loadDecks())
      setHistory(loadHistory())
    }
    return () => {
      alive = false
    }
  }, [ready, configured, user?.id])

  // Fehlende Kartenbilder bereits gespeicherter Decks nachladen (z. B. früher
  // importierte Decks, deren Sets nicht in SETMAP stehen). Pro Deck genau einmal
  // gestartet (auch für später aus der Cloud geladene Decks) und aktualisiert die
  // betroffenen Decks nach und nach, damit im Spiel immer eine Vorderseite erscheint.
  const resolvingRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!ready) return
    const pending = decks.filter(
      (d) => !resolvingRef.current.has(d.id) && d.cards.some((c) => !c.api),
    )
    if (!pending.length) return
    const mine = pending.map((d) => d.id)
    mine.forEach((id) => resolvingRef.current.add(id))
    let alive = true
    void (async () => {
      for (const d of pending) {
        if (!alive) return
        await resolveDeckImages(
          d.cards,
          (cards) => updateDeck({ ...d, cards }),
          () => alive,
        )
      }
    })()
    return () => {
      alive = false
      // Ids wieder freigeben, damit ein abgebrochener Lauf (z. B. React
      // StrictMode-Remount) erneut startet, statt dauerhaft übersprungen zu werden.
      mine.forEach((id) => resolvingRef.current.delete(id))
    }
  }, [ready, decks])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    setScreen('home')
  }

  const startGame = (deck: Deck) => {
    // Nur Demo-Decks sind ohne Premium spielbar; sonst Paywall.
    if (!premium && !isDeckFree(deck)) {
      setScreen('paywall')
      return
    }
    setResult(null)
    setGame(deal(deck))
    setScreen('game')
  }

  const quitGame = () => {
    setGame(null)
    setScreen('home')
  }

  const persistDeck = (deck: Deck) => {
    setDecks((prev) => {
      const next = [...prev, deck]
      if (cloudRef.current && user) cloudUpsertDeck(user.id, deck)
      else saveDecks(next)
      return next
    })
  }

  // Ein bereits gespeichertes Deck ersetzen (z. B. nach dem Nachladen von Bildern).
  const updateDeck = (deck: Deck) => {
    setDecks((prev) => {
      const next = prev.map((d) => (d.id === deck.id ? deck : d))
      if (cloudRef.current && user) cloudUpsertDeck(user.id, deck)
      else saveDecks(next)
      return next
    })
  }

  const confirm = (g: GameState) => {
    const ended: GameState = { ...g, end: Date.now() }
    const r = score(ended)
    const round: Round = { d: g.deck.id, t: +r.time.toFixed(1), h: r.hits, ts: Date.now() }
    const nextHistory = [...history, round]
    setHistory(nextHistory)
    if (cloudRef.current && user) cloudInsertRound(user.id, round)
    else saveHistory(nextHistory)
    setResult(r)
    setGame(ended)
    setScreen('reveal')
  }

  const saveImportedDeck = (name: string, text: string) => {
    const parsed = parseImport(text)
    const deck: Deck = {
      id: 'd' + Date.now(),
      name: name.trim(),
      format: 'Standard',
      cards: cardsOf(parsed.cards),
    }
    persistDeck(deck)
    setScreen('home')
    // Bilder für Karten aus Sets ohne bekannte Zuordnung nachladen und das Deck
    // damit aktualisieren, damit im Spiel immer eine Kartenvorderseite erscheint.
    void resolveDeckImages(
      deck.cards,
      (cards) => updateDeck({ ...deck, cards }),
    )
  }

  const themeCls = theme === 'dark' ? 'pc dark' : 'pc'

  const homeScreen = (
    <Home
      decks={decks}
      history={history}
      premium={premium}
      onMenu={() => setMenuOpen(true)}
      onPlay={startGame}
      onImport={() => setScreen('import')}
      onStats={() => setScreen('stats')}
    />
  )

  const body = useMemo(() => {
    switch (screen) {
      case 'onboarding':
        return <Onboarding onDone={finishOnboarding} onSkip={finishOnboarding} />
      case 'home':
        return homeScreen
      case 'import':
        return <ImportScreen onBack={() => setScreen('home')} onSave={saveImportedDeck} />
      case 'login':
        return <Login onBack={() => setScreen('home')} onDone={() => setScreen('home')} />
      case 'account':
        return <AccountSettings onBack={() => setScreen('home')} />
      case 'game':
        return game ? (
          <GameScreen
            game={game}
            dark={theme === 'dark'}
            onChange={setGame}
            onQuit={quitGame}
            onConfirm={confirm}
          />
        ) : (
          homeScreen
        )
      case 'reveal':
        return result ? (
          <Reveal
            result={result}
            onPlayAgain={() => startGame(result.deck)}
            onHome={() => setScreen('home')}
            onStats={() => setScreen('stats')}
          />
        ) : null
      case 'stats':
        return (
          <Stats
            decks={decks}
            history={history}
            onMenu={() => setMenuOpen(true)}
            onHome={() => setScreen('home')}
          />
        )
      case 'paywall':
        return (
          <Paywall
            onBack={() => setScreen('home')}
            loggedIn={!!user}
            onLogin={() => setScreen('login')}
          />
        )
      case 'impressum':
      case 'datenschutz':
      case 'agb':
        return <Legal doc={screen} onBack={() => setScreen('home')} />
    }
  }, [screen, decks, history, theme, game, result, premium, user])

  return (
    <div className={`pc-root ${theme === 'dark' ? 'dark' : ''}`}>
      <div className={`${themeCls} pc-app`}>
        {recovery ? <ResetPassword onDone={() => setScreen('home')} /> : body}
        <Drawer
          open={menuOpen}
          theme={theme}
          onClose={() => setMenuOpen(false)}
          onToggleTheme={toggleTheme}
          onLogin={() => setScreen('login')}
          onAccount={() => setScreen('account')}
          onLegal={(s) => { setMenuOpen(false); setScreen(s) }}
        />
      </div>
    </div>
  )
}
