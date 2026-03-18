// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import { describe, expect, it } from 'vitest'
import type { RowLabel } from '../matrix'
import { Matrix } from '../matrix'
import { chromaFingerprint, generateRow } from './helpers'

// Schoenberg Op. 25 Piano Suite — a well-known 12-tone row
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
const SCHOENBERG_I0_CHROMAS = [4, 3, 1, 7, 2, 5, 0, 6, 9, 8, 11, 10]
const SCHOENBERG_P1_CHROMAS = [5, 6, 8, 2, 7, 4, 9, 3, 0, 1, 10, 11]

// Ascending chromatic scale from C — analytically exact matrix:
// getCell(r, c) chroma === (c - r + 12) % 12
const CHROMATIC_C = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
]

const SEEDS = Array.from({ length: 20 }, (_, i) => i)
const LABELS: RowLabel[] = Array.from(
  { length: 12 },
  (_, i) => `P${i}` as RowLabel,
)

/** Format context for seed-based test failures. */
function ctx(seed: number, row: string[], extra?: string): string {
  return `seed=${seed} row=[${row.join(' ')}]${extra ? ` ${extra}` : ''}`
}

// ─── getRow ───────────────────────────────────────────────────────────────────

describe('getRow', () => {
  it('P0 row matches input chromas', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const actual = matrix.getRow('P0').map((n) => Note.get(n).chroma)
      const expected = row.map((n) => Note.get(n).chroma)
      expect(actual, ctx(seed, row)).toEqual(expected)
    }
  })

  it('every P-form row contains all 12 pitch classes', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      for (let i = 0; i < 12; i++) {
        const label = `P${i}` as RowLabel
        const pcs = new Set(matrix.getRow(label).map((n) => Note.get(n).chroma))
        expect(pcs.size, ctx(seed, row, label)).toBe(12)
      }
    }
  })

  it('every I-form row contains all 12 pitch classes', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      for (let i = 0; i < 12; i++) {
        const label = `I${i}` as RowLabel
        const pcs = new Set(matrix.getRow(label).map((n) => Note.get(n).chroma))
        expect(pcs.size, ctx(seed, row, label)).toBe(12)
      }
    }
  })

  it('I-forms are the transpose of P-forms', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const pLabel = matrix.pLabel(r)
          const iLabel = matrix.iLabel(c)
          expect(
            Note.get(matrix.getCell(pLabel, c)).chroma,
            ctx(seed, row, `${pLabel}[${c}] vs ${iLabel}[${r}]`),
          ).toBe(Note.get(matrix.getCell(iLabel, r)).chroma)
        }
      }
    }
  })
})

// ─── pLabel / iLabel ──────────────────────────────────────────────────────────

describe('pLabel / iLabel', () => {
  it('pLabel returns correct RowLabel for each positional row', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const refChroma = Note.get(row[0]).chroma
      for (let r = 0; r < 12; r++) {
        const chroma = Note.get(matrix.getCell(r, 0)).chroma
        expect(matrix.pLabel(r), ctx(seed, row, `row=${r}`)).toBe(
          `P${(chroma - refChroma + 12) % 12}`,
        )
      }
    }
  })

  it('iLabel returns correct RowLabel for each positional column', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const refChroma = Note.get(row[0]).chroma
      for (let r = 0; r < 12; r++) {
        const chroma = Note.get(matrix.getCell(0, r)).chroma
        expect(matrix.iLabel(r), ctx(seed, row, `col=${r}`)).toBe(
          `I${(chroma - refChroma + 12) % 12}`,
        )
      }
    }
  })

  it('pLabel(0) is always P0', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      expect(matrix.pLabel(0), ctx(seed, row)).toBe('P0')
    }
  })

  it('iLabel(0) is always I0', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      expect(matrix.iLabel(0), ctx(seed, row)).toBe('I0')
    }
  })

  it('all 12 P-form labels are distinct', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const labels = new Set(
        Array.from({ length: 12 }, (_, r) => matrix.pLabel(r)),
      )
      expect(labels.size, ctx(seed, row)).toBe(12)
    }
  })

  it('all 12 I-form labels are distinct', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const labels = new Set(
        Array.from({ length: 12 }, (_, r) => matrix.iLabel(r)),
      )
      expect(labels.size, ctx(seed, row)).toBe(12)
    }
  })
})

// ─── interval invariance ──────────────────────────────────────────────────────

describe('interval invariance', () => {
  it('all P-forms share the same shortest-path interval sequence', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const refChromas = row.map((n) => Note.get(n).chroma)
      const refDiffs = refChromas.slice(1).map((c, i) => {
        const asc = (c - refChromas[i] + 12) % 12
        return asc <= 6 ? asc : 12 - asc
      })
      for (const label of LABELS) {
        const rc = matrix.getRow(label).map((n) => Note.get(n).chroma)
        const diffs = rc.slice(1).map((c, j) => {
          const asc = (c - rc[j] + 12) % 12
          return asc <= 6 ? asc : 12 - asc
        })
        expect(diffs, ctx(seed, row, label)).toEqual(refDiffs)
      }
    }
  })
})

// ─── overrides ────────────────────────────────────────────────────────────────

describe('overrides', () => {
  it('applies a P-form override to the correct cell', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const overridden = new Matrix(row, 'P0', 'interval-invariant', [
        { cell: { form: 'P', index: 0, position: 3 }, note: 'C##' },
      ])
      expect(overridden.getCell('P0', 3), ctx(seed, row)).toBe('C##')
    }
  })

  it('applies an I-form override to the correct cell', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const overridden = new Matrix(row, 'P0', 'interval-invariant', [
        { cell: { form: 'I', index: 0, position: 3 }, note: 'Ebb' },
      ])
      expect(overridden.getCell('I0', 3), ctx(seed, row)).toBe('Ebb')
    }
  })
})

// ─── reconstruction ───────────────────────────────────────────────────────────

describe('reconstruction from any P-form', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: any P-form reconstructs the same matrix`, () => {
      const row = generateRow(seed)
      const original = new Matrix(row, 'P0', 'interval-invariant', [])
      const originalFP = chromaFingerprint(original)
      for (let i = 0; i < 12; i++) {
        const label = original.pLabel(i)
        const rebuilt = new Matrix(
          original.getRow(label),
          label,
          'interval-invariant',
          [],
        )
        expect(
          chromaFingerprint(rebuilt),
          ctx(seed, row, `from ${label}`),
        ).toEqual(originalFP)
      }
    })
  }
})

describe('reconstruction from any I-form', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: any I-form reconstructs the same matrix`, () => {
      const row = generateRow(seed)
      const original = new Matrix(row, 'P0', 'interval-invariant', [])
      const originalFP = chromaFingerprint(original)
      for (let j = 0; j < 12; j++) {
        const label = original.iLabel(j)
        const rebuilt = new Matrix(
          original.getRow(label),
          label,
          'interval-invariant',
          [],
        )
        expect(
          chromaFingerprint(rebuilt),
          ctx(seed, row, `from ${label}`),
        ).toEqual(originalFP)
      }
    })
  }
})

// ─── concrete values ──────────────────────────────────────────────────────────

describe('concrete cell values (Schoenberg Op. 25)', () => {
  const matrix = new Matrix(SCHOENBERG_P0, 'P0', 'interval-invariant', [])

  it('I0 row has correct chromas', () => {
    expect(matrix.getRow('I0').map((n) => Note.get(n).chroma)).toEqual(
      SCHOENBERG_I0_CHROMAS,
    )
  })

  it('P1 row has correct chromas', () => {
    expect(matrix.getRow('P1').map((n) => Note.get(n).chroma)).toEqual(
      SCHOENBERG_P1_CHROMAS,
    )
  })
})

describe('concrete cell values (chromatic scale)', () => {
  const matrix = new Matrix(CHROMATIC_C, 'P0', 'interval-invariant', [])

  it('getCell(r, c) chroma equals (c - r + 12) % 12 for all cells', () => {
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 12; c++) {
        expect(Note.get(matrix.getCell(r, c)).chroma, `cell(${r},${c})`).toBe(
          (c - r + 12) % 12,
        )
      }
    }
  })
})

// ─── I-form and non-P0 label input ────────────────────────────────────────────

describe('I-form input', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: I0 input produces same chromas as P0 input`, () => {
      const row = generateRow(seed)
      const p0matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const i0row = p0matrix.getRow('I0')
      const i0matrix = new Matrix(i0row, 'I0', 'interval-invariant', [])
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          expect(
            Note.get(i0matrix.getCell(r, c)).chroma,
            ctx(seed, row, `cell(${r},${c}) i0row=[${i0row.join(' ')}]`),
          ).toBe(Note.get(p0matrix.getCell(r, c)).chroma)
        }
      }
    })
  }
})

describe('non-zero P-form input label', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: P5 input produces same chromas as P0 input`, () => {
      const row = generateRow(seed)
      const p0matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const p5row = p0matrix.getRow('P5')
      const rebuilt = new Matrix(p5row, 'P5', 'interval-invariant', [])
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          expect(
            Note.get(rebuilt.getCell(r, c)).chroma,
            ctx(seed, row, `cell(${r},${c}) P5=[${p5row.join(' ')}]`),
          ).toBe(Note.get(p0matrix.getCell(r, c)).chroma)
        }
      }
    })
  }
})

// ─── spelling modes ─────────────────────────────────────────────────────────

describe('pitch-class-invariant mode', () => {
  it('every cell uses the input row spelling for its pitch class', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P0', 'pitch-class-invariant', [])
      const expectedSpelling: string[] = new Array(12)
      for (const n of row) {
        expectedSpelling[Note.get(n).chroma] = n
      }
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const cell = matrix.getCell(r, c)
          expect(
            cell,
            ctx(
              seed,
              row,
              `cell(${r},${c}) got=${cell} chroma=${Note.get(cell).chroma}`,
            ),
          ).toBe(expectedSpelling[Note.get(cell).chroma])
        }
      }
    }
  })

  it('produces the same chromas as interval-invariant mode', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const pci = new Matrix(row, 'P0', 'pitch-class-invariant', [])
      const ii = new Matrix(row, 'P0', 'interval-invariant', [])
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const pciCell = pci.getCell(r, c)
          const iiCell = ii.getCell(r, c)
          expect(
            Note.get(pciCell).chroma,
            ctx(seed, row, `cell(${r},${c}) pci=${pciCell} ii=${iiCell}`),
          ).toBe(Note.get(iiCell).chroma)
        }
      }
    }
  })

  it('overrides still apply on top of respelling', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const overridden = new Matrix(row, 'P0', 'pitch-class-invariant', [
        { cell: { form: 'P', index: 0, position: 3 }, note: 'C##' },
      ])
      expect(overridden.getCell('P0', 3), ctx(seed, row)).toBe('C##')
    }
  })

  it('uses input row spellings when input is not P0', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const matrix = new Matrix(row, 'P5', 'pitch-class-invariant', [])
      const expectedSpelling: string[] = new Array(12)
      for (const n of row) {
        expectedSpelling[Note.get(n).chroma] = n
      }
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const cell = matrix.getCell(r, c)
          expect(cell, ctx(seed, row, `P5 cell(${r},${c}) got=${cell}`)).toBe(
            expectedSpelling[Note.get(cell).chroma],
          )
        }
      }
    }
  })
})

describe('P0 stability across spelling modes', () => {
  it('P0 has the same spellings in both modes when input is P0', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const ii = new Matrix(row, 'P0', 'interval-invariant', [])
      const pci = new Matrix(row, 'P0', 'pitch-class-invariant', [])
      expect(ii.getRow('P0'), ctx(seed, row, 'II vs PCI')).toEqual(
        pci.getRow('P0'),
      )
    }
  })

  it('P0 has the same spellings in both modes when input is not P0', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const ii = new Matrix(row, 'P5', 'interval-invariant', [])
      const pci = new Matrix(row, 'P5', 'pitch-class-invariant', [])
      expect(ii.getRow('P0'), ctx(seed, row, 'P5 input II vs PCI')).toEqual(
        pci.getRow('P0'),
      )
    }
  })
})

// ─── input row spelling preservation ─────────────────────────────────────────

describe('input row spelling preservation', () => {
  it('input row spellings are preserved in both modes (P0 input)', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const ii = new Matrix(row, 'P0', 'interval-invariant', [])
      const pci = new Matrix(row, 'P0', 'pitch-class-invariant', [])
      expect(ii.getRow('P0'), ctx(seed, row, 'II')).toEqual(row)
      expect(pci.getRow('P0'), ctx(seed, row, 'PCI')).toEqual(row)
    }
  })

  it('input row spellings are preserved in both modes (non-P0 input)', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const ii = new Matrix(row, 'P5', 'interval-invariant', [])
      const pci = new Matrix(row, 'P5', 'pitch-class-invariant', [])
      expect(ii.getRow('P5'), ctx(seed, row, 'P5 II')).toEqual(row)
      expect(pci.getRow('P5'), ctx(seed, row, 'P5 PCI')).toEqual(row)
    }
  })

  it('I-form input row spellings are preserved', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const p0matrix = new Matrix(row, 'P0', 'interval-invariant', [])
      const i3row = p0matrix.getRow('I3')
      const rebuilt = new Matrix(i3row, 'I3', 'interval-invariant', [])
      expect(
        rebuilt.getRow('I3'),
        ctx(seed, row, `I3=[${i3row.join(' ')}]`),
      ).toEqual(i3row)
    }
  })
})

// ─── hybrid mode ─────────────────────────────────────────────────────────────

describe('hybrid mode', () => {
  it('produces the same chromas as interval-invariant mode', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const hybrid = new Matrix(row, 'P0', 'hybrid', [])
      const ii = new Matrix(row, 'P0', 'interval-invariant', [])
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const hCell = hybrid.getCell(r, c)
          const iiCell = ii.getCell(r, c)
          expect(
            Note.get(hCell).chroma,
            ctx(seed, row, `cell(${r},${c}) hybrid=${hCell} ii=${iiCell}`),
          ).toBe(Note.get(iiCell).chroma)
        }
      }
    }
  })

  it('I0 column uses input row spellings', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const hybrid = new Matrix(row, 'P0', 'hybrid', [])
      const spellingMap: string[] = new Array(12)
      for (const n of row) spellingMap[Note.get(n).chroma] = n

      for (let r = 0; r < 12; r++) {
        const cell = hybrid.getCell(r, 0)
        const chroma = Note.get(cell).chroma
        expect(
          cell,
          ctx(
            seed,
            row,
            `I0 col row=${r} got=${cell} expected=${spellingMap[chroma]}`,
          ),
        ).toBe(spellingMap[chroma])
      }
    }
  })

  it('P-form rows preserve interval structure', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const hybrid = new Matrix(row, 'P0', 'hybrid', [])
      const refChromas = row.map((n) => Note.get(n).chroma)
      const refDiffs = refChromas.slice(1).map((c, i) => {
        const asc = (c - refChromas[i] + 12) % 12
        return asc <= 6 ? asc : 12 - asc
      })
      for (const label of LABELS) {
        const rc = hybrid.getRow(label).map((n) => Note.get(n).chroma)
        const diffs = rc.slice(1).map((c, j) => {
          const asc = (c - rc[j] + 12) % 12
          return asc <= 6 ? asc : 12 - asc
        })
        expect(diffs, ctx(seed, row, `${label} intervals`)).toEqual(refDiffs)
      }
    }
  })

  it('P0 has the same spellings as PCI mode', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const hybrid = new Matrix(row, 'P0', 'hybrid', [])
      const pci = new Matrix(row, 'P0', 'pitch-class-invariant', [])
      expect(hybrid.getRow('P0'), ctx(seed, row, 'hybrid vs PCI')).toEqual(
        pci.getRow('P0'),
      )
    }
  })

  it('input row spellings are preserved', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const hybrid = new Matrix(row, 'P0', 'hybrid', [])
      expect(hybrid.getRow('P0'), ctx(seed, row)).toEqual(row)
    }
  })

  it('input row spellings are preserved for non-P0 input', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const hybrid = new Matrix(row, 'P5', 'hybrid', [])
      expect(hybrid.getRow('P5'), ctx(seed, row, 'P5')).toEqual(row)
    }
  })

  it('overrides still apply', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const overridden = new Matrix(row, 'P0', 'hybrid', [
        { cell: { form: 'P', index: 0, position: 3 }, note: 'C##' },
      ])
      expect(overridden.getCell('P0', 3), ctx(seed, row)).toBe('C##')
    }
  })

  it('works with I-form input', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const p0matrix = new Matrix(row, 'P0', 'hybrid', [])
      const i0row = p0matrix.getRow('I0')
      const rebuilt = new Matrix(i0row, 'I0', 'hybrid', [])
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const rCell = rebuilt.getCell(r, c)
          const oCell = p0matrix.getCell(r, c)
          expect(
            Note.get(rCell).chroma,
            ctx(
              seed,
              row,
              `cell(${r},${c}) rebuilt=${rCell} original=${oCell} i0row=[${i0row.join(' ')}]`,
            ),
          ).toBe(Note.get(oCell).chroma)
        }
      }
    }
  })
})

// ─── P0 stability across all three modes ─────────────────────────────────────

describe('P0 stability across all three modes', () => {
  it('P0 has the same spellings in all modes when input is P0', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const ii = new Matrix(row, 'P0', 'interval-invariant', [])
      const pci = new Matrix(row, 'P0', 'pitch-class-invariant', [])
      const hybrid = new Matrix(row, 'P0', 'hybrid', [])
      expect(ii.getRow('P0'), ctx(seed, row, 'II vs PCI')).toEqual(
        pci.getRow('P0'),
      )
      expect(ii.getRow('P0'), ctx(seed, row, 'II vs hybrid')).toEqual(
        hybrid.getRow('P0'),
      )
    }
  })

  it('P0 has the same spellings in all modes when input is not P0', () => {
    for (const seed of SEEDS) {
      const row = generateRow(seed)
      const ii = new Matrix(row, 'P5', 'interval-invariant', [])
      const pci = new Matrix(row, 'P5', 'pitch-class-invariant', [])
      const hybrid = new Matrix(row, 'P5', 'hybrid', [])
      expect(ii.getRow('P0'), ctx(seed, row, 'P5 II vs PCI')).toEqual(
        pci.getRow('P0'),
      )
      expect(ii.getRow('P0'), ctx(seed, row, 'P5 II vs hybrid')).toEqual(
        hybrid.getRow('P0'),
      )
    }
  })
})

// ─── input validation ────────────────────────────────────────────────────────

describe('constructor validation', () => {
  it('throws on invalid note name in row', () => {
    const bad = ['X', ...SCHOENBERG_P0.slice(1)]
    expect(() => new Matrix(bad, 'P0', 'interval-invariant', [])).toThrow()
  })

  it('throws on note with octave in row', () => {
    const bad = ['E4', ...SCHOENBERG_P0.slice(1)]
    expect(() => new Matrix(bad, 'P0', 'interval-invariant', [])).toThrow()
  })

  it('throws on row with wrong length', () => {
    expect(
      () =>
        new Matrix(SCHOENBERG_P0.slice(0, 11), 'P0', 'interval-invariant', []),
    ).toThrow()
  })

  it('throws on row with duplicate pitch classes', () => {
    const duped = [...SCHOENBERG_P0.slice(0, 11), 'E']
    expect(() => new Matrix(duped, 'P0', 'interval-invariant', [])).toThrow()
  })
})
