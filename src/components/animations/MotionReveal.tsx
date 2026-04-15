import { useRef } from 'react'
import type { ReactNode } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

type MotionRevealProps = {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  x?: number
  scale?: number
  blur?: number
  amount?: number
  once?: boolean
}

export function MotionReveal({ children, delay = 0, duration = 0.55, y = 18, x = 0, scale = 1, blur = 0, amount = 0.2, once = true }: MotionRevealProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { amount, once })

  if (reduceMotion) {
    return <div>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x, scale, filter: blur > 0 ? `blur(${blur}px)` : 'none' }}
      animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)' } : { opacity: 0, y, x, scale, filter: blur > 0 ? `blur(${blur}px)` : 'none' }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1], delay }}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}

type MotionStaggerProps = {
  children: ReactNode
  delayChildren?: number
  staggerChildren?: number
  amount?: number
  once?: boolean
}

export function MotionStagger({ children, delayChildren = 0, staggerChildren = 0.08, amount = 0.2, once = true }: MotionStaggerProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { amount, once })

  if (reduceMotion) {
    return <div>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren,
            staggerChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
