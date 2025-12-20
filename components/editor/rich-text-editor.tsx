"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"

type AIType = "expand" | "summarize" | "improve" | "creative"

interface RichTextEditorProps {
  initialContent?: string
  initialTitle?: string
  onSave: (title: string, content: string) => Promise<void>
}

export function RichTextEditor({ initialContent = "", initialTitle = "", onSave }: RichTextEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState("")

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      await onSave(title, content)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }, [title, content, onSave])

  const handleAIGenerate = useCallback(
    async (type: AIType) => {
      if (!selectedText && type !== "creative") {
        setError("Please select text or provide a prompt")
        return
      }

      setIsGenerating(true)
      setError(null)

      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: selectedText || content,
            type,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Generation failed")
        }

        const { text } = await response.json()

        if (selectedText) {
          // Replace selected text
          setContent(content.replace(selectedText, text))
          setSelectedText("")
        } else {
          // Append generated text
          setContent(content + (content ? "\n\n" : "") + text)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed")
      } finally {
        setIsGenerating(false)
      }
    },
    [selectedText, content],
  )

  const handleTextSelect = () => {
    const textarea = document.getElementById("editor-content") as HTMLTextAreaElement
    if (textarea) {
      setSelectedText(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd))
    }
  }

  return (
    <div className="space-y-4">
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter draft title..."
        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-fast"
      />

      {/* Editor Toolbar */}
      <Card className="border-border/50 backdrop-blur bg-card/50 p-4">
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">AI Assistant</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAIGenerate("expand")}
              disabled={isGenerating}
              className="transition-fast"
            >
              {isGenerating ? <Spinner className="w-4 h-4" /> : "Expand"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAIGenerate("summarize")}
              disabled={isGenerating}
              className="transition-fast"
            >
              {isGenerating ? <Spinner className="w-4 h-4" /> : "Summarize"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAIGenerate("improve")}
              disabled={isGenerating}
              className="transition-fast"
            >
              {isGenerating ? <Spinner className="w-4 h-4" /> : "Improve"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAIGenerate("creative")}
              disabled={isGenerating}
              className="transition-fast"
            >
              {isGenerating ? <Spinner className="w-4 h-4" /> : "Generate"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Editor */}
      <Textarea
        id="editor-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onMouseUp={handleTextSelect}
        onKeyUp={handleTextSelect}
        placeholder="Start writing or use AI to generate content..."
        className="w-full min-h-96 p-4 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-fast resize-none"
      />

      {/* Error State */}
      {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm fade-in">{error}</div>}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || isGenerating}
          className="bg-primary hover:bg-primary/90 transition-fast"
        >
          {isSaving ? "Saving..." : "Save Draft"}
        </Button>
      </div>
    </div>
  )
}
