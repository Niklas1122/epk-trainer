import type { ConnectorType, EpkEdge, NodeType } from '../types'

export const COL = 180
export const ROW = 90
export const W = 144
export const H = 52
export const R = 18
/** Distance between the outer column and an edge led around it, in columns. */
export const LANE = 0.6

export interface Pt {
  x: number
  y: number
}

export interface Box {
  c: Pt
  hw: number
  hh: number
}

export const isConnector = (t: NodeType): t is ConnectorType => t === 'xor' || t === 'or' || t === 'and'
export const isExtension = (t: NodeType) => t === 'org' || t === 'doc'

export function extent(type: NodeType): { hw: number; hh: number } {
  if (isConnector(type)) return { hw: R, hh: R }
  if (isExtension(type)) return { hw: 58, hh: 22 }
  return { hw: W / 2, hh: H / 2 }
}

export const center = (n: { x: number; y: number }): Pt => ({ x: n.x * COL, y: n.y * ROW })

/** Point on the node boundary facing `q`, restricted to the four sides. */
function port(box: Box, q: Pt): Pt {
  const dx = q.x - box.c.x
  const dy = q.y - box.c.y
  if (Math.abs(dx) >= Math.abs(dy)) return { x: box.c.x + Math.sign(dx) * box.hw, y: box.c.y }
  return { x: box.c.x, y: box.c.y + Math.sign(dy) * box.hh }
}

/** Orthogonal polyline from the boundary of `a` to the boundary of `b`. */
export function routeEdge(edge: EpkEdge, a: Box, b: Box): Pt[] {
  if (edge.from === edge.to) {
    const x = a.c.x + a.hw
    return [
      { x, y: a.c.y - 10 },
      { x: x + 30, y: a.c.y - 10 },
      { x: x + 30, y: a.c.y + 10 },
      { x, y: a.c.y + 10 },
    ]
  }

  let pts: Pt[]
  if (edge.via) {
    pts = [a.c, ...edge.via.map(([x, y]) => center({ x, y })), b.c]
  } else if (Math.abs(a.c.x - b.c.x) < 1 || Math.abs(a.c.y - b.c.y) < 1) {
    pts = [a.c, b.c]
  } else {
    const down = b.c.y > a.c.y
    const midY = down ? (a.c.y + a.hh + b.c.y - b.hh) / 2 : (a.c.y - a.hh + b.c.y + b.hh) / 2
    pts = [a.c, { x: a.c.x, y: midY }, { x: b.c.x, y: midY }, b.c]
  }

  pts = pts.map((p) => ({ ...p }))
  pts[0] = port(a, pts[1])
  pts[pts.length - 1] = port(b, pts[pts.length - 2])
  const dx = edge.dx ?? 0
  return dx ? pts.map((p) => ({ x: p.x + dx, y: p.y })) : pts
}

export function arrowHead(pts: Pt[]): string {
  const p = pts[pts.length - 1]
  const q = pts[pts.length - 2]
  const ang = Math.atan2(p.y - q.y, p.x - q.x)
  const bx = p.x - 10 * Math.cos(ang)
  const by = p.y - 10 * Math.sin(ang)
  const nx = -Math.sin(ang) * 4.5
  const ny = Math.cos(ang) * 4.5
  return `${p.x},${p.y} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`
}

/** Midpoint of the longest segment, used to place a marker on an edge. */
export function edgeAnchor(pts: Pt[]): Pt {
  let best = 0
  let anchor = pts[0]
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    if (len > best) {
      best = len
      anchor = { x: (pts[i].x + pts[i - 1].x) / 2, y: (pts[i].y + pts[i - 1].y) / 2 }
    }
  }
  return anchor
}

export function wrapLabel(label: string, max = 18): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of label.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines
}
