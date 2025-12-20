"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle,
  X,
  AlertTriangle,
  SpellCheck,
  Languages,
  RefreshCw
} from "lucide-react"
import { analyzeText, type AIAnalysis } from "@/lib/ai/client"

interface FloatingToolbarProps {
  content: string
  onReplaceText: (original: string, suggestion: string) => void
  position: { x: number; y: number }
  onClose: () => void
}

export function FloatingToolbar({ content, onReplaceText, position, onClose }: FloatingToolbarProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const analyzeSelection = async () => {
      if (!content.trim()) return

      setIsLoading(true)
      try {
        const result = await analyzeText(content, "grammar")
        setAnalysis(result)
      } catch (error) {
        console.error("Failed to analyze selection:", error)
      } finally {
        setIsLoading(false)
      }
    }

    analyzeSelection()
  }, [content])

  const handleAcceptSuggestion = (original: string, suggestion: string) => {
    onReplaceText(original, suggestion)
    onClose()
  }

  const issues = [
    ...(analysis?.grammarIssues || []),
    ...(analysis?.spellingIssues?.map(issue => ({
      type: "spelling" as const,
      original: issue.word,
      suggestion: issue.suggestion,
      message: `Spelling suggestion (${Math.round(issue.confidence * 100)}% confidence)`,
      position: { start: 0, end: 0 }
    })) || [])
  ]

  if (issues.length === 0 && !isLoading) {
    return null
  }

  return (
    <Card
      className="fixed z-50 w-80 shadow-lg border-2"
      style={{
        left: `${Math.min(position.x, window.innerWidth - 320)}px`,
        top: `${Math.min(position.y + 10, window.innerHeight - 200)}px`,
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">
              {isLoading ? "Analyzing..." : `${issues.length} Issues Found`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground ml-2">Analyzing text...</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {issues.map((issue, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {issue.type === "spelling" ? (
                    <SpellCheck className="w-4 h-4 text-blue-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {issue.type === "spelling" ? "Spelling" : "Grammar"}
                  </div>
                  <div className="text-sm mb-1 line-clamp-2">
                    <span className="line-through text-red-500">{issue.original}</span>
                    <span className="mx-1">→</span>
                    <span className="text-green-600 font-medium">{issue.suggestion}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{issue.message}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAcceptSuggestion(issue.original, issue.suggestion)}
                  className="flex-shrink-0 h-6 px-2 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Fix
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-3 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={onClose}
          >
            Ignore All
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              issues.forEach(issue => {
                onReplaceText(issue.original, issue.suggestion)
              })
              onClose()
            }}
          >
            Accept All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for detecting text selection
export function useTextSelection() {
  const [selection, setSelection] = useState<{
    text: string
    range: Range | null
    position: { x: number; y: number }
  } | null>(null)

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setSelection(null)
        return
      }

      const range = selection.getRangeAt(0)
      const text = range.toString().trim()

      if (text.length > 0 && text.length < 500) {
        const rect = range.getBoundingClientRect()
        setSelection({
          text,
          range,
          position: {
            x: rect.left,
            y: rect.bottom
          }
        })
      } else {
        setSelection(null)
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    document.addEventListener("mouseup", handleSelectionChange)

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      document.removeEventListener("mouseup", handleSelectionChange)
    }
  }, [])

  return selection
}