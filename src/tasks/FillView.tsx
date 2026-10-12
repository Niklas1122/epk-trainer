import { useState } from 'react'
import { EpkDiagram } from '../epk/EpkDiagram'
import type { Mark } from '../epk/EpkDiagram'
import type { FillTask, NodeType } from '../types'
import { Chip, DragGhost } from './Palette'
import { useDrag } from './useDrag'
import type { ViewProps } from './ViewProps'

export function FillView({ task, answer, onChange, revealed }: ViewProps<FillTask>) {
  const slots = Object.keys(task.solution)
  const filled = answer.fill ?? {}
  const [armed, setArmed] = useState<NodeType | null>(null)

  const place = (slot: string, type: NodeType) => onChange({ fill: { ...filled, [slot]: type } })

  const drag = useDrag<NodeType>((type, target) => {
    const slot = target?.closest('[data-slot-id]')?.getAttribute('data-slot-id')
    if (slot) place(slot, type)
  })
  const onChipClick = (type: NodeType) => {
    if (slots.length === 1) place(slots[0], type)
    else setArmed(armed === type ? null : type)
  }
  const onSlotClick = (slot: string) => {
    if (armed) {
      place(slot, armed)
      setArmed(null)
    } else if (filled[slot]) {
      const next = { ...filled }
      delete next[slot]
      onChange({ fill: next })
    }
  }

  const marks: Record<string, Mark> = {}
  if (revealed) {
    for (const slot of slots) {
      const type = filled[slot]
      marks[slot] = type !== undefined && task.solution[slot].includes(type) ? 'correct' : 'wrong'
    }
  }

  return (
    <>
      <div className="palette" aria-label="Elemente zum Einsetzen">
        {task.palette.map((type) => (
          <Chip
            key={type}
            type={type}
            armed={armed === type}
            disabled={revealed}
            onClick={() => onChipClick(type)}
            {...(revealed ? {} : drag.bind(type))}
          />
        ))}
      </div>
      <EpkDiagram
        epk={task.epk}
        selectable={revealed ? 'none' : 'slots'}
        onSelect={onSlotClick}
        filled={filled}
        marks={marks}
        legend={false}
      />
      {drag.ghost && <DragGhost type={drag.ghost.item} x={drag.ghost.x} y={drag.ghost.y} />}
    </>
  )
}
