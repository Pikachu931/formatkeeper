# FormatKeeper

A dual-pane utility for turning raw Markdown, GitHub-Flavored Markdown (GFM), fenced code
blocks and KaTeX/LaTeX math into clean rich text — then copying it straight into Google Docs,
Microsoft Word or Notion without losing tables, headings, code styling or equations.

## Features

- **Live preview** rendered with `react-markdown`, `remark-gfm`, `remark-math` and `rehype-katex`.
- **Rich-text copy** — serializes the previewed DOM with computed styles inlined plus legacy
  table attributes (`border`, `cellpadding`), so tables, blockquotes and code survive editors
  that ignore page CSS. Each equation is emitted as MathML (Word turns it into a native
  equation) *and* as a TeX fallback hidden from Word via `mso-hide:all`, so Google Docs and
  Notion still receive readable formula text. The plain-text flavor carries real LaTeX.
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

## AI layout suggestions (Gemini)

The **Analyze with AI** button in the Markdown pane posts the editor text to `POST /api/analyze`,
a Vercel serverless function that asks Gemini for structured JSON (document type, title,
sections, key highlights, tone and three style specs) and returns it sanitized. The key is read
from `GEMINI_API_KEY` at runtime and never reaches the browser; the document is not stored.

### Setup

1. Create a key in Google AI Studio.
2. **Local:** copy `.env.example` to `.env.local` and set `GEMINI_API_KEY=...`. Plain
   `npm run dev` serves the UI only (Vite has no `/api`), so run `vercel dev` with the Vercel CLI
   linked to the project to exercise the function. `GEMINI_MODEL` is optional and defaults to
   `gemini-3.8-flash`.
3. **Vercel:** Project → Settings → Environment Variables → add `GEMINI_API_KEY` for Production
   and Preview, then redeploy (Deployments → Redeploy, or push a commit). Never prefix it with
   `VITE_`; that would inline it into the browser bundle.
4. `.env.local` and `.env*` are git-ignored; only `.env.example` is committed.

### Behaviour

- Input must be non-empty and at most 20,000 characters.
- Rate limit: 12 analyses per IP per 10 minutes, per warm function instance (best-effort; add a
  shared store such as Upstash if strict limits are needed).
- Missing configuration, upstream 429s, timeouts and malformed JSON return friendly messages.
- **Generate PDF** prints the AI-structured document with the chosen layout; pick “Save as PDF”
  in the browser dialog. The stylesheet handles multiple pages, repeating table headers, colour
  output and system fonts with Bengali fallbacks (`Noto Sans Bengali`, `Nirmala UI`, Vrinda).
- `npm test` runs the validation, sanitizer, endpoint error-path and rate-limit checks without
  calling Gemini.
