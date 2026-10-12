import type { Epk } from '../types'
import { COL, ROW, extent } from './geometry'

/** Mistakes in the data of a diagram, used by the tests: bad ids, dangling edges, overlapping nodes. */
export function layoutProblems(epk: Epk): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const n of epk.nodes) {
    if (ids.has(n.id)) problems.push(`doppelte Knoten-ID ${n.id}`)
    ids.add(n.id)
  }
  const edgeIds = new Set<string>()
  for (const e of epk.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) problems.push(`Kante ${e.id} zeigt auf unbekannten Knoten`)
    if (edgeIds.has(e.id)) problems.push(`doppelte Kanten-ID ${e.id}`)
    edgeIds.add(e.id)
  }
  for (let i = 0; i < epk.nodes.length; i++) {
    for (let j = i + 1; j < epk.nodes.length; j++) {
      const a = epk.nodes[i]
      const b = epk.nodes[j]
      const ea = extent(a.type)
      const eb = extent(b.type)
      const overlapX = Math.abs(a.x - b.x) * COL < ea.hw + eb.hw
      const overlapY = Math.abs(a.y - b.y) * ROW < ea.hh + eb.hh
      if (overlapX && overlapY) problems.push(`${a.id} und ${b.id} überlappen`)
    }
  }
  return problems
}

/** Nodes that do not sit on a cell of the editing grid. */
export function offGrid(epk: Epk, grid: { cols: number; rows: number }): string[] {
  const inside = (v: number, size: number) => Number.isInteger(v) && v >= 0 && v < size
  return epk.nodes.filter((n) => !inside(n.x, grid.cols) || !inside(n.y, grid.rows)).map((n) => n.id)
}
