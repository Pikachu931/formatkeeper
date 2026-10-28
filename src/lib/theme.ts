export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'formatkeeper-theme'

/** The inline bootstrap script in index.html has already resolved the theme. */
export function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Private mode / blocked storage: theme simply is not persisted.
  }
}
