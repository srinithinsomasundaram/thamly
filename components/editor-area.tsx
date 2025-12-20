"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Toolbar } from "./toolbar"
import { InlineSuggestion } from "./inline-suggestion"

interface EditorAreaProps {
  text: string
  onChange: (text: string) => void
  acceptedCount: number
  suggestions?: Array<{
    type: "spelling" | "grammar" | "style" | "clarity"
    original: string
    suggestion: string
    reason: string
  }>
  typeSuggestions?: string[]
  onTypeSuggestions?: (suggestions: string) => void
  onAcceptInline?: (original: string, suggestion: string) => void
}

export function EditorArea({
  text,
  onChange,
  acceptedCount,
  suggestions = [],
  typeSuggestions = [],
  onTypeSuggestions,
  onAcceptInline,
}: EditorAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [inlineSuggestion, setInlineSuggestion] = useState<{
    type: "spelling" | "grammar" | "style" | "clarity"
    original: string
    suggestion: string
    reason: string
    position: { x: number; y: number }
    index: number
  } | null>(null)

  const saveCursorPosition = (): number | null => {
    const selection = window.getSelection()
    if (!selection || !editorRef.current) return null

    try {
      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(editorRef.current)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      return preCaretRange.toString().length
    } catch {
      return null
    }
  }

  const restoreCursorPosition = (offset: number | null) => {
    if (!offset || !editorRef.current) return

    requestAnimationFrame(() => {
      const selection = window.getSelection()
      if (!selection) return

      try {
        const range = document.createRange()
        let charCount = 0
        const nodeStack: Node[] = [editorRef.current!]
        let node: Node | undefined
        let foundStart = false

        while (!foundStart && (node = nodeStack.pop())) {
          if (node.nodeType === Node.TEXT_NODE) {
            const nextCharCount = charCount + (node.textContent?.length || 0)
            if (offset <= nextCharCount) {
              range.setStart(node, offset - charCount)
              foundStart = true
            }
            charCount = nextCharCount
          } else {
            let i = node.childNodes.length
            while (i--) {
              nodeStack.push(node.childNodes[i])
            }
          }
        }

        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } catch {
        // If cursor restoration fails, fallback to end position
        if (editorRef.current) {
          const range = document.createRange()
          range.selectNodeContents(editorRef.current)
          range.collapse(false)
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }
    })
  }

  useEffect(() => {
    if (suggestions.length > 0 && !inlineSuggestion) {
      const firstSuggestion = suggestions[0]
      const editorElement = editorRef.current
      if (editorElement) {
        const rect = editorElement.getBoundingClientRect()
        setInlineSuggestion({
          ...firstSuggestion,
          position: {
            x: rect.left + 300,
            y: rect.top + 100,
          },
          index: 0,
        })
      }
    }
  }, [suggestions, inlineSuggestion])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || ""
    onChange(newText)

    const lastWord = newText.split(/\s+/).pop() || ""

    if (lastWord.length > 2 && /^[a-zA-Z]+$/.test(lastWord)) {
      if (onTypeSuggestions) {
        onTypeSuggestions(lastWord)
        setShowTypeSuggestions(true)
        setSuggestionIndex(0)
      }
    } else {
      setShowTypeSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showTypeSuggestions && typeSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSuggestionIndex((prev) => (prev + 1) % typeSuggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSuggestionIndex((prev) => (prev - 1 + typeSuggestions.length) % typeSuggestions.length)
      } else if (e.key === " ") {
        e.preventDefault()
        if (typeSuggestions[0]) {
          insertSuggestion(typeSuggestions[0])
        }
      }
    }
  }

  const insertSuggestion = (word: string) => {
    const content = editorRef.current?.textContent || ""
    const cursorPos = saveCursorPosition()

    const parts = content.split(/\s+/)
    const lastWord = parts.pop() || ""

    const beforeWord = parts.join(" ")
    const newText = beforeWord ? beforeWord + " " + word + " " : word + " "

    onChange(newText)
    setShowTypeSuggestions(false)
    setSuggestionIndex(0)

    setTimeout(() => {
      editorRef.current?.focus()
      restoreCursorPosition(newText.length)
    }, 0)
  }

  const handleAcceptInlineSuggestion = () => {
    if (inlineSuggestion && onAcceptInline) {
      onAcceptInline(inlineSuggestion.original, inlineSuggestion.suggestion)
      setInlineSuggestion(null)
    }
  }

  const handleDismissInlineSuggestion = () => {
    setInlineSuggestion(null)
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
      <Toolbar />
      <div className="flex-1 overflow-auto relative">
        <div className="flex h-full">
          {/* Line numbers */}
          <div className="w-12 bg-card border-r border-border text-muted-foreground text-right px-3 py-4 text-sm font-mono overflow-hidden flex-shrink-0">
            {text.split("\n").map((_, i) => (
              <div key={i} className="h-6 leading-6">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 px-6 py-4 overflow-auto relative">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              dir="ltr"
              className="text-base leading-relaxed text-foreground bg-background outline-none resize-none min-h-full font-sans"
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                direction: "ltr",
                textAlign: "left",
              }}
              spellCheck={false}
            >
              {text || "Write or paste your Tamil text here..."}
            </div>

            {showTypeSuggestions && typeSuggestions.length > 0 && (
              <div
                className="absolute bg-card border border-border rounded-lg shadow-lg min-w-48 max-w-xs z-50"
                style={{ bottom: "auto", top: "auto" }}
              >
                <div className="p-2 space-y-1">
                  {typeSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => insertSuggestion(suggestion)}
                      className={`px-3 py-2 rounded text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                        idx === suggestionIndex ? "bg-primary text-primary-foreground" : "hover:bg-accent/10"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          idx === suggestionIndex
                            ? "bg-primary-foreground text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-tamil text-lg">{suggestion}</span>
                    </div>
                  ))}
                  <div className="px-3 py-1 text-xs text-muted-foreground text-center border-t border-border mt-2 pt-2">
                    Press <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Space</kbd> to select
                  </div>
                </div>
              </div>
            )}

            {inlineSuggestion && (
              <InlineSuggestion
                type={inlineSuggestion.type}
                original={inlineSuggestion.original}
                suggestion={inlineSuggestion.suggestion}
                reason={inlineSuggestion.reason}
                position={inlineSuggestion.position}
                onAccept={handleAcceptInlineSuggestion}
                onDismiss={handleDismissInlineSuggestion}
              />
            )}
          </div>
        </div>
      </div>
      {acceptedCount > 0 && (
        <div className="px-6 py-2 bg-accent/10 text-accent text-sm flex items-center justify-between border-t border-border">
          <span>
            {acceptedCount} suggestion{acceptedCount !== 1 ? "s" : ""} accepted
          </span>
        </div>
      )}
    </div>
  )
}
