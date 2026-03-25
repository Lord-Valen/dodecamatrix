<!--
SPDX-FileCopyrightText: 2026 Lord-Valen

SPDX-License-Identifier: CC0-1.0
-->

## Quick Reference

### Input

Type 12 notes separated by spaces. Optionally prefix with a label
like `P0`, `I3`, `R5`, or `RI7`. Retrograde forms are reversed
automatically.

Use commas to mark cell boundaries. The first cell defines the
interval pattern for all cells.

Example: `P0 C E G#, F A C#, Bb D F#, Eb G B`

### Cell Completion

After entering the first note of a new cell, press <kbd>Tab</kbd>
to complete it using the established pattern.

With 2+ complete cells, add a trailing comma to derive the next
cell from root motion. Press <kbd>Tab</kbd> to accept.

All valid candidate cells are shown below the input. Click any to
insert it. <span class="help-viable">Green</span> candidates
can complete a full 12-tone row.

### Matrix Navigation (Normal Mode)

Press any arrow key to enter normal mode. The focused cell is
shown with a blue outline.

### Cell Editing

Click any cell or press <kbd>Enter</kbd> on the focused cell to
edit its spelling. Right-click for enharmonic alternatives.

Draft edits appear in yellow. Duplicate notes are outlined in
red. Missing notes are shown on the row label.

Tab falls through to the next different duplicate when no
same-note duplicates remain.

**Commit** applies a valid edited row as the new source row.
**Revert** discards all drafts.

### Search

Type notes in the search bar to highlight every matching
sequence across all 48 row forms (P, I, R, RI). Enharmonic
spellings are treated as equivalent (C# matches Db).
Press <kbd>Escape</kbd> to clear.

### History

Full undo/redo history is shown in the left panel. Click any
entry to jump to that state. The current state is highlighted
in green; future (redoable) states are dimmed.

### Settings

**Spelling** controls how notes are named in the matrix:
*Interval* preserves fifths-based letter names,
*Pitch Class* normalizes to sharps/flats,
*Hybrid* mixes both.

**Rows** toggles between P-form rows and I-form rows.
