"use client"

import { useEffect, useState } from "react"
import { useEditor } from "@tiptap/react"
import { useUsageStatus } from "@/hooks/use-usage-status"

interface TextIssue {
  id: string
  type: "spelling" | "grammar" | "translation"
  text: string
  from: number
  to: number
  suggestion: string
  color: string
}

interface InlineTextAnalyzerProps {
  content: string
  onIssuesFound: (issues: TextIssue[]) => void
  selectedText: string
  onTextSelection: (text: string, from: number, to: number) => void
  analyzeImmediately: boolean
}

export function InlineTextAnalyzer({
  content,
  onIssuesFound,
  selectedText,
  onTextSelection,
  analyzeImmediately
}: InlineTextAnalyzerProps) {
  const usageStatus = useUsageStatus()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisTimeout, setAnalysisTimeout] = useState<NodeJS.Timeout | null>(null)
  const [highlightedIssues, setHighlightedIssues] = useState<TextIssue[]>([])

  // Color schemes for different issue types
  const issueColors = {
    spelling: "#ef4444", // red-500
    grammar: "#f59e0b", // amber-500
    translation: "#10b981" // emerald-500
  }

  // Analyze full content when typing stops
  const analyzeFullContent = async () => {
    if (!usageStatus.isUnlimited && usageStatus.remaining <= 0) return
    if (!content.trim() || content.length < 10) return

    setIsAnalyzing(true)
    try {
      // Split content into sentences for analysis
      const sentences = content.match(/[^.!?]+[.!?]*/g) || [content]
      const allIssues: TextIssue[] = []

      // Analyze each sentence
      for (const sentence of sentences) {
        if (sentence.trim().length < 3) continue

        try {
          const response = await fetch("/api/ai/unified", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: sentence.trim() }),
          })

          if (response.ok) {
            const data = await response.json()

            // Find issues in content and mark them
            const sentenceStart = content.indexOf(sentence)

            // Spelling issues
            if (data.spelling?.corrected && data.spelling.corrected !== sentence.trim()) {
              const words = sentence.trim().split(' ')
              words.forEach((word, index) => {
                if (word.length > 2) {
                  const wordStart = sentenceStart + sentence.indexOf(word)
                  const wordEnd = wordStart + word.length

                  allIssues.push({
                    id: `spelling-${Date.now()}-${index}`,
                    type: "spelling",
                    text: word,
                    from: wordStart,
                    to: wordEnd,
                    suggestion: data.spelling.corrected,
                    color: issueColors.spelling
                  })
                }
              })
            }

            // Grammar issues
            if (data.grammar?.corrected && data.grammar.corrected !== sentence.trim()) {
              const sentenceEnd = sentenceStart + sentence.length
              allIssues.push({
                id: `grammar-${Date.now()}`,
                type: "grammar",
                text: sentence.trim(),
                from: sentenceStart,
                to: sentenceEnd,
                suggestion: data.grammar.corrected,
                color: issueColors.grammar
              })
            }

            // Translation suggestions for English/mixed content
            if (data.translation?.tamil && ["eng", "mixed", "thanglish"].includes(data.language)) {
              const sentenceEnd = sentenceStart + sentence.length
              allIssues.push({
                id: `translation-${Date.now()}`,
                type: "translation",
                text: sentence.trim(),
                from: sentenceStart,
                to: sentenceEnd,
                suggestion: data.translation.tamil,
                color: issueColors.translation
              })
            }
          }
        } catch (error) {
          console.error("Sentence analysis error:", error)
        }
      }

      setHighlightedIssues(allIssues)
      onIssuesFound(allIssues)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Analyze selected text immediately
  const analyzeSelection = async () => {
    if (!usageStatus.isUnlimited && usageStatus.remaining <= 0) return
    if (!selectedText.trim()) return

    try {
      const response = await fetch("/api/ai/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        const selectionIssues: TextIssue[] = []

        // Mark selected text issues
        const from = content.indexOf(selectedText)
        const to = from + selectedText.length

        if (data.spelling?.corrected && data.spelling.corrected !== selectedText.trim()) {
          selectionIssues.push({
            id: `selection-spelling-${Date.now()}`,
            type: "spelling",
            text: selectedText,
            from,
            to,
            suggestion: data.spelling.corrected,
            color: issueColors.spelling
          })
        }

        if (data.grammar?.corrected && data.grammar.corrected !== selectedText.trim()) {
          selectionIssues.push({
            id: `selection-grammar-${Date.now()}`,
            type: "grammar",
            text: selectedText,
            from,
            to,
            suggestion: data.grammar.corrected,
            color: issueColors.grammar
          })
        }

        if (data.translation?.tamil) {
          selectionIssues.push({
            id: `selection-translation-${Date.now()}`,
            type: "translation",
            text: selectedText,
            from,
            to,
            suggestion: data.translation.tamil,
            color: issueColors.translation
          })
        }

        onIssuesFound([...highlightedIssues, ...selectionIssues])
      }
    } catch (error) {
      console.error("Selection analysis error:", error)
    }
  }

  // Debounced analysis on content change
  useEffect(() => {
    if (analysisTimeout) {
      clearTimeout(analysisTimeout)
    }

    const newTimeout = setTimeout(() => {
      if (analyzeImmediately) {
        analyzeFullContent()
      }
    }, 1500) // Faster debounce - 1.5 seconds

    setAnalysisTimeout(newTimeout)

    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout)
      }
    }
  }, [content, analyzeImmediately])

  // Analyze selection when text is selected
  useEffect(() => {
    if (selectedText && analyzeImmediately) {
      analyzeSelection()
    }
  }, [selectedText])

  // Cleanup
  useEffect(() => {
    return () => {
      if (analysisTimeout) {
        clearTimeout(analysisTimeout)
      }
    }
  }, [])

  return null // This component is purely functional
}
