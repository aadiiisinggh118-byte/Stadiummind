import { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, duration = 500, decimals = 0 }) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    const start = performance.now()

    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <>{display.toFixed(decimals)}</>
}
