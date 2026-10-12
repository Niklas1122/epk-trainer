import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { RULE_BY_ID } from '../data/rules'
import { EpkDiagram } from '../epk/EpkDiagram'
import { EMPTY, connect, freeId, move, place, remove, route } from '../epk/edit'
import { offeredNodes, reviewModel } from '../lib/check'
import type { ConnectorType, Epk, EpkNode, ModelTask, NodeType } from '../types'
import { Chip, DragGhost } from './Palette'
import { useDrag } from './useDrag'
import type { ViewProps } from './ViewProps'

/** Something that goes onto the grid: an offered element, a new connector, or a node that is moved. */
interface Piece {
  type: NodeType
  label?: string
  /** Missing for a connector that does not exist yet. */
  id?: string
  placed?: boolean
}

const CONNECTORS: ConnectorType[] = ['xor', 'or', 'and']
const TRAY_ORDER: NodeType[] = ['event', 'function', 'interface', 'org', 'doc']

const names = (nodes: EpkNode[]) => nodes.map((n) => `„${n.label}“`).join(', ')

function ModelResult({ task, model }: { task: ModelTask; model: Epk }) {
  const review = reviewModel(task, model)
  const onlyFlow = !review.sameFlow && !review.missing.length && !review.surplus.length && !review.violations.length
  return (
    <>
      <div className="compare">
        <div className="compare-item">
          <p className="compare-title">Dein Modell</p>
          {model.nodes.length > 0 ? (
            <EpkDiagram epk={route(model)} legend={false} />
          ) : (
            <p className="muted">Du hast kein Element platziert.</p>
          )}
        </div>
        {!review.ok && (
          <div className="compare-item">
            <p className="compare-title">Musterlösung</p>
            <EpkDiagram epk={route(task.solution)} legend={false} />
          </div>
        )}
      </div>
      {!review.ok && (
        <ul className="issues">
          {review.missing.length > 0 && <li>Nicht verwendet: {names(review.missing)}</li>}
          {review.surplus.length > 0 && <li>Gehört nicht in dieses Modell: {names(review.surplus)}</li>}
          {review.violations.map((id) => (
            <li key={id}>
              Dein Modell verstößt gegen <span className="badge">{id}</span> {RULE_BY_ID[id].title}
            </li>
          ))}
          {onlyFlow && (
            <li>
              Dein Modell hält die Regeln ein, die sich automatisch prüfen lassen, bildet aber nicht den beschriebenen
              Ablauf ab. Vergleiche Reihenfolge und Konnektoren mit der Musterlösung.
            </li>
          )}
        </ul>
      )}
    </>
  )
}

export function ModelView({ task, answer, onChange, revealed }: ViewProps<ModelTask>) {
  const model = answer.model ?? task.start ?? EMPTY
  const [armed, setArmed] = useState<Piece | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const update = (next: Epk) => {
    if (next !== model) onChange({ model: next })
  }
  const clear = () => {
    setArmed(null)
    setSelected(null)
  }
  const put = (piece: Piece, x: number, y: number) => {
    if (piece.placed) update(move(model, piece.id!, x, y))
    else update(place(model, { id: piece.id ?? freeId(model), type: piece.type, label: piece.label, x, y }))
  }
  const drag = useDrag<Piece>((piece, target) => {
    const cell = target?.closest('[data-cell]')?.getAttribute('data-cell')
    if (!cell) return
    const [x, y] = cell.split(',').map(Number)
    put(piece, x, y)
    clear()
  })

  if (revealed) return <ModelResult task={task} model={model} />

  const isNode = (id: string | null) => model.nodes.some((n) => n.id === id)
  const nodeSelected = isNode(selected)
  const isArmed = (piece: Piece) => armed?.type === piece.type && armed.id === piece.id
  const tray = offeredNodes(task)
    .filter((n) => !isNode(n.id))
    .sort((a, b) => TRAY_ORDER.indexOf(a.type) - TRAY_ORDER.indexOf(b.type) || a.label!.localeCompare(b.label!, 'de'))
  const pieces: Piece[] = [...tray, ...CONNECTORS.map((type) => ({ type }))]

  const onChipClick = (piece: Piece) => {
    setSelected(null)
    setArmed(isArmed(piece) ? null : piece)
  }
  const onCell = (x: number, y: number) => {
    if (armed) put(armed, x, y)
    else if (nodeSelected) update(move(model, selected!, x, y))
    clear()
  }
  const onSelect = (id: string) => {
    setArmed(null)
    if (nodeSelected && isNode(id) && id !== selected) {
      update(connect(model, selected!, id))
      setSelected(null)
    } else {
      setSelected(id === selected ? null : id)
    }
  }
  const removeSelected = () => {
    if (!selected) return
    update(remove(model, selected))
    setSelected(null)
  }
  const reset = () => {
    onChange({})
    clear()
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') removeSelected()
    if (e.key === 'Escape') clear()
  }

  const hint = armed
    ? 'Klicke auf ein freies Feld, um das Element dort abzulegen.'
    : nodeSelected
      ? 'Klicke ein zweites Element an, um eine Kante dorthin zu ziehen, oder ein freies Feld, um das Element zu verschieben.'
      : selected
        ? 'Die Kante ist ausgewählt. Mit „Auswahl entfernen“ löschst du sie.'
        : 'Ziehe die Elemente in das Raster. Für eine Kante klickst du erst das Element an, von dem sie ausgeht, und dann ihr Ziel.'

  return (
    <div className="editor" onKeyDown={onKeyDown}>
      <div className="palette" aria-label="Elemente zum Platzieren">
        {pieces.map((piece) => (
          <Chip
            key={piece.id ?? piece.type}
            type={piece.type}
            label={piece.label}
            armed={isArmed(piece)}
            onClick={() => onChipClick(piece)}
            {...drag.bind(piece)}
          />
        ))}
      </div>
      <div className="editor-bar">
        <p className="editor-hint" role="status">
          {hint}
        </p>
        <div className="editor-tools">
          <button type="button" className="btn btn-secondary btn-small" disabled={!selected} onClick={removeSelected}>
            Auswahl entfernen
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            disabled={answer.model === undefined}
            onClick={reset}
          >
            Zurücksetzen
          </button>
        </div>
      </div>
      <EpkDiagram
        epk={route(model, task.grid.cols)}
        grid={task.grid}
        onCell={onCell}
        cellsActive={armed !== null || nodeSelected || drag.ghost !== null}
        selectable="all"
        selected={selected}
        onSelect={onSelect}
        nodeProps={(id) => drag.bind({ ...model.nodes.find((n) => n.id === id)!, placed: true })}
        legend={false}
      />
      {drag.ghost && <DragGhost type={drag.ghost.item.type} label={drag.ghost.item.label} x={drag.ghost.x} y={drag.ghost.y} />}
    </div>
  )
}
