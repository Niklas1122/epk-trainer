import type { Epk, EpkNode, NodeType } from '../types'
import { isConnector, isExtension } from './geometry'

/**
 * Rules that can be decided from the structure of a single EPK.
 * The remaining rules (naming, jumps back, linked models) need a human.
 */
export const CHECKABLE = [
  'E1', 'E2', 'E3', 'E4',
  'F1', 'F2',
  'K1', 'K2', 'K3',
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6',
  'P7',
]

const isFunctionLike = (t: NodeType) => t === 'function' || t === 'interface'

/** Returns the ids of all structurally checkable rules that `epk` breaks. */
export function validate(epk: Epk): string[] {
  const found = new Set<string>()
  const byId = new Map(epk.nodes.map((n) => [n.id, n]))
  const type = (id: string) => byId.get(id)!.type

  const ins = new Map<string, string[]>()
  const outs = new Map<string, string[]>()
  const neighbours = new Map<string, string[]>()
  for (const n of epk.nodes) {
    ins.set(n.id, [])
    outs.set(n.id, [])
    neighbours.set(n.id, [])
  }

  const seen = new Set<string>()
  for (const e of epk.edges) {
    neighbours.get(e.from)!.push(e.to)
    neighbours.get(e.to)!.push(e.from)

    if (e.kind === 'assoc') {
      const other = isExtension(type(e.from)) ? e.to : e.from
      if (type(other) !== 'function') found.add('M6')
      continue
    }
    if (e.from === e.to) {
      found.add('M4')
      continue
    }
    const key = `${e.from}>${e.to}`
    if (seen.has(key)) {
      found.add('M5')
      continue
    }
    seen.add(key)
    outs.get(e.from)!.push(e.to)
    ins.get(e.to)!.push(e.from)
  }

  // Nearest events / functions in one direction, looking through connectors.
  const reach = (start: string, dir: Map<string, string[]>): EpkNode[] => {
    const result: EpkNode[] = []
    const visited = new Set<string>()
    const stack = [...dir.get(start)!]
    while (stack.length) {
      const id = stack.pop()!
      if (visited.has(id)) continue
      visited.add(id)
      if (isConnector(type(id))) stack.push(...dir.get(id)!)
      else result.push(byId.get(id)!)
    }
    return result
  }
  const next = (id: string) => reach(id, outs)
  const prev = (id: string) => reach(id, ins)
  const kinds = (nodes: EpkNode[]) => new Set(nodes.map((n) => (n.type === 'event' ? 'event' : 'function')))

  const components: string[][] = []
  const assigned = new Set<string>()
  for (const n of epk.nodes) {
    if (assigned.has(n.id)) continue
    const comp: string[] = []
    const stack = [n.id]
    while (stack.length) {
      const id = stack.pop()!
      if (assigned.has(id)) continue
      assigned.add(id)
      comp.push(id)
      stack.push(...neighbours.get(id)!)
    }
    components.push(comp)
  }
  if (components.length > (epk.frames?.length ?? 1)) found.add('M1')

  for (const n of epk.nodes) {
    if (isExtension(n.type)) continue
    const i = ins.get(n.id)!.length
    const o = outs.get(n.id)!.length
    if (i === 0 && o === 0) continue // isolated, already reported as M1

    if (n.type === 'event') {
      if (o > 1) found.add(i === 0 ? 'E2' : 'E1')
      if (i > 1) found.add(o === 0 ? 'E3' : 'E1')
      if (next(n.id).some((t) => t.type === 'event')) found.add('E4')
    } else if (n.type === 'function') {
      if (i !== 1 || o !== 1) found.add('F1')
      if (next(n.id).some((t) => isFunctionLike(t.type))) found.add('F2')
    } else if (n.type === 'interface') {
      if (i > 1 || o > 1) found.add('P7')
      if (next(n.id).some((t) => isFunctionLike(t.type))) found.add('F2')
    } else if (isConnector(n.type)) {
      const split = i === 1 && o >= 2
      const join = i >= 2 && o === 1
      if (!split && !join) found.add('K1')
      if (kinds(prev(n.id)).size > 1 || kinds(next(n.id)).size > 1) found.add('K2')
      if (o >= 2 && n.type !== 'and' && prev(n.id).some((t) => t.type === 'event')) found.add('K3')
    }
  }

  // A process interface may sit before a start event or after an end event,
  // also with a connector in between that joins several of these events.
  const outerInterface = (id: string, dir: Map<string, string[]>) => {
    const reached = reach(id, dir)
    return reached.length > 0 && reached.every((n) => n.type === 'interface' && dir.get(n.id)!.length === 0)
  }
  for (const comp of components) {
    if (comp.length < 2) continue
    const events = comp.filter((id) => type(id) === 'event')
    const isStart = (id: string) => ins.get(id)!.length === 0 || outerInterface(id, ins)
    const isEnd = (id: string) => outs.get(id)!.length === 0 || outerInterface(id, outs)
    if (!events.some(isStart)) found.add('M2')
    if (!events.some(isEnd)) found.add('M3')
  }

  return [...found].sort()
}
