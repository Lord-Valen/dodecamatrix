// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import { fifthsToNote, interval, noteToFifths } from './fifths'

/**
 * Check whether an array of note names forms a valid 12-tone row:
 * exactly 12 pitch-class-name notes with no octaves and no duplicate chromas.
 */
export function validateRow(notes: string[]): boolean {
  if (notes.length !== 12) return false
  const chromas = new Set<number>()
  for (const note of notes) {
    const n = Note.get(note)
    if (n.empty || n.oct !== undefined) return false
    if (chromas.has(n.chroma)) return false
    chromas.add(n.chroma)
  }
  return true
}

/**
 * Compute the intervals (as fifths-coordinate differences) between consecutive
 * notes in a row.
 */
export function rowIntervals(row: string[]): number[] {
  return row.slice(1).map((note, i) => interval(row[i], note))
}

/**
 * Build a 12-note row by applying successive fifths-coordinate intervals
 * from a starting note.
 */
export function buildRow(startNote: string, intervals: number[]): string[] {
  const row = [startNote]
  let f = noteToFifths(startNote)
  for (const iv of intervals) {
    f += iv
    row.push(fifthsToNote(f))
  }
  return row
}

/**
 * Invert a row: keep the starting note, negate all intervals.
 * Converts an I-form into its corresponding P-form (and vice versa).
 */
export function invertRow(row: string[]): string[] {
  return buildRow(
    row[0],
    rowIntervals(row).map((iv) => -iv),
  )
}
