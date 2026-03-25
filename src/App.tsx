// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { CellId, Override, RowLabel, SpellingMode } from './theory/matrix'
import { Matrix } from './theory/matrix'
import { validateRow } from './theory/row'
import { matchToCellKeys, searchSequence } from './theory/search'
import { Grid } from './ui/Grid'
import { HelpPanel } from './ui/HelpPanel'
import { HistoryPanel } from './ui/HistoryPanel'
import { RowEntry } from './ui/RowEntry'
import { SearchInput } from './ui/SearchInput'
import { SpellingToggle } from './ui/SpellingToggle'
import { TransposeButton } from './ui/TransposeButton'

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
  description: string
}

export default function App() {
  const [row, setRow] = useState<string[]>(DEFAULT_ROW)
  const [label, setLabel] = useState<RowLabel>('P0')
  const [spellingMode, setSpellingMode] =
    useState<SpellingMode>('interval-invariant')
  const [overrides, setOverrides] = useState<Override[]>([])
  const [transposed, setTransposed] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([
    {
      row: DEFAULT_ROW,
      label: 'P0',
      description: 'P0 C C# D D# E F F# G G# A A# B',
    },
  ])
  const [cursor, setCursor] = useState(0)
  const [draftEdits, setDraftEdits] = useState<Map<number, string>>(new Map())
  const [zen, setZen] = useState(false)
  const [searchNotes, setSearchNotes] = useState<string[]>([])

  const matrix = new Matrix(row, label, spellingMode, overrides)
  const highlights = useMemo(
    () => matchToCellKeys(matrix, searchSequence(matrix, searchNotes)),
    [matrix, searchNotes],
  )

  function pushState(newRow: string[], newLabel: RowLabel) {
    const description = `${newLabel} ${newRow.join(' ')}`
    setHistory((prev) => [
      ...prev,
      { row: newRow, label: newLabel, description },
    ])
    setCursor(history.length)
    setRow(newRow)
    setLabel(newLabel)
    setOverrides([])
    setDraftEdits(new Map())
  }

  function handleRowEntry(newRow: string[], newLabel: RowLabel) {
    pushState(newRow, newLabel)
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
          pushState(notes, commitLabel)
          return
        }
      }
    }
  }

  function handleRevert() {
    setDraftEdits(new Map())
  }

  function applySnapshot(index: number) {
    const target = history[index]
    setCursor(index)
    setRow(target.row)
    setLabel(target.label)
    setOverrides([])
    setDraftEdits(new Map())
  }

  function handleUndo() {
    if (cursor > 0) applySnapshot(cursor - 1)
  }

  function handleRedo() {
    if (cursor < history.length - 1) applySnapshot(cursor + 1)
  }

  function handleJump(index: number) {
    if (index >= 0 && index < history.length && index !== cursor) {
      applySnapshot(index)
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
      }
      if (e.key === '.' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setZen((z) => !z)
      }
      if (e.key === 'Escape' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleRevert()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const hasDrafts = draftEdits.size > 0

  return (
    <div className={`app${zen ? ' zen' : ''}`}>
      <div className="input-area">
        <div className="canonical-row">
          <span className="canonical-label">Source row: </span>
          {label} {row.join(' ')}
        </div>
        <RowEntry onSubmit={handleRowEntry} />
      </div>
      <div className="matrix-container">
        <Grid
          matrix={matrix}
          transposed={transposed}
          draftEdits={draftEdits}
          highlights={highlights}
          onCellEdit={handleCellEdit}
          onOverride={handleOverride}
          onCommit={handleCommit}
          onTranspose={() => setTransposed((t) => !t)}
          header={
            <div className="action-bar">
              <button
                type="button"
                className="btn btn-icon"
                disabled={!hasDrafts}
                onClick={handleCommit}
                title="Commit row (Enter)"
              >
                &#x2713;
              </button>
              <button
                type="button"
                className="btn btn-icon"
                disabled={!hasDrafts}
                onClick={handleRevert}
                title="Revert drafts (Escape)"
              >
                &#x2717;
              </button>
              <SearchInput onSearch={setSearchNotes} />
            </div>
          }
          footer={
            <div>
              <div className="toolbar">
                <SpellingToggle
                  mode={spellingMode}
                  onChange={handleSpellingChange}
                />
                <TransposeButton
                  transposed={transposed}
                  onChange={setTransposed}
                />
              </div>
            </div>
          }
        />
      </div>
      <footer className="page-footer">
        <a
          className="github-link"
          href="https://github.com/Lord-Valen/dodecamatrix"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub"
        >
          <svg
            viewBox="0 0 16 16"
            width="20"
            height="20"
            fill="currentColor"
            role="img"
          >
            <title>View on GitHub</title>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </footer>
      <HistoryPanel history={history} cursor={cursor} onJump={handleJump} />
      <HelpPanel />
    </div>
  )
}
