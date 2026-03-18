// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import { describe, expect, it } from 'vitest'
import {
  analyzeNotes,
  cellCompletion,
  remainingChromas,
  validCells,
} from '../cells'

// ─── helpers ────────────────────────────────────────────────────────────────

function chromas(notes: string[]): number[] {
  return notes.map((n) => Note.get(n).chroma)
}

function used(...notes: string[]): Set<number> {
  return analyzeNotes(notes).used
}

/** Recursively check if the remaining chromas can be filled with cells matching the pattern. */
function canCompleteRow(firstCell: string[], usedSet: Set<number>): boolean {
  if (usedSet.size === 12) return true
  const firstChromas = chromas(firstCell)
  const semiPattern = firstChromas
    .slice(1)
    .map((ch, i) => (((ch - firstChromas[i]) % 12) + 12) % 12)
  for (let ch = 0; ch < 12; ch++) {
    if (usedSet.has(ch)) continue
    // Try building a cell
    let cur = ch
    const cell = [cur]
    let ok = true
    for (const s of semiPattern) {
      cur = (cur + s) % 12
      if (usedSet.has(cur)) {
        ok = false
        break
      }
      cell.push(cur)
    }
    if (!ok) continue
    const next = new Set(usedSet)
    for (const c of cell) next.add(c)
    if (canCompleteRow(firstCell, next)) return true
  }
  return false
}

// ─── analyzeNotes ───────────────────────────────────────────────────────────

describe('analyzeNotes', () => {
  it('returns empty used set for no notes', () => {
    const { used, duplicateNotes } = analyzeNotes([])
    expect(used.size).toBe(0)
    expect(duplicateNotes).toEqual([])
  })

  it('tracks used chromas', () => {
    const { used } = analyzeNotes(['C', 'E', 'G'])
    expect([...used]).toEqual(expect.arrayContaining([0, 4, 7]))
    expect(used.size).toBe(3)
  })

  it('detects duplicate chromas with same name', () => {
    const { duplicateNotes } = analyzeNotes(['C', 'E', 'C'])
    expect(duplicateNotes).toEqual(['C/C'])
  })

  it('detects duplicate chromas with different enharmonic names', () => {
    const { duplicateNotes } = analyzeNotes(['E', 'Fb'])
    expect(duplicateNotes).toEqual(['E/Fb'])
  })

  it('detects triple duplicates', () => {
    const { duplicateNotes } = analyzeNotes(['C', 'B#', 'Dbb'])
    expect(duplicateNotes).toEqual(['C/B#/Dbb'])
  })

  it('detects multiple duplicate groups', () => {
    const { duplicateNotes } = analyzeNotes(['C', 'F#', 'C', 'Gb'])
    expect(duplicateNotes).toHaveLength(2)
    expect(duplicateNotes).toContain('C/C')
    expect(duplicateNotes).toContain('F#/Gb')
  })
})

// ─── remainingChromas ───────────────────────────────────────────────────────

describe('remainingChromas', () => {
  it('returns all 12 chroma names when none are used', () => {
    expect(remainingChromas(new Set())).toHaveLength(12)
  })

  it('excludes used chromas', () => {
    const r = remainingChromas(new Set([0, 4, 7]))
    expect(r).not.toContain('C')
    expect(r).not.toContain('E')
    expect(r).toHaveLength(9)
  })

  it('returns empty array when all chromas used', () => {
    expect(
      remainingChromas(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])),
    ).toEqual([])
  })
})

// ─── cellCompletion ─────────────────────────────────────────────────────────

describe('cellCompletion', () => {
  it('returns null for fewer than 2 cells', () => {
    expect(
      cellCompletion([['C', 'E', 'G']], used('C', 'E', 'G'), false),
    ).toBeNull()
  })

  it('returns null for a single-note first cell', () => {
    expect(cellCompletion([['C']], used('C'), false)).toBeNull()
  })

  it('completes a partial trichord cell matching the first cell pattern', () => {
    // First cell: C E G (pattern: +4, +3 in fifths)
    // Second cell partial: B → should complete to B D# F#
    const cells = [['C', 'E', 'G'], ['B']]
    const u = used('C', 'E', 'G', 'B')
    const result = cellCompletion(cells, u, false)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(2) // completing 2 remaining notes
    expect(chromas(result!)).toEqual(chromas(['D#', 'F#']))
  })

  it('completes a partial tetrachord cell', () => {
    // First cell: C D E F (pattern in fifths)
    // Second cell partial: G → complete to G A B C... wait C is used
    // Better: first cell C Db D Eb, second partial: E
    const cells = [['C', 'Db', 'D', 'Eb'], ['E']]
    const u = used('C', 'Db', 'D', 'Eb', 'E')
    const result = cellCompletion(cells, u, false)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(3)
  })

  it('derives next cell from root motion with 2+ complete cells and trailing comma', () => {
    // C E G#, F A C# — root motion C→F = -1 fifth
    // Next start: Bb, cell: Bb D F#
    const cells = [
      ['C', 'E', 'G#'],
      ['F', 'A', 'C#'],
    ]
    const u = used('C', 'E', 'G#', 'F', 'A', 'C#')
    const result = cellCompletion(cells, u, true)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(3)
    expect(chromas(result!)).toEqual(chromas(['Bb', 'D', 'F#']))
  })

  it('returns null when root motion derived cell has chroma conflict', () => {
    // Set up so the derived cell would collide with used chromas
    const cells = [
      ['C', 'E', 'G#'],
      ['F', 'A', 'C#'],
    ]
    // Artificially mark Bb as used
    const u = used('C', 'E', 'G#', 'F', 'A', 'C#', 'Bb')
    expect(cellCompletion(cells, u, true)).toBeNull()
  })

  it('returns null when pattern is inconsistent across cells', () => {
    // Cell 1 pattern ≠ cell 2 pattern
    const cells = [
      ['C', 'E', 'G'],
      ['F', 'A', 'Db'],
    ]
    const u = used('C', 'E', 'G', 'F', 'A', 'Db')
    expect(cellCompletion(cells, u, true)).toBeNull()
  })

  it('returns null with one complete cell and trailing comma (no root motion)', () => {
    const cells = [['C', 'E', 'G']]
    const u = used('C', 'E', 'G')
    expect(cellCompletion(cells, u, true)).toBeNull()
  })

  it('returns null when partial cell is already full', () => {
    const cells = [
      ['C', 'E', 'G'],
      ['B', 'D#', 'F#'],
    ]
    const u = used('C', 'E', 'G', 'B', 'D#', 'F#')
    expect(cellCompletion(cells, u, false)).toBeNull()
  })
})

// ─── validCells ─────────────────────────────────────────────────────────────

describe('validCells', () => {
  it('returns null with no cells', () => {
    expect(validCells([], new Set())).toBeNull()
  })

  it('returns null with a single-note cell', () => {
    expect(validCells([['C']], used('C'))).toBeNull()
  })

  it('finds valid cells after one complete trichord', () => {
    const cells = [['C', 'E', 'G#']]
    const u = used('C', 'E', 'G#')
    const result = validCells(cells, u)
    expect(result).not.toBeNull()
    expect(result!.length).toBeGreaterThan(0)
    // Every candidate cell should have the same semitone pattern as the first
    const firstChromas = chromas(cells[0])
    const semiPattern = firstChromas
      .slice(1)
      .map((ch, i) => (((ch - firstChromas[i]) % 12) + 12) % 12)
    for (const { cell } of result!) {
      const cellChromas = chromas(cell)
      const cellPattern = cellChromas
        .slice(1)
        .map((ch, i) => (((ch - cellChromas[i]) % 12) + 12) % 12)
      expect(cellPattern).toEqual(semiPattern)
    }
  })

  it('all candidate chromas are unused', () => {
    const cells = [['C', 'E', 'G#']]
    const u = used('C', 'E', 'G#')
    const result = validCells(cells, u)!
    for (const { cell } of result) {
      for (const note of cell) {
        expect(u.has(Note.get(note).chroma)).toBe(false)
      }
    }
  })

  it('ranks root-motion-matching cell first with 2+ cells', () => {
    // C E G#, F A C# — root motion = +5 semitones
    // Expected next start chroma: (5 + 5) % 12 = 10 = A#/Bb
    const cells = [
      ['C', 'E', 'G#'],
      ['F', 'A', 'C#'],
    ]
    const u = used('C', 'E', 'G#', 'F', 'A', 'C#')
    const result = validCells(cells, u)!
    expect(result.length).toBeGreaterThan(0)
    expect(Note.get(result[0].cell[0]).chroma).toBe(10) // Bb
  })

  it('spells candidates using interval pattern from first cell', () => {
    // C E G has fifths pattern [+4, +3] (major third + minor third)
    // A candidate starting on C# should be C# E# G#, not C# F G#
    const cells = [['C', 'E', 'G']]
    const u = used('C', 'E', 'G')
    const result = validCells(cells, u)!
    const cSharpCell = result.find((c) => Note.get(c.cell[0]).chroma === 1)
    expect(cSharpCell).toBeDefined()
    expect(cSharpCell!.cell).toEqual(['C#', 'E#', 'G#'])
  })

  it('preserves interval spelling even with double accidentals', () => {
    // Chromatic tetrachord: C C# D D#  — fifths pattern [+7, -5, +7]
    // From G#: G# + 7 = G##, G## + (-5) = A#, A# + 7 = A##
    // This is the interval-correct spelling.
    const cells = [
      ['C', 'C#', 'D', 'D#'],
      ['E', 'F', 'F#', 'G'],
    ]
    const u = used('C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G')
    const result = validCells(cells, u)!
    expect(result).toHaveLength(1)
    expect(result[0].cell).toEqual(['G#', 'G##', 'A#', 'A##'])
  })

  it('returns null when no valid cells exist', () => {
    // Use up 11 chromas — only 1 left, can't form a 3-note cell
    const allButOne = [
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
    ]
    const u = used(...allButOne)
    expect(validCells([['C', 'E', 'G#']], u)).toBeNull()
  })

  it('ranks candidates that leave a valid remaining cell higher', () => {
    // C D F G has pattern [2, 3, 2] semitones
    // After one cell, candidates that allow a valid third cell should rank first
    const cells = [['C', 'D', 'F', 'G']]
    const u = used('C', 'D', 'F', 'G')
    const result = validCells(cells, u)!
    expect(result.length).toBeGreaterThan(1)

    // Verify the first candidate is viable
    expect(result[0].viable).toBe(true)

    // Verify non-viable candidates come after viable ones
    let seenNonCompletable = false
    for (const { viable } of result) {
      if (!viable) seenNonCompletable = true
      if (seenNonCompletable) expect(viable).toBe(false)
    }
  })

  it('viable checks full depth, not just one step ahead', () => {
    // C E G has pattern [4,3] semitones (major triad)
    // D F# A has a valid next cell (one-step viable) but can't
    // complete a full row of 4 trichords — viable should be false.
    const cells = [['C', 'E', 'G']]
    const u = used('C', 'E', 'G')
    const result = validCells(cells, u)!
    for (const { cell, viable } of result) {
      const afterUsed = new Set([...u, ...chromas(cell)])
      expect(viable).toBe(canCompleteRow(cells[0], afterUsed))
    }
  })

  it('returns viable flag for each candidate', () => {
    const cells = [['C', 'D', 'F', 'G']]
    const u = used('C', 'D', 'F', 'G')
    const result = validCells(cells, u)!
    for (const { cell, viable } of result) {
      expect(cell.length).toBeGreaterThan(0)
      expect(typeof viable).toBe('boolean')
    }
    // At least one viable and one non-viable
    expect(result.some((c) => c.viable)).toBe(true)
    expect(result.some((c) => !c.viable)).toBe(true)
  })

  // ─── cell sizes: all factors of 12 > 1 ──────────────────────────────────

  it('finds valid dyad cells (size 2, 6 cells to fill row)', () => {
    // Tritone dyad: C F#, pattern [6] semitones
    const cells = [['C', 'F#']]
    const u = used('C', 'F#')
    const result = validCells(cells, u)
    expect(result).not.toBeNull()
    // 10 unused chromas, each can start a tritone pair
    expect(result!.length).toBe(10)
    for (const { cell } of result!) {
      expect(cell).toHaveLength(2)
      const c = chromas(cell)
      expect((c[1] - c[0] + 12) % 12).toBe(6)
    }
    // All tritone dyads are viable (every partition works)
    expect(result!.every((c) => c.viable)).toBe(true)
  })

  it('dyad viability depends on pattern (fifths, not tritones)', () => {
    // Perfect fifth dyad: C G, pattern [7] semitones
    const cells = [['C', 'G']]
    const u = used('C', 'G')
    const result = validCells(cells, u)
    expect(result).not.toBeNull()
    for (const { cell } of result!) {
      expect(cell).toHaveLength(2)
      const c = chromas(cell)
      expect((c[1] - c[0] + 12) % 12).toBe(7)
    }
    // Not all fifth-dyads can complete a row — some are non-viable
    expect(result!.some((c) => c.viable)).toBe(true)
    expect(result!.some((c) => !c.viable)).toBe(true)
  })

  it('finds valid hexachord cells (size 6, 2 cells to fill row)', () => {
    // Whole-tone hexachord: C D E F# G# A#, pattern [2,2,2,2,2] semitones
    const cells = [['C', 'D', 'E', 'F#', 'G#', 'A#']]
    const u = used('C', 'D', 'E', 'F#', 'G#', 'A#')
    const result = validCells(cells, u)
    expect(result).not.toBeNull()
    // 6 unused chromas, each can start the complementary whole-tone hexachord
    expect(result!).toHaveLength(6)
    for (const { cell, viable } of result!) {
      expect(cell).toHaveLength(6)
      expect(viable).toBe(true)
      const c = chromas(cell)
      for (let i = 1; i < c.length; i++) {
        expect((c[i] - c[i - 1] + 12) % 12).toBe(2)
      }
    }
  })

  it('returns null when cells have inconsistent sizes', () => {
    // Trichord followed by tetrachord — irregular partitioning
    const cells = [
      ['C', 'E', 'G'],
      ['F', 'A', 'C#', 'Bb'],
    ]
    const u = used('C', 'E', 'G', 'F', 'A', 'C#', 'Bb')
    expect(validCells(cells, u)).toBeNull()
  })

  it('handles different enharmonic spellings in input cells', () => {
    // Db instead of C# — semitone pattern should still work
    const cells = [['C', 'Db', 'D']]
    const u = used('C', 'Db', 'D')
    const result = validCells(cells, u)
    expect(result).not.toBeNull()
    // Pattern is [1, 1] semitones — chromatic trichord
    for (const { cell } of result!) {
      const cellChromas = chromas(cell)
      expect((cellChromas[1] - cellChromas[0] + 12) % 12).toBe(1)
      expect((cellChromas[2] - cellChromas[1] + 12) % 12).toBe(1)
    }
  })
})
