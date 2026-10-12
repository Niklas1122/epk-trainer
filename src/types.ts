export type GroupId = 'E' | 'F' | 'K' | 'M' | 'P'
export type ConnectorType = 'xor' | 'or' | 'and'
export type NodeType = 'event' | 'function' | ConnectorType | 'interface' | 'org' | 'doc' | 'slot'

/** x and y are grid positions (column / row), not pixels. */
export interface EpkNode {
  id: string
  type: NodeType
  label?: string
  x: number
  y: number
}

export interface EpkEdge {
  id: string
  from: string
  to: string
  /** Control flow (default) or the undirected link to an extension object. */
  kind?: 'flow' | 'assoc'
  /** Grid waypoints for edges that cannot be routed automatically, e.g. jumps back. */
  via?: [number, number][]
  /** Horizontal pixel offset, used to draw parallel edges next to each other. */
  dx?: number
}

/** A titled box around one model, for tasks that show two linked EPKs. */
export interface EpkFrame {
  title: string
  x: number
  y: number
  w: number
  h: number
}

export interface Epk {
  nodes: EpkNode[]
  edges: EpkEdge[]
  frames?: EpkFrame[]
}

export interface Group {
  id: GroupId
  name: string
  intro: string
}

export interface RuleExample {
  kind: 'good' | 'bad'
  caption: string
  epk: Epk
}

export interface Rule {
  id: string
  group: GroupId
  title: string
  text: string
  why?: string
  examples?: RuleExample[]
}

interface TaskBase {
  id: string
  group: GroupId
  /** Rules this task trains; shown in the feedback. */
  rules: string[]
  prompt: string
  explanation: string
}

export interface McTask extends TaskBase {
  type: 'mc'
  options: string[]
  correct: number[]
  multi?: boolean
}

/**
 * `violates` lists every rule the diagram breaks, the trained one first.
 * An empty list means the EPK is correct.
 */
export interface TfTask extends TaskBase {
  type: 'tf'
  epk: Epk
  violates: string[]
}

export interface RuleTask extends TaskBase {
  type: 'rule'
  epk: Epk
  options: string[]
  correct: string
  violates: string[]
}

export interface SpotTask extends TaskBase {
  type: 'spot'
  epk: Epk
  /** Node or edge ids that count as the faulty element. */
  targets: string[]
  violates: string[]
}

export interface FillTask extends TaskBase {
  type: 'fill'
  epk: Epk
  palette: NodeType[]
  /** Accepted node types per slot id. */
  solution: Record<string, NodeType[]>
}

/** One diagram of a pick task. `violates` is empty for a correct EPK. */
export interface PickChoice {
  epk: Epk
  violates: string[]
  /** Explains the diagram once the answer is revealed. */
  note: string
}

/** `correct` is the only choice that is correct, or the only one that is not. */
export interface PickTask extends TaskBase {
  type: 'pick'
  choices: PickChoice[]
  correct: number
}

/**
 * The learner draws an EPK on a grid. `solution` is a reference model: every
 * rule-conforming model with the same control flow counts as correct.
 * Its events, functions and other labelled nodes are the elements the learner
 * gets; connectors are always available. A repair task starts from a faulty
 * model in `start`. Node positions are whole grid cells.
 */
export interface ModelTask extends TaskBase {
  type: 'model' | 'repair'
  grid: { cols: number; rows: number }
  solution: Epk
  start?: Epk
  /** Offered elements that do not belong into the model. */
  distractors?: EpkNode[]
}

export type Task = McTask | TfTask | RuleTask | SpotTask | FillTask | PickTask | ModelTask
export type TaskType = Task['type']

export interface Answer {
  mc?: number[]
  tf?: boolean
  rule?: string
  spot?: string
  fill?: Record<string, NodeType>
  pick?: number
  model?: Epk
}
