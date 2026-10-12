import type { Epk, EpkEdge, EpkNode } from '../types'
import { assoc, flow } from './build'
import { LANE, isExtension } from './geometry'

// Operations of the modelling editor. Each one returns a new EPK.

export const EMPTY: Epk = { nodes: [], edges: [] }

export const nodeAt = (epk: Epk, x: number, y: number) => epk.nodes.find((n) => n.x === x && n.y === y)

/** An id for a new connector that no node of the EPK uses yet. */
export function freeId(epk: Epk): string {
  let i = 1
  while (epk.nodes.some((n) => n.id === `c#${i}`)) i++
  return `c#${i}`
}

/** Adds a node at its own position, unless the cell is taken. */
export function place(epk: Epk, node: EpkNode): Epk {
  if (nodeAt(epk, node.x, node.y) || epk.nodes.some((n) => n.id === node.id)) return epk
  return { ...epk, nodes: [...epk.nodes, node] }
}

export function move(epk: Epk, id: string, x: number, y: number): Epk {
  if (nodeAt(epk, x, y)) return epk
  return { ...epk, nodes: epk.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) }
}

/**
 * Draws an edge from one node to another. An edge that already runs between
 * the two is replaced, so connecting them the other way round turns it.
 */
export function connect(epk: Epk, from: string, to: string): Epk {
  if (from === to) return epk
  const isObject = (id: string) => isExtension(epk.nodes.find((n) => n.id === id)!.type)
  const between = (e: EpkEdge) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
  const edge = isObject(from) ? assoc(from, to) : isObject(to) ? assoc(to, from) : flow(`${from}>${to}`)[0]
  return { ...epk, edges: [...epk.edges.filter((e) => !between(e)), edge] }
}

/** Removes an edge, or a node together with its edges. */
export function remove(epk: Epk, id: string): Epk {
  return {
    ...epk,
    nodes: epk.nodes.filter((n) => n.id !== id),
    edges: epk.edges.filter((e) => e.id !== id && e.from !== id && e.to !== id),
  }
}

const LANE_GAP = 0.1

/**
 * Leads edges that run upwards around the side of the model, the way a jump
 * back is drawn. `cols` fixes the lanes to a grid of that width; without it
 * they follow the outermost nodes.
 */
export function route(epk: Epk, cols?: number): Epk {
  const at = new Map(epk.nodes.map((n) => [n.id, n]))
  const min = cols === undefined ? Math.min(...epk.nodes.map((n) => n.x)) : 0
  const max = cols === undefined ? Math.max(...epk.nodes.map((n) => n.x)) : cols - 1
  let left = 0
  let right = 0
  const edges = epk.edges.map((e): EpkEdge => {
    const a = at.get(e.from)!
    const b = at.get(e.to)!
    if (e.kind === 'assoc' || e.via || a.y <= b.y) return e
    const x = a.x - min >= (max - min) / 2 ? max + LANE + LANE_GAP * right++ : min - LANE - LANE_GAP * left++
    return { ...e, via: [[x, a.y], [x, b.y]] }
  })
  return { ...epk, edges }
}
