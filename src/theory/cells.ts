// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import { interval, transpose } from './fifths'

const ALL_CHROMAS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
const CHROMA_NAMES = [
  'C',
  'C#/Db',
  'D',
  'D#/Eb',
  'E',
  'F',
  'F#/Gb',
  'G',
  'G#/Ab',
  'A',
  'A#/Bb',
  'B',
]
const SHARP_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]

/** Extract the chromas used so far and any duplicate note names. */
export function analyzeNotes(notes: string[]): {
  used: Set<number>
  duplicateNotes: string[]
} {
  const used = new Set<number>()
  const chromaToNotes = new Map<number, string[]>()
  for (const note of notes) {
    const ch = Note.get(note).chroma
    used.add(ch)
    const names = chromaToNotes.get(ch) ?? []
    names.push(note)
    chromaToNotes.set(ch, names)
  }
  const duplicateNotes: string[] = []
  for (const names of chromaToNotes.values()) {
    if (names.length > 1) {
      duplicateNotes.push(names.join('/'))
    }
  }
  return { used, duplicateNotes }
}

/** List chroma names not yet used. */
export function remainingChromas(used: Set<number>): string[] {
  const r: string[] = []
  for (const ch of ALL_CHROMAS) {
    if (!used.has(ch)) r.push(CHROMA_NAMES[ch])
  }
  return r
}

/**
 * Try to auto-complete the current (last) cell from the pattern defined
 * by the first cell.  Cells are comma-delimited by the user.
 *
 * - The first cell defines the interval pattern (in fifths coordinates).
 * - All intermediate cells must match that pattern.
 * - If the last cell is incomplete, suggests notes to complete it.
 * - If there's a trailing comma and 2+ complete cells, derives the next
 *   cell's starting note from root motion.
 * - Only suggests if all resulting chromas are unused.
 */
export function cellCompletion(
  cells: string[][],
  used: Set<number>,
  trailingComma: boolean,
): string[] | null {
  const firstCell = cells[0]
  if (!firstCell || firstCell.length < 2) return null

  const pattern = firstCell.slice(1).map((n, i) => interval(firstCell[i], n))

  // All complete cells (everything except a potential partial last cell)
  const completeCells = trailingComma ? cells : cells.slice(0, -1)
  const partialCell = trailingComma ? [] : (cells[cells.length - 1] ?? [])

  // Need at least the first cell complete
  if (completeCells.length < 1) return null

  // Verify pattern consistency across all complete cells
  for (let c = 0; c < completeCells.length; c++) {
    if (completeCells[c].length !== firstCell.length) return null
    if (c === 0) continue // first cell defines the pattern
    for (let i = 0; i < pattern.length; i++) {
      if (interval(completeCells[c][i], completeCells[c][i + 1]) !== pattern[i])
        return null
    }
  }

  // If the partial cell is already full, nothing to suggest
  if (partialCell.length >= firstCell.length) return null

  // Determine the starting note for the cell being completed
  let startNote: string | null = null

  if (partialCell.length > 0) {
    // User already entered some notes in this cell — start from the last one
    startNote = partialCell[partialCell.length - 1]
  } else if (completeCells.length >= 2) {
    // Derive starting note from root motion between cell starts
    const rootMotion = interval(completeCells[0][0], completeCells[1][0])
    // Verify root motion is consistent across all consecutive cell pairs
    for (let c = 1; c < completeCells.length - 1; c++) {
      if (interval(completeCells[c][0], completeCells[c + 1][0]) !== rootMotion)
        return null
    }
    startNote = transpose(
      completeCells[completeCells.length - 1][0],
      rootMotion,
    )
  } else {
    return null // only one complete cell and no partial — can't derive next start
  }

  // Build the completion
  const completion: string[] = []
  const patternStart = partialCell.length > 0 ? partialCell.length - 1 : 0
  let current = startNote

  // If partial cell is empty, include the derived start note
  if (partialCell.length === 0) {
    const ch = Note.get(current).chroma
    if (used.has(ch)) return null
    completion.push(current)
  }

  for (let i = patternStart; i < pattern.length; i++) {
    const next = transpose(current, pattern[i])
    const ch = Note.get(next).chroma
    if (used.has(ch)) return null
    completion.push(next)
    current = next
  }

  return completion.length > 0 ? completion : null
}

/** Try to build a full cell from a starting chroma using a semitone pattern. */
function tryBuildCell(
  startChroma: number,
  semiPattern: number[],
  used: Set<number>,
): number[] | null {
  const cell = [startChroma]
  let ch = startChroma
  for (const semi of semiPattern) {
    ch = (ch + semi + 12) % 12
    if (used.has(ch)) return null
    cell.push(ch)
  }
  return cell
}

/** Spell a cell by applying fifths intervals from a starting note. */
function spellCell(start: string, fifthsPattern: number[]): string[] {
  const cell = [start]
  let current = start
  for (const iv of fifthsPattern) {
    current = transpose(current, iv)
    cell.push(current)
  }
  return cell
}

/** Check whether the remaining chromas can be completely filled with cells matching the pattern. */
function isViable(semiPattern: number[], used: Set<number>): boolean {
  const stack: Set<number>[] = [used]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (current.size === 12) return true
    for (let ch = 0; ch < 12; ch++) {
      if (current.has(ch)) continue
      const cell = tryBuildCell(ch, semiPattern, current)
      if (!cell) continue
      const next = new Set(current)
      for (const c of cell) next.add(c)
      stack.push(next)
    }
  }
  return false
}

/**
 * Find all valid complete cells that could come next, ordered by likelihood.
 *
 * Uses semitone intervals for pattern matching and candidate generation,
 * since we're choosing spellings ourselves (via CHROMA_NAMES).
 *
 * If 2+ complete cells exist, the cell matching the established root motion
 * is ranked first. Remaining cells are sorted by absolute semitone distance
 * from the last cell's starting note (closer = more likely).
 */
export interface CellCandidate {
  cell: string[]
  viable: boolean
}

export function validCells(
  cells: string[][],
  used: Set<number>,
): CellCandidate[] | null {
  if (cells.length < 1) return null
  const firstCell = cells[0]
  if (firstCell.length < 2) return null

  // All cells must have the same size
  if (cells.some((c) => c.length !== firstCell.length)) return null

  // Semitone interval pattern (for chroma-level validity)
  const chromas = firstCell.map((n) => Note.get(n).chroma)
  const semiPattern = chromas
    .slice(1)
    .map((ch, i) => (((ch - chromas[i]) % 12) + 12) % 12)

  // Fifths interval pattern (for spelling)
  const fifthsPattern = firstCell
    .slice(1)
    .map((n, i) => interval(firstCell[i], n))

  const lastStartChroma = Note.get(cells[cells.length - 1][0]).chroma

  // Try every unused chroma as a starting note
  const candidates: { cell: string[]; dist: number; viable: boolean }[] = []
  for (const ch of ALL_CHROMAS) {
    if (used.has(ch)) continue
    const cellChromas = tryBuildCell(ch, semiPattern, used)
    if (cellChromas) {
      const cell = spellCell(SHARP_NAMES[ch], fifthsPattern)
      const dist = Math.min(
        (((ch - lastStartChroma) % 12) + 12) % 12,
        (((lastStartChroma - ch) % 12) + 12) % 12,
      )
      const afterUsed = new Set(used)
      for (const c of cellChromas) afterUsed.add(c)
      const viable = isViable(semiPattern, afterUsed)
      candidates.push({ cell, dist, viable })
    }
  }

  if (candidates.length === 0) return null

  // If we can derive root motion, put the matching cell first
  let rootMotionChroma: number | null = null
  if (cells.length >= 2) {
    const startChromas = cells.map((c) => Note.get(c[0]).chroma)
    const motion = (((startChromas[1] - startChromas[0]) % 12) + 12) % 12
    let consistent = true
    for (let c = 1; c < startChromas.length - 1; c++) {
      if (
        (((startChromas[c + 1] - startChromas[c]) % 12) + 12) % 12 !==
        motion
      ) {
        consistent = false
        break
      }
    }
    if (consistent) {
      rootMotionChroma = (lastStartChroma + motion) % 12
    }
  }

  candidates.sort((a, b) => {
    // Completable candidates first
    const aComp = a.viable ? 1 : 0
    const bComp = b.viable ? 1 : 0
    if (aComp !== bComp) return bComp - aComp
    // Then root motion match
    const aMatch =
      rootMotionChroma !== null &&
      Note.get(a.cell[0]).chroma === rootMotionChroma
    const bMatch =
      rootMotionChroma !== null &&
      Note.get(b.cell[0]).chroma === rootMotionChroma
    if (aMatch !== bMatch) return aMatch ? -1 : 1
    return a.dist - b.dist
  })

  return candidates.map(({ cell, viable }) => ({ cell, viable }))
}
