// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'

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
        <div className="help-content">
          <h2>Quick Reference</h2>

          <section>
            <h3>Input</h3>
            <p>
              Type 12 notes separated by spaces. Optionally prefix with a label
              like <code>P0</code> or <code>I3</code>.
            </p>
            <p>
              Use commas to mark cell boundaries. The first cell defines the
              interval pattern for all cells.
            </p>
            <p>
              Example: <code>P0 C E G#, F A C#, Bb D F#, Eb G B</code>
            </p>
          </section>

          <section>
            <h3>Cell Completion</h3>
            <p>
              After entering the first note of a new cell, press <kbd>Tab</kbd>{' '}
              to complete it using the established pattern.
            </p>
            <p>
              With 2+ complete cells, add a trailing comma to derive the next
              cell from root motion. Press <kbd>Tab</kbd> to accept.
            </p>
            <p>
              All valid candidate cells are shown below the input. Click any to
              insert it. <span className="help-viable">Green</span> candidates
              can complete a full 12-tone row.
            </p>
          </section>

          <section>
            <h3>Matrix Editing</h3>
            <p>
              Click any cell to edit its spelling. Right-click for enharmonic
              alternatives.
            </p>
            <p>
              Draft edits appear in yellow. Conflicting chromas are outlined in
              red.
            </p>
            <p>
              <strong>Commit</strong> applies a valid edited row as the new
              source row. <strong>Revert</strong> discards all drafts.{' '}
              <strong>Undo</strong> restores the previous source row.
            </p>
          </section>

          <section>
            <h3>Settings</h3>
            <p>
              <strong>Spelling</strong> controls how notes are named in the
              matrix: <em>Interval</em> preserves fifths-based letter names,{' '}
              <em>Pitch Class</em> normalizes to sharps/flats, <em>Hybrid</em>{' '}
              mixes both.
            </p>
            <p>
              <strong>Rows</strong> toggles between P-form rows and I-form rows.
            </p>
          </section>
        </div>
      </div>
    </aside>
  )
}
