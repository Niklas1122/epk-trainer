import { GROUPS, RULES } from '../data/rules'
import { TASKS } from '../data/tasks'
import { cls } from '../lib/labels'
import { PRACTICE_SIZE, ruleProgress } from '../lib/practice'
import type { RuleProgress, RuleStatus } from '../lib/practice'
import { useProgress } from '../lib/progress'
import { link } from '../lib/router'

const STATUS: Record<RuleStatus, { label: string; icon: string }> = {
  open: { label: 'Offen', icon: '○' },
  started: { label: 'Begonnen', icon: '◐' },
  weak: { label: 'Wiederholen', icon: '↻' },
  done: { label: 'Sitzt', icon: '✓' },
}

function RuleRow({ entry }: { entry: RuleProgress }) {
  const { rule, total, right, wrong, status } = entry
  return (
    <li className="rule-row">
      <span className="badge">{rule.id}</span>
      <div className="rule-row-main">
        <p className="rule-row-title">{rule.title}</p>
        <div className="meter" aria-hidden="true">
          <span className="meter-right" style={{ width: `${(right / total) * 100}%` }} />
          <span className="meter-wrong" style={{ width: `${(wrong / total) * 100}%` }} />
        </div>
        <p className="muted small">
          {right} von {total} Aufgaben richtig{wrong > 0 && `, ${wrong} zuletzt falsch`}
        </p>
      </div>
      <span className={cls('status', `is-${status}`)}>
        <span aria-hidden="true">{STATUS[status].icon}</span> {STATUS[status].label}
      </span>
      <a className="btn btn-secondary btn-small" href={link('regel', rule.id)} aria-label={`Regel ${rule.id} üben`}>
        Üben
      </a>
    </li>
  )
}

export function Progress() {
  const progress = useProgress()
  const rules = ruleProgress(progress)
  const count = (status: RuleStatus) => rules.filter((r) => r.status === status).length
  const solved = TASKS.filter((t) => progress.solved[t.id]).length
  const best = progress.tests.reduce((max, t) => Math.max(max, t.score / t.total), 0)

  const stats = [
    { value: `${solved} / ${TASKS.length}`, label: 'Aufgaben zuletzt richtig gelöst' },
    { value: `${count('done')} / ${RULES.length}`, label: 'Regeln sitzen' },
    { value: String(count('weak')), label: count('weak') === 1 ? 'Regel zum Wiederholen' : 'Regeln zum Wiederholen' },
    {
      value: progress.tests.length ? `${Math.round(best * 100)} %` : '–',
      label: progress.tests.length
        ? `bestes Ergebnis in ${progress.tests.length} ${progress.tests.length === 1 ? 'Test' : 'Tests'}`
        : 'noch kein Test absolviert',
    },
  ]

  return (
    <section className="page">
      <h1>Mein Fortschritt</h1>
      <p className="lead">Hier siehst du, welche Regeln schon sitzen und welche du wiederholen solltest.</p>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="card stat">
            <p className="stat-value">{s.value}</p>
            <p className="muted small">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card practice-card">
        <div>
          <h2>Gezielt üben</h2>
          <p className="muted">
            {PRACTICE_SIZE} Aufgaben, passend zu deinem Stand: zuerst die zuletzt falsch gelösten, dann die noch nicht
            bearbeiteten, danach die am längsten nicht geübten.
          </p>
        </div>
        <a className="btn btn-primary" href={link('training')}>
          Gezielt üben
        </a>
      </div>

      {GROUPS.map((g) => (
        <section key={g.id} className="rule-group">
          <h2>
            {g.id} · {g.name}
          </h2>
          <ul className="card rule-list">
            {rules
              .filter((r) => r.rule.group === g.id)
              .map((entry) => (
                <RuleRow key={entry.rule.id} entry={entry} />
              ))}
          </ul>
        </section>
      ))}
    </section>
  )
}
