// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import { describe, expect, it } from 'vitest'
import { Matrix } from '../matrix'
import { buildRow, invertRow, rowIntervals } from '../row'
import { chromaFingerprint, generateRow } from './helpers'

const SCHOENBERG_P0 = [
  'E',
  'F',
  'G',
  'Db',
  'Gb',
  'Eb',
  'Ab',
  'D',
  'B',
  'C',
  'A',
  'Bb',
]
const SEEDS = Array.from({ length: 20 }, (_, i) => i)

describe('rowIntervals', () => {
  it('produces 11 intervals for a 12-note row', () => {
    expect(rowIntervals(SCHOENBERG_P0)).toHaveLength(11)
  })

  it('each interval represents the correct fifths distance', () => {
    const intervals = rowIntervals(SCHOENBERG_P0)
    for (let i = 0; i < intervals.length; i++) {
      // Fifths difference should match the two notes' coords
      const fromCoord = Note.get(SCHOENBERG_P0[i]).coord[0]
      const toCoord = Note.get(SCHOENBERG_P0[i + 1]).coord[0]
      expect(
        intervals[i],
        `interval ${i}: ${SCHOENBERG_P0[i]}→${SCHOENBERG_P0[i + 1]}`,
      ).toBe(toCoord - fromCoord)
    }
  })
})

describe('buildRow', () => {
  it('returns intervals.length + 1 notes', () => {
    const intervals = rowIntervals(SCHOENBERG_P0)
    expect(buildRow('E', intervals)).toHaveLength(12)
  })

  it('first note is the start note', () => {
    const intervals = rowIntervals(SCHOENBERG_P0)
    expect(buildRow('E', intervals)[0]).toBe('E')
  })

  it('produces correct chromas from known intervals', () => {
    const intervals = rowIntervals(SCHOENBERG_P0)
    const rebuilt = buildRow('E', intervals)
    const expected = SCHOENBERG_P0.map((n) => Note.get(n).chroma)
    expect(rebuilt.map((n) => Note.get(n).chroma)).toEqual(expected)
  })

  it('round-trips with rowIntervals', () => {
    const intervals = rowIntervals(SCHOENBERG_P0)
    const rebuilt = buildRow(SCHOENBERG_P0[0], intervals)
    expect(rebuilt.map((n) => Note.get(n).chroma)).toEqual(
      SCHOENBERG_P0.map((n) => Note.get(n).chroma),
    )
  })

  it('round-trips with exotic spellings', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const intervals = rowIntervals(row)
      const rebuilt = buildRow(row[0], intervals)
      expect(rebuilt, `seed=${seed} row=[${row.join(' ')}]`).toEqual(row)
    }
  })
})

describe('invertRow', () => {
  it('preserves all 12 unique chromas', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const inverted = invertRow(row)
      const chromas = new Set(inverted.map((n) => Note.get(n).chroma))
      expect(chromas.size, `seed=${seed} row=[${row.join(' ')}]`).toBe(12)
    }
  })

  it('is its own inverse (double inversion returns original chromas)', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const doubleInverted = invertRow(invertRow(row))
      expect(
        doubleInverted.map((n) => Note.get(n).chroma),
        `seed=${seed} row=[${row.join(' ')}]`,
      ).toEqual(row.map((n) => Note.get(n).chroma))
    }
  })

  for (let j = 0; j < 12; j++) {
    it(`reconstructs Schoenberg matrix from I-form ${j} via invertRow`, () => {
      const original = new Matrix(SCHOENBERG_P0, 'P0', 'interval-invariant', [])
      const originalFP = chromaFingerprint(original)
      const pRow = invertRow(original.getRow(original.iLabel(j)))
      const rebuilt = new Matrix(pRow, 'P0', 'interval-invariant', [])
      expect(chromaFingerprint(rebuilt)).toEqual(originalFP)
    })
  }
})
