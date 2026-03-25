// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import type { Matrix, RowLabel } from './matrix'

export interface SearchMatch {
  form: 'P' | 'I' | 'R' | 'RI'
  index: number
  position: number // start position within the (possibly reversed) row
  length: number
}

/**
 * Search all 48 row forms (P, I, R, RI × 12 indices) for contiguous
 * subsequences matching the given notes by chroma.
 */
export function searchSequence(matrix: Matrix, notes: string[]): SearchMatch[] {
  if (notes.length === 0) return []

  const targetChromas = notes.map((n) => Note.get(n).chroma)
  const matches: SearchMatch[] = []

  for (let i = 0; i < 12; i++) {
    const pLabel = matrix.pLabel(i)
    const iLabel = matrix.iLabel(i)
    const pRow = matrix.getRow(pLabel)
    const iRow = matrix.getRow(iLabel)

    const pIndex = parseInt(pLabel.slice(1), 10)
    const iIndex = parseInt(iLabel.slice(1), 10)

    findIn(pRow, targetChromas, 'P', pIndex, matches)
    findIn(iRow, targetChromas, 'I', iIndex, matches)
    findIn([...pRow].reverse(), targetChromas, 'R', pIndex, matches)
    findIn([...iRow].reverse(), targetChromas, 'RI', iIndex, matches)
  }

  return matches
}

/**
 * Convert search matches to a set of flat cell keys (matrixRow * 12 + matrixCol)
 * for highlighting in the grid.
 */
export function matchToCellKeys(
  matrix: Matrix,
  matches: SearchMatch[],
): Set<number> {
  const keys = new Set<number>()

  for (const match of matches) {
    const label =
      `${match.form === 'R' ? 'P' : match.form === 'RI' ? 'I' : match.form}${match.index}` as RowLabel
    const isRetrograde = match.form === 'R' || match.form === 'RI'

    for (let j = 0; j < match.length; j++) {
      const pos = isRetrograde ? 11 - (match.position + j) : match.position + j

      if (match.form === 'P' || match.form === 'R') {
        // P/R: find positional row for this P label
        for (let r = 0; r < 12; r++) {
          if (matrix.pLabel(r) === label) {
            keys.add(r * 12 + pos)
            break
          }
        }
      } else {
        // I/RI: find positional column for this I label
        for (let c = 0; c < 12; c++) {
          if (matrix.iLabel(c) === label) {
            keys.add(pos * 12 + c)
            break
          }
        }
      }
    }
  }

  return keys
}

function findIn(
  row: string[],
  targetChromas: number[],
  form: SearchMatch['form'],
  index: number,
  matches: SearchMatch[],
) {
  const len = targetChromas.length
  for (let pos = 0; pos <= 12 - len; pos++) {
    let match = true
    for (let j = 0; j < len; j++) {
      if (Note.get(row[pos + j]).chroma !== targetChromas[j]) {
        match = false
        break
      }
    }
    if (match) {
      matches.push({ form, index, position: pos, length: len })
    }
  }
}
