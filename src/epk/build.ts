import type { Epk, EpkEdge, EpkFrame, EpkNode, NodeType } from '../types'

// Short helpers so that diagrams in the data files stay readable.

const node =
  (type: NodeType) =>
  (id: string, label: string, x: number, y: number): EpkNode => ({ id, type, label, x, y })

export const ev = node('event')
export const fn = node('function')
export const pi = node('interface')
export const org = node('org')
export const doc = node('doc')

const bare =
  (type: NodeType) =>
  (id: string, x: number, y: number): EpkNode => ({ id, type, x, y })

export const xor = bare('xor')
export const or = bare('or')
export const and = bare('and')
export const slot = bare('slot')

/** Control flow edges. Each argument is a chain such as 'a>b>c'. */
export function flow(...chains: string[]): EpkEdge[] {
  const edges: EpkEdge[] = []
  for (const chain of chains) {
    const ids = chain.split('>')
    for (let i = 1; i < ids.length; i++) {
      edges.push({ id: `${ids[i - 1]}>${ids[i]}`, from: ids[i - 1], to: ids[i] })
    }
  }
  return edges
}

/** Control flow edge along explicit grid waypoints, e.g. a jump back. */
export const via = (from: string, to: string, points: [number, number][]): EpkEdge => ({
  id: `${from}>${to}`,
  from,
  to,
  via: points,
})

/** Link between an extension object and a node. */
export const assoc = (from: string, to: string): EpkEdge => ({
  id: `${from}~${to}`,
  from,
  to,
  kind: 'assoc',
})

export const frame = (title: string, x: number, y: number, w: number, h: number): EpkFrame => ({
  title,
  x,
  y,
  w,
  h,
})

export const epk = (nodes: EpkNode[], edges: EpkEdge[], frames?: EpkFrame[]): Epk => ({
  nodes,
  edges,
  ...(frames ? { frames } : {}),
})
