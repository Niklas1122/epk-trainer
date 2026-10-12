# EPK-Trainer

Web Based Training zur Wiederholung der EPK-Modellierungsregeln (E, F, K, M, P) aus der Vorlesung
Prozessmodellierung bzw. [Lehmann 2008].

Die Anwendung ist eine statische Web-App ohne Server und ohne Anmeldung. Der Lernfortschritt wird nur
im Browser des Lernenden gespeichert. Entwicklung und Betrieb sind kostenlos.

## Funktionen

- **Regelkatalog** mit allen 30 Regeln, Erläuterungen und Richtig/Falsch-Beispielen
- **Lernmodus** je Regelgruppe mit sofortiger Rückmeldung und Erklärung
- **Testmodus** mit 15 zufälligen Aufgaben und Auswertung am Ende
- **Acht Aufgabentypen**, vom Ankreuzen bis zum eigenen Modell:

| Aufgabentyp        | Kürzel   | Was der Lernende tut                                                  |
| ------------------ | -------- | --------------------------------------------------------------------- |
| Multiple Choice    | `mc`     | Aussagen zu den Regeln ankreuzen                                      |
| Richtig oder falsch | `tf`    | entscheiden, ob eine EPK regelkonform ist                             |
| Regel zuordnen     | `rule`   | die Regel nennen, gegen die eine EPK verstößt                         |
| Fehler finden      | `spot`   | das fehlerhafte Element im Diagramm anklicken                         |
| Lücke füllen       | `fill`   | das fehlende Element in eine Lücke ziehen                             |
| Diagramm auswählen | `pick`   | unter mehreren EPKs die regelkonforme (oder die fehlerhafte) wählen   |
| Modellieren        | `model`  | aus einer Beschreibung selbst eine EPK auf einem Raster zeichnen      |
| Modell korrigieren | `repair` | eine fehlerhafte EPK im selben Editor reparieren                      |

## Starten

Voraussetzung ist Node.js ab Version 20.19.

```bash
npm install
npm run dev
```

Meldet PowerShell, dass `npm.ps1` nicht digital signiert ist, blockiert der PC unsignierte Skripte.
Dann startet `.\start.cmd` (oder ein Doppelklick darauf) die App ohne npm. Alternativ laufen alle
npm-Befehle in einem Git-Bash-Terminal.

Weitere Befehle:

| Befehl            | Zweck                                             |
| ----------------- | ------------------------------------------------- |
| `npm test`        | prüft Regelkatalog und Aufgaben auf Fehler        |
| `npm run build`   | erzeugt die fertige Website im Ordner `dist`      |
| `npm run preview` | zeigt den Inhalt von `dist` lokal an              |

## Aufbau

```
src/
├─ main.tsx, App.tsx        Einstieg und Seitenrahmen
├─ types.ts                 Datentypen für Regeln, Diagramme und Aufgaben
├─ data/                    Inhalte
│  ├─ rules.ts              Regelkatalog mit Erläuterungen und Beispielen
│  └─ tasks/                Aufgaben, eine Datei je Regelgruppe
│     ├─ e-ereignisse.ts
│     ├─ f-funktionen.ts
│     ├─ k-konnektoren.ts
│     ├─ m-modell.ts
│     ├─ p-prozessschnittstellen.ts
│     ├─ prompts.ts         Aufgabentexte, die mehrfach vorkommen
│     └─ index.ts           fügt alle Gruppen zusammen
├─ epk/                     alles rund um das Diagramm
│  ├─ EpkDiagram.tsx        Zeichnen als SVG
│  ├─ geometry.ts           Maße und Kantenführung
│  ├─ build.ts              Kurzschreibweise für Diagramme in den Daten
│  ├─ validate.ts           Regelprüfer
│  ├─ compare.ts            vergleicht zwei Modelle unabhängig vom Layout
│  ├─ edit.ts               Bearbeitungsschritte des Modellier-Editors
│  └─ layoutProblems.ts     Datenprüfung für die Tests
├─ tasks/                   Darstellung der Aufgaben, eine Datei je Aufgabentyp
│  ├─ TaskView.tsx          wählt die Ansicht zum Aufgabentyp
│  ├─ McView.tsx … ModelView.tsx
│  ├─ Feedback.tsx          Rückmeldung nach dem Prüfen
│  └─ Option.tsx, Palette.tsx, useDrag.ts   gemeinsam genutzte Bausteine
├─ pages/                   Startseite, Regelkatalog, Lern- und Testmodus
├─ lib/                     Auswertung, Fortschritt (localStorage), Navigation
└─ styles/                  Stylesheets je Bereich, zusammengeführt in index.css
```

Tests liegen als `*.test.ts` neben dem, was sie prüfen.

## Neue Aufgabe anlegen

Aufgaben sind reine Daten in `src/data/tasks/`, in der Datei ihrer Regelgruppe. Die ID folgt dem
Muster `<gruppe>-<typ>-<nummer>`, zum Beispiel `f-tf-3`. Ein Diagramm besteht aus Knoten auf einem
Raster (Spalte, Zeile) und Kanten:

```ts
{
  id: 'f-tf-3',
  type: 'tf',
  group: 'F',
  rules: ['F2'],
  prompt: 'Ist diese EPK regelkonform?',
  epk: epk(
    [
      ev('a', 'Antrag ist gestellt', 0, 0),
      fn('b', 'Antrag prüfen', 0, 1),
      fn('c', 'Antrag ablegen', 0, 2),
      ev('d', 'Antrag ist abgelegt', 0, 3),
    ],
    flow('a>b>c>d'),
  ),
  violates: ['F2'],
  explanation: 'Zwischen den beiden Funktionen fehlt ein Ereignis.',
}
```

`violates` nennt alle Regeln, die das Diagramm verletzt (leer bedeutet regelkonform). `npm test`
vergleicht diese Angabe mit dem Regelprüfer in `src/epk/validate.ts` und meldet Diagramme, die
versehentlich eine weitere Regel verletzen, sowie überlappende Knoten und fehlerhafte Verweise.

Der Regelprüfer erkennt E1 bis E4, F1, F2, K1 bis K3, M1 bis M6 und P7. Die übrigen Regeln
(z. B. Rücksprünge, Benennung von Prozessschnittstellen) lassen sich nicht aus einem einzelnen
Diagramm ableiten und müssen von Hand geprüft werden.

### Diagramm auswählen

Jede Auswahlmöglichkeit bringt ihr Diagramm, die verletzten Regeln und einen Hinweis mit, der nach
dem Prüfen erscheint. Die Reihenfolge wird beim Anzeigen gemischt, die Hinweise dürfen deshalb
nicht auf „EPK A“ oder „EPK B“ verweisen.

```ts
{
  id: 'f-pick-2',
  type: 'pick',
  ...
  choices: [
    { epk: epk(...), violates: [], note: 'Regelkonform: …' },
    { epk: epk(...), violates: ['F1'], note: 'Die Funktion hat zwei ausgehende Kanten (F1).' },
  ],
  correct: 0,
}
```

### Modellieren und Modell korrigieren

Eine Modellieraufgabe besteht aus dem Raster und einer Musterlösung. Deren Ereignisse, Funktionen
und übrige beschriftete Elemente erhält der Lernende zum Platzieren, Konnektoren stehen immer
bereit. Knoten liegen auf ganzen Rasterfeldern.

```ts
{
  id: 'f-model-2',
  type: 'model',
  ...
  grid: { cols: 3, rows: 4 },
  solution: epk(
    [ev('s', 'Antrag ist gestellt', 1, 0), fn('f', 'Antrag prüfen', 1, 1), xor('k', 1, 2), ...],
    flow('s>f>k', 'k>a', 'k>b'),
  ),
}
```

Als richtig gilt jedes Modell, das der Regelprüfer nicht beanstandet und denselben Ablauf wie die
Musterlösung beschreibt. Wo die Elemente liegen, spielt keine Rolle, und mehrere gleichartige
Konnektoren hintereinander zählen wie einer. Der Aufgabentext muss deshalb eindeutig festlegen,
welche Konnektoren gemeint sind („entweder … oder“, „gleichzeitig“).

- `start` gibt ein Modell vor. Bei `type: 'repair'` ist es die fehlerhafte EPK. Elemente, die auch
  in der Musterlösung vorkommen, tragen dort dieselbe ID.
- `distractors` sind zusätzlich angebotene Elemente, die nicht in das Modell gehören.
- Kanten, die nach oben führen, zeichnet der Editor von selbst als Rücksprung außen herum.

## Veröffentlichen auf GitHub Pages

1. Repository auf GitHub anlegen und den Code pushen.
2. Unter *Settings → Pages* als Quelle **GitHub Actions** wählen.
3. Der Workflow in `.github/workflows/deploy.yml` testet, baut und veröffentlicht bei jedem Push
   auf `main`.

Alternativ lässt sich der Inhalt von `dist` auf jeden beliebigen Webspace kopieren.
