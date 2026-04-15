'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    let observer
    let frameId

    const initObserver = () => {
      observer?.disconnect()

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible')
            }
          })
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
      )

      document.querySelectorAll('.reveal, .reveal-stagger').forEach((element) => {
        observer.observe(element)
      })
    }

    frameId = window.requestAnimationFrame(initObserver)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      observer?.disconnect()
    }
  }, [pathname])

  return null
}
