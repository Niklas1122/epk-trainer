import type { Epk } from '../types'
import { isConnector, isExtension } from './geometry'

/**
 * Describes what an EPK models, independent of its layout and of connector ids:
 * one entry per path from an event or function to the next one, naming the
 * connectors on the way, and one entry per attached extension object.
 */
export function signature(epk: Epk): string[] {
  const type = new Map(epk.nodes.map((n) => [n.id, n.type]))
  const ins = new Map<string, number>()
  const outs = new Map<string, string[]>()
  const entries = new Set<string>()

  for (const e of epk.edges) {
    if (e.kind === 'assoc') {
      const [object, owner] = isExtension(type.get(e.from)!) ? [e.from, e.to] : [e.to, e.from]
      entries.add(`${object} ~ ${owner}`)
      continue
    }
    ins.set(e.to, (ins.get(e.to) ?? 0) + 1)
    outs.set(e.from, [...(outs.get(e.from) ?? []), e.to])
  }

  const step = (id: string) => {
    const split = (outs.get(id)?.length ?? 0) > 1
    const join = (ins.get(id) ?? 0) > 1
    return `${type.get(id)}-${split && join ? 'both' : split ? 'split' : join ? 'join' : 'pass'}`
  }
  const walk = (start: string, id: string, path: string[], seen: Set<string>) => {
    for (const next of outs.get(id) ?? []) {
      if (!isConnector(type.get(next)!)) {
        entries.add([start, ...path, next].join(' > '))
      } else if (!seen.has(next)) {
        // Chained connectors of the same kind mean the same as a single one.
        const s = step(next)
        walk(start, next, path[path.length - 1] === s ? path : [...path, s], new Set(seen).add(next))
      }
    }
  }
  for (const n of epk.nodes) if (!isConnector(n.type)) walk(n.id, n.id, [], new Set())

  return [...entries].sort()
}

/** True if both EPKs model the same process. Labelled nodes are matched by id. */
export const sameFlow = (a: Epk, b: Epk) => signature(a).join('\n') === signature(b).join('\n')
