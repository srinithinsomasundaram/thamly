"use client"

// Re-export RichTextEditor as TiptapEditor for compatibility
export { RichTextEditor as TiptapEditor } from "./rich-text-editor"
export type { RichTextEditorProps as TiptapEditorProps } from "./rich-text-editor"

// Re-export related types
export type AISuggestion = {
  id: string
  type: "grammar" | "clarity" | "spelling" | "tone" | "translation" | "tamil-spelling"
  title: string
  original?: string
  suggested?: string
  reason: string
  position?: number
}

export type SpellingError = {
  word: string
  suggestions: string[]
  position: number
  explanation: string
}

export type TransliterationSuggestion = {
  english: string
  tamil: string
  confidence: number
}

// Export the RichTextEditor as default export
export { RichTextEditor as default } from "./rich-text-editor"