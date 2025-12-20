"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Search,
  Undo2,
  Redo2,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface CodeEditorProps {
  content: string
  onChange: (content: string) => void
  onSelect: (text: string) => void
  placeholder?: string
}

export function CodeEditor({ content, onChange, onSelect, placeholder = "Start writing..." }: CodeEditorProps) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("English")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSelect = () => {
    if (textareaRef.current) {
      const selected = textareaRef.current.value.substring(
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd,
      )
      onSelect(selected)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") {
        e.preventDefault()
        // Toggle bold
      } else if (e.key === "i") {
        e.preventDefault()
        // Toggle italic
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-background/50 rounded-lg border border-border/50 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur p-3 space-y-2">
        {/* First Row */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border/50 mx-1" />

          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <Bold className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <Italic className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <Underline className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <Strikethrough className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border/50 mx-1" />

          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <List className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <ListOrdered className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border/50 mx-1" />

          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <AlignRight className="w-4 h-4" />
          </Button>

          <div className="flex-1" />

          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <Link2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/10 transition-fast">
            <Search className="w-4 h-4" />
          </Button>

          {/* Language Dropdown */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-2 text-xs font-medium hover:bg-primary/10 transition-fast flex items-center gap-1"
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            >
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              English
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onMouseUp={handleSelect}
        onKeyUp={handleSelect}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 p-6 bg-background text-foreground placeholder-muted-foreground focus:outline-none resize-none font-mono text-sm leading-relaxed"
      />

      {/* Word Count */}
      <div className="border-t border-border/50 bg-card/30 backdrop-blur px-6 py-2 text-xs text-muted-foreground">
        {content.split(/\s+/).filter(Boolean).length} words • {content.length} characters
      </div>
    </div>
  )
}
