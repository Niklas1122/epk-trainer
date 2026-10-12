import { and, assoc, doc, epk, ev, flow, fn, frame, org, pi, via, xor } from '../epk/build'
import type { Epk, Group, GroupId, Rule, RuleExample } from '../types'

// Regelsammlung nach Prof. Dr. Frank Lehmann, Vorlesung Prozessmodellierung
// bzw. [Lehmann 2008]. Die Erläuterungen (`why`) und Beispiele sind ergänzt.

export const GROUPS: Group[] = [
  {
    id: 'E',
    name: 'Ereignisregeln',
    intro: 'Ereignisse beschreiben eingetretene Zustände. Sie lösen Funktionen aus oder sind deren Ergebnis.',
  },
  {
    id: 'F',
    name: 'Funktionsregeln',
    intro: 'Funktionen sind die Tätigkeiten im Prozess. Nur sie können Entscheidungen treffen.',
  },
  {
    id: 'K',
    name: 'Konnektorenregeln',
    intro: 'Konnektoren (UND, ODER, XOR) spalten den Kontrollfluss auf oder führen ihn zusammen.',
  },
  {
    id: 'M',
    name: 'Modellregeln',
    intro: 'Objekttypübergreifende Regeln für die gesamte EPK, einschließlich der Regeln für Rücksprünge.',
  },
  {
    id: 'P',
    name: 'Prozessschnittstellen-Regeln',
    intro: 'Prozessschnittstellen (Prozesswegweiser) verknüpfen mehrere EPKs miteinander.',
  },
]

const good = (caption: string, e: Epk): RuleExample => ({ kind: 'good', caption, epk: e })
const bad = (caption: string, e: Epk): RuleExample => ({ kind: 'bad', caption, epk: e })

const loopExample = epk(
  [
    ev('s', 'Prüfung ist fällig', 1, 0),
    xor('j', 1, 1),
    fn('f', 'Ergebnis prüfen', 1, 2),
    xor('x', 1, 3),
    ev('ok', 'Ergebnis ist in Ordnung', 0.5, 4),
    ev('nok', 'Ergebnis ist fehlerhaft', 1.5, 4),
  ],
  [...flow('s>j>f>x', 'x>ok', 'x>nok'), via('nok', 'j', [[2.45, 4], [2.45, 1]])],
)

const linkExample = epk(
  [
    ev('a1', 'Ereignis 1', 0, 0),
    fn('a2', 'Funktion 1', 0, 1),
    ev('a3', 'Ereignis 2', 0, 2),
    pi('a4', 'Prozess B', 0, 3),
    pi('b1', 'Prozess A', 1.3, 0),
    ev('b2', 'Ereignis 2', 1.3, 1),
    fn('b3', 'Funktion 2', 1.3, 2),
    ev('b4', 'Ereignis 3', 1.3, 3),
  ],
  flow('a1>a2>a3>a4', 'b1>b2>b3>b4'),
  [frame('EPK „Prozess A“', 0, 0, 1, 4), frame('EPK „Prozess B“', 1.3, 0, 1, 4)],
)

export const RULES: Rule[] = [
  {
    id: 'E1',
    group: 'E',
    title: 'Eine eingehende und eine ausgehende Kante',
    text: 'Ereignisse haben grundsätzlich genau eine eingehende und genau eine ausgehende Kante.',
    why: 'Soll der Ablauf nach einem Ereignis verzweigen oder vor einem Ereignis zusammenlaufen, übernimmt das ein Konnektor. Ausnahmen sind Start- und Endereignisse (E2, E3).',
    examples: [
      bad(
        'Das Ereignis hat zwei ausgehende Kanten.',
        epk(
          [ev('a', 'Ereignis', 0.5, 0), fn('f1', 'Funktion 1', 0, 1), fn('f2', 'Funktion 2', 1, 1)],
          flow('a>f1', 'a>f2'),
        ),
      ),
      good(
        'Ein Konnektor übernimmt die Aufteilung.',
        epk(
          [ev('a', 'Ereignis', 0.5, 0), and('k', 0.5, 1), fn('f1', 'Funktion 1', 0, 2), fn('f2', 'Funktion 2', 1, 2)],
          flow('a>k', 'k>f1', 'k>f2'),
        ),
      ),
    ],
  },
  {
    id: 'E2',
    group: 'E',
    title: 'Startereignisse',
    text: 'Startereignisse lösen einen Prozess aus. Sie besitzen genau eine ausgehende Kante.',
    why: 'Ein Startereignis hat keinen Vorgänger im Kontrollfluss. Vor ihm darf höchstens eine Prozessschnittstelle stehen (M2).',
    examples: [
      good(
        'Start- und Endereignis haben jeweils genau eine Kante.',
        epk(
          [ev('a', 'Startereignis', 0, 0), fn('f', 'Funktion', 0, 1), ev('b', 'Endereignis', 0, 2)],
          flow('a>f>b'),
        ),
      ),
    ],
  },
  {
    id: 'E3',
    group: 'E',
    title: 'Endereignisse',
    text: 'Endereignisse bilden die Ergebnisse eines Prozesses ab. Sie besitzen genau eine eingehende Kante.',
    why: 'Ein Endereignis hat keinen Nachfolger im Kontrollfluss. Nach ihm darf höchstens eine Prozessschnittstelle folgen (M3).',
    examples: [
      bad(
        'Das Endereignis hat zwei eingehende Kanten.',
        epk(
          [fn('f1', 'Funktion 1', 0, 0), fn('f2', 'Funktion 2', 1, 0), ev('e', 'Endereignis', 0.5, 1)],
          flow('f1>e', 'f2>e'),
        ),
      ),
      good(
        'Ein Konnektor führt die Zweige vorher zusammen.',
        epk(
          [fn('f1', 'Funktion 1', 0, 0), fn('f2', 'Funktion 2', 1, 0), xor('k', 0.5, 1), ev('e', 'Endereignis', 0.5, 2)],
          flow('f1>k', 'f2>k', 'k>e'),
        ),
      ),
    ],
  },
  {
    id: 'E4',
    group: 'E',
    title: 'Auf ein Ereignis folgt eine Funktion',
    text: 'Auf ein Ereignis folgt stets eine Funktion und umgekehrt. Ereignisse folgen somit nicht direkt aufeinander.',
    why: 'Zwischen zwei Zuständen muss immer etwas getan werden. Konnektoren dazwischen ändern daran nichts: Es zählt das nächste Ereignis oder die nächste Funktion auf dem Pfad.',
    examples: [
      bad(
        'Zwei Ereignisse folgen direkt aufeinander.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), ev('b', 'Ereignis 2', 0, 1), fn('f', 'Funktion', 0, 2)],
          flow('a>b>f'),
        ),
      ),
    ],
  },
  {
    id: 'E5',
    group: 'E',
    title: 'Keine Entscheidungskompetenz',
    text: 'Ereignisse haben keine Entscheidungskompetenz. Sie sind passive Elemente, die nicht über den weiteren Ablauf entscheiden (vgl. K3).',
    why: 'Ein Ereignis stellt nur fest, dass ein Zustand eingetreten ist. Entscheidungen trifft immer eine Funktion (F3).',
  },

  {
    id: 'F1',
    group: 'F',
    title: 'Eine eingehende und eine ausgehende Kante',
    text: 'Funktionen haben genau eine eingehende und genau eine ausgehende Kante.',
    why: 'Mehrere Auslöser oder mehrere Ergebnisse einer Funktion werden über Konnektoren angebunden.',
    examples: [
      bad(
        'Die Funktion hat zwei ausgehende Kanten.',
        epk(
          [fn('f', 'Funktion', 0.5, 0), ev('a', 'Ereignis 1', 0, 1), ev('b', 'Ereignis 2', 1, 1)],
          flow('f>a', 'f>b'),
        ),
      ),
      good(
        'Ein Konnektor verteilt auf die Ereignisse.',
        epk(
          [fn('f', 'Funktion', 0.5, 0), xor('k', 0.5, 1), ev('a', 'Ereignis 1', 0, 2), ev('b', 'Ereignis 2', 1, 2)],
          flow('f>k', 'k>a', 'k>b'),
        ),
      ),
    ],
  },
  {
    id: 'F2',
    group: 'F',
    title: 'Auf eine Funktion folgt ein Ereignis',
    text: 'Auf eine Funktion folgt grundsätzlich stets ein Ereignis und umgekehrt. Funktionen folgen somit grundsätzlich nicht direkt aufeinander.',
    why: 'Jede Funktion führt zu einem Ergebnis, das als Ereignis sichtbar wird. Das ist das Gegenstück zu E4.',
    examples: [
      bad(
        'Zwei Funktionen folgen direkt aufeinander.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), fn('f1', 'Funktion 1', 0, 1), fn('f2', 'Funktion 2', 0, 2), ev('b', 'Ereignis 2', 0, 3)],
          flow('a>f1>f2>b'),
        ),
      ),
    ],
  },
  {
    id: 'F3',
    group: 'F',
    title: 'Entscheidungskompetenz',
    text: 'Funktionen besitzen die Kompetenz, Entscheidungen über den weiteren Ablauf zu treffen.',
    why: 'Deshalb darf ein XOR- oder ODER-Split nur nach einer Funktion stehen (K3, M7).',
  },

  {
    id: 'K1',
    group: 'K',
    title: 'Entweder Split oder Join',
    text: 'Konnektoren sind entweder Verteiler mit einem Eingang und mehreren Ausgängen (Split) oder Verknüpfungen mit mehreren Eingängen und einem Ausgang (Join). Für Doppelkonnektoren gilt diese Regel nicht.',
    why: 'Ein einfacher Konnektor mit mehreren Eingängen und mehreren Ausgängen ist nicht eindeutig lesbar. Stattdessen werden zwei Konnektoren hintereinander modelliert (K4).',
    examples: [
      bad(
        'Der Konnektor hat zwei Eingänge und zwei Ausgänge.',
        epk(
          [
            fn('f1', 'Funktion 1', 0, 0),
            fn('f2', 'Funktion 2', 1, 0),
            xor('k', 0.5, 1),
            ev('a', 'Ereignis 1', 0, 2),
            ev('b', 'Ereignis 2', 1, 2),
          ],
          flow('f1>k', 'f2>k', 'k>a', 'k>b'),
        ),
      ),
      good(
        'Join: mehrere Eingänge, ein Ausgang.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), ev('b', 'Ereignis 2', 1, 0), xor('k', 0.5, 1), fn('f', 'Funktion', 0.5, 2)],
          flow('a>k', 'b>k', 'k>f'),
        ),
      ),
    ],
  },
  {
    id: 'K2',
    group: 'K',
    title: 'Ein- und Ausgänge jeweils vom gleichen Typ',
    text: 'Alle Eingänge und alle Ausgänge eines Konnektors sind jeweils vom gleichen Typ: Sie verbinden entweder ausschließlich Ereignisse oder ausschließlich Funktionen mit dem Konnektor.',
    why: 'Ein Konnektor verknüpft zum Beispiel mehrere Ereignisse zu einer Funktion oder verteilt eine Funktion auf mehrere Ereignisse, aber nie gemischt.',
    examples: [
      bad(
        'Die Ausgänge führen zu einem Ereignis und zu einer Funktion.',
        epk(
          [fn('f', 'Funktion 1', 0.5, 0), xor('k', 0.5, 1), ev('a', 'Ereignis', 0, 2), fn('g', 'Funktion 2', 1, 2)],
          flow('f>k', 'k>a', 'k>g'),
        ),
      ),
    ],
  },
  {
    id: 'K3',
    group: 'K',
    title: 'Kein XOR- oder ODER-Split nach einem Ereignis',
    text: 'Nach Ereignissen folgt kein XOR- oder ODER-Konnektor zur Aufspaltung (Split) des Kontrollflusses (vgl. E5).',
    why: 'Bei XOR und ODER muss jemand auswählen, welcher Zweig durchlaufen wird. Ein Ereignis kann das nicht. Ein UND-Split nach einem Ereignis ist erlaubt, weil dabei nichts entschieden wird.',
    examples: [
      bad(
        'Nach dem Ereignis müsste entschieden werden.',
        epk(
          [ev('a', 'Ereignis', 0.5, 0), xor('k', 0.5, 1), fn('f1', 'Funktion 1', 0, 2), fn('f2', 'Funktion 2', 1, 2)],
          flow('a>k', 'k>f1', 'k>f2'),
        ),
      ),
      good(
        'Ein UND-Split stößt beide Funktionen an.',
        epk(
          [ev('a', 'Ereignis', 0.5, 0), and('k', 0.5, 1), fn('f1', 'Funktion 1', 0, 2), fn('f2', 'Funktion 2', 1, 2)],
          flow('a>k', 'k>f1', 'k>f2'),
        ),
      ),
    ],
  },
  {
    id: 'K4',
    group: 'K',
    title: 'Konnektoren dürfen verkettet werden',
    text: 'Konnektoren können direkt verkettet, d. h. hintereinander modelliert werden, um komplexere Regeln auszudrücken.',
    examples: [
      good(
        'Entweder Ereignis 1 und 2 gemeinsam oder Ereignis 3 lösen die Funktion aus.',
        epk(
          [
            ev('a', 'Ereignis 1', 0, 0),
            ev('b', 'Ereignis 2', 1, 0),
            and('k1', 0.5, 1),
            ev('c', 'Ereignis 3', 2, 1),
            xor('k2', 1.25, 2),
            fn('f', 'Funktion', 1.25, 3),
          ],
          flow('a>k1', 'b>k1', 'k1>k2', 'c>k2', 'k2>f'),
        ),
      ),
    ],
  },

  {
    id: 'M1',
    group: 'M',
    title: 'Keine unverbundenen Modellteile',
    text: 'Es darf keine unverbundenen Modellteile geben: weder isolierte Funktionen, Ereignisse oder andere Objekte noch mehrere Teilketten.',
    why: 'Eine EPK ist ein zusammenhängender Graph. Was nicht verbunden ist, gehört nicht zum Ablauf.',
    examples: [
      bad(
        'Funktion 2 ist mit nichts verbunden.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), fn('f', 'Funktion 1', 0, 1), ev('b', 'Ereignis 2', 0, 2), fn('g', 'Funktion 2', 1, 1)],
          flow('a>f>b'),
        ),
      ),
    ],
  },
  {
    id: 'M2',
    group: 'M',
    title: 'Mindestens ein Startereignis',
    text: 'Ein Modell besitzt stets mindestens ein Startereignis (auslösendes Ereignis). Prozessschnittstellen können ungeachtet dessen vor Startereignissen modelliert werden.',
    why: 'Eine EPK beginnt nie mit einer Funktion.',
    examples: [
      bad(
        'Das Modell beginnt mit einer Funktion.',
        epk([fn('f', 'Funktion', 0, 0), ev('a', 'Ereignis', 0, 1)], flow('f>a')),
      ),
    ],
  },
  {
    id: 'M3',
    group: 'M',
    title: 'Mindestens ein Endereignis',
    text: 'Ein Modell besitzt stets mindestens ein Endereignis (im Sinne eines Ergebnisses). Prozessschnittstellen können ungeachtet dessen nach Endereignissen modelliert werden.',
    why: 'Eine EPK endet nie mit einer Funktion.',
    examples: [
      bad(
        'Das Modell endet mit einer Funktion.',
        epk([ev('a', 'Ereignis', 0, 0), fn('f', 'Funktion', 0, 1)], flow('a>f')),
      ),
    ],
  },
  {
    id: 'M4',
    group: 'M',
    title: 'Keine Schlingen',
    text: 'Kanten mit gleichem Anfangs- und Endknoten („Schlingen“) sind nicht erlaubt.',
    why: 'Wiederholungen werden als Rücksprung über einen Konnektor modelliert (M9 bis M11).',
    examples: [
      bad(
        'Die Kante beginnt und endet an derselben Funktion.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), fn('f', 'Funktion', 0, 1), ev('b', 'Ereignis 2', 0, 2)],
          flow('a>f', 'f>f', 'f>b'),
        ),
      ),
    ],
  },
  {
    id: 'M5',
    group: 'M',
    title: 'Keine Mehrfachkanten',
    text: 'Mehrfachkanten, also mehrere Kanten zwischen denselben zwei Knoten, sind nicht erlaubt.',
    examples: [
      bad(
        'Zwischen Ereignis und Funktion verlaufen zwei Kanten.',
        epk(
          [ev('a', 'Ereignis', 0, 0), fn('f', 'Funktion', 0, 1)],
          [
            { id: 'a>f#1', from: 'a', to: 'f', dx: -9 },
            { id: 'a>f#2', from: 'a', to: 'f', dx: 9 },
          ],
        ),
      ),
    ],
  },
  {
    id: 'M6',
    group: 'M',
    title: 'Erweiterungsobjekte nur an Funktionen',
    text: 'Erweiterungsobjekte wie Datenobjekte, Organisationseinheiten, Dokumente, Anwendungssysteme, Hardware oder Input- und Outputleistungen dürfen nur mit Funktionen verbunden werden, nicht mit Ereignissen.',
    why: 'Nur Funktionen sind aktiv: Sie werden von jemandem ausgeführt und verarbeiten Daten.',
    examples: [
      good(
        'Die Organisationseinheit hängt an der Funktion.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), fn('f', 'Funktion', 0, 1), ev('b', 'Ereignis 2', 0, 2), org('o', 'Abteilung', 1, 1)],
          [...flow('a>f>b'), assoc('o', 'f')],
        ),
      ),
      bad(
        'Das Dokument hängt an einem Ereignis.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), fn('f', 'Funktion', 0, 1), ev('b', 'Ereignis 2', 0, 2), doc('d', 'Dokument', 1, 2)],
          [...flow('a>f>b'), assoc('d', 'b')],
        ),
      ),
    ],
  },
  {
    id: 'M7',
    group: 'M',
    title: 'Nach Entscheidungen folgt ein Split',
    text: 'Auf Funktionen, die Entscheidungen treffen, folgen stets aufspaltende Konnektoren, im Regelfall XOR, in Ausnahmefällen ODER. Ereignisse in den verschiedenen Zweigen dokumentieren die Entscheidungsmöglichkeiten.',
    examples: [
      good(
        'Die Ereignisse nach dem XOR halten die möglichen Ergebnisse fest.',
        epk(
          [
            fn('f', 'Antrag prüfen', 0.5, 0),
            xor('k', 0.5, 1),
            ev('a', 'Antrag ist genehmigt', 0, 2),
            ev('b', 'Antrag ist abgelehnt', 1, 2),
          ],
          flow('f>k', 'k>a', 'k>b'),
        ),
      ),
    ],
  },
  {
    id: 'M8',
    group: 'M',
    title: 'Zusammenführen mit demselben Konnektor',
    text: 'Prozesszweige werden aus Gründen der Ablauflogik grundsätzlich mit demselben Konnektor (UND, XOR, ODER) wieder zusammengeführt, der auch zur Aufspaltung genutzt wurde.',
    why: 'Ein XOR-Split aktiviert nur einen Zweig. Ein UND-Join würde danach vergeblich auf den zweiten warten.',
    examples: [
      good(
        'UND spaltet auf, UND führt zusammen.',
        epk(
          [
            ev('a', 'Ereignis 1', 0.5, 0),
            and('k1', 0.5, 1),
            fn('f1', 'Funktion 1', 0, 2),
            fn('f2', 'Funktion 2', 1, 2),
            and('k2', 0.5, 3),
            ev('b', 'Ereignis 2', 0.5, 4),
          ],
          flow('a>k1', 'k1>f1', 'k1>f2', 'f1>k2', 'f2>k2', 'k2>b'),
        ),
      ),
    ],
  },
  {
    id: 'M9',
    group: 'M',
    title: 'Rücksprung geht von einem Ereignis aus',
    text: 'Ein Rücksprung geht immer von einem Ereignis weg, und zwar von dem Ereignis, aus dem sich die Notwendigkeit für den Rücksprung ergibt.',
    examples: [
      good(
        'Der Rücksprung geht vom Ereignis aus (M9), mündet in einem XOR-Konnektor (M10) und das unmittelbar vor einer Funktion (M11).',
        loopExample,
      ),
    ],
  },
  {
    id: 'M10',
    group: 'M',
    title: 'Rücksprung mündet in einem Konnektor',
    text: 'Ein Rücksprung mündet immer in einem Konnektor. Falls kein Konnektor vorhanden ist, muss ein neuer eingefügt werden, grundsätzlich ein XOR-Konnektor.',
    why: 'Ohne Konnektor hätte das Ziel zwei eingehende Kanten. Ein Beispiel steht bei Regel M9.',
  },
  {
    id: 'M11',
    group: 'M',
    title: 'Rücksprung mündet vor einer Funktion',
    text: 'Ein Rücksprung muss unmittelbar vor einer Funktion einmünden, damit Ereignisse und Funktionen weiterhin abwechselnd modelliert sind.',
    why: 'Der Rücksprung kommt von einem Ereignis (M9). Würde er vor einem Ereignis einmünden, folgten zwei Ereignisse aufeinander. Ein Beispiel steht bei Regel M9.',
  },

  {
    id: 'P1',
    group: 'P',
    title: 'Steht anstelle einer Funktion',
    text: 'Die Prozessschnittstelle steht in einer EPK anstelle einer Funktion.',
    why: 'Vor und nach einer Prozessschnittstelle steht deshalb ein Ereignis, nie eine Funktion.',
    examples: [
      good(
        'Nach dem Endereignis verweist die Prozessschnittstelle auf den Folgeprozess.',
        epk(
          [
            ev('a', 'Ereignis 1', 0, 0),
            fn('f', 'Funktion', 0, 1),
            ev('b', 'Ereignis 2', 0, 2),
            pi('p', 'Folgeprozess', 0, 3),
          ],
          flow('a>f>b>p'),
        ),
      ),
    ],
  },
  {
    id: 'P2',
    group: 'P',
    title: 'Name in der aufrufenden EPK',
    text: 'In der aufrufenden EPK gibt die Prozessschnittstelle durch ihre Position die Verknüpfungsstelle an und durch ihre Bezeichnung, welche EPK aufgerufen wird: Sie trägt den Namen der aufgerufenen EPK.',
    examples: [
      good(
        'Prozess A ruft Prozess B auf. Jede Schnittstelle trägt den Namen der jeweils anderen EPK (P2, P3), und „Ereignis 2“ wird wiederholt (P4).',
        linkExample,
      ),
    ],
  },
  {
    id: 'P3',
    group: 'P',
    title: 'Name in der aufgerufenen EPK',
    text: 'In der aufgerufenen EPK gibt ebenfalls eine Prozessschnittstelle die Verknüpfungsstelle an. Sie trägt den Namen der aufrufenden EPK.',
    why: 'So ist in beiden Modellen erkennbar, woher der Ablauf kommt und wohin er führt. Ein Beispiel steht bei Regel P2.',
  },
  {
    id: 'P4',
    group: 'P',
    title: 'Ereignis wird wiederholt',
    text: 'In der aufrufenden EPK steht vor der Prozessschnittstelle ein Ereignis (oder mehrere). Dieses Ereignis wird in der aufgerufenen EPK nach der dortigen Prozessschnittstelle wiederholt. Bei mehreren aufrufenden Ereignissen werden alle wiederholt.',
    why: 'Das wiederholte Ereignis ist die Nahtstelle zwischen beiden Modellen. Ein Beispiel steht bei Regel P2.',
  },
  {
    id: 'P5',
    group: 'P',
    title: 'Eingefügte Subprozesse',
    text: 'Bei eingefügten Subprozessen steht die aufrufende Prozessschnittstelle mitten im Kontrollfluss der EPK, aus der eine andere EPK aufgerufen wird. In der aufgerufenen EPK markieren Prozessschnittstellen die Ein- und die Aussprungstelle.',
  },
  {
    id: 'P6',
    group: 'P',
    title: 'Keine Schleifen und Rekursionen',
    text: 'Schleifen (Prozess A ruft B, B ruft C, C ruft A) und Rekursionen (Prozess A ruft A) sind nicht zulässig.',
  },
  {
    id: 'P7',
    group: 'P',
    title: 'Genau eine Kontrollflusskante',
    text: 'Prozessschnittstellen haben genau eine eingehende oder genau eine ausgehende Kontrollflusskante.',
    why: 'Mehrere Ereignisse vor einer Prozessschnittstelle werden zuerst über einen Konnektor zusammengeführt.',
    examples: [
      bad(
        'Die Prozessschnittstelle hat zwei eingehende Kanten.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), ev('b', 'Ereignis 2', 1, 0), pi('p', 'Folgeprozess', 0.5, 1)],
          flow('a>p', 'b>p'),
        ),
      ),
      good(
        'Ein Konnektor führt die Ereignisse vorher zusammen.',
        epk(
          [ev('a', 'Ereignis 1', 0, 0), ev('b', 'Ereignis 2', 1, 0), xor('k', 0.5, 1), pi('p', 'Folgeprozess', 0.5, 2)],
          flow('a>k', 'b>k', 'k>p'),
        ),
      ),
    ],
  },
]

export const RULE_BY_ID: Record<string, Rule> = Object.fromEntries(RULES.map((r) => [r.id, r]))

export const rulesOf = (group: GroupId) => RULES.filter((r) => r.group === group)
