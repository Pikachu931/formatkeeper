import type { Analysis, StyleId } from '../lib/analysis'

type AiDocumentProps = {
  analysis: Analysis
  styleId: StyleId
  /** Cards render a shortened version and add padding for the preview frame. */
  compact?: boolean
}

/**
 * Inline styles only: the same markup feeds the card previews and the printed
 * PDF, so what the user picks is exactly what prints.
 */
export function AiDocument({ analysis, styleId, compact = false }: AiDocumentProps) {
  const style = analysis.styles[styleId]
  const { palette } = style
  const gorgeous = styleId === 'gorgeous'
  const minimal = styleId === 'minimalistic'
  const headingEm = style.fontSizes.heading / style.fontSizes.body
  const sectionEm = headingEm * 0.62
  const highlights = analysis.keyHighlights.slice(0, gorgeous ? 4 : 3)
  const sections = compact ? analysis.sections.slice(0, 2) : analysis.sections

  return (
    <article
      style={{
        backgroundColor: palette.background,
        color: palette.ink,
        fontFamily: style.fonts.body,
        fontSize: `${style.fontSizes.body}pt`,
        lineHeight: 1.62,
        padding: compact ? '16px' : 0,
      }}
    >
      <header style={{ marginBottom: '1.8em' }}>
        {gorgeous ? (
          <div
            style={{
              backgroundColor: palette.accentSoft,
              borderLeft: `5px solid ${palette.accent}`,
              borderRadius: 4,
              padding: '0.9em 1em',
            }}
          >
            <h1
              style={{
                fontFamily: style.fonts.heading,
                fontSize: `${headingEm}em`,
                lineHeight: 1.15,
                margin: 0,
                color: palette.accent,
              }}
            >
              {analysis.title}
            </h1>
          </div>
        ) : (
          <h1
            style={{
              fontFamily: style.fonts.heading,
              fontSize: `${headingEm}em`,
              lineHeight: 1.2,
              margin: 0,
              fontWeight: minimal ? 400 : 700,
              letterSpacing: minimal ? '0.01em' : '-0.015em',
            }}
          >
            {analysis.title}
          </h1>
        )}

        <p
          style={{
            color: palette.muted,
            fontSize: '0.78em',
            letterSpacing: '0.09em',
            margin: '0.8em 0 0',
            textTransform: 'uppercase',
          }}
        >
          {analysis.documentType} · {analysis.tone}
        </p>

        {gorgeous ? (
          <div
            style={{
              backgroundColor: palette.accent,
              height: 1,
              marginTop: '1.1em',
              opacity: 0.35,
            }}
          />
        ) : null}
      </header>

      {highlights.length > 0 ? (
        gorgeous ? (
          <div style={{ display: 'grid', gap: '0.55em', marginBottom: '1.7em' }}>
            {highlights.map((highlight, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: palette.surface,
                  borderLeft: `3px solid ${palette.accent}`,
                  fontSize: '0.95em',
                  padding: '0.6em 0.85em',
                }}
              >
                <strong style={{ color: palette.accent }}>{highlight}</strong>
              </div>
            ))}
          </div>
        ) : (
          <ul
            style={{
              color: palette.muted,
              margin: '0 0 1.6em',
              paddingLeft: '1.15em',
            }}
          >
            {highlights.map((highlight, index) => (
              <li key={index} style={{ margin: '0.25em 0' }}>
                {highlight}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {sections.map((section, index) => (
        <section key={index} style={{ marginBottom: '1.5em' }}>
          {gorgeous ? (
            <h2
              style={{
                backgroundColor: palette.accentSoft,
                borderLeft: `4px solid ${palette.accent}`,
                color: palette.ink,
                fontFamily: style.fonts.heading,
                fontSize: `${sectionEm}em`,
                lineHeight: 1.3,
                margin: '0 0 0.7em',
                padding: '0.38em 0.7em',
              }}
            >
              {section.heading}
            </h2>
          ) : (
            <h2
              style={{
                borderBottom: minimal ? 'none' : `1px solid ${palette.accentSoft}`,
                color: palette.ink,
                fontFamily: style.fonts.heading,
                fontSize: `${sectionEm}em`,
                fontWeight: minimal ? 400 : 600,
                letterSpacing: minimal ? '0.01em' : '-0.01em',
                lineHeight: 1.3,
                margin: '0 0 0.6em',
                paddingBottom: minimal ? 0 : '0.25em',
              }}
            >
              {section.heading}
            </h2>
          )}

          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex} style={{ margin: '0 0 0.75em' }}>
              {paragraph}
            </p>
          ))}

          {section.bullets.length > 0 ? (
            <ul style={{ margin: '0 0 0.9em', paddingLeft: '1.15em' }}>
              {section.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex} style={{ margin: '0.2em 0' }}>
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}

          {section.table ? (
            <table
              style={{
                borderCollapse: 'collapse',
                fontSize: '0.9em',
                margin: '0.4em 0 1em',
                width: '100%',
              }}
            >
              <thead>
                <tr>
                  {section.table.headers.map((header, headerIndex) => (
                    <th
                      key={headerIndex}
                      style={{
                        backgroundColor: palette.surface,
                        borderBottom: `2px solid ${palette.accent}`,
                        padding: '0.45em 0.6em',
                        textAlign: 'left',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={{
                          borderBottom: `1px solid ${palette.accentSoft}`,
                          padding: '0.4em 0.6em',
                          verticalAlign: 'top',
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {gorgeous && index < sections.length - 1 ? (
            <div
              style={{
                backgroundColor: palette.accentSoft,
                height: 1,
                marginTop: '1.1em',
              }}
            />
          ) : null}
        </section>
      ))}

      {compact ? null : (
        <footer
          style={{
            borderTop: `1px solid ${palette.surface}`,
            color: palette.muted,
            fontSize: '0.78em',
            marginTop: '2em',
            paddingTop: '0.6em',
          }}
        >
          Prepared with FormatKeeper
        </footer>
      )}
    </article>
  )
}
