import { RULE_BY_ID } from '../data/rules'
import { isCorrect, solutionText } from '../lib/check'
import { cls } from '../lib/labels'
import type { Answer, Task } from '../types'

export function Feedback({ task, answer }: { task: Task; answer: Answer }) {
  const ok = isCorrect(task, answer)
  return (
    <div className={cls('feedback', ok ? 'is-ok' : 'is-bad')} role="status">
      <p className="feedback-title">{ok ? 'Richtig!' : 'Leider falsch.'}</p>
      {!ok && <p>{solutionText(task)}</p>}
      <p>{task.explanation}</p>
      <ul className="rule-refs">
        {task.rules.map((id) => (
          <li key={id}>
            <span className="badge">{id}</span>
            <span>{RULE_BY_ID[id].text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
