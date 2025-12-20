"use client"

import { useEffect, useRef, useCallback } from "react"

interface AutoGrammarCheckProps {
  content: string
  onSuggestionFound: (suggestion: {
    type: 'grammar' | 'spelling'
    original: string
    suggested: string
    reason: string
  }) => void
  delay?: number // Delay in ms (default: 1000ms)
}

export function AutoGrammarCheck({
  content,
  onSuggestionFound,
  delay = 1000
}: AutoGrammarCheckProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>("")
  const isCheckingRef = useRef<boolean>(false)

  const checkGrammar = useCallback(async (text: string) => {
    if (isCheckingRef.current || text.trim().length < 2) return

    isCheckingRef.current = true

    try {
      // First, check grammar
      const grammarResponse = await fetch("/api/comprehensive-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (grammarResponse.ok) {
        const grammarData = await grammarResponse.json()

        if (grammarData.success && grammarData.result) {
          onSuggestionFound({
            type: grammarData.result.type as 'grammar' | 'spelling',
            original: grammarData.result.original,
            suggested: grammarData.result.suggestions[0],
            reason: grammarData.result.reason
          })
          return // Don't check spelling if grammar issue found
        }
      }

      // If no grammar issues, check spelling
      const spellingResponse = await fetch("/api/tamil-spelling-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (spellingResponse.ok) {
        const spellingData = await spellingResponse.json()

        if (spellingData.success && spellingData.suggestion && spellingData.suggestion !== text) {
          onSuggestionFound({
            type: 'spelling',
            original: text,
            suggested: spellingData.suggestion,
            reason: spellingData.reason || "Spelling correction suggested"
          })
        }
      }
    } catch (error) {
      console.error("Auto-grammar check error:", error)
    } finally {
      isCheckingRef.current = false
    }
  }, [onSuggestionFound])

  // Monitor content changes and trigger checks after delay
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Don't check if content is the same as last checked
    if (content === lastContentRef.current || content.trim().length < 2) {
      return
    }

    // Set new timeout for grammar check
    timeoutRef.current = setTimeout(() => {
      lastContentRef.current = content
      checkGrammar(content)
    }, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, delay, checkGrammar])

  return null // This component doesn't render anything
}