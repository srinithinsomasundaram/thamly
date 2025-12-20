"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import TextAlign from "@tiptap/extension-text-align"
import LinkExtension from "@tiptap/extension-link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  LinkIcon,
  Sparkles,
  CheckCircle,
  X,
  Languages,
  Wand2,
  Copy,
  LogIn,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import NextLink from "next/link"

// Mock transliteration suggestions for demo
const getInstantSuggestions = (word: string) => {
  const suggestions: Array<{ english: string; tamil: string; confidence: number }> = []

  const commonWords: Record<string, string> = {
    'naan': 'நான்',
    'neenga': 'நீங்கள்',
    'enna': 'என்ன',
    'epdi': 'எப்படி',
    'enga': 'எங்கே',
    'vaanga': 'வாங்க',
    'poitu': 'போயிட்டு',
    'vanthu': 'வந்து',
    'irukken': 'இருக்கேன்',
    'irukku': 'இருக்கு',
    'welcome': 'வரவேற்பு',
    'hello': 'வணக்கம்',
    'thank': 'நன்றி',
    'you': 'நீங்கள்',
    'how': 'எப்படி',
    'are': 'இருக்கிறீர்கள்',
    'what': 'என்ன',
    'is': 'இது',
    'this': 'இது',
    'that': 'அது',
    'good': 'நல்ல',
    'morning': 'காலை',
    'night': 'இரவு',
    'today': 'இன்று',
    'tomorrow': 'நாளை',
    'yesterday': 'நேற்று',
    'please': 'தயவு செய்து',
    'sorry': 'மன்னிக்கவும்',
    'yes': 'ஆம்',
    'no': 'இல்லை',
    'friend': 'நண்பர்',
    'family': 'குடும்பம்',
    'love': 'காதல்',
    'happy': 'மகிழ்ச்சி',
    'sad': 'சோகம்'
  }

  const lowerWord = word.toLowerCase()
  if (commonWords[lowerWord]) {
    suggestions.push({
      english: word,
      tamil: commonWords[lowerWord],
      confidence: 0.95
    })
  }

  return suggestions
}

// Mock AI suggestions for demo
const getAISuggestions = async (word: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))
  return getInstantSuggestions(word)
}

export interface AdvancedDemoEditorRef {
  applySuggestion: (suggestion: { english: string; tamil: string; confidence: number }) => void
}

interface AdvancedDemoEditorProps {
  className?: string
  maxContentLength?: number
}

export const AdvancedDemoEditor = forwardRef<AdvancedDemoEditorRef, AdvancedDemoEditorProps>(({
  className,
  maxContentLength = 1000
}, ref) => {
  const [content, setContent] = useState("")
  const [suggestions, setSuggestions] = useState<Array<{ english: string; tamil: string; confidence: number }>>([])
  const [selectedText, setSelectedText] = useState("")
  const [wordAtCursor, setWordAtCursor] = useState("")
  const [isTamilMode, setIsTamilMode] = useState(true)
  const [currentWordRange, setCurrentWordRange] = useState<{ start: number; end: number } | null>(null)
  const [liveTranslation, setLiveTranslation] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationHistory, setTranslationHistory] = useState<Array<{ original: string; translated: string; timestamp: number }>>([])
  const [textCount, setTextCount] = useState(0)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const currentWordRef = useRef("")
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Strike,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Start typing in English, Tamil, or Thanglish to experience the AI magic...",
        emptyEditorClass: "is-empty",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      const textContent = editor.getText()
      const truncatedContent = textContent.length > maxContentLength
        ? textContent.substring(0, maxContentLength)
        : textContent

      setContent(truncatedContent)
      handleSelectionChange()

      // Check text count for login prompt
      const sentences = truncatedContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
      if (sentences.length >= 2 && textCount < 2) {
        setTextCount(sentences.length)
        setShowLoginPrompt(true)
      }

      // Handle transliteration suggestions
      if (isTamilMode && truncatedContent.length > 0) {
        try {
          const { from } = editor.state.selection
          const docSize = editor.state.doc.content.size
          const safeFrom = Math.min(from, docSize)
          const textBefore = editor.state.doc.textBetween(0, safeFrom, " ")
          const words = textBefore.split(/\s+/)
          const currentWord = words[words.length - 1] || ""

          if (currentWord.length >= 2) {
            setCurrentWordRange({
              start: safeFrom - currentWord.length,
              end: safeFrom,
            })

            const localSuggestions = getInstantSuggestions(currentWord)
            if (localSuggestions.length > 0) {
              setSuggestions(localSuggestions)
            }

            if (currentWordRef.current !== currentWord) {
              currentWordRef.current = currentWord
              getAISuggestions(currentWord)
                .then((aiSuggestions) => {
                  if (currentWordRef.current === currentWord && aiSuggestions.length > 0) {
                    setSuggestions(aiSuggestions)
                  }
                })
                .catch((error) => {
                  console.error("Failed to get AI suggestions:", error)
                })
            }
          } else {
            setSuggestions([])
            setCurrentWordRange(null)
            currentWordRef.current = ""
          }
        } catch (error) {
          console.error("Failed to get suggestions:", error)
          setSuggestions([])
          setCurrentWordRange(null)
        }
      }
    },
    onSelectionUpdate: ({ editor }) => {
      handleSelectionChange()
    },
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none transition-all duration-200",
      },
    },
  })

  const handleSelectionChange = () => {
    if (!editor) return

    const { from, to } = editor.state.selection
    if (from !== to) {
      const selectedText = editor.state.doc.textBetween(from, to, " ")
      const textContent = editor.getText()
      const words = textContent.substring(0, from).split(/\s+/)
      const wordAtCursor = words[words.length - 1] || ""

      setSelectedText(selectedText)
      setWordAtCursor(wordAtCursor)
    } else {
      setSelectedText("")
      setWordAtCursor("")
    }
  }

  // Live translation effect
  useEffect(() => {
    if (!content || content.trim().length < 2) {
      setLiveTranslation("")
      setIsTranslating(false)
      return
    }

    const translateText = async () => {
      const trimmedContent = content.trim()

      // Check if it contains English or Thanglish
      const hasEnglishContent = /^[a-zA-Z\s.,!?]+$/.test(trimmedContent)
      const commonThanglishWords = ['naan', 'neenga', 'enna', 'epdi', 'enga', 'vaanga', 'poitu', 'vanthu', 'irukken']
      const words = trimmedContent.toLowerCase().split(/\s+/)
      const hasThanglishWords = words.some(word => commonThanglishWords.includes(word))

      if ((hasEnglishContent || hasThanglishWords) && words.length >= 2) {
        setIsTranslating(true)

        // Simulate translation API call
        setTimeout(() => {
          const mockTranslation = trimmedContent
            .replace(/welcome/gi, 'வணக்கம்')
            .replace(/hello/gi, 'வணக்கம்')
            .replace(/naan/gi, 'நான்')
            .replace(/neenga/gi, 'நீங்கள்')
            .replace(/how are you/gi, 'நீங்கள் எப்படி இருக்கிறீர்கள்')
            .replace(/thank you/gi, 'நன்றி')
            .replace(/good morning/gi, 'காலை வணக்கம்')
            .replace(/good night/gi, 'இரவு வணக்கம்')
            .replace(/this is/gi, 'இது')
            .replace(/what is/gi, 'என்ன')
            .replace(/i am/gi, 'நான்')
            .replace(/i love/gi, 'நான் காதலிக்கிறேன்')
            + (trimmedContent.length > 50 ? '...' : '')

          setLiveTranslation(mockTranslation)
          setIsTranslating(false)

          // Add to history
          setTranslationHistory(prev => [
            { original: trimmedContent, translated: mockTranslation, timestamp: Date.now() },
            ...prev.slice(0, 4) // Keep only last 5 translations
          ])
        }, 1200)
      } else {
        setLiveTranslation("")
        setIsTranslating(false)
      }
    }

    const timeout = setTimeout(translateText, 1000)
    return () => clearTimeout(timeout)
  }, [content])

  useImperativeHandle(ref, () => ({
    applySuggestion: (suggestion) => {
      if (!editor || !currentWordRange) return

      try {
        const tr = editor.state.tr
        tr.delete(currentWordRange.start, currentWordRange.end)
        tr.insertText(suggestion.tamil + " ", currentWordRange.start)
        editor.view.dispatch(tr)
        editor.view.focus()

        setSuggestions([])
        setCurrentWordRange(null)
        currentWordRef.current = ""
      } catch (error) {
        console.error("Error applying suggestion:", error)
      }
    }
  }))

  const handleApplySuggestion = (suggestion: { english: string; tamil: string; confidence: number }) => {
    if (!editor || !currentWordRange) return

    try {
      const tr = editor.state.tr
      tr.delete(currentWordRange.start, currentWordRange.end)
      tr.insertText(suggestion.tamil + " ", currentWordRange.start)
      editor.view.dispatch(tr)
      editor.view.focus()

      setSuggestions([])
      setCurrentWordRange(null)
      currentWordRef.current = ""
    } catch (error) {
      console.error("Error applying suggestion:", error)
    }
  }

  const handleApplyLiveTranslation = () => {
    if (liveTranslation && editor) {
      editor.chain().focus().setContent(liveTranslation, false)
      setLiveTranslation("")
    }
  }

  const handleCopyTranslation = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!editor) {
    return null
  }

  return (
    <div className={`w-full max-w-7xl mx-auto ${className}`}>
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground max-w-md w-full shadow-2xl animate-slide-up">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold">You're doing great! 🎉</h3>
                <p className="text-primary-foreground/90 leading-relaxed">
                  You've experienced the magic of Thamly AI! Ready to unlock unlimited writing power, save your work, and access all premium features?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="font-semibold">✨ Unlimited AI</div>
                  <div className="text-primary-foreground/80 text-xs">No more limits</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="font-semibold">💾 Save Work</div>
                  <div className="text-primary-foreground/80 text-xs">Never lose content</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="font-semibold">🚀 All Features</div>
                  <div className="text-primary-foreground/80 text-xs">Premium tools</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="font-semibold">🎯 Smart Templates</div>
                  <div className="text-primary-foreground/80 text-xs">200+ templates</div>
                </div>
              </div>

              <div className="space-y-3">
                <Button size="lg" className="w-full bg-white text-primary hover:bg-slate-100 font-semibold" asChild>
                  <NextLink href="/auth/sign-up">
                    Sign Up Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </NextLink>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/20 text-primary-foreground hover:bg-white/10 font-semibold"
                  asChild
                >
                  <NextLink href="/auth/login">
                    <LogIn className="w-5 h-5 mr-2" />
                    Log In
                  </NextLink>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                >
                  Continue with demo
                </Button>
              </div>

              <p className="text-xs text-primary-foreground/70">
                Join 10,000+ writers already using Thamly AI
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Advanced AI Writing Studio</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Interactive Demo
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Editor Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rich Text Editor */}
            <div className="lg:col-span-2">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Rich Text Editor</h3>
                  <div className="flex items-center gap-2">
                    {textCount >= 2 && !showLoginPrompt && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        Demo Mode
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {content.length} / {maxContentLength} characters
                    </div>
                  </div>
                </div>

                <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                  {/* Integrated Toolbar */}
                  <div className="flex items-center gap-1 border-b border-gray-200 p-2 bg-gray-50 flex-wrap">
                    <button
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                      title="Undo"
                    >
                      <Undo className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                      title="Redo"
                    >
                      <Redo className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded transition-colors ${editor.isActive("bold")
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-200 text-gray-600"
                        }`}
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded transition-colors ${editor.isActive("italic")
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-200 text-gray-600"
                        }`}
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className={`p-1.5 rounded transition-colors ${editor.isActive("underline")
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-200 text-gray-600"
                        }`}
                      title="Underline"
                    >
                      <UnderlineIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={`p-1.5 rounded transition-colors ${editor.isActive("strike")
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-200 text-gray-600"
                        }`}
                      title="Strikethrough"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <button
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded transition-colors ${editor.isActive("bulletList")
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-200 text-gray-600"
                        }`}
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded transition-colors ${editor.isActive("orderedList")
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-200 text-gray-600"
                        }`}
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <button
                      onClick={() => editor.chain().focus().setTextAlign("left").run()}
                      className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: "left" })
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-200 text-gray-600"
                        }`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const url = window.prompt("Enter URL:")
                        if (url) {
                          editor.chain().focus().setLink({ href: url }).run()
                        }
                      }}
                      className={`p-1.5 rounded transition-colors ${editor.isActive("link")
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-200 text-gray-600"
                        }`}
                      title="Insert Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>

                    <div className="flex-1" />

                    <button
                      onClick={() => setIsTamilMode(!isTamilMode)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors rounded ${isTamilMode
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      {isTamilMode ? "தமிழ்" : "English"}
                    </button>
                  </div>

                  <EditorContent
                    editor={editor}
                    className="flex-1 overflow-auto p-6 prose prose-base lg:prose-lg max-w-none focus:outline-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:p-0 [&_.ProseMirror]:text-gray-800 [&_.ProseMirror]:leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* AI Assistant Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200/60 rounded-xl shadow-lg flex flex-col h-full overflow-hidden backdrop-blur-sm">
                {/* Header */}
                <div className="border-b border-slate-200/60 px-4 py-4 flex items-center gap-3 bg-gradient-to-r from-white to-slate-50/80">
                  <div className="relative">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      AI Assistant
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time writing assistance
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {/* Selected Text */}
                    {selectedText && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-blue-800 mb-1">Selected Text</p>
                            <p className="text-sm text-blue-900 font-medium break-words">
                              "{selectedText.length > 60 ? selectedText.substring(0, 60) + "..." : selectedText}"
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedText("")}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Live Translation */}
                    {(liveTranslation || isTranslating) && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Languages className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs font-semibold text-emerald-800">
                            {isTranslating ? 'Translating...' : 'Translation Ready'}
                          </p>
                        </div>
                        {isTranslating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <span className="text-xs text-emerald-700">Converting text...</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-emerald-900 font-medium">{liveTranslation}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleApplyLiveTranslation}
                                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                              >
                                Apply
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyTranslation(liveTranslation)}
                                className="text-xs"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Transliteration Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Tamil Suggestions</p>
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            onClick={() => handleApplySuggestion(suggestion)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900">{suggestion.tamil}</p>
                                <p className="text-xs text-slate-500">from "{suggestion.english}"</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Translation History */}
                    {translationHistory.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Recent Translations</p>
                        {translationHistory.map((item, index) => (
                          <div key={item.timestamp} className="p-2 bg-muted/30 rounded-lg text-xs">
                            <p className="text-muted-foreground line-clamp-1">{item.original}</p>
                            <p className="text-foreground font-medium line-clamp-1">{item.translated}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty State */}
                    {suggestions.length === 0 && !liveTranslation && !isTranslating && !selectedText && translationHistory.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-900 mb-1">Start Typing!</p>
                        <p className="text-xs text-slate-600">Try typing in English or Thanglish to see AI magic</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200/60 px-4 py-3 bg-gradient-to-r from-slate-50 to-white/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${content.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-xs text-slate-500">
                        {content.length > 0 ? 'Monitoring' : 'Waiting for input'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">AI v2.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Templates */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Quick Templates:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => editor.chain().focus().setContent("Welcome to Thamly! Your personal AI writing assistant.\n\nStart typing in English, Tamil, or Thanglish to experience:\n• Real-time translation\n• Smart suggestions\n• Grammar checking\n• Text improvement", false)}
                className="text-xs"
              >
                Welcome Message
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => editor.chain().focus().setContent("Naan ungalai sandhithathukku magizhchi. Thamly AI assistant nanbanaga irukum.", false)}
                className="text-xs"
              >
                Tamil Greeting
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => editor.chain().focus().setContent("Dear Team,\n\nI hope this message finds you well. I wanted to share an exciting tool called Thamly that can help us create better content faster.\n\nBest regards", false)}
                className="text-xs"
              >
                Email Template
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => editor.chain().focus().setContent("# AI Writing Revolution\n\nIn today's digital world, artificial intelligence is transforming how we create and communicate.", false)}
                className="text-xs"
              >
                Blog Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

AdvancedDemoEditor.displayName = "AdvancedDemoEditor"