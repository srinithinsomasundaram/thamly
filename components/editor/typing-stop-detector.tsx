"use client"

import { useEffect, useRef, useState } from "react"

interface TypingStopDetectorProps {
  text: string
  onStopTyping: (text: string) => void
  debounceMs?: number
  minLength?: number
}

export function TypingStopDetector({
  text,
  onStopTyping,
  debounceMs = 1500, // Wait 1.5 seconds after typing stops
  minLength = 3 // Minimum characters to analyze
}: TypingStopDetectorProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTextRef = useRef<string>("")
  const [isDetecting, setIsDetecting] = useState(false)

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // If text is too short, don't analyze
    if (text.trim().length < minLength) {
      lastTextRef.current = text
      setIsDetecting(false)
      return
    }

    // If text hasn't changed, don't trigger again
    if (text === lastTextRef.current) {
      return
    }

    // Set new timeout
    setIsDetecting(true)
    timeoutRef.current = setTimeout(() => {
      // Check if text is still the same (user didn't type again)
      if (text === lastTextRef.current && text.trim().length >= minLength) {
        // Get the last sentence or phrase
        const sentences = text.match(/[^.!?]+[.!?]*/g) || []
        const lastSentence = sentences[sentences.length - 1]?.trim() || text.trim()

        // Split into words and analyze
        const words = lastSentence.split(/\s+/)
        const textToAnalyze = words.length > 5 ? words.slice(-5).join(' ') : lastSentence

        onStopTyping(textToAnalyze)
      }
      setIsDetecting(false)
    }, debounceMs)

    // Update last text ref
    lastTextRef.current = text

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, onStopTyping, debounceMs, minLength])

  return null // This component doesn't render anything
}