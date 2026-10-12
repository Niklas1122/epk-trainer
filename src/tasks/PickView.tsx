import type { CSSProperties } from 'react'
import { EpkDiagram, LegendItems } from '../epk/EpkDiagram'
import { COL, W } from '../epk/geometry'
import { choiceName, cls } from '../lib/labels'
import type { Epk, PickTask } from '../types'
import { OptionMark, optionState } from './Option'
import type { ViewProps } from './ViewProps'

/** Rough pixel width of a diagram, so that wide diagrams get fewer columns. */
function widthOf(epk: Epk): number {
  const xs = [...epk.nodes.map((n) => n.x), ...epk.edges.flatMap((e) => e.via?.map(([x]) => x) ?? [])]
  return (Math.max(...xs) - Math.min(...xs)) * COL + W + 70
}

export function PickView({ task, answer, onChange, revealed }: ViewProps<PickTask>) {
  const width = Math.min(400, Math.max(...task.choices.map((c) => widthOf(c.epk))))
  const types = [...new Set(task.choices.flatMap((c) => c.epk.nodes.map((n) => n.type)))]
  return (
    <>
      <div className="choices" style={{ '--choice-min': `${width}px` } as CSSProperties}>
        {task.choices.map((choice, i) => {
          const mark = { selected: answer.pick === i, correct: task.correct === i, revealed }
          return (
            // The button makes the choice reachable by keyboard; a click anywhere on the card selects it.
            <div
              key={i}
              className={cls('choice', optionState(mark))}
              onClick={revealed ? undefined : () => onChange({ pick: i })}
            >
              <button type="button" className="choice-head" aria-pressed={mark.selected} disabled={revealed}>
                <OptionMark {...mark} />
                {choiceName(i)}
              </button>
              <EpkDiagram epk={choice.epk} legend={false} />
              {revealed && <p className="choice-note">{choice.note}</p>}
            </div>
          )
        })}
      </div>
      <div className="legend">
        <LegendItems types={types} />
      </div>
    </>
  )
}
