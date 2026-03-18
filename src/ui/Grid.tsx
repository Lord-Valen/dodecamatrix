// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useRef } from 'react'
import { Note } from 'tonal'
import type { CellId, Matrix, RowLabel } from '../theory/matrix'
import { validateRow } from '../theory/row'
import { NoteCell } from './NoteCell'

interface GridProps {
  matrix: Matrix
  transposed: boolean
  draftEdits: Map<number, string>
  onCellEdit: (matrixRow: number, matrixCol: number, note: string) => void
  onOverride: (cell: CellId, note: string) => void
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function Grid({
  matrix,
  transposed,
  draftEdits,
  onCellEdit,
  onOverride,
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

  function tabToConflict(fromRow: number, fromCol: number, chroma: number) {
    // Find the conflicting cell in the same row
    const rowCells = Array.from({ length: 12 }, (_, c) => cell(fromRow, c))
    for (let c = 0; c < 12; c++) {
      if (c === fromCol) continue
      if (Note.get(rowCells[c].note).chroma === chroma) {
        const target = tableRef.current?.querySelector(
          `[data-cell="${fromRow}-${c}"]`,
        ) as HTMLElement | null
        target?.click()
        return
      }
    }
    // Fallback: check same column
    const colCells = Array.from({ length: 12 }, (_, r) => cell(r, fromCol))
    for (let r = 0; r < 12; r++) {
      if (r === fromRow) continue
      if (Note.get(colCells[r].note).chroma === chroma) {
        const target = tableRef.current?.querySelector(
          `[data-cell="${r}-${fromCol}"]`,
        ) as HTMLElement | null
        target?.click()
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

          // Find duplicate chromas within the row
          const rowConflicts = new Set<number>()
          if (rowHasDraft && !rowValid) {
            const chromas = cells.map((c) => Note.get(c.note).chroma)
            const seen = new Set<number>()
            for (const ch of chromas) {
              if (seen.has(ch)) rowConflicts.add(ch)
              else seen.add(ch)
            }
          }

          return (
            <tr key={r}>
              <th className={labelClass}>{label}</th>
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
                    onTab={() => tabToConflict(r, c, chroma)}
                  />
                )
              })}
              <th className={`${labelClass} retro-label`}>
                {retroLabel(label)}
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
