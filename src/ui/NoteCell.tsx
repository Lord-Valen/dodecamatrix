// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useRef, useState } from 'react'
import { Note } from 'tonal'

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
  highlighted: boolean
  focused: boolean
  cellId: string
  onEdit: (note: string) => void
  onClick?: () => void
  onOverride: (note: string) => void
  onTab?: (newNote: string) => void
  onShiftTab?: (newNote: string) => void
  onCommit?: () => void
  onTranspose?: () => void
  onEscape?: () => void
}

export function NoteCell({
  note,
  chroma,
  isDraft,
  conflict,
  highlighted,
  focused,
  onEdit,
  cellId,
  onClick: onClickProp,
  onOverride,
  onTab,
  onShiftTab,
  onCommit,
  onTranspose,
  onEscape,
}: NoteCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note)
  const [menu, setMenu] = useState(false)
  const committed = useRef(false)
  const preEdit = useRef(note)

  function startEdit() {
    onClickProp?.()
    committed.current = false
    preEdit.current = note
    setDraft(note)
    setEditing(true)
  }

  function normalize(raw: string): string {
    const trimmed = raw.trim()
    return Note.get(trimmed).name || trimmed
  }

  function handleChange(value: string) {
    setDraft(value)
    onEdit(normalize(value))
  }

  function commit() {
    if (committed.current) return
    committed.current = true
    setEditing(false)
    const value = draft.trim()
    if (!value) onEdit(preEdit.current)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      commit()
      onCommit?.()
    }
    if (e.key === 'Escape') {
      commit()
      onEscape?.()
    }
    if (e.key === ' ') {
      e.preventDefault()
      commit()
      onTranspose?.()
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const value = normalize(draft)
      commit()
      if (value) {
        if (e.shiftKey) onShiftTab?.(value)
        else onTab?.(value)
      }
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    const alternatives = ENHARMONICS[chroma].filter((n) => n !== note)
    if (alternatives.length > 0) setMenu(true)
  }

  if (editing) {
    return (
      <td
        className={`note-cell editing${conflict ? ' conflict' : ''}`}
        data-cell={cellId}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      </td>
    )
  }

  const alternatives = ENHARMONICS[chroma].filter((n) => n !== note)

  return (
    <td
      className={`note-cell${isDraft ? ' draft' : ''}${conflict ? ' conflict' : ''}${highlighted ? ' highlighted' : ''}${focused ? ' focused' : ''}`}
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
