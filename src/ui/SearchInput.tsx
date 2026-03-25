// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from 'react'
import { Note } from 'tonal'

interface SearchInputProps {
  onSearch: (notes: string[]) => void
}

function parseSearchNotes(input: string): string[] {
  if (!input.trim()) return []
  return input
    .trim()
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .filter((p) => {
      const n = Note.get(p)
      return !n.empty && n.oct === undefined
    })
}

export function SearchInput({ onSearch }: SearchInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(value: string) {
    setInput(value)
    onSearch(parseSearchNotes(value))
  }

  function handleClear() {
    setInput('')
    onSearch([])
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="search-input">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleClear()
            inputRef.current?.blur()
          }
        }}
        placeholder="Search: C D E"
      />
      {input && (
        <button type="button" className="btn btn-icon" onClick={handleClear}>
          &#x2717;
        </button>
      )}
    </div>
  )
}
