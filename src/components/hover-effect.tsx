"use client"
import { useRef, useState, CSSProperties, ReactNode } from "react"

interface HoverEffectProps {
  style?: CSSProperties
  children: ReactNode
  easing?: string
  scale?: number
  mouseDownScale?: number | null
  speed?: number
  perspective?: number
  max?: number
  className?: string
  inlineFlex?: boolean
  onMouseEnter?: () => void
  onMouseMove?: (event: React.MouseEvent) => void
  onMouseLeave?: (event: React.MouseEvent) => void
}

export default function HoverEffect({
  style = {},
  children,
  easing = "cubic-bezier(.03,.98,.52,.99)",
  scale = 1,
  mouseDownScale = null,
  speed = 400,
  perspective = 1000,
  max = 10,
  className = "",
  inlineFlex = false,
  onMouseEnter = () => {},
  onMouseMove = () => {},
  onMouseLeave = () => {},
}: HoverEffectProps) {
  const defaultStyles = {
    transformStyle: "preserve-3d",
    display: inlineFlex ? "inline-flex" : "flex",
  }
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [tiltStyles, setTiltStyles] = useState(defaultStyles)
  const element = useRef<HTMLDivElement>(null)
  const width = useRef<number>(0)
  const height = useRef<number>(0)
  const top = useRef<number>(0)
  const left = useRef<number>(0)
  const updateCall = useRef<number | null>(null)
  const transitionTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleOnMouseEnter = () => {
    updateElementPosition()
    setTransition()
    return onMouseEnter()
  }

  const handleOnMouseMove = (event: React.MouseEvent) => {
    if (isMouseDown) return
    if (updateCall.current !== null && typeof window !== "undefined") {
      window.cancelAnimationFrame(updateCall.current)
    }
    updateCall.current = requestAnimationFrame(() => updateElementStyle(event))
    return onMouseMove(event)
  }

  const handleOnMouseLeave = (event: React.MouseEvent) => {
    setIsMouseDown(false)
    setTransition()
    handleReset()
    return onMouseLeave(event)
  }

  const handleOnMouseDown = () => {
    setIsMouseDown(true)
    setTransition()
    handlePress()
  }

  const handleOnMouseUp = () => {
    setIsMouseDown(false)
    setTransition()
    handleRelease()
  }

  const updateElementStyle = (event: React.MouseEvent) => {
    const values = getValues(event)

    setTiltStyles(prevStyle => ({
      ...prevStyle,
      transform: `perspective(${perspective}px) rotateX(
        ${values.tiltY}deg) rotateY(${values.tiltX}deg) scale3d(${scale}, ${scale}, ${scale})`,
    }))
  }

  const getValues = (event: React.MouseEvent) => {
    let x = (event.clientX - left.current) / width.current
    let y = (event.clientY - top.current) / height.current

    x = Math.min(Math.max(x, 0), 1)
    y = Math.min(Math.max(y, 0), 1)

    const tiltX = (-1 * (max / 2 - x * max)).toFixed(2)
    const tiltY = (1 * (max / 2 - y * max)).toFixed(2)

    const angle =
      Math.atan2(
        event.clientX - (left.current + width.current / 2),
        -(event.clientY - (top.current + height.current / 2))
      ) *
      (180 / Math.PI)

    const percentageX = x * 100
    const percentageY = y * 100

    return {
      tiltX,
      tiltY,
      angle,
      percentageX,
      percentageY,
    }
  }

  const updateElementPosition = () => {
    const rect = element.current?.getBoundingClientRect()
    if (rect) {
      width.current = rect.width
      height.current = rect.height
      top.current = rect.top
      left.current = rect.left
    }
  }
  const setTransition = () => {
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current)

    setTiltStyles(prevStyle => ({
      ...prevStyle,
      transition: `${speed}ms ${easing}`,
    }))

    transitionTimeout.current = setTimeout(() => {
      setTiltStyles(prevStyle => ({
        ...prevStyle,
        transition: "",
      }))
    }, speed)
  }

  const handleReset = () => {
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        setTiltStyles(prevStyle => ({
          ...prevStyle,
          transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        }))
      })
    }
  }

  const handlePress = () => {
    if (!mouseDownScale) return
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        setTiltStyles(prevStyle => ({
          ...prevStyle,
          transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(${mouseDownScale}, ${mouseDownScale}, ${mouseDownScale})`,
        }))
      })
    }
  }
  const handleRelease = () => {
    if (updateCall.current !== null) {
      window.cancelAnimationFrame(updateCall.current)
    }

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        setTiltStyles(prevStyle => ({
          ...prevStyle,
          transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(${scale}, ${scale}, ${scale})`,
        }))
      })
    }
  }

  return (
    <div
      style={{
        transform: "translateZ(100px)",
        display: inlineFlex ? "inline-flex" : "flex",
      }}
      className={className}
    >
      <div
        className={`hover-3d w-full`}
        style={{
          ...style,
          ...tiltStyles,
          transformStyle: tiltStyles.transformStyle as CSSProperties["transformStyle"],
        }}
        ref={element}
        onMouseEnter={handleOnMouseEnter}
        onMouseMove={handleOnMouseMove}
        onMouseLeave={handleOnMouseLeave}
        onMouseDown={handleOnMouseDown}
        onMouseUp={handleOnMouseUp}
      >
        {children}
      </div>
    </div>
  )
}
