// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import type { SpellingMode } from '../theory/matrix'

interface SpellingToggleProps {
  mode: SpellingMode
  onChange: (mode: SpellingMode) => void
}

const OPTIONS: { value: SpellingMode; label: string }[] = [
  { value: 'interval-invariant', label: 'Interval' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'pitch-class-invariant', label: 'Pitch Class' },
]

export function SpellingToggle({ mode, onChange }: SpellingToggleProps) {
  return (
    <fieldset className="spelling-toggle">
      <legend className="spelling-legend">Spelling</legend>
      {OPTIONS.map(({ value, label }) => (
        <label key={value} className="spelling-option">
          <input
            type="radio"
            name="spelling-mode"
            value={value}
            checked={mode === value}
            onChange={() => onChange(value)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  )
}
