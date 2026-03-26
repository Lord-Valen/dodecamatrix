// SPDX-FileCopyrightText: 2026 Lord-Valen
//
// SPDX-License-Identifier: MIT-0

import react from '@vitejs/plugin-react'
import { marked } from 'marked'
import { defineConfig } from 'vite'

function markdown(): import('vite').Plugin {
  return {
    name: 'markdown',
    transform(src, id) {
      if (!id.endsWith('.md')) return
      const html = marked.parse(src, { async: false }) as string
      return { code: `export default ${JSON.stringify(html)}`, map: null }
    },
  }
}

export default defineConfig({
  plugins: [markdown(), react()],
})
