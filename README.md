# FormatKeeper

A dual-pane utility for turning raw Markdown, GitHub-Flavored Markdown (GFM), fenced code
blocks and KaTeX/LaTeX math into clean rich text — then copying it straight into Google Docs,
Microsoft Word or Notion without losing tables, headings, code styling or equations.

## Features

- **Live preview** rendered with `react-markdown`, `remark-gfm`, `remark-math` and `rehype-katex`.
- **Rich-text copy** — serializes the previewed DOM with computed styles inlined, so the pasted
  result keeps tables, blockquotes, code colours and math in editors that ignore page CSS.
  Equations paste as their original TeX source rather than KaTeX markup.
- **Print / PDF** — a print stylesheet repaints the page as a single-column white document with
  page-break protection for tables, code, quotes and display math, so the browser's *Save as
  PDF* output matches the preview. Printed pages end with a `© SA7` footer.
- **Sample payload** covering headings, lists, task lists, a GFM table, a blockquote, a
  syntax-highlighted code block and inline + display math.
- **Dark-mode-first design** with a persistent light theme, custom scrollbars, live character and
  word counts, and keyboard-accessible controls.

## Stack

| Concern    | Choice                                                   |
| ---------- | -------------------------------------------------------- |
| Framework  | Vite 8 + React 19 + TypeScript                           |
| Styling    | Tailwind CSS v4 (`@tailwindcss/vite`), CSS custom properties |
| Icons      | `lucide-react`                                           |
| Markdown   | `react-markdown`, `remark-gfm`, `remark-math`            |
| Math       | `rehype-katex` + `katex` (styles imported in `main.tsx`)  |
| Highlight  | `rehype-highlight` with a custom token palette           |

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type-check + production bundle
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Notes

- The markdown renderer (and with it KaTeX and the highlighter) is code-split and loaded on
  demand, so the first paint only ships the shell.
- The preview parses the document as independent top-level blocks (`src/lib/blocks.ts`) and
  memoizes each one, so typing re-renders only the block under the caret. Documents that rely
  on document-wide syntax (reference definitions, footnotes, block HTML) automatically fall
  back to a single-pass render.
- Clipboard output is produced from the live preview, temporarily switching it to the light
  palette while serializing so pasted text stays readable on white documents.
- Theme preference is stored under `formatkeeper-theme`; an inline bootstrap script applies it
  before first paint to avoid a flash of the wrong theme.
