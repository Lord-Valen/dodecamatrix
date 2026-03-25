// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
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

  function handleChange(value: string) {
    setInput(value)
    onSearch(parseSearchNotes(value))
  }

  function handleClear() {
    setInput('')
    onSearch([])
  }

  return (
    <div className="search-input">
      <input
        type="text"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
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
