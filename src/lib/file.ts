/** Files bigger than this are rejected rather than blocking the main thread. */
const MAX_BYTES = 2 * 1024 * 1024

export async function readDroppedFile(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error('That file is larger than 2 MB.')
  }
  return file.text()
}

export function downloadMarkdown(source: string): void {
  const blob = new Blob([source], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'formatkeeper.md'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
