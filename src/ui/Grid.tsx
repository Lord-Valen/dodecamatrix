// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef } from 'react'
import { Note } from 'tonal'
import { remainingChromas } from '../theory/cells'
import type { CellId, Matrix, RowLabel } from '../theory/matrix'
import { validateRow } from '../theory/row'
import { NoteCell } from './NoteCell'

interface GridProps {
  matrix: Matrix
  transposed: boolean
  draftEdits: Map<number, string>
  onCellEdit: (matrixRow: number, matrixCol: number, note: string) => void
  onOverride: (cell: CellId, note: string) => void
  onCommit: () => void
  onTranspose: () => void
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function Grid({
  matrix,
  transposed,
  draftEdits,
  onCellEdit,
  onOverride,
  onCommit,
  onTranspose,
  header,
  footer,
}: GridProps) {
  const rowLabel = (r: number): RowLabel =>
    transposed ? matrix.iLabel(r) : matrix.pLabel(r)

  const colLabel = (c: number): RowLabel =>
    transposed ? matrix.pLabel(c) : matrix.iLabel(c)

  const retroLabel = (label: RowLabel): string => {
    const index = label.slice(1)
    return label[0] === 'P' ? `R${index}` : `RI${index}`
  }

  const cell = (r: number, c: number): { note: string; isDraft: boolean } => {
    const [mr, mc] = transposed ? [c, r] : [r, c]
    const key = mr * 12 + mc
    const draft = draftEdits.get(key)
    if (draft !== undefined) {
      return { note: draft, isDraft: true }
    }
    return { note: matrix.getCell(mr, mc), isDraft: false }
  }

  // Precompute column draft/validity info
  const colHasDraft: boolean[] = []
  const colValid: boolean[] = []
  for (let c = 0; c < 12; c++) {
    const colCells = Array.from({ length: 12 }, (_, r) => cell(r, c))
    const hasDraft = colCells.some((cl) => cl.isDraft)
    colHasDraft[c] = hasDraft
    colValid[c] = hasDraft && validateRow(colCells.map((cl) => cl.note))
  }

  const tableRef = useRef<HTMLTableElement>(null)
  const pendingCell = useRef<string | null>(null)

  useEffect(() => {
    if (pendingCell.current) {
      const target = tableRef.current?.querySelector(
        `[data-cell="${pendingCell.current}"]`,
      ) as HTMLElement | null
      pendingCell.current = null
      target?.click()
    }
  })

  function clickCell(row: number, col: number) {
    const target = tableRef.current?.querySelector(
      `[data-cell="${row}-${col}"]`,
    ) as HTMLElement | null
    target?.click()
  }

  /** Tab: cycle through cells with the same pitch class, then fall through to next conflict */
  function tabSameChroma(fromRow: number, fromCol: number, chroma: number) {
    const rowCells = Array.from({ length: 12 }, (_, c) => cell(fromRow, c))
    for (let i = 1; i < 12; i++) {
      const c = (fromCol + i) % 12
      if (Note.get(rowCells[c].note).chroma === chroma) {
        clickCell(fromRow, c)
        return
      }
    }
    tabNextChroma(fromRow, fromCol, chroma)
  }

  /** Shift+Tab: jump to the next conflicting pitch class */
  function tabNextChroma(fromRow: number, fromCol: number, chroma: number) {
    const rowCells = Array.from({ length: 12 }, (_, c) => cell(fromRow, c))
    const chromaCounts = new Map<number, number>()
    for (const { note } of rowCells) {
      const ch = Note.get(note).chroma
      chromaCounts.set(ch, (chromaCounts.get(ch) ?? 0) + 1)
    }
    for (let i = 1; i < 12; i++) {
      const c = (fromCol + i) % 12
      const ch = Note.get(rowCells[c].note).chroma
      if (ch !== chroma && (chromaCounts.get(ch) ?? 0) > 1) {
        clickCell(fromRow, c)
        return
      }
    }
  }

  return (
    <table className="matrix-grid" ref={tableRef}>
      {header && (
        <thead>
          <tr>
            <th />
            <th colSpan={12} className="grid-header">
              {header}
            </th>
            <th />
          </tr>
        </thead>
      )}
      <thead>
        <tr>
          <th />
          {Array.from({ length: 12 }, (_, c) => {
            const label = colLabel(c)
            const labelClass = colHasDraft[c]
              ? `col-label ${colValid[c] ? 'row-valid' : 'row-invalid'}`
              : 'col-label'
            return (
              <th key={c} className={labelClass}>
                {label}
              </th>
            )
          })}
          <th />
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 12 }, (_, r) => {
          const label = rowLabel(r)
          const form = label[0] as 'P' | 'I'
          const index = parseInt(label.slice(1), 10)
          const cells = Array.from({ length: 12 }, (_, c) => cell(r, c))
          const rowHasDraft = cells.some((c) => c.isDraft)
          const rowValid = rowHasDraft && validateRow(cells.map((c) => c.note))
          const labelClass = rowHasDraft
            ? `row-label ${rowValid ? 'row-valid' : 'row-invalid'}`
            : 'row-label'

          // Find duplicate chromas and missing notes within the row
          const rowConflicts = new Set<number>()
          let missingNotes: string[] = []
          if (rowHasDraft && !rowValid) {
            const chromas = cells.map((c) => Note.get(c.note).chroma)
            const seen = new Set<number>()
            for (const ch of chromas) {
              if (seen.has(ch)) rowConflicts.add(ch)
              else seen.add(ch)
            }
            missingNotes = remainingChromas(seen)
          }

          return (
            <tr key={r}>
              <th className={labelClass}>
                {label}
                {missingNotes.length > 0 && (
                  <div className="missing-notes">{missingNotes.join(' ')}</div>
                )}
              </th>
              {cells.map(({ note, isDraft }, c) => {
                const [mr, mc] = transposed ? [c, r] : [r, c]
                const chroma = Note.get(note).chroma
                return (
                  <NoteCell
                    key={c}
                    note={note}
                    chroma={chroma}
                    isDraft={isDraft}
                    conflict={rowConflicts.has(chroma)}
                    cellId={`${r}-${c}`}
                    onEdit={(n) => onCellEdit(mr, mc, n)}
                    onOverride={(n) =>
                      onOverride({ form, index, position: c }, n)
                    }
                    onTab={(newNote) =>
                      tabSameChroma(r, c, Note.get(newNote).chroma)
                    }
                    onShiftTab={(newNote) =>
                      tabNextChroma(r, c, Note.get(newNote).chroma)
                    }
                    onCommit={onCommit}
                    onTranspose={() => {
                      pendingCell.current = `${c}-${r}`
                      onTranspose()
                    }}
                  />
                )
              })}
              <th className={`${labelClass} retro-label`}>
                {retroLabel(label)}
                {missingNotes.length > 0 && (
                  <div className="missing-notes">{missingNotes.join(' ')}</div>
                )}
              </th>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <th />
          {Array.from({ length: 12 }, (_, c) => {
            const label = colLabel(c)
            const labelClass = colHasDraft[c]
              ? `col-label retro-label ${colValid[c] ? 'row-valid' : 'row-invalid'}`
              : 'col-label retro-label'
            return (
              <th key={c} className={labelClass}>
                {retroLabel(label)}
              </th>
            )
          })}
          <th />
        </tr>
        {footer && (
          <tr>
            <th />
            <th colSpan={12} className="grid-footer">
              {footer}
            </th>
            <th />
          </tr>
        )}
      </tfoot>
    </table>
  )
}
