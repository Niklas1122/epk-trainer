import { and, epk, ev, flow, fn, frame, pi, slot, xor } from '../../epk/build'
import type { Task } from '../../types'
import { SPOT } from './prompts'

/** „Ware bestellen“ calls „Ware annehmen“; the arguments are the parts a learner can get wrong. */
const linkedOrder = (callerInterface: string, calleeInterface: string, repeatedEvent: string) =>
  epk(
    [
      ev('a1', 'Bedarf ist gemeldet', 0, 0),
      fn('a2', 'Bestellung auslösen', 0, 1),
      ev('a3', 'Ware ist bestellt', 0, 2),
      pi('a4', callerInterface, 0, 3),
      pi('b1', calleeInterface, 1.3, 0),
      ev('b2', repeatedEvent, 1.3, 1),
      fn('b3', 'Lieferung prüfen', 1.3, 2),
      ev('b4', 'Lieferung ist geprüft', 1.3, 3),
    ],
    flow('a1>a2>a3>a4', 'b1>b2>b3>b4'),
    [frame('EPK „Ware bestellen“', 0, 0, 1, 4), frame('EPK „Ware annehmen“', 1.3, 0, 1, 4)],
  )

export const P_TASKS: Task[] = [
  {
    id: 'p-mc-1',
    type: 'mc',
    group: 'P',
    rules: ['P1'],
    prompt: 'An welcher Stelle steht eine Prozessschnittstelle in einer EPK?',
    options: [
      'Anstelle einer Funktion',
      'Anstelle eines Ereignisses',
      'Anstelle eines Konnektors',
      'Neben einer Funktion, wie ein Erweiterungsobjekt',
    ],
    correct: [0],
    explanation: 'Vor und nach einer Prozessschnittstelle steht deshalb ein Ereignis.',
  },
  {
    id: 'p-mc-2',
    type: 'mc',
    group: 'P',
    rules: ['P2'],
    prompt:
      'Die EPK „Auftrag annehmen“ ruft an ihrem Ende die EPK „Auftrag ausführen“ auf. Welchen Namen trägt die Prozessschnittstelle in der EPK „Auftrag annehmen“?',
    options: ['Auftrag ausführen', 'Auftrag annehmen', 'Auftrag ist angenommen', 'Sie bleibt unbenannt'],
    correct: [0],
    explanation: 'In der aufrufenden EPK trägt die Prozessschnittstelle den Namen der aufgerufenen EPK.',
  },
  {
    id: 'p-mc-3',
    type: 'mc',
    group: 'P',
    rules: ['P6'],
    prompt: 'Prozess A ruft Prozess B auf, B ruft C auf, und C ruft wieder A auf. Ist das zulässig?',
    options: [
      'Nein, Schleifen über Prozessschnittstellen sind nicht zulässig.',
      'Ja, solange alle Prozessschnittstellen richtig benannt sind.',
      'Ja, wenn der Aufruf über einen XOR-Konnektor erfolgt.',
      'Ja, verboten ist nur, dass ein Prozess sich selbst aufruft.',
    ],
    correct: [0],
    explanation: 'Weder Schleifen über mehrere Prozesse noch Rekursionen (A ruft A) sind erlaubt.',
  },
  {
    id: 'p-mc-4',
    type: 'mc',
    group: 'P',
    rules: ['P5'],
    prompt: 'Ein Subprozess wird mitten in einen Ablauf eingefügt. Was gilt in der aufgerufenen EPK?',
    options: [
      'Prozessschnittstellen markieren dort die Ein- und die Aussprungstelle.',
      'Sie enthält keine Prozessschnittstelle.',
      'Sie besteht nur aus einer einzigen Funktion.',
      'Sie ruft am Ende sich selbst erneut auf.',
    ],
    correct: [0],
    explanation:
      'Die aufrufende Prozessschnittstelle steht mitten im Kontrollfluss. Im Subprozess zeigen Prozessschnittstellen, wo der Ablauf herkommt und wohin er zurückkehrt.',
  },
  {
    id: 'p-mc-5',
    type: 'mc',
    group: 'P',
    rules: ['P5', 'P1'],
    prompt: 'Ein Subprozess wird mitten in einen Ablauf eingefügt. Wo steht die aufrufende Prozessschnittstelle?',
    options: [
      'Mitten im Kontrollfluss der aufrufenden EPK, an der Stelle des Subprozesses',
      'Immer nach dem Endereignis der aufrufenden EPK',
      'Immer vor dem Startereignis der aufrufenden EPK',
      'Neben der Funktion, die den Subprozess auslöst',
    ],
    correct: [0],
    explanation:
      'Bei einem eingefügten Subprozess läuft der Ablauf nach dem Aufruf in derselben EPK weiter. Die Prozessschnittstelle steht deshalb mitten im Kontrollfluss, anstelle einer Funktion.',
  },
  {
    id: 'p-mc-6',
    type: 'mc',
    group: 'P',
    rules: ['P6'],
    prompt: 'Welche dieser Aufrufketten über Prozessschnittstellen ist zulässig?',
    options: [
      'Prozess A ruft B auf, B ruft C auf.',
      'Prozess A ruft B auf, B ruft wieder A auf.',
      'Prozess A ruft sich selbst auf.',
      'Prozess A ruft B auf, B ruft C auf, C ruft wieder A auf.',
    ],
    correct: [0],
    explanation:
      'Zulässig ist nur eine Kette, die zu keinem bereits aufgerufenen Prozess zurückführt. Schleifen und Rekursionen sind verboten.',
  },
  {
    id: 'p-tf-1',
    type: 'tf',
    group: 'P',
    rules: ['P2', 'P3', 'P4'],
    prompt: 'Die EPK „Auftrag annehmen“ ruft die EPK „Auftrag ausführen“ auf. Ist die Verknüpfung regelkonform?',
    epk: epk(
      [
        ev('a1', 'Auftrag ist eingegangen', 0, 0),
        fn('a2', 'Auftrag erfassen', 0, 1),
        ev('a3', 'Auftrag ist erfasst', 0, 2),
        pi('a4', 'Auftrag ausführen', 0, 3),
        pi('b1', 'Auftrag annehmen', 1.3, 0),
        ev('b2', 'Auftrag ist erfasst', 1.3, 1),
        fn('b3', 'Ware kommissionieren', 1.3, 2),
        ev('b4', 'Ware ist kommissioniert', 1.3, 3),
      ],
      flow('a1>a2>a3>a4', 'b1>b2>b3>b4'),
      [frame('EPK „Auftrag annehmen“', 0, 0, 1, 4), frame('EPK „Auftrag ausführen“', 1.3, 0, 1, 4)],
    ),
    violates: [],
    explanation:
      'Jede Prozessschnittstelle trägt den Namen der jeweils anderen EPK, und das Ereignis „Auftrag ist erfasst“ wird in der aufgerufenen EPK wiederholt.',
  },
  {
    id: 'p-tf-2',
    type: 'tf',
    group: 'P',
    rules: ['M2', 'M3', 'P1'],
    prompt: 'Diese EPK beginnt und endet mit einer Prozessschnittstelle. Ist sie regelkonform?',
    epk: epk(
      [
        pi('p1', 'Angebot erstellen', 0, 0),
        ev('a', 'Angebot ist erstellt', 0, 1),
        fn('f', 'Angebot versenden', 0, 2),
        ev('b', 'Angebot ist versandt', 0, 3),
        pi('p2', 'Auftrag annehmen', 0, 4),
      ],
      flow('p1>a>f>b>p2'),
    ),
    violates: [],
    explanation:
      'Prozessschnittstellen dürfen vor dem Startereignis und nach dem Endereignis stehen. Das Modell besitzt trotzdem ein Start- und ein Endereignis.',
  },
  {
    id: 'p-tf-3',
    type: 'tf',
    group: 'P',
    rules: ['P6'],
    prompt: 'Diese EPK heißt „Rechnung prüfen“. Ist sie regelkonform?',
    epk: epk(
      [
        ev('a', 'Rechnung ist eingegangen', 0, 0),
        fn('b', 'Beträge abgleichen', 0, 1),
        ev('c', 'Rechnung ist fehlerhaft', 0, 2),
        pi('p', 'Rechnung prüfen', 0, 3),
      ],
      flow('a>b>c>p'),
      [frame('EPK „Rechnung prüfen“', 0, 0, 1, 4)],
    ),
    violates: ['P6'],
    explanation:
      'Die Prozessschnittstelle am Ende trägt den Namen der eigenen EPK: Der Prozess ruft sich selbst auf. Solche Rekursionen sind nicht zulässig.',
  },
  {
    id: 'p-rule-1',
    type: 'rule',
    group: 'P',
    rules: ['P4'],
    prompt: 'Die EPK „Bewerbung prüfen“ ruft die EPK „Gespräch führen“ auf. Gegen welche Regel verstößt die Verknüpfung?',
    epk: epk(
      [
        ev('a1', 'Bewerbung ist eingegangen', 0, 0),
        fn('a2', 'Bewerbung sichten', 0, 1),
        ev('a3', 'Bewerbung ist gesichtet', 0, 2),
        pi('a4', 'Gespräch führen', 0, 3),
        pi('b1', 'Bewerbung prüfen', 1.3, 0),
        ev('b2', 'Termin ist vereinbart', 1.3, 1),
        fn('b3', 'Gespräch vorbereiten', 1.3, 2),
        ev('b4', 'Gespräch ist vorbereitet', 1.3, 3),
      ],
      flow('a1>a2>a3>a4', 'b1>b2>b3>b4'),
      [frame('EPK „Bewerbung prüfen“', 0, 0, 1, 4), frame('EPK „Gespräch führen“', 1.3, 0, 1, 4)],
    ),
    options: ['P2', 'P3', 'P4', 'P7'],
    correct: 'P4',
    violates: ['P4'],
    explanation:
      'Vor der Prozessschnittstelle steht „Bewerbung ist gesichtet“. Dieses Ereignis müsste in der aufgerufenen EPK wiederholt werden, dort steht aber „Termin ist vereinbart“.',
  },
  {
    id: 'p-rule-2',
    type: 'rule',
    group: 'P',
    rules: ['P7'],
    prompt: 'Diese EPK wird von der EPK „Auftrag annehmen“ aufgerufen. Gegen welche Regel verstößt sie?',
    epk: epk(
      [
        pi('p', 'Auftrag annehmen', 0.5, 0),
        ev('a', 'Auftrag ist erfasst', 0, 1),
        ev('b', 'Zahlung ist eingegangen', 1, 1),
        and('j', 0.5, 2),
        fn('f', 'Ware versenden', 0.5, 3),
        ev('e', 'Ware ist versandt', 0.5, 4),
      ],
      flow('p>a>j', 'p>b>j', 'j>f>e'),
    ),
    options: ['E2', 'K3', 'P1', 'P7'],
    correct: 'P7',
    violates: ['P7'],
    explanation:
      'Von der Prozessschnittstelle gehen zwei Kanten aus. Sie darf nur eine ausgehende Kante haben; die beiden Ereignisse müssten über einen Konnektor angebunden werden.',
  },
  {
    id: 'p-spot-1',
    type: 'spot',
    group: 'P',
    rules: ['P3'],
    prompt: 'Die EPK „Angebot erstellen“ ruft die EPK „Angebot versenden“ auf. Klicke das Element an, das den Regelverstoß verursacht.',
    epk: epk(
      [
        ev('a1', 'Anfrage ist eingegangen', 0, 0),
        fn('a2', 'Angebot kalkulieren', 0, 1),
        ev('a3', 'Angebot ist kalkuliert', 0, 2),
        pi('a4', 'Angebot versenden', 0, 3),
        pi('b1', 'Angebot versenden', 1.3, 0),
        ev('b2', 'Angebot ist kalkuliert', 1.3, 1),
        fn('b3', 'Angebot drucken', 1.3, 2),
        ev('b4', 'Angebot ist gedruckt', 1.3, 3),
      ],
      flow('a1>a2>a3>a4', 'b1>b2>b3>b4'),
      [frame('EPK „Angebot erstellen“', 0, 0, 1, 4), frame('EPK „Angebot versenden“', 1.3, 0, 1, 4)],
    ),
    targets: ['b1'],
    violates: ['P3'],
    explanation:
      'Die Prozessschnittstelle in der aufgerufenen EPK trägt deren eigenen Namen. Sie müsste nach der aufrufenden EPK benannt sein, also „Angebot erstellen“.',
  },
  {
    id: 'p-spot-2',
    type: 'spot',
    group: 'P',
    rules: ['P7'],
    prompt: SPOT,
    epk: epk(
      [
        ev('s', 'Prüfung ist fällig', 0.5, 0),
        fn('f', 'Gerät prüfen', 0.5, 1),
        xor('x', 0.5, 2),
        ev('a', 'Gerät ist in Ordnung', 0, 3),
        ev('b', 'Gerät ist defekt', 1, 3),
        pi('p', 'Prüfbericht erstellen', 0.5, 4),
      ],
      flow('s>f>x', 'x>a>p', 'x>b>p'),
    ),
    targets: ['p', 'a>p', 'b>p'],
    violates: ['P7'],
    explanation:
      'Die Prozessschnittstelle hat zwei eingehende Kanten. Die beiden Ereignisse müssen vorher über einen XOR-Konnektor zusammengeführt werden.',
  },
  {
    id: 'p-fill-1',
    type: 'fill',
    group: 'P',
    rules: ['P1', 'P2'],
    prompt: 'Diese EPK soll an ihrem Ende den Prozess „Reise abrechnen“ aufrufen. Ziehe das passende Element in die Lücke.',
    epk: epk(
      [
        ev('a', 'Reise ist genehmigt', 0, 0),
        fn('b', 'Reise buchen', 0, 1),
        ev('c', 'Reise ist gebucht', 0, 2),
        slot('x', 0, 3),
      ],
      flow('a>b>c>x'),
    ),
    palette: ['event', 'function', 'interface', 'xor'],
    solution: { x: ['interface'] },
    explanation:
      'Den Aufruf einer anderen EPK zeigt eine Prozessschnittstelle. Sie steht anstelle einer Funktion und trägt den Namen der aufgerufenen EPK.',
  },
  {
    id: 'p-pick-1',
    type: 'pick',
    group: 'P',
    rules: ['P1', 'M3'],
    prompt: 'Am Ende dieser EPK soll der Prozess „Wartung dokumentieren“ aufgerufen werden. Welche EPK ist regelkonform?',
    choices: [
      {
        epk: epk(
          [
            ev('a', 'Wartung ist geplant', 0, 0),
            fn('b', 'Wartung durchführen', 0, 1),
            ev('c', 'Wartung ist durchgeführt', 0, 2),
            pi('p', 'Wartung dokumentieren', 0, 3),
          ],
          flow('a>b>c>p'),
        ),
        violates: [],
        note: 'Regelkonform: Die Prozessschnittstelle steht anstelle einer Funktion und folgt auf das Endereignis.',
      },
      {
        epk: epk(
          [
            ev('a', 'Wartung ist geplant', 0, 0),
            fn('b', 'Wartung durchführen', 0, 1),
            pi('p', 'Wartung dokumentieren', 0, 2),
          ],
          flow('a>b>p'),
        ),
        violates: ['P1', 'F2', 'M3'],
        note: 'Die Prozessschnittstelle folgt direkt auf eine Funktion. Sie steht aber selbst anstelle einer Funktion (P1), davor fehlt also das Endereignis (M3).',
      },
      {
        epk: epk(
          [
            ev('a', 'Wartung ist geplant', 0, 0),
            fn('b', 'Wartung durchführen', 0, 1),
            ev('c', 'Wartung ist durchgeführt', 0, 2),
            fn('d', 'Wartung dokumentieren', 0, 3),
          ],
          flow('a>b>c>d'),
        ),
        violates: ['M3', 'F1'],
        note: 'Hier steht eine gewöhnliche Funktion statt einer Prozessschnittstelle. Die EPK ruft damit keinen Prozess auf und endet ohne Endereignis (M3).',
      },
    ],
    correct: 0,
    explanation:
      'Eine Prozessschnittstelle steht anstelle einer Funktion. Vor ihr steht deshalb ein Ereignis, hier das Endereignis der EPK.',
  },
  {
    id: 'p-pick-2',
    type: 'pick',
    group: 'P',
    rules: ['P2', 'P3', 'P4'],
    prompt: 'Die EPK „Ware bestellen“ ruft an ihrem Ende die EPK „Ware annehmen“ auf. Welche Verknüpfung ist regelkonform?',
    choices: [
      {
        epk: linkedOrder('Ware annehmen', 'Ware bestellen', 'Ware ist bestellt'),
        violates: [],
        note: 'Regelkonform: Jede Prozessschnittstelle trägt den Namen der jeweils anderen EPK, und das Ereignis „Ware ist bestellt“ wird wiederholt.',
      },
      {
        epk: linkedOrder('Ware bestellen', 'Ware annehmen', 'Ware ist bestellt'),
        violates: ['P2', 'P3'],
        note: 'Beide Prozessschnittstellen tragen den Namen ihrer eigenen EPK. Sie müssen nach der jeweils anderen EPK benannt sein (P2, P3).',
      },
      {
        epk: linkedOrder('Ware annehmen', 'Ware bestellen', 'Ware ist geliefert'),
        violates: ['P4'],
        note: 'In der aufgerufenen EPK steht „Ware ist geliefert“. Dort müsste das Ereignis „Ware ist bestellt“ wiederholt werden (P4).',
      },
    ],
    correct: 0,
    explanation:
      'Die Prozessschnittstelle nennt in jeder EPK die jeweils andere. Das Ereignis vor dem Aufruf wird in der aufgerufenen EPK wiederholt und verbindet so beide Modelle.',
  },
  {
    id: 'p-pick-3',
    type: 'pick',
    group: 'P',
    rules: ['P5', 'P3'],
    prompt:
      'Die EPK „Auftrag abwickeln“ fügt mitten in ihrem Ablauf den Subprozess „Bonität prüfen“ ein und läuft danach weiter. Welche Fassung der aufgerufenen EPK „Bonität prüfen“ ist regelkonform?',
    choices: [
      {
        epk: epk(
          [
            pi('p1', 'Auftrag abwickeln', 0, 0),
            ev('a', 'Auftrag ist erfasst', 0, 1),
            fn('f', 'Auskunft einholen', 0, 2),
            ev('b', 'Bonität ist geprüft', 0, 3),
            pi('p2', 'Auftrag abwickeln', 0, 4),
          ],
          flow('p1>a>f>b>p2'),
        ),
        violates: [],
        note: 'Regelkonform: Prozessschnittstellen markieren die Einsprungstelle am Anfang und die Aussprungstelle am Ende. Beide tragen den Namen der aufrufenden EPK.',
      },
      {
        epk: epk(
          [
            pi('p1', 'Auftrag abwickeln', 0, 0),
            ev('a', 'Auftrag ist erfasst', 0, 1),
            fn('f', 'Auskunft einholen', 0, 2),
            ev('b', 'Bonität ist geprüft', 0, 3),
          ],
          flow('p1>a>f>b'),
        ),
        violates: ['P5'],
        note: 'Die Aussprungstelle fehlt. Ohne Prozessschnittstelle am Ende ist nicht erkennbar, dass der Ablauf in die EPK „Auftrag abwickeln“ zurückkehrt (P5).',
      },
      {
        epk: epk(
          [
            ev('a', 'Auftrag ist erfasst', 0, 0),
            fn('f', 'Auskunft einholen', 0, 1),
            ev('b', 'Bonität ist geprüft', 0, 2),
          ],
          flow('a>f>b'),
        ),
        violates: ['P5'],
        note: 'Weder die Ein- noch die Aussprungstelle ist markiert (P5). Die EPK lässt nicht erkennen, dass sie als Subprozess aufgerufen wird.',
      },
    ],
    correct: 0,
    explanation:
      'In einem eingefügten Subprozess markieren Prozessschnittstellen die Ein- und die Aussprungstelle. Sie tragen den Namen der aufrufenden EPK.',
  },
  {
    id: 'p-model-1',
    type: 'model',
    group: 'P',
    rules: ['P3', 'P4'],
    prompt:
      'Die EPK „Schaden melden“ endet mit dem Ereignis „Schaden ist gemeldet“ und ruft danach die EPK „Schaden regulieren“ auf. Modelliere den Anfang der aufgerufenen EPK „Schaden regulieren“, in der der Schaden begutachtet wird. Nicht alle Elemente werden gebraucht.',
    grid: { cols: 2, rows: 4 },
    solution: epk(
      [
        pi('p', 'Schaden melden', 0, 0),
        ev('a', 'Schaden ist gemeldet', 0, 1),
        fn('f', 'Schaden begutachten', 0, 2),
        ev('e', 'Schaden ist begutachtet', 0, 3),
      ],
      flow('p>a>f>e'),
    ),
    distractors: [pi('q', 'Schaden regulieren', 0, 0), ev('z', 'Schaden ist aufgetreten', 0, 0)],
    explanation:
      'In der aufgerufenen EPK trägt die Prozessschnittstelle den Namen der aufrufenden EPK „Schaden melden“ (P3). Danach wird deren letztes Ereignis „Schaden ist gemeldet“ wiederholt (P4).',
  },
  {
    id: 'p-repair-1',
    type: 'repair',
    group: 'P',
    rules: ['P7', 'M8'],
    prompt:
      'Nach der Bonitätsprüfung wird in beiden Fällen der Prozess „Kunde benachrichtigen“ aufgerufen. Diese EPK enthält dabei einen Regelverstoß. Korrigiere das Modell.',
    grid: { cols: 3, rows: 6 },
    start: epk(
      [
        ev('s', 'Bonität ist angefragt', 1, 0),
        fn('f', 'Bonität prüfen', 1, 1),
        xor('x', 1, 2),
        ev('a', 'Bonität ist ausreichend', 0, 3),
        ev('b', 'Bonität ist unzureichend', 2, 3),
        pi('p', 'Kunde benachrichtigen', 1, 5),
      ],
      flow('s>f>x', 'x>a>p', 'x>b>p'),
    ),
    solution: epk(
      [
        ev('s', 'Bonität ist angefragt', 1, 0),
        fn('f', 'Bonität prüfen', 1, 1),
        xor('x', 1, 2),
        ev('a', 'Bonität ist ausreichend', 0, 3),
        ev('b', 'Bonität ist unzureichend', 2, 3),
        xor('j', 1, 4),
        pi('p', 'Kunde benachrichtigen', 1, 5),
      ],
      flow('s>f>x', 'x>a>j', 'x>b>j', 'j>p'),
    ),
    explanation:
      'Die Prozessschnittstelle hatte zwei eingehende Kanten. Ein XOR-Konnektor führt die beiden Ereignisse vorher zusammen, passend zum XOR-Split davor.',
  },
]
