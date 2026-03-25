// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { type Keymap, matchBinding } from '../keymap'

const keymap: Keymap = {
  global: [
    { key: 'z', ctrl: true, action: 'undo', description: 'Undo' },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      action: 'redo',
      description: 'Redo',
    },
  ],
  normal: [
    { key: 'ArrowUp', action: 'cursorUp', description: 'Move cursor up' },
    { key: 's', action: 'spellingNext', description: 'Next spelling' },
    {
      key: 's',
      shift: true,
      action: 'spellingPrev',
      description: 'Previous spelling',
    },
  ],
  edit: [
    { key: 'Tab', action: 'tabNext', description: 'Jump to next duplicate' },
  ],
}

describe('matchBinding', () => {
  it('matches a global binding regardless of mode', () => {
    expect(matchBinding(keymap, 'z', true, false, 'normal')).toBe('undo')
    expect(matchBinding(keymap, 'z', true, false, 'edit')).toBe('undo')
  })

  it('matches a normal binding only in normal mode', () => {
    expect(matchBinding(keymap, 'ArrowUp', false, false, 'normal')).toBe(
      'cursorUp',
    )
    expect(
      matchBinding(keymap, 'ArrowUp', false, false, 'edit'),
    ).toBeUndefined()
  })

  it('matches an edit binding only in edit mode', () => {
    expect(matchBinding(keymap, 'Tab', false, false, 'edit')).toBe('tabNext')
    expect(matchBinding(keymap, 'Tab', false, false, 'normal')).toBeUndefined()
  })

  it('distinguishes ctrl modifier', () => {
    expect(matchBinding(keymap, 'z', false, false, 'normal')).toBeUndefined()
    expect(matchBinding(keymap, 'z', true, false, 'normal')).toBe('undo')
  })

  it('distinguishes shift modifier', () => {
    expect(matchBinding(keymap, 'z', true, true, 'normal')).toBe('redo')
    expect(matchBinding(keymap, 'z', true, false, 'normal')).toBe('undo')
  })

  it('distinguishes shift for same key in same mode', () => {
    expect(matchBinding(keymap, 's', false, false, 'normal')).toBe(
      'spellingNext',
    )
    expect(matchBinding(keymap, 's', false, true, 'normal')).toBe(
      'spellingPrev',
    )
  })

  it('returns undefined for unbound keys', () => {
    expect(matchBinding(keymap, 'x', false, false, 'normal')).toBeUndefined()
  })

  it('global bindings take precedence over mode bindings', () => {
    const km: Keymap = {
      global: [{ key: 'a', action: 'globalA', description: '' }],
      normal: [{ key: 'a', action: 'normalA', description: '' }],
      edit: [],
    }
    expect(matchBinding(km, 'a', false, false, 'normal')).toBe('globalA')
  })
})
