import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'

interface Press<T> {
  item: T
  x: number
  y: number
  moved: boolean
}

/**
 * Drag and drop with pointer events, so it works with mouse, pen and touch.
 * `onDrop` gets the element under the pointer at the moment of release.
 */
export function useDrag<T>(onDrop: (item: T, target: Element | null) => void) {
  const [ghost, setGhost] = useState<{ item: T; x: number; y: number } | null>(null)
  const press = useRef<Press<T> | null>(null)

  const onPointerMove = (e: PointerEvent) => {
    const p = press.current
    if (!p) return
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return
    p.moved = true
    setGhost({ item: p.item, x: e.clientX, y: e.clientY })
  }
  const release = () => {
    const p = press.current
    press.current = null
    setGhost(null)
    return p?.moved ? p : null
  }
  const onPointerUp = (e: PointerEvent) => {
    const p = release()
    if (!p) return
    // A mouse sends a click right after the drag. It must not count as a click on the handle.
    const swallow = (click: Event) => click.stopPropagation()
    window.addEventListener('click', swallow, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', swallow, { capture: true }))
    onDrop(p.item, document.elementFromPoint(e.clientX, e.clientY))
  }

  /** Attributes that make an element the handle for dragging `item`. */
  const bind = (item: T) => ({
    onPointerDown: (e: PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      press.current = { item, x: e.clientX, y: e.clientY, moved: false }
    },
    onPointerMove,
    onPointerUp,
    onPointerCancel: release,
  })

  return { ghost, bind }
}
