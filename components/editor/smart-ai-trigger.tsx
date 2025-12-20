"use client"

import { useEffect, useRef } from "react"
import {
  detectSentenceAtCursor,
  extractSentences,
  endsWithSentencePunctuation,
  getCompleteSentenceFromSelection
} from "@/lib/utils/sentence-detection"

interface SmartAITriggerProps {
  content: string
  selectedText: string
  onSentenceDetected: (sentence: string, fullText: string) => void
  onSelectionChange?: (selectionStart: number, selectionEnd: number) => void
  debounceMs?: number // Delay after sentence completion before triggering AI
}

export function SmartAITrigger({
  content,
  selectedText,
  onSentenceDetected,
  onSelectionChange,
  debounceMs = 800
}: SmartAITriggerProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>("")
  const lastSentenceRef = useRef<string>("")

  // Track selection changes
  useEffect(() => {
    if (!onSelectionChange || !content) return

    // Find the selected text position in content
    if (selectedText && content.includes(selectedText)) {
      const startIndex = content.indexOf(selectedText)
      const endIndex = startIndex + selectedText.length

      // Only trigger if selection is meaningful (more than 2 characters)
      if (selectedText.trim().length > 2) {
        onSelectionChange(startIndex, endIndex)
      }
    } else {
      // No selection
      onSelectionChange(-1, -1)
    }
  }, [selectedText, content, onSelectionChange])

  // Monitor content for sentence completion
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Skip if content is the same
    if (content === lastContentRef.current) {
      return
    }

    const sentences = extractSentences(content)
    const lastSentence = sentences[sentences.length - 1] || ""

    // Check if we have a new complete sentence (different from last one)
    if (lastSentence && lastSentence !== lastSentenceRef.current) {
      // Check if it ends with proper punctuation
      if (endsWithSentencePunctuation(lastSentence)) {
        // Debounce the AI trigger
        timeoutRef.current = setTimeout(() => {
          // Trigger AI analysis for the complete sentence
          onSentenceDetected(lastSentence, content)
          lastSentenceRef.current = lastSentence
        }, debounceMs)
      }
    }

    lastContentRef.current = content

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, debounceMs, onSentenceDetected])

  // Handle selection-based analysis (when user selects text)
  useEffect(() => {
    if (!selectedText || !content || !onSentenceDetected) return

    // Don't trigger AI for very short selections
    if (selectedText.trim().length < 3) return

    // Get the complete sentence containing the selection
    const startIndex = content.indexOf(selectedText)
    if (startIndex === -1) return

    const endIndex = startIndex + selectedText.length
    const completeSentence = getCompleteSentenceFromSelection(content, startIndex, endIndex)

    // Only trigger if the selection or sentence is substantial
    if (completeSentence.length >= 5) {
      // Small delay to allow user to finish selecting
      setTimeout(() => {
        onSentenceDetected(completeSentence, content)
      }, 300)
    }
  }, [selectedText, content, onSentenceDetected])

  // Component doesn't render anything
  return null
}