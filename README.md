<!--
SPDX-FileCopyrightText: 2026 Lord-Valen

SPDX-License-Identifier: CC0-1.0
-->

# Dodecamatrix

A 12-tone serial composition matrix built with React. Enter a tone row, and the app generates the full 12x12 matrix of prime, inversion, retrograde, and retrograde-inversion forms with musically intelligent enharmonic spelling.

## Features

### Dynamic matrix editing

Click any cell to edit its spelling in place. Drafts appear in yellow with real-time conflict detection — duplicate pitch classes are outlined in red, and missing notes are shown on the row label. Tab cycles through duplicates so you can fix conflicts without leaving the keyboard. Commit a valid row with Enter; it becomes the new source row and the entire matrix updates.

### Sequence search

Type a sequence of notes to instantly highlight every occurrence across all 48 row forms (P, I, R, RI). Enharmonic spellings are treated as equivalent (C# matches Db). Use it to find motivic connections, verify combinatorial properties, or trace a pitch sequence through the matrix. Focus the search bar with Ctrl+F.

### Row entry with cell completion

Type 12 notes to set the source row. Use commas to group notes into cells — the first cell defines an interval pattern that auto-completes subsequent cells. All four forms are accepted as input labels (P, I, R, RI); retrogrades are back-calculated automatically.

```
P0 C E G#, F A C#, Bb D F#, Eb G B
```

Press **Tab** to accept a suggestion, or click any candidate from the list below the input. Candidates shown in green can complete a full 12-tone row; others may lead to dead ends.

With 2+ complete cells, root motion between cell starts is extrapolated to predict the next cell.

### Spelling modes

Three strategies for naming notes in the matrix:

- **Interval** — preserves fifths-based letter names across transpositions (C E G# transposes to F A C#, not F A Db)
- **Pitch Class** — normalizes every cell to the source row's note names
- **Hybrid** — respells inversion starting notes from the source row, then builds with intervals

### Transpose

Toggle between P-form rows (prime forms across, inversions down) and I-form rows (inversions across, primes down).

## Development

Requires [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```sh
pnpm install
pnpm dev       # development server
pnpm test      # run tests in watch mode
pnpm lint      # biome lint + format check
pnpm ci        # full pipeline: lint, typecheck, test, build
```

## Architecture

The theory layer (`src/theory/`) is pure functions with no UI dependencies:

- **fifths.ts** — interval arithmetic on the line of fifths, avoiding tonal.js encoding issues with extreme accidentals
- **matrix.ts** — the Matrix class: builds the 12x12 grid, applies spelling modes and overrides
- **row.ts** — row construction, inversion, interval extraction, validation
- **cells.ts** — cell pattern analysis, auto-completion, candidate generation with recursive viability checking
- **search.ts** — sequence search across all 48 row forms

The UI layer (`src/ui/`) renders the matrix and handles input:

- **Grid.tsx** — the 12x12 table with row/column labels and retrograde labels
- **NoteCell.tsx** — individual cell editing and enharmonic context menu
- **RowEntry.tsx** — input parsing, live feedback, cell completion UI
- **SearchInput.tsx** — sequence search input with live highlighting
- **HelpPanel.tsx** / **HistoryPanel.tsx** — collapsible side panels
- **SpellingToggle.tsx** / **TransposeButton.tsx** — settings controls
