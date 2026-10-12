import { useEffect, useRef, useState } from 'react'
import { GROUPS, RULE_BY_ID } from '../data/rules'
import { tasksOf } from '../data/tasks'
import { isAnswered, isCorrect } from '../lib/check'
import { TASK_LABEL, cls } from '../lib/labels'
import { tasksOfRule } from '../lib/practice'
import { readProgress, saveResults, saveTest } from '../lib/progress'
import { link } from '../lib/router'
import { learnQueue, testQueue, weakQueue } from '../lib/session'
import { Feedback } from '../tasks/Feedback'
import { TaskView } from '../tasks/TaskView'
import type { Answer, GroupId, Task } from '../types'

interface Props {
  /**
   * `learn` works through the tasks of one rule group or one rule, `weak`
   * through the tasks the learner needs most. Both give feedback after every
   * task; `test` only at the end.
   */
  mode: 'learn' | 'test' | 'weak'
  group?: GroupId
  rule?: string
}

const naturalOrder = (a: string, b: string) => a.localeCompare(b, 'de', { numeric: true })

export function Runner({ mode, group, rule }: Props) {
  const initial = () => {
    if (mode === 'test') return testQueue()
    if (mode === 'weak') return weakQueue(readProgress())
    return learnQueue((rule ? tasksOfRule(rule) : tasksOf(group!)).map((t) => t.id))
  }
  const [queue, setQueue] = useState<Task[]>(initial)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  // Move focus with the content so keyboard and screen reader users follow along.
  useEffect(() => {
    heading.current?.focus()
    window.scrollTo(0, 0)
  }, [index, done, queue])

  const start = (tasks: Task[]) => {
    setQueue(tasks)
    setAnswers([])
    setIndex(0)
    setChecked(false)
    setDone(false)
  }

  const title =
    mode === 'test'
      ? 'Test'
      : mode === 'weak'
        ? 'Gezielt üben'
        : rule
          ? `Üben: Regel ${rule}`
          : `Üben: ${GROUPS.find((g) => g.id === group)?.name}`
  const back =
    mode === 'test'
      ? { href: link(), label: 'Test abbrechen' }
      : mode === 'weak'
        ? { href: link('fortschritt'), label: 'Zum Fortschritt' }
        : { href: link('regeln', rule ? RULE_BY_ID[rule].group : group!), label: 'Zu den Regeln' }
  const results = queue.map((t, i) => isCorrect(t, answers[i] ?? {}))
  const score = results.filter(Boolean).length

  if (done) {
    const wrong = queue.filter((_, i) => !results[i])
    const weakRules = [...new Set(wrong.flatMap((t) => t.rules))].sort(naturalOrder)
    const canRepeat = mode !== 'test' && wrong.length > 0
    return (
      <section className="page">
        <h1 ref={heading} tabIndex={-1}>
          {mode === 'test' ? 'Testergebnis' : 'Auswertung'}
        </h1>
        <div className="card score-card">
          <p className="score">
            {score} von {queue.length}
          </p>
          <p className="muted">Aufgaben richtig gelöst ({Math.round((score / queue.length) * 100)} %)</p>
          {mode === 'test' && (
            <ul className="breakdown">
              {GROUPS.map((g) => {
                const own = queue.map((t, i) => ({ t, ok: results[i] })).filter((r) => r.t.group === g.id)
                return (
                  <li key={g.id}>
                    <span className="badge">{g.id}</span>
                    <span>{g.name}</span>
                    <span className="breakdown-score">
                      {own.filter((r) => r.ok).length} / {own.length}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {weakRules.length > 0 && (
          <div className="card">
            <h2>Diese Regeln solltest du wiederholen</h2>
            <ul className="rule-refs">
              {weakRules.map((id) => (
                <li key={id}>
                  <a className="badge" href={link('regeln', RULE_BY_ID[id].group)}>
                    {id}
                  </a>
                  <span>{RULE_BY_ID[id].title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2>Alle Aufgaben im Überblick</h2>
        <div className="review">
          {queue.map((task, i) => (
            <details key={task.id} className="card review-item">
              <summary>
                <span className={cls('result-dot', results[i] ? 'is-ok' : 'is-bad')} aria-hidden="true">
                  {results[i] ? '✓' : '✕'}
                </span>
                <span className="visually-hidden">{results[i] ? 'Richtig:' : 'Falsch:'}</span>
                <span className="review-prompt">{task.prompt}</span>
                <span className="tag">{TASK_LABEL[task.type]}</span>
              </summary>
              <TaskView task={task} answer={answers[i] ?? {}} onChange={() => {}} revealed />
              <Feedback task={task} answer={answers[i] ?? {}} />
            </details>
          ))}
        </div>

        <div className="actions">
          {canRepeat && (
            <button type="button" className="btn btn-primary" onClick={() => start(learnQueue(wrong.map((t) => t.id)))}>
              Falsche Aufgaben wiederholen
            </button>
          )}
          <button
            type="button"
            className={cls('btn', canRepeat ? 'btn-secondary' : 'btn-primary')}
            onClick={() => start(initial())}
          >
            {mode === 'test' ? 'Neuer Test' : mode === 'weak' ? 'Weitere Aufgaben' : 'Alle Aufgaben erneut'}
          </button>
          <a className="btn btn-secondary" href={mode === 'weak' ? link('fortschritt') : link()}>
            {mode === 'weak' ? 'Zum Fortschritt' : 'Zur Übersicht'}
          </a>
        </div>
      </section>
    )
  }

  const task = queue[index]
  const answer = answers[index] ?? {}
  const last = index === queue.length - 1
  const answered = isAnswered(task, answer)

  const setAnswer = (a: Answer) => {
    const next = [...answers]
    next[index] = a
    setAnswers(next)
  }
  const check = () => {
    setChecked(true)
    saveResults({ [task.id]: isCorrect(task, answer) })
  }
  const advance = () => {
    if (!last) {
      setIndex(index + 1)
      setChecked(false)
      return
    }
    if (mode === 'test') {
      saveResults(Object.fromEntries(queue.map((t, i) => [t.id, results[i]])))
      saveTest(score, queue.length)
    }
    setDone(true)
  }

  return (
    <section className="page">
      <div className="runner-head">
        <a className="back" href={back.href}>
          ← {back.label}
        </a>
        <span className="muted">
          {title} · Aufgabe {index + 1} von {queue.length}
        </span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Fortschritt"
        aria-valuemin={0}
        aria-valuemax={queue.length}
        aria-valuenow={index + (checked ? 1 : 0)}
      >
        <div style={{ width: `${((index + (checked ? 1 : 0)) / queue.length) * 100}%` }} />
      </div>

      <article className="card task">
        <span className="tag">{TASK_LABEL[task.type]}</span>
        <h1 className="task-prompt" ref={heading} tabIndex={-1}>
          {task.prompt}
        </h1>
        <TaskView key={`${task.id}-${index}`} task={task} answer={answer} onChange={setAnswer} revealed={checked} />
        {checked && <Feedback task={task} answer={answer} />}
        <div className="actions">
          {mode !== 'test' && !checked ? (
            <button type="button" className="btn btn-primary" disabled={!answered} onClick={check}>
              Prüfen
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={!answered} onClick={advance}>
              {!last ? 'Weiter' : mode === 'test' ? 'Test abschließen' : 'Zur Auswertung'}
            </button>
          )}
        </div>
      </article>
    </section>
  )
}
