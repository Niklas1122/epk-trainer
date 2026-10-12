import type { ReactNode } from 'react'
import { cls } from '../lib/labels'

interface MarkProps {
  selected: boolean
  correct: boolean
  revealed: boolean
  multi?: boolean
}

interface OptionProps extends MarkProps {
  onClick: () => void
  children: ReactNode
}

/** Classes that colour a chosen and, once revealed, a right or wrong answer. */
export const optionState = ({ selected, correct, revealed }: MarkProps) =>
  cls(selected && 'is-selected', revealed && (correct ? 'is-correct' : selected && 'is-wrong'))

export function OptionMark({ selected, correct, revealed, multi }: MarkProps) {
  return (
    <span className={cls('option-mark', multi && 'is-multi')} aria-hidden="true">
      {revealed && correct ? '✓' : revealed && selected ? '✕' : ''}
    </span>
  )
}

export function Option({ onClick, children, ...mark }: OptionProps) {
  return (
    <button
      type="button"
      className={cls('option', optionState(mark))}
      aria-pressed={mark.selected}
      disabled={mark.revealed}
      onClick={onClick}
    >
      <OptionMark {...mark} />
      <span>{children}</span>
    </button>
  )
}
