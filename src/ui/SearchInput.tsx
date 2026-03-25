// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { type Ref, useImperativeHandle, useRef, useState } from 'react'
import { Note } from 'tonal'

export interface SearchInputHandle {
  focus: () => void
}

interface SearchInputProps {
  onSearch: (notes: string[]) => void
  ref?: Ref<SearchInputHandle>
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

export function SearchInput({ onSearch, ref }: SearchInputProps) {
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

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

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
