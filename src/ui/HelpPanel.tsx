// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import helpHtml from './help.md'

export function HelpPanel() {
  const [visible, setVisible] = useState(true)

  return (
    <aside className={`help-panel ${visible ? '' : 'help-panel-collapsed'}`}>
      <button
        type="button"
        className="help-toggle"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? '\u203A' : '\u2039'}
      </button>
      <div className="help-drawer">
        <div
          className="help-content"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time markdown, not user input
          dangerouslySetInnerHTML={{ __html: helpHtml }}
        />
      </div>
    </aside>
  )
}
