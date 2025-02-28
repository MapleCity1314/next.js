import { useState, useRef, useCallback } from 'react'

interface Options {
  enterDelay?: number
  exitDelay?: number
  onUnmount?: () => void
}

/**
 * Useful to perform CSS transitions on React components without
 * using libraries like Framer Motion. This hook will defer the
 * unmount of a React component until after a delay.
 *
 * @param active - Whether the component should be rendered
 * @param options - Options for the delayed render
 * @param options.enterDelay - Delay before rendering the component
 * @param options.exitDelay - Delay before unmounting the component
 *
 * const Modal = ({ active }) => {
 * const { mounted, rendered } = useDelayedRender(active, {
 *  exitDelay: 2000,
 * })
 *
 * if (!mounted) return null
 *
 * return (
 *   <Portal>
 *     <div className={rendered ? 'modal visible' : 'modal'}>...</div>
 *   </Portal>
 * )
 *}
 *
 * */
export function useDelayedRender(active = false, options: Options = {}) {
  const [mounted, setMounted] = useState(active)
  const [rendered, setRendered] = useState(false)

  const renderTimerRef = useRef<NodeJS.Timeout | null>(null)
  const unmountTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prevActiveRef = useRef(active)

  const recalculate = useCallback(() => {
    const { enterDelay = 1, exitDelay = 0 } = options

    if (prevActiveRef.current) {
      // Mount immediately
      setMounted(true)
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current)

      if (enterDelay <= 0) {
        // Render immediately
        setRendered(true)
      } else {
        if (renderTimerRef.current) return

        // Render after a delay
        renderTimerRef.current = setTimeout(() => {
          setRendered(true)
          renderTimerRef.current = null
        }, enterDelay)
      }
    } else {
      // Immediately set to unrendered
      setRendered(false)

      if (exitDelay <= 0) {
        setMounted(false)
      } else {
        if (unmountTimerRef.current) return

        // Unmount after a delay
        unmountTimerRef.current = setTimeout(() => {
          setMounted(false)
          unmountTimerRef.current = null
        }, exitDelay)
      }
    }
  }, [options])

  // When the active prop changes, need to re-calculate
  if (active !== prevActiveRef.current) {
    prevActiveRef.current = active
    // We want to do this synchronously with the render, not in an effect
    // this way when active → true, mounted → true in the same pass
    recalculate()
  }

  return {
    mounted,
    rendered,
  }
}
