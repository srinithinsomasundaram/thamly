"use client"

import { useEffect, useRef, useCallback } from "react"

interface AutoTranslationProps {
  content: string
  onTranslationComplete: (translated: string, original: string) => void
  delay?: number // Delay in ms after typing stops (default: 1500ms)
}

export function AutoTranslation({
  content,
  onTranslationComplete,
  delay = 1500
}: AutoTranslationProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>("")
  const isTranslatingRef = useRef<boolean>(false)

  const translateText = useCallback(async (text: string) => {
    if (isTranslatingRef.current) return

    isTranslatingRef.current = true

    try {
      // Detect if text contains English
      const hasEnglish = /[a-zA-Z]/.test(text)
      const hasTamil = /[\u0B80-\u0BFF]/.test(text)

      // Only translate if English detected and has sufficient content
      if (!hasEnglish || hasEnglish && text.trim().length < 3) {
        return
      }

      const response = await fetch("/api/thanglish-to-tamil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          tone: "neutral"
        }),
      })

      if (!response.ok) return

      const data = await response.json()

      if (data.success && data.result?.tamil && data.result.tamil !== text) {
        // Don't auto-apply, just create a suggestion
        onTranslationComplete(data.result.tamil, text)
      }
    } catch (error) {
      console.error("Auto-translation error:", error)
    } finally {
      isTranslatingRef.current = false
    }
  }, [onTranslationComplete])

  // Monitor content changes and trigger translation after delay
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Don't translate if content is the same as last translated
    if (content === lastContentRef.current) {
      return
    }

    // Set new timeout for translation
    if (content.trim()) {
      timeoutRef.current = setTimeout(() => {
        lastContentRef.current = content
        translateText(content)
      }, delay)
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, delay, translateText])

  return null // This component doesn't render anything
}