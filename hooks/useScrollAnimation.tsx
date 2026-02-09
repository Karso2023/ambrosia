"use client"

import { useEffect, RefObject } from 'react'

interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  onEnter?: (element: Element) => void
  onLeave?: (element: Element) => void
}

export function useScrollAnimation(
  refs: RefObject<HTMLElement | null>[],
  options: ScrollAnimationOptions = {}
) {
  const {
    threshold = 0.5,
    rootMargin = '-50px',
    onEnter,
    onLeave
  } = options

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    refs.forEach((ref) => {
      if (!ref.current) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              onEnter?.(entry.target)
            } else {
              onLeave?.(entry.target)
            }
          })
        },
        {
          threshold,
          rootMargin
        }
      )

      observer.observe(ref.current)
      observers.push(observer)
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [refs, threshold, rootMargin, onEnter, onLeave])
}