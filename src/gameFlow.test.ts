import { describe, it, expect } from 'vitest'
import { cardsOf, type Card } from './game'
import {
  addCopy,
  lockedType,
  removeCopy,
  selectedTotal,
  toggleRaise,
  visibleRange,
} from './gameFlow'

const [ultraBall, psychic, dreepy] = cardsOf([
  { n: 'Ultra Ball', s: 'SVI', c: '196', api: 'sv1/196', t: 'T', q: 4 },
  { n: 'Psychic Energy', s: 'SVE', c: '5', api: 'sve/5', t: 'E', q: 6 },
  { n: 'Dreepy', s: 'TWM', c: '128', api: 'sv6/128', t: 'P', q: 4, b: 1 },
])

// Restdeck: 0 Ultra Ball, 1 Psychic, 2 Ultra Ball, 3 Dreepy
const rest: Card[] = [ultraBall, psychic, ultraBall, dreepy]

describe('lockedType', () => {
  it('ist null, solange nichts angehoben ist', () => {
    expect(lockedType({}, rest)).toBeNull()
    expect(lockedType({ 0: false }, rest)).toBeNull()
  })

  it('übernimmt den Typ der angehobenen Karten', () => {
    expect(lockedType({ 1: true }, rest)).toBe('E')
  })
})

describe('toggleRaise', () => {
  it('hebt eine Karte an, wenn noch nichts angehoben ist', () => {
    const r = toggleRaise({}, 0, rest)
    expect(r.blocked).toBeNull()
    expect(r.raised[0]).toBe(true)
  })

  it('hebt weitere Karten desselben Typs an', () => {
    const r = toggleRaise({ 0: true }, 2, rest)
    expect(r.blocked).toBeNull()
    expect(r.raised).toEqual({ 0: true, 2: true })
  })

  it('senkt eine angehobene Karte wieder ab', () => {
    const r = toggleRaise({ 0: true, 2: true }, 0, rest)
    expect(r.blocked).toBeNull()
    expect(r.raised[0]).toBe(false)
    expect(r.raised[2]).toBe(true)
  })

  it('blockt einen anderen Typ und meldet den gesperrten Typ zurück', () => {
    const before = { 0: true }
    const r = toggleRaise(before, 1, rest)
    expect(r.blocked).toBe('T')
    expect(r.raised).toBe(before)
  })

  it('gibt den Typ wieder frei, sobald alles abgesenkt ist', () => {
    const lowered = toggleRaise({ 0: true }, 0, rest).raised
    const r = toggleRaise(lowered, 3, rest)
    expect(r.blocked).toBeNull()
    expect(r.raised[3]).toBe(true)
  })
})

describe('Auswahl der Preiskarten', () => {
  it('zählt die Gesamtauswahl', () => {
    expect(selectedTotal({})).toBe(0)
    expect(selectedTotal({ a: 2, b: 0, c: 3 })).toBe(5)
  })

  it('addCopy erhöht um genau eine Kopie', () => {
    const r = addCopy({}, 'a', 4)
    expect(r.result).toBe('added')
    expect(r.sel).toEqual({ a: 1 })
    expect(addCopy(r.sel, 'a', 4).sel).toEqual({ a: 2 })
  })

  it('addCopy springt nicht zurück auf 0, wenn alle Kopien gewählt sind', () => {
    const before = { a: 2 }
    const r = addCopy(before, 'a', 2)
    expect(r.result).toBe('max')
    expect(r.sel).toBe(before)
  })

  it('addCopy lässt keine siebte Karte zu', () => {
    const before = { a: 4, b: 2 }
    const r = addCopy(before, 'c', 3)
    expect(r.result).toBe('full')
    expect(r.sel).toBe(before)
  })

  it('removeCopy verringert um genau eine Kopie und entfernt den Eintrag bei 0', () => {
    expect(removeCopy({ a: 2, b: 1 }, 'a')).toEqual({ a: 1, b: 1 })
    expect(removeCopy({ a: 1, b: 1 }, 'a')).toEqual({ b: 1 })
  })

  it('removeCopy ändert nichts an nicht gewählten Karten', () => {
    const before = { b: 1 }
    expect(removeCopy(before, 'a')).toBe(before)
  })
})

describe('visibleRange', () => {
  // 46 Karten, Kopfbalken 50 px, sichtbare Höhe 500 px
  it('zeigt am Anfang die ersten Karten', () => {
    expect(visibleRange(0, 500, 50, 46)).toEqual([1, 10])
  })

  it('verschiebt sich mit dem Scroll-Offset', () => {
    expect(visibleRange(600, 500, 50, 46)).toEqual([13, 22])
  })

  it('endet bei der letzten Karte', () => {
    expect(visibleRange(2000, 500, 50, 46)).toEqual([41, 46])
  })

  it('liefert 0–0 für ein leeres Deck', () => {
    expect(visibleRange(0, 500, 50, 0)).toEqual([0, 0])
  })

  it('bleibt bei fehlenden Maßen (noch nicht gelayoutet) gültig', () => {
    expect(visibleRange(0, 0, 0, 46)).toEqual([1, 1])
  })
})
