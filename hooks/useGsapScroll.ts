'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * GSAP scroll animations for the landing page.
 * Adds: progress bar at top, smooth section parallax, and header accent reveals.
 * Runs only when GSAP is available and motion is not reduced.
 */
export function useGsapScroll() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) return

    gsap.registerPlugin(ScrollTrigger)

    // 1. Scroll progress bar
    let progress = document.getElementById('gsap-progress')
    if (!progress) {
      progress = document.createElement('div')
      progress.id = 'gsap-progress'
      progress.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        height: 3px;
        width: 0%;
        background: linear-gradient(90deg, #22C55E, #4ADE80);
        z-index: 100;
        box-shadow: 0 0 10px rgba(34,197,94,0.5);
      `
      document.body.appendChild(progress)
    }

    const tween = gsap.to(progress, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        start: 0,
        end: 'max',
        scrub: 0.3,
      },
    })

    // 2. Parallax on background glows
    const glows = document.querySelectorAll('[data-parallax]')
    const glowTweens: gsap.core.Tween[] = []
    glows.forEach((el, i) => {
      const speed = parseFloat(el.getAttribute('data-parallax') || '0.3')
      const t = gsap.to(el, {
        yPercent: -speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
      glowTweens.push(t)
    })

    return () => {
      tween.kill()
      glowTweens.forEach((t) => t.kill())
      ScrollTrigger.getAll().forEach((st) => st.kill())
      progress.remove()
    }
  }, [])
}
