import { describe, expect, it } from 'vitest'
import { EMPTY } from '../../epk/edit'
import { layoutProblems, offGrid } from '../../epk/layoutProblems'
import { CHECKABLE, validate } from '../../epk/validate'
import { offeredNodes, reviewModel } from '../../lib/check'
import { TASK_LABEL } from '../../lib/labels'
import type { Epk } from '../../types'
import { RULE_BY_ID } from '../rules'
import { TASKS } from './index'

const checkable = (ids: string[]) => ids.filter((id) => CHECKABLE.includes(id)).sort()

describe('Aufgaben', () => {
  it('haben eindeutige IDs', () => {
    expect(new Set(TASKS.map((t) => t.id)).size).toBe(TASKS.length)
  })

  it('decken in jeder Regelgruppe alle Aufgabentypen ab', () => {
    for (const group of new Set(TASKS.map((t) => t.group))) {
      const types = new Set(TASKS.filter((t) => t.group === group).map((t) => t.type))
      expect(Object.keys(TASK_LABEL).filter((type) => !types.has(type as never)), group).toEqual([])
    }
  })

  for (const task of TASKS) {
    describe(task.id, () => {
      it('ist nach Regelgruppe und Aufgabentyp benannt', () => {
        expect(task.id).toMatch(new RegExp(`^${task.group.toLowerCase()}-${task.type}-\\d+$`))
      })

      it('verweist nur auf vorhandene Regeln', () => {
        for (const id of task.rules) expect(RULE_BY_ID[id], id).toBeDefined()
      })

      if (task.type === 'mc') {
        it('hat gültige Lösungen', () => {
          expect(task.correct.length).toBeGreaterThan(0)
          for (const i of task.correct) expect(task.options[i]).toBeDefined()
          if (!task.multi) expect(task.correct.length).toBe(1)
        })
        return
      }

      if (task.type === 'pick') {
        // The declared violations must match what the checker finds, so a diagram
        // never breaks a rule by accident.
        it('hat Diagramme, die genau die angegebenen Regeln verletzen', () => {
          for (const choice of task.choices) {
            expect(layoutProblems(choice.epk)).toEqual([])
            expect(validate(choice.epk)).toEqual(checkable(choice.violates))
            for (const id of choice.violates) expect(RULE_BY_ID[id], id).toBeDefined()
          }
        })

        it('hat genau eine passende Antwort', () => {
          const conforming = task.choices.map((c) => c.violates.length === 0)
          expect(conforming[task.correct]).toBeDefined()
          expect(conforming.filter((c) => c === conforming[task.correct])).toHaveLength(1)
        })
        return
      }

      // Model and repair tasks, the two types with an editing grid.
      if ('grid' in task) {
        it('hat eine regelkonforme Musterlösung im Raster', () => {
          expect(layoutProblems(task.solution)).toEqual([])
          expect(offGrid(task.solution, task.grid)).toEqual([])
          expect(validate(task.solution)).toEqual([])
          expect(reviewModel(task, task.solution).ok).toBe(true)
        })

        it('bietet jedes Element eindeutig an', () => {
          const all = [...task.solution.nodes, ...(task.start?.nodes ?? []), ...(task.distractors ?? [])]
          for (const offered of offeredNodes(task)) {
            expect(offered.label, offered.id).toBeTruthy()
            // The same id must stand for the same element in the solution and at the start.
            for (const n of all.filter((n) => n.id === offered.id)) {
              expect({ type: n.type, label: n.label }).toEqual({ type: offered.type, label: offered.label })
            }
          }
          for (const d of task.distractors ?? []) {
            expect(task.solution.nodes.some((n) => n.id === d.id), d.id).toBe(false)
          }
        })

        it('ist am Anfang noch nicht gelöst', () => {
          const start: Epk = task.start ?? EMPTY
          if (task.type === 'repair') expect(task.start).toBeDefined()
          expect(layoutProblems(start)).toEqual([])
          expect(offGrid(start, task.grid)).toEqual([])
          expect(reviewModel(task, start).ok).toBe(false)
        })
        return
      }

      it('hat ein Diagramm ohne Layoutfehler', () => {
        expect(layoutProblems(task.epk)).toEqual([])
      })

      if (task.type === 'fill') {
        it('ist mit der Lösung regelkonform', () => {
          const slots = task.epk.nodes.filter((n) => n.type === 'slot').map((n) => n.id)
          expect(Object.keys(task.solution).sort()).toEqual(slots.sort())
          for (const accepted of Object.values(task.solution)) {
            for (const type of accepted) expect(task.palette).toContain(type)
          }
          const solved: Epk = {
            ...task.epk,
            nodes: task.epk.nodes.map((n) => (n.type === 'slot' ? { ...n, type: task.solution[n.id][0] } : n)),
          }
          expect(validate(solved)).toEqual([])
        })
        return
      }

      it('verletzt genau die angegebenen Regeln', () => {
        expect(validate(task.epk)).toEqual(checkable(task.violates))
        for (const id of task.violates) expect(RULE_BY_ID[id], id).toBeDefined()
      })

      if (task.type === 'rule') {
        it('hat genau eine zutreffende Antwortoption', () => {
          expect(task.options).toContain(task.correct)
          expect(task.options.filter((o) => task.violates.includes(o))).toEqual([task.correct])
          for (const o of task.options) expect(RULE_BY_ID[o], o).toBeDefined()
        })
      }

      if (task.type === 'spot') {
        it('markiert vorhandene Elemente als Lösung', () => {
          const ids = [...task.epk.nodes.map((n) => n.id), ...task.epk.edges.map((e) => e.id)]
          expect(task.targets.length).toBeGreaterThan(0)
          for (const t of task.targets) expect(ids).toContain(t)
          expect(task.violates.length).toBeGreaterThan(0)
        })
      }
    })
  }
})
