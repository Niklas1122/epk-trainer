import { epk, ev, flow, fn, slot, xor } from '../../epk/build'
import type { Task } from '../../types'
import { RULE, SPOT, TF } from './prompts'

export const F_TASKS: Task[] = [
  {
    id: 'f-mc-1',
    type: 'mc',
    group: 'F',
    rules: ['F3'],
    prompt: 'Welches Element einer EPK besitzt die Kompetenz, über den weiteren Ablauf zu entscheiden?',
    options: ['Die Funktion', 'Das Ereignis', 'Der Konnektor', 'Die Prozessschnittstelle'],
    correct: [0],
    explanation:
      'Der Konnektor nach der Funktion stellt die Entscheidung nur dar. Die Ereignisse in den Zweigen dokumentieren die möglichen Ergebnisse.',
  },
  {
    id: 'f-mc-2',
    type: 'mc',
    group: 'F',
    rules: ['F1'],
    prompt: 'Eine Funktion hat zwei mögliche Ergebnisse. Wie wird das regelkonform modelliert?',
    options: [
      'Von der Funktion führt eine Kante zu einem Konnektor, der auf die beiden Ereignisse verteilt.',
      'Von der Funktion führen zwei Kanten direkt zu den beiden Ereignissen.',
      'Die beiden Ereignisse werden direkt hintereinander modelliert.',
      'Die Funktion wird für jedes Ergebnis einmal kopiert.',
    ],
    correct: [0],
    explanation: 'Eine Funktion hat genau eine ausgehende Kante. Mehrere Ergebnisse werden über einen Konnektor angebunden.',
  },
  {
    id: 'f-tf-1',
    type: 'tf',
    group: 'F',
    rules: ['F2'],
    prompt: TF,
    epk: epk(
      [
        ev('a', 'Rechnung ist eingegangen', 0, 0),
        fn('b', 'Rechnung prüfen', 0, 1),
        fn('c', 'Rechnung bezahlen', 0, 2),
        ev('d', 'Rechnung ist bezahlt', 0, 3),
      ],
      flow('a>b>c>d'),
    ),
    violates: ['F2'],
    explanation:
      'Die beiden Funktionen folgen direkt aufeinander. Dazwischen fehlt ein Ereignis wie „Rechnung ist geprüft“.',
  },
  {
    id: 'f-tf-2',
    type: 'tf',
    group: 'F',
    rules: ['F1', 'F3'],
    prompt: TF,
    epk: epk(
      [
        ev('s', 'Kreditantrag ist eingegangen', 0.5, 0),
        fn('f', 'Kreditantrag prüfen', 0.5, 1),
        xor('x', 0.5, 2),
        ev('a', 'Kreditantrag ist genehmigt', 0, 3),
        ev('b', 'Kreditantrag ist abgelehnt', 1, 3),
      ],
      flow('s>f>x', 'x>a', 'x>b'),
    ),
    violates: [],
    explanation:
      'Die Funktion trifft die Entscheidung und hat genau eine ausgehende Kante. Der XOR-Konnektor verteilt auf die beiden möglichen Ergebnisse.',
  },
  {
    id: 'f-rule-1',
    type: 'rule',
    group: 'F',
    rules: ['F1'],
    prompt: RULE,
    epk: epk(
      [
        ev('a', 'Bestellung ist freigegeben', 0, 0),
        ev('b', 'Ware ist verfügbar', 1, 0),
        fn('f', 'Ware versenden', 0.5, 1),
        ev('e', 'Ware ist versandt', 0.5, 2),
      ],
      flow('a>f', 'b>f', 'f>e'),
    ),
    options: ['E3', 'E4', 'F1', 'M2'],
    correct: 'F1',
    violates: ['F1'],
    explanation:
      'Die Funktion hat zwei eingehende Kanten. Die beiden Startereignisse müssen über einen Konnektor verknüpft werden, hier mit UND.',
  },
  {
    id: 'f-spot-1',
    type: 'spot',
    group: 'F',
    rules: ['F1'],
    prompt: SPOT,
    epk: epk(
      [
        ev('s', 'Lieferung ist eingetroffen', 0.5, 0),
        fn('f', 'Lieferung prüfen', 0.5, 1),
        ev('a', 'Lieferung ist in Ordnung', 0, 2),
        ev('b', 'Lieferung ist mangelhaft', 1, 2),
      ],
      flow('s>f', 'f>a', 'f>b'),
    ),
    targets: ['f', 'f>a', 'f>b'],
    violates: ['F1'],
    explanation:
      'Die Funktion hat zwei ausgehende Kanten. Zwischen der Funktion und den beiden Ereignissen fehlt ein XOR-Konnektor.',
  },
  {
    id: 'f-fill-1',
    type: 'fill',
    group: 'F',
    rules: ['F2', 'E4'],
    prompt: 'In dieser EPK fehlt ein Element. Ziehe das passende Element in die Lücke.',
    epk: epk(
      [ev('a', 'Bewerbung ist eingegangen', 0, 0), slot('x', 0, 1), ev('c', 'Bewerbung ist gesichtet', 0, 2)],
      flow('a>x>c'),
    ),
    palette: ['event', 'function', 'xor', 'and'],
    solution: { x: ['function'] },
    explanation: 'Zwischen zwei Ereignissen steht immer eine Funktion, hier zum Beispiel „Bewerbung sichten“.',
  },
  {
    id: 'f-pick-1',
    type: 'pick',
    group: 'F',
    rules: ['F1', 'M7'],
    prompt:
      'Die Funktion „Angebot bewerten“ hat zwei mögliche Ergebnisse: Das Angebot wird angenommen oder abgelehnt. Welche EPK bildet das regelkonform ab?',
    choices: [
      {
        epk: epk(
          [
            ev('s', 'Angebot ist eingegangen', 0.5, 0),
            fn('f', 'Angebot bewerten', 0.5, 1),
            xor('k', 0.5, 2),
            ev('a', 'Angebot ist angenommen', 0, 3),
            ev('b', 'Angebot ist abgelehnt', 1, 3),
          ],
          flow('s>f>k', 'k>a', 'k>b'),
        ),
        violates: [],
        note: 'Regelkonform: Die Funktion hat eine ausgehende Kante, der XOR-Konnektor verteilt auf die beiden Ergebnisse.',
      },
      {
        epk: epk(
          [
            ev('s', 'Angebot ist eingegangen', 0.5, 0),
            fn('f', 'Angebot bewerten', 0.5, 1),
            ev('a', 'Angebot ist angenommen', 0, 2),
            ev('b', 'Angebot ist abgelehnt', 1, 2),
          ],
          flow('s>f', 'f>a', 'f>b'),
        ),
        violates: ['F1'],
        note: 'Die Funktion hat zwei ausgehende Kanten (F1). Zwischen Funktion und Ereignissen fehlt ein Konnektor.',
      },
      {
        epk: epk(
          [
            ev('s', 'Angebot ist eingegangen', 0, 0),
            fn('f', 'Angebot bewerten', 0, 1),
            ev('a', 'Angebot ist angenommen', 0, 2),
            ev('b', 'Angebot ist abgelehnt', 0, 3),
          ],
          flow('s>f>a>b'),
        ),
        violates: ['E4'],
        note: 'Die beiden Ergebnisse stehen hintereinander, als träten beide nacheinander ein. Zwei Ereignisse dürfen außerdem nicht direkt aufeinander folgen (E4).',
      },
    ],
    correct: 0,
    explanation:
      'Eine Funktion hat genau eine ausgehende Kante. Trifft sie eine Entscheidung, folgt ein aufspaltender Konnektor, und die Ereignisse in den Zweigen halten die möglichen Ergebnisse fest.',
  },
  {
    id: 'f-model-1',
    type: 'model',
    group: 'F',
    rules: ['F1', 'F3', 'M7'],
    prompt:
      'Modelliere diesen Ablauf: Sobald eine Reisekostenabrechnung eingereicht ist, wird sie geprüft. Dabei wird sie entweder freigegeben oder zurückgewiesen.',
    grid: { cols: 3, rows: 4 },
    solution: epk(
      [
        ev('s', 'Abrechnung ist eingereicht', 1, 0),
        fn('f', 'Abrechnung prüfen', 1, 1),
        xor('k', 1, 2),
        ev('a', 'Abrechnung ist freigegeben', 0, 3),
        ev('b', 'Abrechnung ist zurückgewiesen', 2, 3),
      ],
      flow('s>f>k', 'k>a', 'k>b'),
    ),
    explanation:
      'Die Funktion „Abrechnung prüfen“ trifft die Entscheidung. Sie hat genau eine ausgehende Kante zu einem XOR-Konnektor, weil sich die beiden Ergebnisse gegenseitig ausschließen.',
  },
  {
    id: 'f-repair-1',
    type: 'repair',
    group: 'F',
    rules: ['F2'],
    prompt: 'Diese EPK enthält einen Regelverstoß. Korrigiere das Modell mit dem bereitliegenden Element.',
    grid: { cols: 2, rows: 5 },
    start: epk(
      [
        ev('a', 'Ware ist eingetroffen', 0, 0),
        fn('b', 'Ware auspacken', 0, 1),
        fn('c', 'Ware einlagern', 0, 3),
        ev('d', 'Ware ist eingelagert', 0, 4),
      ],
      flow('a>b>c>d'),
    ),
    solution: epk(
      [
        ev('a', 'Ware ist eingetroffen', 0, 0),
        fn('b', 'Ware auspacken', 0, 1),
        ev('x', 'Ware ist ausgepackt', 0, 2),
        fn('c', 'Ware einlagern', 0, 3),
        ev('d', 'Ware ist eingelagert', 0, 4),
      ],
      flow('a>b>x>c>d'),
    ),
    explanation:
      'Die beiden Funktionen folgten direkt aufeinander. Dazwischen gehört das Ereignis „Ware ist ausgepackt“, das das Ergebnis der ersten Funktion festhält.',
  },
]
