import type { ButtonHTMLAttributes } from 'react'
import { NodeIcon } from '../epk/EpkDiagram'
import { NODE_LABEL, cls } from '../lib/labels'
import type { NodeType } from '../types'

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  type: NodeType
  /** Defaults to the name of the node type. */
  label?: string
  armed?: boolean
}

/** An element that is clicked or dragged into a diagram. */
export function Chip({ type, label, armed, ...rest }: ChipProps) {
  return (
    <button type="button" className={cls('chip', armed && 'is-armed')} aria-pressed={armed} {...rest}>
      <NodeIcon type={type} />
      {label ?? NODE_LABEL[type]}
    </button>
  )
}

/** Follows the pointer while a chip or a node is dragged. */
export function DragGhost({ type, label, x, y }: { type: NodeType; label?: string; x: number; y: number }) {
  return (
    <div className="drag-ghost" style={{ left: x, top: y }}>
      <NodeIcon type={type} />
      {label ?? NODE_LABEL[type]}
    </div>
  )
}
