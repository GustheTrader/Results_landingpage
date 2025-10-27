document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-dashboard-root]')
  if (!root) return

  const smoothScrollLinks = root.querySelectorAll('a[href^="#"]')
  smoothScrollLinks.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href')?.substring(1)
      if (!targetId) return
      const target = document.getElementById(targetId)
      if (!target) return
      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })

  const codeBlocks = root.querySelectorAll('code')
  codeBlocks.forEach((code) => {
    code.addEventListener('click', async () => {
      const text = code.textContent?.trim()
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        code.classList.add('copied')
        code.dataset.copied = 'true'
        setTimeout(() => {
          code.classList.remove('copied')
          delete code.dataset.copied
        }, 1500)
      } catch (error) {
        console.warn('Clipboard copy failed', error)
      }
    })
  })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    },
    { threshold: 0.2 }
  )

  root.querySelectorAll('section').forEach((section) => {
    section.classList.add('reveal')
    observer.observe(section)
  })
})
