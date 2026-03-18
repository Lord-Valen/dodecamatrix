// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import { buildRow, invertRow, rowIntervals } from './row'

// ─── types ────────────────────────────────────────────────────────────────────

export type FormType = 'P' | 'I'

type Index =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
export type RowLabel = `${FormType}${Index}`

export interface CellId {
  form: FormType
  index: number // semitones above P0[0] (0–11) — the Px / Ix label
  position: number // position within the row (0–11)
}

export type SpellingMode =
  | 'interval-invariant'
  | 'pitch-class-invariant'
  | 'hybrid'

export interface Override {
  cell: CellId
  note: string
}

// ─── internal helpers ─────────────────────────────────────────────────────────

function buildSpellingMap(row: string[]): string[] {
  const map: string[] = new Array(12)
  for (const noteName of row) {
    map[Note.get(noteName).chroma] = noteName
  }
  return map
}

function respell(noteName: string, map: string[]): string {
  return map[Note.get(noteName).chroma]
}

function parseLabel(label: RowLabel): { form: FormType; index: number } {
  return { form: label[0] as FormType, index: parseInt(label.slice(1), 10) }
}

// ─── Matrix class ─────────────────────────────────────────────────────────────

/**
 * A 12×12 matrix storing two spelling layers:
 *
 * - **chromas**: the pitch classes (0–11), computed once from interval arithmetic.
 * - **inputSpellings**: every cell spelled using the input row's note names
 *   (the composer's intent). This is the pitch-class-invariant view.
 * - **intervalSpellings**: every cell spelled by tonal's interval arithmetic.
 *   This is the interval-invariant view.
 *
 * The spelling mode selects which layer to read from. The input row's position
 * and P0 always use input-derived spellings regardless of mode. Overrides are
 * applied on top of whichever layer is active.
 */
export class Matrix {
  private readonly inputSpellings: readonly string[]
  private readonly intervalSpellings: readonly string[]
  private readonly hybridSpellings: readonly string[]
  private readonly spellingMode: SpellingMode
  private readonly refChroma: number
  private readonly pLabelToRow: readonly number[]
  private readonly iLabelToRow: readonly number[]
  private readonly overriddenCells: ReadonlyMap<number, string>

  constructor(
    row: string[],
    label: RowLabel,
    spellingMode: SpellingMode,
    overrides: Override[],
  ) {
    if (row.length !== 12)
      throw new Error(`Row must have 12 notes, got ${row.length}`)
    const chromas = new Set<number>()
    for (const note of row) {
      const n = Note.get(note)
      if (n.empty) throw new Error(`Invalid note name: ${note}`)
      if (n.oct !== undefined)
        throw new Error(`Note must not have octave: ${note}`)
      if (chromas.has(n.chroma))
        throw new Error(`Duplicate pitch class: ${note}`)
      chromas.add(n.chroma)
    }

    this.spellingMode = spellingMode

    const { form, index } = parseLabel(label)
    this.refChroma = (Note.get(row[0]).chroma - index + 12) % 12
    // Normalise to a P-form row before building
    const pRow = form === 'I' ? invertRow(row) : row

    const intervals = rowIntervals(pRow)
    const invertedIntervals = intervals.map((iv) => -iv)

    // I0: apply inverted intervals from P0[0] — gives starting notes for P-form rows.
    // When the input label isn't P0/I0, we need to find P0's starting note by
    // transposing down by `index` semitones. We find the note in the computed I0
    // column whose chroma matches.
    let i0: string[]
    if (index === 0) {
      i0 = buildRow(pRow[0], invertedIntervals)
    } else {
      // Find P0's starting note: it's the note in the I0 column whose chroma
      // is `index` semitones below the input row's starting note.
      const p0Chroma = (Note.get(pRow[0]).chroma - index + 12) % 12
      const i0FromInput = buildRow(pRow[0], invertedIntervals)
      const p0Start = i0FromInput.find((n) => Note.get(n).chroma === p0Chroma)!
      i0 = buildRow(p0Start, invertedIntervals)
    }

    // Build all three spelling layers from the same interval-arithmetic cells.
    const inputSpellingMap = buildSpellingMap(row)
    const inputSpellings: string[] = new Array(144)
    const intervalSpellings: string[] = new Array(144)
    const hybridSpellings: string[] = new Array(144)

    // Hybrid layer: respell I0 starting notes, then build rows with intervals.
    const i0Respelled = i0.map((note) => respell(note, inputSpellingMap))

    for (let r = 0; r < 12; r++) {
      const builtRow = buildRow(i0[r], intervals)
      const hybridRow = buildRow(i0Respelled[r], intervals)
      for (let c = 0; c < 12; c++) {
        const k = r * 12 + c
        // P0 is row 0 — use input-derived spellings in both layers
        // so P0 stays stable across modes.
        intervalSpellings[k] =
          r === 0 ? respell(builtRow[c], inputSpellingMap) : builtRow[c]
        inputSpellings[k] = respell(builtRow[c], inputSpellingMap)
        hybridSpellings[k] =
          r === 0 ? respell(hybridRow[c], inputSpellingMap) : hybridRow[c]
      }
    }

    // Build label→row-index lookups from chromas (same in both layers).
    const pLabelToRow: number[] = new Array(12)
    const iLabelToRow: number[] = new Array(12)
    for (let r = 0; r < 12; r++) {
      const pChroma = Note.get(inputSpellings[r * 12]).chroma
      pLabelToRow[(pChroma - this.refChroma + 12) % 12] = r
      const iChroma = Note.get(inputSpellings[r]).chroma
      iLabelToRow[(iChroma - this.refChroma + 12) % 12] = r
    }
    this.pLabelToRow = pLabelToRow
    this.iLabelToRow = iLabelToRow

    // Preserve the input row's exact spellings in all layers.
    if (form === 'P') {
      const r = pLabelToRow[index]
      for (let c = 0; c < 12; c++) {
        inputSpellings[r * 12 + c] = row[c]
        intervalSpellings[r * 12 + c] = row[c]
        hybridSpellings[r * 12 + c] = row[c]
      }
    } else {
      const col = iLabelToRow[index]
      for (let r = 0; r < 12; r++) {
        inputSpellings[r * 12 + col] = row[r]
        intervalSpellings[r * 12 + col] = row[r]
        hybridSpellings[r * 12 + col] = row[r]
      }
    }

    this.inputSpellings = inputSpellings
    this.intervalSpellings = intervalSpellings
    this.hybridSpellings = hybridSpellings

    // Resolve overrides into a sparse map keyed by flat cell index.
    const overriddenCells = new Map<number, string>()
    for (const { cell, note } of overrides) {
      if (cell.form === 'P') {
        const r = pLabelToRow[cell.index]
        overriddenCells.set(r * 12 + cell.position, note)
      } else {
        const r = iLabelToRow[cell.index]
        overriddenCells.set(cell.position * 12 + r, note)
      }
    }
    this.overriddenCells = overriddenCells
  }

  private cellAt(k: number): string {
    const override = this.overriddenCells.get(k)
    if (override !== undefined) return override
    switch (this.spellingMode) {
      case 'interval-invariant':
        return this.intervalSpellings[k]
      case 'pitch-class-invariant':
        return this.inputSpellings[k]
      case 'hybrid':
        return this.hybridSpellings[k]
    }
  }

  /** Get a cell by label and column position, or by positional row and column. */
  getCell(label: RowLabel, col: number): string
  getCell(row: number, col: number): string
  getCell(rowOrLabel: RowLabel | number, col: number): string {
    if (typeof rowOrLabel === 'number') {
      return this.cellAt(rowOrLabel * 12 + col)
    }
    const { form, index } = parseLabel(rowOrLabel)
    if (form === 'P') {
      return this.cellAt(this.pLabelToRow[index] * 12 + col)
    } else {
      return this.cellAt(col * 12 + this.iLabelToRow[index])
    }
  }

  /** Get all 12 notes of a P- or I-form row by label. */
  getRow(label: RowLabel): string[] {
    return Array.from({ length: 12 }, (_, c) => this.getCell(label, c))
  }

  /** RowLabel for positional row `row` — e.g. 'P0', 'P5'. */
  pLabel(row: number): RowLabel {
    const chroma = Note.get(this.cellAt(row * 12)).chroma
    const index = (chroma - this.refChroma + 12) % 12
    return `P${index}` as RowLabel
  }

  /** RowLabel for positional I-form row `row` — e.g. 'I0', 'I3'. */
  iLabel(row: number): RowLabel {
    const chroma = Note.get(this.cellAt(row)).chroma
    const index = (chroma - this.refChroma + 12) % 12
    return `I${index}` as RowLabel
  }
}
