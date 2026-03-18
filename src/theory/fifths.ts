// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

// ─── coordinate-based interval arithmetic ────────────────────────────────────
//
// Tonal's interval name roundtrip (coord → name → coord) is lossy for extreme
// accidentals: the name "5dddd" encodes fifths = -27, but the actual distance
// B##→Fbb is -34 fifths. The difference (7 fifths = 1 semitone) silently
// corrupts transpositions.
//
// We work directly with fifths coordinates to avoid this. A pitch-class note
// has a single coordinate: its position on the line of fifths.
//   C=0, G=1, D=2, A=3, E=4, B=5, F=-1
//   Each # adds 7, each b subtracts 7.
//
// An interval between pitch classes is the difference of their fifths coords.
// Transposition is addition. Negation is sign flip. No names, no loss.

import { Note } from 'tonal'

/** Fifths coordinate of a pitch-class note name. */
export function noteToFifths(note: string): number {
  return Note.get(note).coord[0]
}

/** Base fifths for each letter step. */
const STEP_TO_FIFTHS = [0, 2, 4, -1, 1, 3, 5] // C D E F G A B

/** Inverse: (fifths+1)%7 → step index. */
const FIFTHS_TO_STEP = [3, 0, 4, 1, 5, 2, 6] // 0→F, 1→C, 2→G, 3→D, 4→A, 5→E, 6→B

const LETTERS = 'CDEFGAB'

/** Convert a fifths coordinate back to a pitch-class note name. */
export function fifthsToNote(f: number): string {
  // Proper modulo (always non-negative)
  const mod = (((f + 1) % 7) + 7) % 7
  const step = FIFTHS_TO_STEP[mod]
  const alt = (f - STEP_TO_FIFTHS[step]) / 7
  const letter = LETTERS[step]
  if (alt > 0) return letter + '#'.repeat(alt)
  if (alt < 0) return letter + 'b'.repeat(-alt)
  return letter
}

/** Interval (as fifths difference) between two pitch-class notes. */
export function interval(from: string, to: string): number {
  return noteToFifths(to) - noteToFifths(from)
}

/** Transpose a pitch-class note by a fifths-coordinate interval. */
export function transpose(note: string, fifths: number): string {
  return fifthsToNote(noteToFifths(note) + fifths)
}
