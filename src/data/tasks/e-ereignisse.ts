import { and, epk, ev, flow, fn, pi, slot, xor } from '../../epk/build'
import type { Task } from '../../types'
import { RULE, SPOT, TF } from './prompts'

export const E_TASKS: Task[] = [
  {
    id: 'e-mc-1',
    type: 'mc',
    group: 'E',
    rules: ['E1'],
    prompt: 'Wie viele Kanten hat ein Ereignis, das mitten im Ablauf liegt (also weder Start- noch Endereignis ist)?',
    options: [
      'Genau eine eingehende und genau eine ausgehende Kante',
      'Eine eingehende und beliebig viele ausgehende Kanten',
      'Beliebig viele eingehende und eine ausgehende Kante',
      'Mindestens eine eingehende und mindestens eine ausgehende Kante',
    ],
    correct: [0],
    explanation: 'Verzweigungen und Zusammenführungen laufen immer über Konnektoren, nie über das Ereignis selbst.',
  },
  {
    id: 'e-mc-2',
    type: 'mc',
    group: 'E',
    rules: ['E2', 'E3', 'E4', 'E5'],
    multi: true,
    prompt: 'Welche Aussagen über Ereignisse treffen zu? Mehrere Antworten sind richtig.',
    options: [
      'Ein Startereignis besitzt genau eine ausgehende Kante.',
      'Ein Endereignis besitzt genau eine eingehende Kante.',
      'Ein Ereignis kann entscheiden, welcher Zweig durchlaufen wird.',
      'Zwei Ereignisse dürfen direkt aufeinander folgen.',
    ],
    correct: [0, 1],
    explanation:
      'Ereignisse sind passiv und entscheiden nichts (E5). Auf ein Ereignis folgt außerdem immer eine Funktion (E4).',
  },
  {
    id: 'e-mc-3',
    type: 'mc',
    group: 'E',
    rules: ['E5', 'F3'],
    prompt: 'Warum darf ein Ereignis nicht über den weiteren Ablauf entscheiden?',
    options: [
      'Weil Ereignisse passive Elemente sind, die nur einen eingetretenen Zustand beschreiben',
      'Weil Ereignisse immer am Ende eines Prozesses stehen',
      'Weil Ereignisse keine ausgehenden Kanten haben dürfen',
      'Weil Entscheidungen ausschließlich von Konnektoren getroffen werden',
    ],
    correct: [0],
    explanation:
      'Entscheidungen trifft immer eine Funktion. Der Konnektor danach stellt die Entscheidung nur dar, er trifft sie nicht.',
  },
  {
    id: 'e-tf-1',
    type: 'tf',
    group: 'E',
    rules: ['E4'],
    prompt: TF,
    epk: epk(
      [
        ev('a', 'Bestellung ist eingegangen', 0, 0),
        ev('b', 'Bestellung ist erfasst', 0, 1),
        fn('c', 'Bestellung prüfen', 0, 2),
        ev('d', 'Bestellung ist geprüft', 0, 3),
      ],
      flow('a>b>c>d'),
    ),
    violates: ['E4'],
    explanation:
      'Die ersten beiden Ereignisse folgen direkt aufeinander. Dazwischen fehlt die Funktion, die die Bestellung erfasst.',
  },
  {
    id: 'e-tf-2',
    type: 'tf',
    group: 'E',
    rules: ['E2', 'E3', 'E4'],
    prompt: TF,
    epk: epk(
      [
        ev('a', 'Paket ist eingetroffen', 0, 0),
        fn('b', 'Paket annehmen', 0, 1),
        ev('c', 'Paket ist angenommen', 0, 2),
        fn('d', 'Paket einlagern', 0, 3),
        ev('e', 'Paket ist eingelagert', 0, 4),
      ],
      flow('a>b>c>d>e'),
    ),
    violates: [],
    explanation:
      'Die EPK beginnt mit einem Startereignis, endet mit einem Endereignis, und Ereignisse und Funktionen wechseln sich ab.',
  },
  {
    id: 'e-rule-1',
    type: 'rule',
    group: 'E',
    rules: ['E2'],
    prompt: RULE,
    epk: epk(
      [
        ev('s', 'Bedarf ist entstanden', 0.5, 0),
        fn('f1', 'Angebot einholen', 0, 1),
        fn('f2', 'Budget prüfen', 1, 1),
        ev('e1', 'Angebot ist eingeholt', 0, 2),
        ev('e2', 'Budget ist geprüft', 1, 2),
      ],
      flow('s>f1>e1', 's>f2>e2'),
    ),
    options: ['E2', 'E4', 'F2', 'M2'],
    correct: 'E2',
    violates: ['E2'],
    explanation:
      'Das Startereignis hat zwei ausgehende Kanten. Richtig wäre ein UND-Konnektor nach dem Ereignis, der beide Funktionen anstößt.',
  },
  {
    id: 'e-spot-1',
    type: 'spot',
    group: 'E',
    rules: ['E1'],
    prompt: SPOT,
    epk: epk(
      [
        ev('s', 'Anfrage ist eingegangen', 0.5, 0),
        fn('f1', 'Anfrage prüfen', 0.5, 1),
        ev('m', 'Anfrage ist geprüft', 0.5, 2),
        fn('f2', 'Angebot erstellen', 0, 3),
        fn('f3', 'Kunde informieren', 1, 3),
        ev('e2', 'Angebot ist erstellt', 0, 4),
        ev('e3', 'Kunde ist informiert', 1, 4),
      ],
      flow('s>f1>m', 'm>f2>e2', 'm>f3>e3'),
    ),
    targets: ['m', 'm>f2', 'm>f3'],
    violates: ['E1'],
    explanation:
      'Das Ereignis „Anfrage ist geprüft“ hat zwei ausgehende Kanten. Die Aufteilung auf zwei Funktionen muss ein Konnektor übernehmen.',
  },
  {
    id: 'e-spot-2',
    type: 'spot',
    group: 'E',
    rules: ['E3'],
    prompt: SPOT,
    epk: epk(
      [
        ev('s1', 'Zahlung ist eingegangen', 0, 0),
        ev('s2', 'Ware ist versandt', 1, 0),
        fn('f1', 'Zahlung verbuchen', 0, 1),
        fn('f2', 'Versand bestätigen', 1, 1),
        ev('end', 'Auftrag ist abgeschlossen', 0.5, 2),
      ],
      flow('s1>f1>end', 's2>f2>end'),
    ),
    targets: ['end', 'f1>end', 'f2>end'],
    violates: ['E3'],
    explanation:
      'Das Endereignis hat zwei eingehende Kanten. Die beiden Funktionen müssen vorher über einen Konnektor zusammengeführt werden.',
  },
  {
    id: 'e-fill-1',
    type: 'fill',
    group: 'E',
    rules: ['E4', 'F2'],
    prompt: 'In dieser EPK fehlt ein Element. Ziehe das passende Element in die Lücke.',
    epk: epk(
      [
        ev('a', 'Urlaubsantrag ist gestellt', 0, 0),
        fn('b', 'Urlaubsantrag prüfen', 0, 1),
        slot('x', 0, 2),
        fn('d', 'Urlaub eintragen', 0, 3),
        ev('e', 'Urlaub ist eingetragen', 0, 4),
      ],
      flow('a>b>x>d>e'),
    ),
    palette: ['event', 'function', 'xor', 'and'],
    solution: { x: ['event'] },
    explanation:
      'Zwischen zwei Funktionen steht immer ein Ereignis, hier zum Beispiel „Urlaubsantrag ist genehmigt“.',
  },
  {
    id: 'e-pick-1',
    type: 'pick',
    group: 'E',
    rules: ['E1', 'K3'],
    prompt:
      'Nach dem Ereignis „Auftrag ist geprüft“ sollen zwei Funktionen angestoßen werden. Welche EPK ist regelkonform?',
    choices: [
      {
        epk: epk(
          [
            ev('s', 'Auftrag ist eingegangen', 0.5, 0),
            fn('f', 'Auftrag prüfen', 0.5, 1),
            ev('m', 'Auftrag ist geprüft', 0.5, 2),
            and('k', 0.5, 3),
            fn('f1', 'Material bestellen', 0, 4),
            fn('f2', 'Termin planen', 1, 4),
            ev('e1', 'Material ist bestellt', 0, 5),
            ev('e2', 'Termin ist geplant', 1, 5),
          ],
          flow('s>f>m>k', 'k>f1>e1', 'k>f2>e2'),
        ),
        violates: [],
        note: 'Regelkonform: Ein UND-Konnektor stößt nach dem Ereignis beide Funktionen an.',
      },
      {
        epk: epk(
          [
            ev('s', 'Auftrag ist eingegangen', 0.5, 0),
            fn('f', 'Auftrag prüfen', 0.5, 1),
            ev('m', 'Auftrag ist geprüft', 0.5, 2),
            fn('f1', 'Material bestellen', 0, 3),
            fn('f2', 'Termin planen', 1, 3),
            ev('e1', 'Material ist bestellt', 0, 4),
            ev('e2', 'Termin ist geplant', 1, 4),
          ],
          flow('s>f>m', 'm>f1>e1', 'm>f2>e2'),
        ),
        violates: ['E1'],
        note: 'Das Ereignis hat zwei ausgehende Kanten (E1). Die Aufteilung muss ein Konnektor übernehmen.',
      },
      {
        epk: epk(
          [
            ev('s', 'Auftrag ist eingegangen', 0.5, 0),
            fn('f', 'Auftrag prüfen', 0.5, 1),
            ev('m', 'Auftrag ist geprüft', 0.5, 2),
            xor('k', 0.5, 3),
            fn('f1', 'Material bestellen', 0, 4),
            fn('f2', 'Termin planen', 1, 4),
            ev('e1', 'Material ist bestellt', 0, 5),
            ev('e2', 'Termin ist geplant', 1, 5),
          ],
          flow('s>f>m>k', 'k>f1>e1', 'k>f2>e2'),
        ),
        violates: ['K3'],
        note: 'Nach einem Ereignis darf kein XOR-Split folgen (K3): Ein Ereignis kann nicht entscheiden, welcher Zweig durchlaufen wird.',
      },
    ],
    correct: 0,
    explanation:
      'Verzweigt der Ablauf nach einem Ereignis, übernimmt das ein Konnektor. Zulässig ist dort nur UND, weil ein Ereignis keine Entscheidung treffen kann.',
  },
  {
    id: 'e-pick-2',
    type: 'pick',
    group: 'E',
    rules: ['E4', 'M2'],
    prompt: 'Zwei dieser EPKs sind regelkonform. Welche ist es nicht?',
    choices: [
      {
        epk: epk(
          [
            ev('a', 'Störung ist gemeldet', 0, 0),
            fn('b', 'Störung beheben', 0, 1),
            ev('c', 'Störung ist behoben', 0, 2),
            ev('d', 'Ticket ist geschlossen', 0, 3),
          ],
          flow('a>b>c>d'),
        ),
        violates: ['E4'],
        note: 'Die letzten beiden Ereignisse folgen direkt aufeinander (E4). Dazwischen fehlt eine Funktion wie „Ticket schließen“.',
      },
      {
        epk: epk(
          [
            ev('a', 'Störung ist gemeldet', 0, 0),
            fn('b', 'Störung beheben', 0, 1),
            ev('c', 'Störung ist behoben', 0, 2),
            fn('d', 'Ticket schließen', 0, 3),
            ev('e', 'Ticket ist geschlossen', 0, 4),
          ],
          flow('a>b>c>d>e'),
        ),
        violates: [],
        note: 'Regelkonform: Ereignisse und Funktionen wechseln sich ab.',
      },
      {
        epk: epk(
          [
            pi('p', 'Störung melden', 0, 0),
            ev('a', 'Störung ist gemeldet', 0, 1),
            fn('b', 'Störung beheben', 0, 2),
            ev('c', 'Störung ist behoben', 0, 3),
          ],
          flow('p>a>b>c'),
        ),
        violates: [],
        note: 'Regelkonform: Vor dem Startereignis darf eine Prozessschnittstelle stehen.',
      },
    ],
    correct: 0,
    explanation:
      'Auf ein Ereignis folgt stets eine Funktion. Eine Prozessschnittstelle vor dem Startereignis ist dagegen erlaubt, denn sie steht anstelle einer Funktion.',
  },
  {
    id: 'e-model-1',
    type: 'model',
    group: 'E',
    rules: ['E2', 'E3', 'E4'],
    prompt:
      'Modelliere diesen Ablauf: Sobald eine Bewerbung eingegangen ist, wird sie gesichtet. Danach wird der Bewerber eingeladen.',
    grid: { cols: 2, rows: 5 },
    solution: epk(
      [
        ev('a', 'Bewerbung ist eingegangen', 0, 0),
        fn('b', 'Bewerbung sichten', 0, 1),
        ev('c', 'Bewerbung ist gesichtet', 0, 2),
        fn('d', 'Bewerber einladen', 0, 3),
        ev('e', 'Bewerber ist eingeladen', 0, 4),
      ],
      flow('a>b>c>d>e'),
    ),
    explanation:
      'Die EPK beginnt mit einem Startereignis und endet mit einem Endereignis. Dazwischen wechseln sich Ereignisse und Funktionen ab.',
  },
  {
    id: 'e-repair-1',
    type: 'repair',
    group: 'E',
    rules: ['E1', 'K3'],
    prompt:
      'Diese EPK enthält einen Regelverstoß. Korrigiere das Modell so, dass nach der Prüfung beide Funktionen angestoßen werden.',
    grid: { cols: 3, rows: 6 },
    start: epk(
      [
        ev('s', 'Anfrage ist eingegangen', 1, 0),
        fn('f', 'Anfrage prüfen', 1, 1),
        ev('m', 'Anfrage ist geprüft', 1, 2),
        fn('f1', 'Angebot erstellen', 0, 4),
        fn('f2', 'Kunde informieren', 2, 4),
        ev('e1', 'Angebot ist erstellt', 0, 5),
        ev('e2', 'Kunde ist informiert', 2, 5),
      ],
      flow('s>f>m', 'm>f1>e1', 'm>f2>e2'),
    ),
    solution: epk(
      [
        ev('s', 'Anfrage ist eingegangen', 1, 0),
        fn('f', 'Anfrage prüfen', 1, 1),
        ev('m', 'Anfrage ist geprüft', 1, 2),
        and('k', 1, 3),
        fn('f1', 'Angebot erstellen', 0, 4),
        fn('f2', 'Kunde informieren', 2, 4),
        ev('e1', 'Angebot ist erstellt', 0, 5),
        ev('e2', 'Kunde ist informiert', 2, 5),
      ],
      flow('s>f>m>k', 'k>f1>e1', 'k>f2>e2'),
    ),
    explanation:
      'Das Ereignis „Anfrage ist geprüft“ hatte zwei ausgehende Kanten. Ein UND-Konnektor übernimmt die Aufteilung. XOR oder ODER wären nach einem Ereignis nicht zulässig.',
  },
]
