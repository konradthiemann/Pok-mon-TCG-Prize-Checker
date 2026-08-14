import { useEffect, useMemo, useState } from 'react'
import {
  type Deck,
  type GameState,
  type Result,
  type Round,
  cardsOf,
  deal,
  parseImport,
  score,
} from './game'
import { loadDecks, loadHistory, saveDecks, saveHistory } from './storage'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { ImportScreen } from './screens/ImportScreen'
import { GameScreen } from './screens/GameScreen'
import { Reveal } from './screens/Reveal'
import { Stats } from './screens/Stats'

export type Screen = 'onboarding' | 'home' | 'import' | 'game' | 'reveal' | 'stats'
type Theme = 'light' | 'dark'

const ONBOARDED_KEY = 'pc_onboarded_v1'
const THEME_KEY = 'pc_theme_v1'

export function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    localStorage.getItem(ONBOARDED_KEY) ? 'home' : 'onboarding',
  )
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) || 'light',
  )
  const [decks, setDecks] = useState<Deck[]>(() => loadDecks())
  const [history, setHistory] = useState<Round[]>(() => loadHistory())
  const [game, setGame] = useState<GameState | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])
  useEffect(() => {
    saveDecks(decks)
  }, [decks])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    setScreen('home')
  }

  const startGame = (deck: Deck) => {
    setResult(null)
    setGame(deal(deck))
    setScreen('game')
  }

  const quitGame = () => {
    setGame(null)
    setScreen('home')
  }

  const confirm = (g: GameState) => {
    const ended: GameState = { ...g, end: Date.now() }
    const r = score(ended)
    const nextHistory = [...history, { d: g.deck.id, t: +r.time.toFixed(1), h: r.hits, ts: Date.now() }]
    setHistory(nextHistory)
    saveHistory(nextHistory)
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
    setDecks((d) => [...d, deck])
    setScreen('home')
  }

  const themeCls = theme === 'dark' ? 'pc dark' : 'pc'

  const body = useMemo(() => {
    switch (screen) {
      case 'onboarding':
        return <Onboarding onDone={finishOnboarding} onSkip={finishOnboarding} />
      case 'home':
        return (
          <Home
            decks={decks}
            history={history}
            theme={theme}
            onToggleTheme={toggleTheme}
            onPlay={startGame}
            onImport={() => setScreen('import')}
            onStats={() => setScreen('stats')}
          />
        )
      case 'import':
        return <ImportScreen onBack={() => setScreen('home')} onSave={saveImportedDeck} />
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
          <Home
            decks={decks}
            history={history}
            theme={theme}
            onToggleTheme={toggleTheme}
            onPlay={startGame}
            onImport={() => setScreen('import')}
            onStats={() => setScreen('stats')}
          />
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
            theme={theme}
            onToggleTheme={toggleTheme}
            onHome={() => setScreen('home')}
          />
        )
    }
  }, [screen, decks, history, theme, game, result])

  return (
    <div className={`pc-root ${theme === 'dark' ? 'dark' : ''}`}>
      <div className={`${themeCls} pc-app`}>{body}</div>
    </div>
  )
}
