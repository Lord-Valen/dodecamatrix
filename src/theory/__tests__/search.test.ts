// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { Matrix } from '../matrix'
import { matchToCellKeys, searchSequence } from '../search'

const CHROMATIC = [
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

function matrix(row: string[] = CHROMATIC) {
  return new Matrix(row, 'P0', 'interval-invariant', [])
}

describe('searchSequence', () => {
  it('returns empty array when sequence is empty', () => {
    expect(searchSequence(matrix(), [])).toEqual([])
  })

  it('finds a single note in all forms that contain it', () => {
    const results = searchSequence(matrix(), ['C'])
    // C (chroma 0) appears once per form, across P, I, R, RI — 48 matches
    expect(results).toHaveLength(48)
  })

  it('finds the start of P0 in the chromatic matrix', () => {
    const results = searchSequence(matrix(), ['C', 'C#', 'D'])
    const p0Match = results.find(
      (r) => r.form === 'P' && r.index === 0 && r.position === 0,
    )
    expect(p0Match).toBeDefined()
    expect(p0Match!.length).toBe(3)
  })

  it('finds a sequence at the end of a row', () => {
    const results = searchSequence(matrix(), ['A', 'A#', 'B'])
    const p0Match = results.find(
      (r) => r.form === 'P' && r.index === 0 && r.position === 9,
    )
    expect(p0Match).toBeDefined()
  })

  it('finds retrograde matches', () => {
    // In the chromatic matrix, R0 is B A# A G# ... C
    // So searching for B A# A should match R0 at position 0
    const results = searchSequence(matrix(), ['B', 'A#', 'A'])
    const r0Match = results.find(
      (r) => r.form === 'R' && r.index === 0 && r.position === 0,
    )
    expect(r0Match).toBeDefined()
  })

  it('matches by chroma, not spelling', () => {
    // Db has the same chroma as C#
    const results = searchSequence(matrix(), ['C', 'Db', 'D'])
    const p0Match = results.find(
      (r) => r.form === 'P' && r.index === 0 && r.position === 0,
    )
    expect(p0Match).toBeDefined()
  })

  it('returns no matches for a sequence not in the matrix', () => {
    // C C C — repeated chroma can't appear consecutively in a 12-tone row
    const results = searchSequence(matrix(), ['C', 'C'])
    expect(results).toEqual([])
  })

  it('finds a full 12-note row', () => {
    const results = searchSequence(matrix(), CHROMATIC)
    const p0Match = results.find(
      (r) => r.form === 'P' && r.index === 0 && r.position === 0,
    )
    expect(p0Match).toBeDefined()
    expect(p0Match!.length).toBe(12)
  })
})

describe('matchToCellKeys', () => {
  it('maps a P-form match to the correct grid cells', () => {
    // P0 in the chromatic matrix is positional row 0
    const m = matrix()
    const matches = searchSequence(m, ['C', 'C#', 'D'])
    const p0Match = matches.filter(
      (r) => r.form === 'P' && r.index === 0 && r.position === 0,
    )
    const keys = matchToCellKeys(m, p0Match)
    // Row 0, cols 0,1,2
    expect(keys).toEqual(new Set([0, 1, 2]))
  })

  it('maps an R-form match to reversed grid positions', () => {
    // R0 match at position 0 (B A# A) → P0 row, cols 11,10,9
    const m = matrix()
    const matches = searchSequence(m, ['B', 'A#', 'A'])
    const r0Match = matches.filter(
      (r) => r.form === 'R' && r.index === 0 && r.position === 0,
    )
    const keys = matchToCellKeys(m, r0Match)
    expect(keys).toEqual(new Set([11, 10, 9]))
  })

  it('maps an I-form match to the correct grid cells', () => {
    const m = matrix()
    // I0 starts at chroma 0 (C) and goes down in the column
    const i0Row = m.getRow('I0')
    const seq = i0Row.slice(0, 3)
    const matches = searchSequence(m, seq)
    const i0Match = matches.filter(
      (r) => r.form === 'I' && r.index === 0 && r.position === 0,
    )
    const keys = matchToCellKeys(m, i0Match)
    // I0 is positional column 0, rows 0,1,2
    expect(keys).toEqual(new Set([0 * 12 + 0, 1 * 12 + 0, 2 * 12 + 0]))
  })
})
