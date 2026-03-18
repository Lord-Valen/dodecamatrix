// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { Note } from 'tonal'
import { z } from 'zod'
import type { Override, SpellingMode } from './matrix'

/** The serializable file format — what is saved to and loaded from disk. */
export interface MatrixFile {
  row: string[] // P0, normalized — 12 spelled pitch class names
  spellingMode: SpellingMode
  overrides: Override[]
}

// Zod schema for a valid spelled pitch class name (no octave)
const NoteNameSchema = z.string().refine(
  (name) => {
    const n = Note.get(name)
    return !n.empty && n.oct === undefined
  },
  {
    message:
      'Must be a valid pitch class name with no octave (e.g. "C#", "Bb")',
  },
)

const CellIdSchema = z.object({
  form: z.enum(['P', 'I']),
  index: z.number().int().min(0).max(11),
  position: z.number().int().min(0).max(11),
})

const OverrideSchema = z.object({
  cell: CellIdSchema,
  note: NoteNameSchema,
})

export const MatrixStateSchema = z.object({
  version: z.literal(1),
  row: z
    .array(NoteNameSchema)
    .length(12)
    .refine(
      (row) => {
        const chromas = new Set(row.map((n) => Note.get(n).chroma))
        return chromas.size === 12
      },
      { message: 'Row must contain all 12 pitch classes exactly once' },
    ),
  spellingMode: z.enum(['interval-invariant', 'pitch-class-invariant']),
  overrides: z.array(OverrideSchema),
})

/**
 * Parse and validate a JSON file import.
 * Returns the MatrixFile on success, or a descriptive error string on failure.
 */
export function parseMatrixFile(
  raw: unknown,
): { ok: true; state: MatrixFile } | { ok: false; error: string } {
  const result = MatrixStateSchema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    return { ok: false, error: first ? first.message : 'Invalid file format' }
  }
  const { row, spellingMode, overrides } = result.data
  return { ok: true, state: { row, spellingMode, overrides } }
}
