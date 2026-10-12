import type { NodeType, TaskType } from '../types'

export const NODE_LABEL: Record<NodeType, string> = {
  event: 'Ereignis',
  function: 'Funktion',
  xor: 'XOR-Konnektor',
  or: 'ODER-Konnektor',
  and: 'UND-Konnektor',
  interface: 'Prozessschnittstelle',
  org: 'Organisationseinheit',
  doc: 'Dokument',
  slot: 'Lücke',
}

export const TASK_LABEL: Record<TaskType, string> = {
  mc: 'Multiple Choice',
  tf: 'Richtig oder falsch',
  rule: 'Regel zuordnen',
  spot: 'Fehler finden',
  fill: 'Lücke füllen',
  pick: 'Diagramm auswählen',
  model: 'Modellieren',
  repair: 'Modell korrigieren',
}

/** Name of a diagram in a pick task: EPK A, EPK B and so on. */
export const choiceName = (index: number) => `EPK ${String.fromCharCode(65 + index)}`

export const cls = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')
