import { describe, expect, it } from 'vitest'
import { layoutProblems } from '../epk/layoutProblems'
import { GROUPS, RULES } from './rules'
import { TASKS } from './tasks'

describe('Regelkatalog', () => {
  it('hat eindeutige Regel-IDs in bekannten Gruppen', () => {
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length)
    for (const r of RULES) expect(GROUPS.some((g) => g.id === r.group)).toBe(true)
  })

  it('hat zu jeder Regel mindestens eine Aufgabe', () => {
    const trained = new Set(TASKS.flatMap((t) => t.rules))
    expect(RULES.filter((r) => !trained.has(r.id)).map((r) => r.id)).toEqual([])
  })

  it('hat Beispieldiagramme ohne Layoutfehler', () => {
    for (const r of RULES) {
      for (const ex of r.examples ?? []) expect(layoutProblems(ex.epk), r.id).toEqual([])
    }
  })
})
