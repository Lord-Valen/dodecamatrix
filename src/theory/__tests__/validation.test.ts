// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { MatrixStateSchema, parseMatrixFile } from '../validation'

const VALID_ROW = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
]

const VALID_FILE = {
  version: 1,
  row: VALID_ROW,
  spellingMode: 'interval-invariant',
  overrides: [],
}

describe('MatrixStateSchema', () => {
  it('rejects note with octave', () => {
    const withOctave = ['C4', ...VALID_ROW.slice(1)]
    expect(
      MatrixStateSchema.safeParse({ ...VALID_FILE, row: withOctave }).success,
    ).toBe(false)
  })

  it('rejects invalid note name', () => {
    const invalid = ['X', ...VALID_ROW.slice(1)]
    expect(
      MatrixStateSchema.safeParse({ ...VALID_FILE, row: invalid }).success,
    ).toBe(false)
  })

  it('rejects row with duplicate pitch classes', () => {
    const duped = [...VALID_ROW.slice(0, 11), 'C']
    expect(
      MatrixStateSchema.safeParse({ ...VALID_FILE, row: duped }).success,
    ).toBe(false)
  })
})

describe('parseMatrixFile', () => {
  it('returns ok: true with state for valid input', () => {
    const result = parseMatrixFile(VALID_FILE)
    expect(result).toEqual({
      ok: true,
      state: {
        row: VALID_ROW,
        spellingMode: 'interval-invariant',
        overrides: [],
      },
    })
  })

  it('returns ok: false with error string for invalid input', () => {
    const result = parseMatrixFile({ version: 99 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(typeof result.error).toBe('string')
    }
  })
})
