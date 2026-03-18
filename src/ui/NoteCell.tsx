// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useRef, useState } from 'react'

const ENHARMONICS: readonly (readonly string[])[] = [
  ['C', 'B#'],
  ['C#', 'Db'],
  ['D'],
  ['D#', 'Eb'],
  ['E', 'Fb'],
  ['E#', 'F'],
  ['F#', 'Gb'],
  ['G'],
  ['G#', 'Ab'],
  ['A'],
  ['A#', 'Bb'],
  ['B', 'Cb'],
]

interface NoteCellProps {
  note: string
  chroma: number
  isDraft: boolean
  conflict: boolean
  cellId: string
  onEdit: (note: string) => void
  onOverride: (note: string) => void
  onTab?: () => void
}

export function NoteCell({
  note,
  chroma,
  isDraft,
  conflict,
  onEdit,
  cellId,
  onOverride,
  onTab,
}: NoteCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note)
  const [menu, setMenu] = useState(false)
  const committed = useRef(false)

  function startEdit() {
    committed.current = false
    setDraft(note)
    setEditing(true)
  }

  function commit() {
    if (committed.current) return
    committed.current = true
    setEditing(false)
    const value = draft.trim()
    if (value && value !== note) {
      onEdit(value)
    }
  }

  function cancel() {
    committed.current = true
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') cancel()
    if (e.key === 'Tab') {
      e.preventDefault()
      commit()
      onTab?.()
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    const alternatives = ENHARMONICS[chroma].filter((n) => n !== note)
    if (alternatives.length > 0) setMenu(true)
  }

  if (editing) {
    return (
      <td className="note-cell editing" data-cell={cellId}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      </td>
    )
  }

  const alternatives = ENHARMONICS[chroma].filter((n) => n !== note)

  return (
    <td
      className={`note-cell${isDraft ? ' draft' : ''}${conflict ? ' conflict' : ''}`}
      data-cell={cellId}
      onClick={startEdit}
      onContextMenu={handleContextMenu}
    >
      {note}
      {menu && alternatives.length > 0 && (
        <div className="spelling-menu" onMouseLeave={() => setMenu(false)}>
          {alternatives.map((alt) => (
            <button
              type="button"
              key={alt}
              onClick={(e) => {
                e.stopPropagation()
                onOverride(alt)
                setMenu(false)
              }}
            >
              {alt}
            </button>
          ))}
        </div>
      )}
    </td>
  )
}
