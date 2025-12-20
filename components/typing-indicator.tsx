"use client"

import { useEffect, useState } from "react"

interface TypingIndicatorProps {
  isActive: boolean
  speed: number // characters per second
}

export function TypingIndicator({ isActive, speed }: TypingIndicatorProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""))
    }, 500)

    return () => clearInterval(interval)
  }, [isActive])

  if (!isActive) return null

  const speedLevel = speed > 30 ? "fast" : speed > 15 ? "normal" : "slow"
  const speedEmoji = {
    fast: "🔥",
    normal: "✨",
    slow: "📝",
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
      <span>{speedEmoji[speedLevel as keyof typeof speedEmoji]}</span>
      <span>Typing{dots}</span>
    </div>
  )
}
