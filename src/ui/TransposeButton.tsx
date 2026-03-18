// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT

interface TransposeButtonProps {
  transposed: boolean
  onChange: (transposed: boolean) => void
}

export function TransposeButton({
  transposed,
  onChange,
}: TransposeButtonProps) {
  return (
    <fieldset className="spelling-toggle">
      <legend className="spelling-legend">Rows</legend>
      <label className="spelling-option">
        <input
          type="radio"
          name="row-form"
          checked={!transposed}
          onChange={() => onChange(false)}
        />
        P-forms
      </label>
      <label className="spelling-option">
        <input
          type="radio"
          name="row-form"
          checked={transposed}
          onChange={() => onChange(true)}
        />
        I-forms
      </label>
    </fieldset>
  )
}
