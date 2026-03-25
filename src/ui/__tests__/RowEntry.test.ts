// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { parseInput } from '../RowEntry'

const CHROMATIC_P0 = 'C C# D D# E F F# G G# A A# B'
const CHROMATIC_REVERSED = 'B A# A G# G F# F E D# D C# C'

describe('parseInput R/RI labels', () => {
  it('accepts an R label and reverses the notes to produce a P label', () => {
    const result = parseInput(`R0 ${CHROMATIC_REVERSED}`)
    expect(result).not.toHaveProperty('error')
    if (!('error' in result)) {
      expect(result.label).toBe('P0')
      expect(result.row).toEqual(CHROMATIC_P0.split(' '))
    }
  })

  it('accepts R with a non-zero index', () => {
    const result = parseInput(`R5 ${CHROMATIC_REVERSED}`)
    expect(result).not.toHaveProperty('error')
    if (!('error' in result)) {
      expect(result.label).toBe('P5')
      expect(result.row).toEqual(CHROMATIC_P0.split(' '))
    }
  })

  it('accepts an RI label and reverses the notes to produce an I label', () => {
    const result = parseInput(`RI0 ${CHROMATIC_REVERSED}`)
    expect(result).not.toHaveProperty('error')
    if (!('error' in result)) {
      expect(result.label).toBe('I0')
      expect(result.row).toEqual(CHROMATIC_P0.split(' '))
    }
  })

  it('accepts RI with a non-zero index', () => {
    const result = parseInput(`RI7 ${CHROMATIC_REVERSED}`)
    expect(result).not.toHaveProperty('error')
    if (!('error' in result)) {
      expect(result.label).toBe('I7')
      expect(result.row).toEqual(CHROMATIC_P0.split(' '))
    }
  })

  it('rejects R/RI with index out of range', () => {
    const result = parseInput(`R13 ${CHROMATIC_P0}`)
    expect(result).toHaveProperty('error')
  })

  it('still accepts P and I labels as before', () => {
    const pResult = parseInput(`P0 ${CHROMATIC_P0}`)
    expect(pResult).not.toHaveProperty('error')
    if (!('error' in pResult)) {
      expect(pResult.label).toBe('P0')
    }

    const iResult = parseInput(`I3 ${CHROMATIC_P0}`)
    expect(iResult).not.toHaveProperty('error')
    if (!('error' in iResult)) {
      expect(iResult.label).toBe('I3')
    }
  })
})
