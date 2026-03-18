// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import type { Matrix } from '../matrix'

/**
 * Produce a Set of comma-joined chroma strings for each P-form row.
 * Two matrices with identical fingerprints contain the same pitch-class content.
 */
export function chromaFingerprint(m: Matrix): Set<string> {
  return new Set(
    Array.from({ length: 12 }, (_, r) =>
      m
        .getRow(m.pLabel(r))
        .map((n) => Note.get(n).chroma)
        .join(','),
    ),
  )
}

/** All enharmonic spellings for each chroma (0–11), including double sharps/flats. */
const ENHARMONICS: readonly (readonly string[])[] = [
  ['C', 'B#', 'Dbb'],
  ['C#', 'Db', 'B##'],
  ['D', 'C##', 'Ebb'],
  ['D#', 'Eb', 'Fbb'],
  ['E', 'Fb', 'D##'],
  ['E#', 'F', 'Gbb'],
  ['F#', 'Gb', 'E##'],
  ['G', 'F##', 'Abb'],
  ['G#', 'Ab'],
  ['A', 'G##', 'Bbb'],
  ['A#', 'Bb', 'Cbb'],
  ['B', 'Cb', 'A##'],
]

/** Simple seeded PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a valid 12-tone row with randomized enharmonic spellings.
 * Deterministic for a given seed.
 */
export function generateRow(seed: number): string[] {
  const rng = mulberry32(seed)

  // Pick a random enharmonic spelling for each chroma
  const notes = ENHARMONICS.map((alts) => alts[Math.floor(rng() * alts.length)])

  // Fisher-Yates shuffle
  for (let i = 11; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[notes[i], notes[j]] = [notes[j], notes[i]]
  }

  return notes
}
