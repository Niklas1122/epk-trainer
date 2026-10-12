import { and, epk, ev, flow, fn, or, slot, xor } from '../../epk/build'
import type { Task } from '../../types'
import { SPOT, TF } from './prompts'

export const K_TASKS: Task[] = [
  {
    id: 'k-mc-1',
    type: 'mc',
    group: 'K',
    rules: ['K1'],
    prompt: 'Welche Aussage über einfache Konnektoren (keine Doppelkonnektoren) ist richtig?',
    options: [
      'Ein Konnektor hat entweder einen Eingang und mehrere Ausgänge oder mehrere Eingänge und einen Ausgang.',
      'Ein Konnektor darf zugleich mehrere Eingänge und mehrere Ausgänge haben.',
      'Ein Konnektor hat immer genau einen Eingang und genau einen Ausgang.',
      'Zwei Konnektoren dürfen nie direkt aufeinander folgen.',
    ],
    correct: [0],
    explanation:
      'Ein Konnektor ist entweder Split oder Join. Wer beides braucht, modelliert zwei Konnektoren hintereinander (K4).',
  },
  {
    id: 'k-mc-2',
    type: 'mc',
    group: 'K',
    rules: ['K4'],
    prompt: 'Dürfen zwei Konnektoren direkt hintereinander modelliert werden?',
    options: [
      'Ja, so lassen sich komplexere Verknüpfungen ausdrücken.',
      'Nein, zwischen zwei Konnektoren muss immer ein Ereignis stehen.',
      'Nein, zwischen zwei Konnektoren muss immer eine Funktion stehen.',
      'Nur, wenn beide Konnektoren vom gleichen Typ sind.',
    ],
    correct: [0],
    explanation: 'Konnektoren dürfen verkettet werden, auch wenn sie unterschiedlichen Typs sind.',
  },
  {
    id: 'k-tf-1',
    type: 'tf',
    group: 'K',
    rules: ['K3', 'E5'],
    prompt: TF,
    epk: epk(
      [
        ev('s', 'Ware ist eingetroffen', 0.5, 0),
        xor('x', 0.5, 1),
        fn('f1', 'Ware einlagern', 0, 2),
        fn('f2', 'Ware zurücksenden', 1, 2),
        ev('e1', 'Ware ist eingelagert', 0, 3),
        ev('e2', 'Ware ist zurückgesandt', 1, 3),
      ],
      flow('s>x', 'x>f1>e1', 'x>f2>e2'),
    ),
    violates: ['K3'],
    explanation:
      'Nach dem Ereignis folgt ein XOR-Split. Ein Ereignis kann aber nicht entscheiden, ob eingelagert oder zurückgesendet wird. Es fehlt eine Funktion wie „Ware prüfen“.',
  },
  {
    id: 'k-tf-2',
    type: 'tf',
    group: 'K',
    rules: ['K3'],
    prompt: TF,
    epk: epk(
      [
        ev('s', 'Bestellung ist freigegeben', 0.5, 0),
        and('x', 0.5, 1),
        fn('f1', 'Ware verpacken', 0, 2),
        fn('f2', 'Rechnung erstellen', 1, 2),
        ev('e1', 'Ware ist verpackt', 0, 3),
        ev('e2', 'Rechnung ist erstellt', 1, 3),
      ],
      flow('s>x', 'x>f1>e1', 'x>f2>e2'),
    ),
    violates: [],
    explanation:
      'Ein UND-Split nach einem Ereignis ist erlaubt: Beide Funktionen werden angestoßen, es wird nichts entschieden. Verboten sind nur XOR und ODER.',
  },
  {
    id: 'k-tf-3',
    type: 'tf',
    group: 'K',
    rules: ['K4', 'K1'],
    prompt: 'In dieser EPK folgen zwei Konnektoren direkt aufeinander. Ist sie regelkonform?',
    epk: epk(
      [
        ev('a', 'Bestellung ist geprüft', 0, 0),
        ev('b', 'Ware ist verfügbar', 1, 0),
        and('k1', 0.5, 1),
        ev('c', 'Sonderfreigabe ist erteilt', 2, 1),
        xor('k2', 1.25, 2),
        fn('f', 'Ware ausliefern', 1.25, 3),
        ev('e', 'Ware ist ausgeliefert', 1.25, 4),
      ],
      flow('a>k1', 'b>k1', 'k1>k2', 'c>k2', 'k2>f>e'),
    ),
    violates: [],
    explanation:
      'Konnektoren dürfen verkettet werden. Beide sind Joins mit je einem Ausgang, und alle Eingänge kommen von Ereignissen.',
  },
  {
    id: 'k-rule-1',
    type: 'rule',
    group: 'K',
    rules: ['K2'],
    prompt: 'Der Konnektor in dieser EPK verstößt gegen eine Regel. Welche?',
    epk: epk(
      [
        ev('s', 'Antrag ist eingegangen', 0.5, 0),
        fn('f1', 'Antrag prüfen', 0.5, 1),
        xor('x', 0.5, 2),
        ev('a', 'Antrag ist abgelehnt', 0, 3),
        fn('f2', 'Antrag bearbeiten', 1, 3),
        ev('b', 'Antrag ist bearbeitet', 1, 4),
      ],
      flow('s>f1>x', 'x>a', 'x>f2>b'),
    ),
    options: ['K1', 'K2', 'K3', 'K4'],
    correct: 'K2',
    violates: ['K2', 'F2'],
    explanation:
      'Die Ausgänge des Konnektors führen zu einem Ereignis und zu einer Funktion. Als Folge steht im rechten Zweig außerdem eine Funktion direkt nach einer Funktion (F2).',
  },
  {
    id: 'k-spot-1',
    type: 'spot',
    group: 'K',
    rules: ['K1'],
    prompt: SPOT,
    epk: epk(
      [
        ev('s1', 'Angebot ist eingegangen', 0, 0),
        ev('s2', 'Muster ist eingegangen', 1, 0),
        fn('f1', 'Angebot prüfen', 0, 1),
        fn('f2', 'Muster testen', 1, 1),
        xor('x', 0.5, 2),
        ev('a', 'Lieferant ist ausgewählt', 0, 3),
        ev('b', 'Lieferant ist abgelehnt', 1, 3),
      ],
      flow('s1>f1>x', 's2>f2>x', 'x>a', 'x>b'),
    ),
    targets: ['x'],
    violates: ['K1'],
    explanation:
      'Der Konnektor hat zwei Eingänge und zwei Ausgänge. Er müsste in einen Join und einen nachfolgenden Split aufgeteilt werden.',
  },
  {
    id: 'k-spot-2',
    type: 'spot',
    group: 'K',
    rules: ['K3'],
    prompt: SPOT,
    epk: epk(
      [
        ev('s', 'Reklamation ist eingegangen', 0.5, 0),
        fn('f', 'Reklamation erfassen', 0.5, 1),
        ev('m', 'Reklamation ist erfasst', 0.5, 2),
        or('o', 0.5, 3),
        fn('f1', 'Ersatz liefern', 0, 4),
        fn('f2', 'Gutschrift erstellen', 1, 4),
        ev('e1', 'Ersatz ist geliefert', 0, 5),
        ev('e2', 'Gutschrift ist erstellt', 1, 5),
      ],
      flow('s>f>m>o', 'o>f1>e1', 'o>f2>e2'),
    ),
    targets: ['o'],
    violates: ['K3'],
    explanation:
      'Der ODER-Split steht direkt nach einem Ereignis. Ob Ersatz, Gutschrift oder beides, müsste vorher eine Funktion entscheiden.',
  },
  {
    id: 'k-fill-1',
    type: 'fill',
    group: 'K',
    rules: ['K3'],
    prompt: 'Nach dem Ereignis werden zwei Funktionen angestoßen. Ziehe das Element in die Lücke, das hier zulässig ist.',
    epk: epk(
      [
        ev('s', 'Messe ist beendet', 0.5, 0),
        slot('x', 0.5, 1),
        fn('f1', 'Kontakte erfassen', 0, 2),
        fn('f2', 'Messestand abbauen', 1, 2),
        ev('e1', 'Kontakte sind erfasst', 0, 3),
        ev('e2', 'Messestand ist abgebaut', 1, 3),
      ],
      flow('s>x', 'x>f1>e1', 'x>f2>e2'),
    ),
    palette: ['xor', 'or', 'and', 'function'],
    solution: { x: ['and'] },
    explanation:
      'Nach einem Ereignis ist nur ein UND-Split erlaubt. XOR und ODER würden eine Entscheidung verlangen, die ein Ereignis nicht treffen kann.',
  },
  {
    id: 'k-pick-1',
    type: 'pick',
    group: 'K',
    rules: ['K1', 'K4'],
    prompt: 'Zwei Prüfungen laufen zusammen, danach gibt es zwei mögliche Ergebnisse. Welche EPK ist regelkonform?',
    choices: [
      {
        epk: epk(
          [
            ev('s1', 'Zeugnis ist eingegangen', 0, 0),
            ev('s2', 'Referenz ist eingegangen', 1, 0),
            fn('f1', 'Zeugnis prüfen', 0, 1),
            fn('f2', 'Referenz prüfen', 1, 1),
            and('j', 0.5, 2),
            xor('x', 0.5, 3),
            ev('a', 'Bewerber ist geeignet', 0, 4),
            ev('b', 'Bewerber ist ungeeignet', 1, 4),
          ],
          flow('s1>f1>j', 's2>f2>j', 'j>x', 'x>a', 'x>b'),
        ),
        violates: [],
        note: 'Regelkonform: Ein UND-Join führt die beiden Prüfungen zusammen, ein eigener XOR-Split verteilt auf die Ergebnisse. Konnektoren dürfen so verkettet werden (K4).',
      },
      {
        epk: epk(
          [
            ev('s1', 'Zeugnis ist eingegangen', 0, 0),
            ev('s2', 'Referenz ist eingegangen', 1, 0),
            fn('f1', 'Zeugnis prüfen', 0, 1),
            fn('f2', 'Referenz prüfen', 1, 1),
            xor('x', 0.5, 2),
            ev('a', 'Bewerber ist geeignet', 0, 3),
            ev('b', 'Bewerber ist ungeeignet', 1, 3),
          ],
          flow('s1>f1>x', 's2>f2>x', 'x>a', 'x>b'),
        ),
        violates: ['K1'],
        note: 'Der Konnektor hat zwei Eingänge und zwei Ausgänge (K1). Er muss in einen Join und einen Split aufgeteilt werden.',
      },
      {
        epk: epk(
          [
            ev('s1', 'Zeugnis ist eingegangen', 0, 0),
            ev('s2', 'Referenz ist eingegangen', 1, 0),
            fn('f1', 'Zeugnis prüfen', 0, 1),
            fn('f2', 'Referenz prüfen', 1, 1),
            and('x', 0.5, 2),
            ev('a', 'Bewerber ist geeignet', 0, 3),
            ev('b', 'Bewerber ist ungeeignet', 1, 3),
          ],
          flow('s1>f1>x', 's2>f2>x', 'x>a', 'x>b'),
        ),
        violates: ['K1'],
        note: 'Auch ein UND-Konnektor darf nicht zugleich zusammenführen und aufspalten (K1). Der Typ des Konnektors ändert daran nichts.',
      },
    ],
    correct: 0,
    explanation:
      'Ein einfacher Konnektor ist entweder Join oder Split. Wer beides braucht, modelliert zwei Konnektoren direkt hintereinander.',
  },
  {
    id: 'k-model-1',
    type: 'model',
    group: 'K',
    rules: ['K3', 'K2', 'M8'],
    prompt:
      'Modelliere diesen Ablauf: Sobald eine Veranstaltung genehmigt ist, werden gleichzeitig der Raum gebucht und die Einladungen verschickt. Erst wenn beides erledigt ist, wird das Programm veröffentlicht.',
    grid: { cols: 3, rows: 7 },
    solution: epk(
      [
        ev('s', 'Veranstaltung ist genehmigt', 1, 0),
        and('k1', 1, 1),
        fn('f1', 'Raum buchen', 0, 2),
        fn('f2', 'Einladungen verschicken', 2, 2),
        ev('e1', 'Raum ist gebucht', 0, 3),
        ev('e2', 'Einladungen sind verschickt', 2, 3),
        and('k2', 1, 4),
        fn('f3', 'Programm veröffentlichen', 1, 5),
        ev('e', 'Programm ist veröffentlicht', 1, 6),
      ],
      flow('s>k1', 'k1>f1>e1>k2', 'k1>f2>e2>k2', 'k2>f3>e'),
    ),
    explanation:
      'Nach einem Ereignis ist nur ein UND-Split zulässig (K3). Weil beide Zweige durchlaufen werden, führt auch ein UND-Konnektor sie wieder zusammen (M8).',
  },
  {
    id: 'k-repair-1',
    type: 'repair',
    group: 'K',
    rules: ['K3', 'E5'],
    prompt:
      'Sobald der Vertrag unterschrieben ist, werden beide Funktionen angestoßen. Der Konnektor in dieser EPK ist dafür nicht zulässig. Korrigiere das Modell.',
    grid: { cols: 3, rows: 4 },
    start: epk(
      [
        ev('s', 'Vertrag ist unterschrieben', 1, 0),
        xor('x', 1, 1),
        fn('f1', 'Vertrag archivieren', 0, 2),
        fn('f2', 'Kunde anlegen', 2, 2),
        ev('e1', 'Vertrag ist archiviert', 0, 3),
        ev('e2', 'Kunde ist angelegt', 2, 3),
      ],
      flow('s>x', 'x>f1>e1', 'x>f2>e2'),
    ),
    solution: epk(
      [
        ev('s', 'Vertrag ist unterschrieben', 1, 0),
        and('k', 1, 1),
        fn('f1', 'Vertrag archivieren', 0, 2),
        fn('f2', 'Kunde anlegen', 2, 2),
        ev('e1', 'Vertrag ist archiviert', 0, 3),
        ev('e2', 'Kunde ist angelegt', 2, 3),
      ],
      flow('s>k', 'k>f1>e1', 'k>f2>e2'),
    ),
    explanation:
      'Nach einem Ereignis darf kein XOR- oder ODER-Split stehen, weil ein Ereignis nichts entscheiden kann. Ein UND-Split stößt beide Funktionen an.',
  },
]
