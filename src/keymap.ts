// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useEffect } from 'react'
import keymapData from './keymap.json'

export type Mode = 'global' | 'normal' | 'edit'

export interface KeyBinding {
  key: string
  ctrl?: boolean
  shift?: boolean
  action: string
  description: string
}

export type Keymap = Record<Mode, KeyBinding[]>

export const KEYMAP: Keymap = keymapData as Keymap

function matchIn(
  bindings: KeyBinding[],
  key: string,
  ctrl: boolean,
  shift: boolean,
): string | undefined {
  return bindings.find(
    (b) =>
      b.key.toLowerCase() === key.toLowerCase() &&
      !!b.ctrl === ctrl &&
      !!b.shift === shift,
  )?.action
}

export function matchBinding(
  keymap: Keymap,
  key: string,
  ctrl: boolean,
  shift: boolean,
  mode: Exclude<Mode, 'global'>,
): string | undefined {
  return (
    matchIn(keymap.global, key, ctrl, shift) ??
    matchIn(keymap[mode], key, ctrl, shift)
  )
}

function currentMode(): Exclude<Mode, 'global'> {
  return document.activeElement?.tagName === 'INPUT' ? 'edit' : 'normal'
}

export function useKeymap(
  keymap: Keymap,
  actions: Record<string, (e: KeyboardEvent) => void>,
) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const action = matchBinding(
        keymap,
        e.key,
        e.ctrlKey || e.metaKey,
        e.shiftKey,
        currentMode(),
      )
      if (action && actions[action]) {
        e.preventDefault()
        actions[action](e)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })
}
