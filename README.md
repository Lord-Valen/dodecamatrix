<!--
SPDX-FileCopyrightText: 2026 Lord-Valen

SPDX-License-Identifier: CC0-1.0
-->

# Dodecamatrix

A 12-tone serial composition matrix built with React. Enter a tone row, and the app generates the full 12x12 matrix of prime, inversion, retrograde, and retrograde-inversion forms with musically intelligent enharmonic spelling.

## Features

### Row entry with cell completion

Type 12 notes to set the source row. Use commas to group notes into cells — the first cell defines an interval pattern that auto-completes subsequent cells.

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

### Matrix editing

Click any cell to retype it. Right-click for a menu of enharmonic alternatives. Edits appear as yellow drafts; conflicting chromas are outlined in red. **Commit** applies a valid edited row as the new source. **Revert** discards drafts. **Undo** restores the previous source row.

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

The UI layer (`src/ui/`) renders the matrix and handles input:

- **Grid.tsx** — the 12x12 table with row/column labels and retrograde labels
- **NoteCell.tsx** — individual cell editing and enharmonic context menu
- **RowEntry.tsx** — input parsing, live feedback, cell completion UI
- **HelpPanel.tsx** — collapsible reference sidebar
- **SpellingToggle.tsx** / **TransposeButton.tsx** — settings controls
