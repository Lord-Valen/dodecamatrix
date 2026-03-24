// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'

interface Snapshot {
  row: string[]
  label: string
  description: string
}

interface HistoryPanelProps {
  history: Snapshot[]
  cursor: number
  onJump: (index: number) => void
}

export function HistoryPanel({ history, cursor, onJump }: HistoryPanelProps) {
  const [visible, setVisible] = useState(true)

  return (
    <aside
      className={`history-panel ${visible ? '' : 'history-panel-collapsed'}`}
    >
      <div className="history-drawer">
        <div className="history-content">
          <h2>History</h2>
          <ul className="history-list">
            {history.map((snap, i) => (
              <li
                key={`${snap.description}-${i}`}
                className={
                  i === cursor
                    ? 'history-current'
                    : i > cursor
                      ? 'history-future'
                      : ''
                }
              >
                {i === cursor ? (
                  snap.description
                ) : (
                  <button type="button" onClick={() => onJump(i)}>
                    {snap.description}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        className="history-toggle"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? '\u2039' : '\u203A'}
      </button>
    </aside>
  )
}
