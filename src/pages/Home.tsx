import { GROUPS, RULES, rulesOf } from '../data/rules'
import { TASKS, tasksOf } from '../data/tasks'
import { TASK_LABEL } from '../lib/labels'
import { PRACTICE_SIZE, ruleProgress } from '../lib/practice'
import { resetProgress, useProgress } from '../lib/progress'
import { link } from '../lib/router'
import { TEST_TASKS_PER_GROUP } from '../lib/session'

export function Home() {
  const progress = useProgress()
  const rules = ruleProgress(progress)
  const weakRules = rules.filter((r) => r.status === 'weak').length
  const doneRules = rules.filter((r) => r.status === 'done').length
  const lastTest = progress.tests[progress.tests.length - 1]
  const bestTest = progress.tests.reduce<number | null>(
    (best, t) => (best === null || t.score / t.total > best ? t.score / t.total : best),
    null,
  )
  const hasProgress = Object.keys(progress.solved).length > 0 || progress.tests.length > 0

  const reset = () => {
    if (window.confirm('Den gesamten Lernfortschritt auf diesem Gerät löschen?')) resetProgress()
  }

  return (
    <section className="page">
      <div className="hero">
        <h1>EPK-Regeln trainieren</h1>
        <p className="lead">
          Wiederhole die {RULES.length} Regeln zur Modellierung syntaktisch korrekter ereignisgesteuerter Prozessketten,
          und übe sie an {TASKS.length} Aufgaben in {Object.keys(TASK_LABEL).length} Aufgabentypen: vom Ankreuzen bis zum
          eigenen Modell.
        </p>
      </div>

      <h2>Lernen und üben</h2>
      <div className="group-grid">
        {GROUPS.map((g) => {
          const tasks = tasksOf(g.id)
          const solved = tasks.filter((t) => progress.solved[t.id]).length
          return (
            <article key={g.id} className="card group-card">
              <header>
                <span className="badge badge-lg">{g.id}</span>
                <div>
                  <h3>{g.name}</h3>
                  <p className="muted">
                    {rulesOf(g.id).length} Regeln · {tasks.length} Aufgaben
                  </p>
                </div>
              </header>
              <p>{g.intro}</p>
              <div
                className="progress"
                role="progressbar"
                aria-label={`Fortschritt ${g.name}`}
                aria-valuemin={0}
                aria-valuemax={tasks.length}
                aria-valuenow={solved}
              >
                <div style={{ width: `${(solved / tasks.length) * 100}%` }} />
              </div>
              <p className="muted small">
                {solved} von {tasks.length} Aufgaben richtig gelöst
              </p>
              <div className="actions">
                <a className="btn btn-secondary" href={link('regeln', g.id)}>
                  Regeln ansehen
                </a>
                <a className="btn btn-primary" href={link('ueben', g.id)}>
                  Üben
                </a>
              </div>
            </article>
          )
        })}

        <article className="card group-card practice-tile">
          <header>
            <span className="badge badge-lg" aria-hidden="true">
              ↻
            </span>
            <div>
              <h3>Gezielt üben</h3>
              <p className="muted">{PRACTICE_SIZE} Aufgaben, passend zu deinem Stand</p>
            </div>
          </header>
          <p>
            Zuerst kommen Aufgaben, die du zuletzt falsch gelöst hast, dann die, die du noch nicht bearbeitet hast.
          </p>
          <p className="muted small">
            {doneRules} von {RULES.length} Regeln sitzen
            {weakRules > 0 && ` · ${weakRules} zum Wiederholen`}
          </p>
          <div className="actions">
            <a className="btn btn-secondary" href={link('fortschritt')}>
              Fortschritt ansehen
            </a>
            <a className="btn btn-primary" href={link('training')}>
              Gezielt üben
            </a>
          </div>
        </article>

        <article className="card group-card test-card">
          <header>
            <span className="badge badge-lg">T</span>
            <div>
              <h3>Test</h3>
              <p className="muted">{GROUPS.length * TEST_TASKS_PER_GROUP} zufällige Aufgaben</p>
            </div>
          </header>
          <p>
            Je {TEST_TASKS_PER_GROUP} Aufgaben aus jeder Regelgruppe. Die Auflösung gibt es erst am Ende, zusammen mit den
            Regeln, die du wiederholen solltest.
          </p>
          <p className="muted small">
            {lastTest
              ? `Letzter Test: ${lastTest.score} von ${lastTest.total} · Bestes Ergebnis: ${Math.round((bestTest ?? 0) * 100)} %`
              : 'Noch kein Test absolviert'}
          </p>
          <div className="actions">
            <a className="btn btn-primary" href={link('test')}>
              Test starten
            </a>
          </div>
        </article>
      </div>

      <p className="muted small storage-note">
        Dein Fortschritt wird nur in diesem Browser gespeichert.{' '}
        {hasProgress && (
          <button type="button" className="link-button" onClick={reset}>
            Fortschritt zurücksetzen
          </button>
        )}
      </p>
    </section>
  )
}
