// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import type { CellId, Override, RowLabel, SpellingMode } from './theory/matrix'
import { Matrix } from './theory/matrix'
import { validateRow } from './theory/row'
import { Grid } from './ui/Grid'
import { HelpPanel } from './ui/HelpPanel'
import { RowEntry } from './ui/RowEntry'
import { SpellingToggle } from './ui/SpellingToggle'
import { TransposeButton } from './ui/TransposeButton'
import './App.css'

const DEFAULT_ROW = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]

interface Snapshot {
  row: string[]
  label: RowLabel
}

export default function App() {
  const [row, setRow] = useState<string[]>(DEFAULT_ROW)
  const [label, setLabel] = useState<RowLabel>('P0')
  const [spellingMode, setSpellingMode] =
    useState<SpellingMode>('interval-invariant')
  const [overrides, setOverrides] = useState<Override[]>([])
  const [transposed, setTransposed] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [draftEdits, setDraftEdits] = useState<Map<number, string>>(new Map())

  const matrix = new Matrix(row, label, spellingMode, overrides)

  function pushHistory() {
    setHistory((prev) => [...prev, { row, label }])
  }

  function handleRowEntry(newRow: string[], newLabel: RowLabel) {
    pushHistory()
    setRow(newRow)
    setLabel(newLabel)
    setOverrides([])
    setDraftEdits(new Map())
  }

  function handleCellEdit(matrixRow: number, matrixCol: number, note: string) {
    setDraftEdits((prev) => {
      const next = new Map(prev)
      const key = matrixRow * 12 + matrixCol
      if (note === matrix.getCell(matrixRow, matrixCol)) {
        next.delete(key)
      } else {
        next.set(key, note)
      }
      return next
    })
  }

  function handleOverride(cell: CellId, note: string) {
    setOverrides((prev) => [
      ...prev.filter(
        (o) =>
          o.cell.form !== cell.form ||
          o.cell.index !== cell.index ||
          o.cell.position !== cell.position,
      ),
      { cell, note },
    ])
  }

  function handleSpellingChange(mode: SpellingMode) {
    setSpellingMode(mode)
  }

  function handleCommit() {
    // Check both display rows and display columns for valid edited rows
    for (const direction of ['row', 'col'] as const) {
      for (let i = 0; i < 12; i++) {
        const notes: string[] = []
        let hasDraft = false
        for (let j = 0; j < 12; j++) {
          const [mr, mc] =
            direction === 'row'
              ? transposed
                ? [j, i]
                : [i, j]
              : transposed
                ? [i, j]
                : [j, i]
          const key = mr * 12 + mc
          const draft = draftEdits.get(key)
          if (draft !== undefined) {
            hasDraft = true
            notes.push(draft)
          } else {
            notes.push(matrix.getCell(mr, mc))
          }
        }
        if (hasDraft && validateRow(notes)) {
          const commitLabel =
            direction === 'row'
              ? transposed
                ? matrix.iLabel(i)
                : matrix.pLabel(i)
              : transposed
                ? matrix.pLabel(i)
                : matrix.iLabel(i)
          pushHistory()
          setRow(notes)
          setLabel(commitLabel)
          setOverrides([])
          setDraftEdits(new Map())
          return
        }
      }
    }
  }

  function handleRevert() {
    setDraftEdits(new Map())
  }

  function handleUndo() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setRow(prev.row)
    setLabel(prev.label)
    setHistory((h) => h.slice(0, -1))
    setOverrides([])
    setDraftEdits(new Map())
  }

  const hasDrafts = draftEdits.size > 0

  return (
    <div className="app">
      <a
        className="github-link"
        href="https://github.com/Lord-Valen/dodecamatrix"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on GitHub"
      >
        <svg
          viewBox="0 0 16 16"
          width="24"
          height="24"
          fill="currentColor"
          role="img"
        >
          <title>View on GitHub</title>
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
      </a>
      <div className="matrix-container">
        <Grid
          matrix={matrix}
          transposed={transposed}
          draftEdits={draftEdits}
          onCellEdit={handleCellEdit}
          onOverride={handleOverride}
          onCommit={handleCommit}
          onTranspose={() => setTransposed((t) => !t)}
          header={
            <>
              <div className="canonical-row">
                <span className="canonical-label">Source row: </span>
                {label} {row.join(' ')}
              </div>
              <RowEntry onSubmit={handleRowEntry} />
            </>
          }
          footer={
            <div className="toolbar">
              <SpellingToggle
                mode={spellingMode}
                onChange={handleSpellingChange}
              />
              <TransposeButton
                transposed={transposed}
                onChange={setTransposed}
              />
              {hasDrafts && (
                <>
                  <button type="button" className="btn" onClick={handleCommit}>
                    Commit
                  </button>
                  <button type="button" className="btn" onClick={handleRevert}>
                    Revert
                  </button>
                </>
              )}
              {history.length > 0 && (
                <button type="button" className="btn" onClick={handleUndo}>
                  Undo
                </button>
              )}
            </div>
          }
        />
      </div>
      <HelpPanel />
    </div>
  )
}
