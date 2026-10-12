import type { KeyboardEvent, SVGProps } from 'react'
import { NODE_LABEL, cls } from '../lib/labels'
import type { Epk, NodeType } from '../types'
import { COL, H, LANE, ROW, W, arrowHead, center, edgeAnchor, extent, isConnector, routeEdge, wrapLabel } from './geometry'
import type { Box, Pt } from './geometry'

export type Mark = 'correct' | 'wrong' | 'hint'

interface Props {
  epk: Epk
  /** Which elements react to clicks: none, every node and edge, or only slots. */
  selectable?: 'none' | 'all' | 'slots'
  selected?: string | null
  onSelect?: (id: string) => void
  marks?: Record<string, Mark>
  /** Node types the learner has put into slots. */
  filled?: Record<string, NodeType | undefined>
  legend?: boolean
  /** Reserves the space of an editing grid, so the diagram keeps its size while it is edited. */
  grid?: { cols: number; rows: number }
  /** Draws the free cells of the grid as targets for placing nodes. */
  onCell?: (x: number, y: number) => void
  /** Lets the free cells react to clicks. They then lie on top of the edges. */
  cellsActive?: boolean
  /** Extra attributes for a node, used by the editor to make nodes draggable. */
  nodeProps?: (id: string) => SVGProps<SVGGElement>
}

const PAD = 14
const LEGEND_ORDER: NodeType[] = ['event', 'function', 'interface', 'and', 'or', 'xor', 'org', 'doc']
const SYMBOL: Partial<Record<NodeType, string>> = { xor: 'XOR', or: '∨', and: '∧' }

const hexagon = (hw: number, hh: number, inset = 15) =>
  `${-hw},0 ${-hw + inset},${-hh} ${hw - inset},${-hh} ${hw},0 ${hw - inset},${hh} ${-hw + inset},${hh}`

function Shape({ type }: { type: NodeType }) {
  const { hw, hh } = extent(type)
  switch (type) {
    case 'event':
      return <polygon className="shape" points={hexagon(hw, hh)} />
    case 'function':
      return <rect className="shape" x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={12} />
    case 'interface':
      return (
        <>
          {/* offset down and right so that incoming arrows at the top stay visible */}
          <polygon className="shape shape-back" points={hexagon(hw, hh)} transform="translate(9 7)" />
          <rect className="shape" x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={12} />
        </>
      )
    case 'org':
      return (
        <>
          <ellipse className="shape" rx={hw} ry={hh} />
          <line className="shape-detail" x1={-hw + 15} y1={-hh + 8} x2={-hw + 15} y2={hh - 8} />
        </>
      )
    case 'doc':
      return (
        <path
          className="shape"
          d={`M${-hw},${-hh} H${hw} V${hh - 6} Q${hw / 2},${hh - 16} 0,${hh - 6} T${-hw},${hh - 6} Z`}
        />
      )
    case 'slot':
      return <rect className="shape" x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={12} />
    default:
      return <circle className="shape" r={hw} />
  }
}

function NodeText({ type, label }: { type: NodeType; label?: string }) {
  if (isConnector(type)) {
    return (
      <text className={cls('node-symbol', type === 'xor' && 'is-word')} dy={type === 'xor' ? '0.36em' : '0.34em'}>
        {SYMBOL[type]}
      </text>
    )
  }
  if (type === 'slot') {
    return (
      <text className="node-symbol" dy="0.36em">
        ?
      </text>
    )
  }
  const lines = wrapLabel(label ?? '', type === 'org' || type === 'doc' ? 14 : 18)
  const dy = type === 'doc' ? -4 : 0
  return (
    <text className="node-label">
      {lines.map((line, i) => (
        <tspan key={i} x={0} y={(i - (lines.length - 1) / 2) * 15 + dy} dy="0.35em">
          {line}
        </tspan>
      ))}
    </text>
  )
}

/** Small symbol for legends and the palette of fill tasks. */
export function NodeIcon({ type }: { type: NodeType }) {
  const { hw, hh } = extent(type)
  const connector = isConnector(type)
  const pad = connector ? 3 : 12
  return (
    <svg
      className={cls('node-icon', `t-${type}`)}
      viewBox={`${-hw - pad} ${-hh - pad} ${(hw + pad) * 2} ${(hh + pad) * 2}`}
      width={connector ? 26 : 40}
      height={connector ? 26 : 18}
      aria-hidden="true"
    >
      <Shape type={type} />
      {connector && <NodeText type={type} />}
    </svg>
  )
}

export function LegendItems({ types }: { types: NodeType[] }) {
  return (
    <>
      {LEGEND_ORDER.filter((t) => types.includes(t)).map((t) => (
        <span key={t} className="legend-item">
          <NodeIcon type={t} />
          {NODE_LABEL[t].replace('-Konnektor', '')}
        </span>
      ))}
    </>
  )
}

function Badge({ at, mark }: { at: Pt; mark: Mark }) {
  return (
    <g className={cls('epk-badge', `mark-${mark}`)} transform={`translate(${at.x} ${at.y})`} aria-hidden="true">
      <circle r={10} />
      <text dy="0.36em">{mark === 'wrong' ? '✕' : '✓'}</text>
    </g>
  )
}

export function EpkDiagram({
  epk,
  selectable = 'none',
  selected,
  onSelect,
  marks = {},
  filled = {},
  legend = true,
  grid,
  onCell,
  cellsActive,
  nodeProps,
}: Props) {
  const boxes = new Map<string, Box & { type: NodeType }>()
  for (const n of epk.nodes) {
    const type = n.type === 'slot' ? (filled[n.id] ?? 'slot') : n.type
    boxes.set(n.id, { type, c: center(n), ...extent(type) })
  }
  const routes = epk.edges.map((edge) => ({
    edge,
    pts: routeEdge(edge, boxes.get(edge.from)!, boxes.get(edge.to)!),
  }))
  const frames = (epk.frames ?? []).map((f) => ({
    title: f.title,
    x: f.x * COL - W / 2 - 18,
    y: f.y * ROW - H / 2 - 44,
    width: (f.w - 1) * COL + W + 36,
    height: (f.h - 1) * ROW + H + 62,
  }))

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const grow = (x0: number, y0: number, x1: number, y1: number) => {
    minX = Math.min(minX, x0)
    minY = Math.min(minY, y0)
    maxX = Math.max(maxX, x1)
    maxY = Math.max(maxY, y1)
  }
  for (const b of boxes.values()) grow(b.c.x - b.hw - 2, b.c.y - b.hh - 12, b.c.x + b.hw + 12, b.c.y + b.hh + 10)
  for (const r of routes) for (const p of r.pts) grow(p.x - 8, p.y - 8, p.x + 8, p.y + 8)
  for (const f of frames) grow(f.x, f.y, f.x + f.width, f.y + f.height)
  if (grid) {
    const side = LANE * COL + 26
    grow(-side, -H / 2 - 4, (grid.cols - 1) * COL + side, (grid.rows - 1) * ROW + H / 2 + 4)
  }
  const width = maxX - minX + PAD * 2
  const height = maxY - minY + PAD * 2

  const describe = (id: string) => {
    const node = epk.nodes.find((n) => n.id === id)!
    const type = boxes.get(id)!.type
    return node.label ? `${NODE_LABEL[type]} „${node.label}“` : NODE_LABEL[type]
  }

  const button = (label: string, action: (() => void) | false | undefined, pressed?: boolean) => {
    if (!action) return {}
    return {
      role: 'button',
      tabIndex: 0,
      'aria-label': label,
      'aria-pressed': pressed,
      onClick: action,
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          action()
        }
      },
    }
  }
  const interactive = (id: string, label: string, enabled: boolean) =>
    button(label, enabled && onSelect && (() => onSelect(id)), selected === id)

  const cells: [number, number][] = []
  if (grid && onCell) {
    const taken = new Set(epk.nodes.map((n) => `${n.x},${n.y}`))
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) if (!taken.has(`${x},${y}`)) cells.push([x, y])
    }
  }

  const legendTypes = [...new Set([...boxes.values()].map((b) => b.type))]

  return (
    <figure className="epk">
      <div className="epk-scroll">
        <svg
          className="epk-svg"
          viewBox={`${minX - PAD} ${minY - PAD} ${width} ${height}`}
          width={width}
          height={height}
          role="group"
          aria-label="EPK-Diagramm"
        >
          {frames.map((f) => (
            <g key={f.title} className="epk-frame">
              <rect x={f.x} y={f.y} width={f.width} height={f.height} rx={14} />
              <text x={f.x + f.width / 2} y={f.y + 21}>
                {f.title}
              </text>
            </g>
          ))}

          {routes.map(({ edge, pts }) => {
            const points = pts.map((p) => `${p.x},${p.y}`).join(' ')
            const enabled = selectable === 'all'
            return (
              <g
                key={edge.id}
                className={cls(
                  'epk-edge',
                  edge.kind === 'assoc' && 'is-assoc',
                  enabled && 'is-selectable',
                  selected === edge.id && 'is-selected',
                  marks[edge.id] && `mark-${marks[edge.id]}`,
                )}
                {...interactive(edge.id, `Kante von ${describe(edge.from)} nach ${describe(edge.to)}`, enabled)}
              >
                <polyline className="hit" points={points} />
                <polyline className="line" points={points} />
                {edge.kind !== 'assoc' && <polygon className="head" points={arrowHead(pts)} />}
              </g>
            )
          })}

          {cells.map(([x, y]) => (
            <g
              key={`${x},${y}`}
              className={cls('epk-cell', cellsActive && 'is-selectable')}
              transform={`translate(${x * COL} ${y * ROW})`}
              data-cell={`${x},${y}`}
              {...button(`Freies Feld, Spalte ${x + 1}, Zeile ${y + 1}`, cellsActive && (() => onCell!(x, y)))}
            >
              <rect className="hit" x={-COL / 2} y={-ROW / 2} width={COL} height={ROW} />
              <rect className="spot" x={-W / 2} y={-H / 2} width={W} height={H} rx={12} />
            </g>
          ))}

          {epk.nodes.map((n) => {
            const box = boxes.get(n.id)!
            const isSlot = n.type === 'slot'
            const enabled = selectable === 'all' || (selectable === 'slots' && isSlot)
            const label = isSlot && box.type !== 'slot' ? NODE_LABEL[box.type].replace('-Konnektor', '') : n.label
            return (
              <g
                key={n.id}
                className={cls(
                  'epk-node',
                  `t-${box.type}`,
                  isSlot && 'is-slot',
                  enabled && 'is-selectable',
                  selected === n.id && 'is-selected',
                  marks[n.id] && `mark-${marks[n.id]}`,
                )}
                transform={`translate(${box.c.x} ${box.c.y})`}
                data-slot-id={isSlot ? n.id : undefined}
                {...interactive(n.id, isSlot && box.type === 'slot' ? 'Lücke' : describe(n.id), enabled)}
                {...nodeProps?.(n.id)}
              >
                <Shape type={box.type} />
                <NodeText type={box.type} label={label} />
              </g>
            )
          })}

          {routes.map(({ edge, pts }) => marks[edge.id] && <Badge key={edge.id} at={edgeAnchor(pts)} mark={marks[edge.id]} />)}
          {epk.nodes.map((n) => {
            const box = boxes.get(n.id)!
            return (
              marks[n.id] && (
                <Badge key={n.id} at={{ x: box.c.x + box.hw - 4, y: box.c.y - box.hh + 2 }} mark={marks[n.id]} />
              )
            )
          })}
        </svg>
      </div>

      {legend && legendTypes.some((t) => LEGEND_ORDER.includes(t)) && (
        <figcaption className="legend">
          <LegendItems types={legendTypes} />
        </figcaption>
      )}
    </figure>
  )
}
