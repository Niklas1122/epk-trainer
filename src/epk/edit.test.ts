import { describe, expect, it } from 'vitest'
import { and, assoc, doc, epk, ev, flow, fn, xor } from './build'
import { sameFlow, signature } from './compare'
import { EMPTY, connect, freeId, move, place, remove, route } from './edit'
import { validate } from './validate'

const decision = (k = xor('k', 1, 2)) =>
  epk(
    [ev('s', 'Start', 1, 0), fn('f', 'Prüfen', 1, 1), k, ev('a', 'Ja', 0, 3), ev('b', 'Nein', 2, 3)],
    flow(`s>f>${k.id}`, `${k.id}>a`, `${k.id}>b`),
  )

describe('Editor', () => {
  it('baut Schritt für Schritt dasselbe Modell wie die Vorlage', () => {
    const target = decision()
    let model = EMPTY
    for (const n of target.nodes.filter((n) => n.id !== 'k')) model = place(model, n)
    model = place(model, { ...xor(freeId(model), 1, 2) })
    for (const [from, to] of [['s', 'f'], ['f', 'c#1'], ['c#1', 'a'], ['c#1', 'b']]) model = connect(model, from, to)
    expect(validate(model)).toEqual([])
    expect(sameFlow(model, target)).toBe(true)
  })

  it('belegt kein Feld doppelt', () => {
    const model = place(EMPTY, ev('a', 'A', 0, 0))
    expect(place(model, fn('b', 'B', 0, 0))).toBe(model)
    expect(move(place(model, fn('b', 'B', 0, 1)), 'b', 0, 0).nodes.find((n) => n.id === 'b')).toMatchObject({ y: 1 })
  })

  it('dreht eine Kante um, statt eine zweite zu ziehen', () => {
    const model = connect(connect(decision(), 'f', 's'), 's', 's')
    expect(model.edges.filter((e) => [e.from, e.to].sort().join() === 'f,s')).toEqual([{ id: 'f>s', from: 'f', to: 's' }])
  })

  it('verbindet Erweiterungsobjekte ohne Richtung', () => {
    const model = place(decision(), doc('d', 'Beleg', 2, 1))
    expect(connect(model, 'f', 'd').edges.at(-1)).toEqual(assoc('d', 'f'))
    expect(connect(model, 'd', 'f').edges.at(-1)).toEqual(assoc('d', 'f'))
  })

  it('entfernt mit einem Knoten auch dessen Kanten', () => {
    const model = remove(decision(), 'k')
    expect(model.nodes.map((n) => n.id)).not.toContain('k')
    expect(model.edges.map((e) => e.id)).toEqual(['s>f'])
    expect(remove(decision(), 's>f').edges).toHaveLength(3)
  })

  it('führt nur Kanten nach oben außen herum', () => {
    const model = connect(decision(), 'b', 'f')
    const routed = route(model, 3)
    expect(routed.edges.filter((e) => e.via).map((e) => e.id)).toEqual(['b>f'])
    expect(routed.edges.at(-1)!.via).toEqual([[2.6, 3], [2.6, 1]])
  })
})

describe('Vergleich zweier Modelle', () => {
  it('ignoriert Layout und die IDs der Konnektoren', () => {
    const moved = decision(xor('other', 2, 2))
    expect(sameFlow(decision(), { ...moved, nodes: moved.nodes.map((n) => ({ ...n, y: n.y + 1 })) })).toBe(true)
  })

  it('unterscheidet Konnektortypen', () => {
    expect(sameFlow(decision(), decision(and('k', 1, 2)))).toBe(false)
  })

  it('behandelt verkettete gleichartige Konnektoren wie einen', () => {
    const chained = epk(
      [...decision().nodes, xor('k2', 2, 2), ev('c', 'Vielleicht', 1, 3)],
      flow('s>f>k', 'k>a', 'k>k2', 'k2>b', 'k2>c'),
    )
    expect(signature(chained)).toContain('f > xor-split > b')
    expect(signature(chained)).toContain('f > xor-split > c')
  })

  it('erkennt eine fehlende Verbindung', () => {
    expect(sameFlow(decision(), remove(decision(), 'k>b'))).toBe(false)
  })
})
