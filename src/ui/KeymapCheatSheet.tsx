// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { KEYMAP, type KeyBinding, type Mode } from '../keymap'

const KEY_LABELS: Record<string, string> = {
  ArrowUp: '\u2191',
  ArrowDown: '\u2193',
  ArrowLeft: '\u2190',
  ArrowRight: '\u2192',
  ' ': 'Space',
  Escape: 'Esc',
  Enter: 'Enter',
}

function formatKey(b: KeyBinding): string {
  const parts: string[] = []
  if (b.ctrl) parts.push('Ctrl')
  if (b.shift) parts.push('Shift')
  parts.push(KEY_LABELS[b.key] ?? b.key.toUpperCase())
  return parts.join('+')
}

const SECTIONS: [Mode, string][] = [
  ['global', 'Global Keys'],
  ['normal', 'Normal Mode'],
  ['edit', 'Edit Mode'],
]

export function KeymapCheatSheet() {
  return (
    <>
      {SECTIONS.map(([mode, label]) => {
        const bindings = KEYMAP[mode]
        if (bindings.length === 0) return null
        return (
          <div key={mode}>
            <h3>{label}</h3>
            <table>
              <tbody>
                {bindings.map((b) => (
                  <tr key={b.action}>
                    <td>
                      <kbd>{formatKey(b)}</kbd>
                    </td>
                    <td>{b.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </>
  )
}
