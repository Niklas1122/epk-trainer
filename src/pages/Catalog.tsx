import { GROUPS, rulesOf } from '../data/rules'
import { tasksOf } from '../data/tasks'
import { EpkDiagram, LegendItems } from '../epk/EpkDiagram'
import { cls } from '../lib/labels'
import { link } from '../lib/router'
import type { GroupId, NodeType, Rule } from '../types'

const LEGEND: NodeType[] = ['event', 'function', 'interface', 'and', 'or', 'xor', 'org', 'doc']

function RuleCard({ rule }: { rule: Rule }) {
  return (
    <article className="card rule" id={rule.id}>
      <header className="rule-head">
        <span className="badge">{rule.id}</span>
        <h3>{rule.title}</h3>
      </header>
      <p className="rule-text">{rule.text}</p>
      {rule.why && <p className="muted">{rule.why}</p>}
      {rule.examples && (
        <div className="examples">
          {rule.examples.map((ex, i) => (
            <div key={i} className={cls('example', `is-${ex.kind}`)}>
              <span className="example-tag">{ex.kind === 'good' ? '✓ Richtig' : '✕ Falsch'}</span>
              <EpkDiagram epk={ex.epk} legend={false} />
              <p>{ex.caption}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function Catalog({ group }: { group?: GroupId }) {
  const groups = group ? GROUPS.filter((g) => g.id === group) : GROUPS
  return (
    <section className="page">
      <h1>Regelkatalog</h1>
      <p className="lead">Alle Regeln zur Modellierung syntaktisch korrekter EPKs, mit Erläuterung und Beispielen.</p>

      <nav className="tabs" aria-label="Regelgruppe">
        <a href={link('regeln')} className={cls(!group && 'is-active')} aria-current={!group ? 'page' : undefined}>
          Alle
        </a>
        {GROUPS.map((g) => (
          <a
            key={g.id}
            href={link('regeln', g.id)}
            className={cls(group === g.id && 'is-active')}
            aria-current={group === g.id ? 'page' : undefined}
          >
            {g.id}
          </a>
        ))}
      </nav>

      <div className="legend legend-box">
        <LegendItems types={LEGEND} />
      </div>

      {groups.map((g) => (
        <section key={g.id} className="rule-group">
          <h2>
            {g.id} · {g.name}
          </h2>
          <p className="muted">{g.intro}</p>
          {rulesOf(g.id).map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
          <a className="btn btn-primary" href={link('ueben', g.id)}>
            {tasksOf(g.id).length} Aufgaben zu Gruppe {g.id} üben
          </a>
        </section>
      ))}
    </section>
  )
}
