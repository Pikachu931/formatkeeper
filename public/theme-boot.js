;(function () {
  try {
    var stored = localStorage.getItem('formatkeeper-theme')
    var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    var dark = stored ? stored === 'dark' : !prefersLight
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  } catch {
    /* Storage or matchMedia unavailable: the dark class in the markup stands. */
  }
})()
