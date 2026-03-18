// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useMemo, useState } from 'react'
import { Note } from 'tonal'
import {
  analyzeNotes,
  cellCompletion,
  remainingChromas,
  validCells,
} from '../theory/cells'
import type { FormType, RowLabel } from '../theory/matrix'

interface RowEntryProps {
  onSubmit: (row: string[], label: RowLabel) => void
}

const LABEL_RE = /^([PI])(\d{1,2})$/

function parseInput(
  input: string,
): { row: string[]; label: RowLabel } | { error: string } {
  const parts = input
    .trim()
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))

  let label: RowLabel
  let notes: string[]

  if (parts.length === 13) {
    const match = LABEL_RE.exec(parts[0])
    if (!match) return { error: `Invalid label: ${parts[0]}` }
    const form = match[1] as FormType
    const index = parseInt(match[2], 10)
    if (index < 0 || index > 11)
      return { error: `Label index must be 0–11, got ${index}` }
    label = `${form}${index}` as RowLabel
    notes = parts.slice(1)
  } else if (parts.length === 12) {
    label = 'P0'
    notes = parts
  } else {
    return { error: 'Expected 12 notes, or a label followed by 12 notes' }
  }

  const chromaToNames = new Map<number, string[]>()
  for (const note of notes) {
    const n = Note.get(note)
    if (n.empty) return { error: `Invalid note: ${note}` }
    if (n.oct !== undefined)
      return { error: `Note must not have octave: ${note}` }
    const names = chromaToNames.get(n.chroma) ?? []
    names.push(note)
    chromaToNames.set(n.chroma, names)
  }

  const dupes = [...chromaToNames.values()].filter((ns) => ns.length > 1)
  if (dupes.length > 0) {
    return {
      error: `Duplicate pitch class: ${dupes.map((ns) => ns.join('/')).join(', ')}`,
    }
  }

  return { row: notes, label }
}

/** Parse the note tokens from input (skipping a leading label if present). */
function parseNotes(input: string): string[] {
  if (!input.trim()) return []
  const parts = input
    .trim()
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
  const start = LABEL_RE.test(parts[0]) ? 1 : 0
  return parts.slice(start).filter((p) => {
    const n = Note.get(p)
    return !n.empty && n.oct === undefined
  })
}

/** Parse comma-delimited cells from input (skipping a leading label if present). */
function parseCells(input: string): string[][] {
  const raw = input.trim()
  if (!raw) return []

  // Strip leading label
  const firstToken = raw.split(/\s+/)[0]
  const body = LABEL_RE.test(
    firstToken.charAt(0).toUpperCase() + firstToken.slice(1),
  )
    ? raw.slice(firstToken.length).trim()
    : raw

  if (!body) return []

  return body
    .split(',')
    .map((cs) =>
      cs
        .trim()
        .split(/\s+/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .filter((p) => {
          const n = Note.get(p)
          return !n.empty && n.oct === undefined
        }),
    )
    .filter((cell) => cell.length > 0)
}

const PLACEHOLDER = 'P0 C E G#, F A C#, Bb D F#, Eb G B'

export function RowEntry({ onSubmit }: RowEntryProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const notes = useMemo(() => parseNotes(input), [input])
  const cells = useMemo(() => parseCells(input), [input])
  const trailingComma = useMemo(() => /,\s*$/.test(input.trim()), [input])
  const { used, duplicateNotes } = useMemo(() => analyzeNotes(notes), [notes])
  const remaining = useMemo(() => remainingChromas(used), [used])
  const suggestion = useMemo(
    () => cellCompletion(cells, used, trailingComma),
    [cells, used, trailingComma],
  )
  const candidates = useMemo(
    () => (trailingComma ? validCells(cells, used) : null),
    [trailingComma, cells, used],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = parseInput(input || PLACEHOLDER)
    if ('error' in result) {
      setError(result.error)
    } else {
      setError('')
      onSubmit(result.row, result.label)
    }
  }

  function pickCell(cell: string[]) {
    setInput((prev) => `${prev.trimEnd()} ${cell.join(' ')}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      if (suggestion) {
        e.preventDefault()
        pickCell(suggestion)
      } else if (candidates?.length) {
        e.preventDefault()
        pickCell(candidates[0].cell)
      }
    }
  }

  return (
    <form className="row-entry" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER}
      />
      <button className="btn" type="submit">
        Set Row
      </button>
      <div className="row-entry-feedback">
        {suggestion && !candidates && (
          <span
            className="row-entry-suggestion"
            onClick={() => pickCell(suggestion)}
          >
            Tab: {suggestion.join(' ')}
          </span>
        )}
        {candidates && (
          <span className="row-entry-starts">
            Cells:{' '}
            {candidates.map(({ cell, viable }, i) => (
              <span key={i}>
                {i > 0 && <span className="row-entry-sep">, </span>}
                <span
                  className={
                    viable ? 'row-entry-start viable' : 'row-entry-start'
                  }
                  onClick={() => pickCell(cell)}
                >
                  {cell.join(' ')}
                </span>
              </span>
            ))}
          </span>
        )}
        {duplicateNotes.length > 0 && (
          <span className="row-entry-warning">
            Duplicate: {duplicateNotes.join(', ')}
          </span>
        )}
        {used.size > 0 && remaining.length > 0 && (
          <span className="row-entry-remaining">
            Available: {remaining.join('  ')}
          </span>
        )}
        {error && <span className="row-entry-error">Error: {error}</span>}
      </div>
    </form>
  )
}
