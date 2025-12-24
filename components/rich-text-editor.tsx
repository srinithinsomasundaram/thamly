"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import BoldExtension from "@tiptap/extension-bold"
import ItalicExtension from "@tiptap/extension-italic"
import UnderlineExtension from "@tiptap/extension-underline"
import StrikeExtension from "@tiptap/extension-strike"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import {
  Newspaper,
  Undo,
  Redo,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Search as SearchIcon,
  Mic,
  Square,
} from "lucide-react"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import {
  getAISuggestions,
  getCurrentWord,
  getInstantSuggestions,
  type TransliterationSuggestion,
} from "@/lib/tamil-transliterator"
import { SpellingMark } from "@/lib/spelling-mark-extension"
import { SelectionMark } from "@/lib/selection-mark-extension"
import { TextIssueHighlight } from "./editor/text-issue-highlight"
import { useUsageStatus } from "@/hooks/use-usage-status"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export interface SpellingError {
  word: string
  suggestions: string[]
  position: number
  explanation: string
}

export interface RichTextEditorRef {
  applySuggestion: (suggestion: TransliterationSuggestion) => void
  applySpellingCorrection: (suggestion: string, range: { from: number; to: number }) => void
}

export interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  spellingErrors?: SpellingError[]
  onTextSelection?: (selectedText: string, wordAtCursor: string) => void
  selectedText?: string
  onSuggestionsChange?: (suggestions: TransliterationSuggestion[]) => void
  onSpellingErrorClick?: (error: { word: string; suggestions: string[]; explanation: string; range: { from: number; to: number } }) => void
  showToolbar?: boolean
  textIssues?: any[]  // Add text issues for highlighting
  onTextIssueClick?: (issue: any) => void
  mode?: string
  onModeToggle?: () => void
  readOnly?: boolean
  toolbarMode?: "full" | "voice"
}

const FREE_MAX_DURATION = 30
const PRO_MAX_DURATION = 300

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value,
  onChange,
  spellingErrors = [],
  onTextSelection,
  selectedText,
  onSuggestionsChange,
  onSpellingErrorClick,
  showToolbar = true,
  textIssues = [],
  onTextIssueClick,
  mode,
  onModeToggle,
  readOnly = false,
  toolbarMode = "full",
}, ref) => {
  const [isTamilMode, setIsTamilMode] = useState(true)
  const [currentWordRange, setCurrentWordRange] = useState<{ start: number; end: number } | null>(null)
  const currentWordRef = useRef("")
  const editorRef = useRef<HTMLDivElement>(null)
  const [inlineSuggestions, setInlineSuggestions] = useState<TransliterationSuggestion[]>([])
  const [inlinePosition, setInlinePosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [inlineSelected, setInlineSelected] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [replaceTerm, setReplaceTerm] = useState("")
  const [linkInput, setLinkInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recordingLimitRef = useRef<NodeJS.Timeout | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const activeStreamRef = useRef<MediaStream | null>(null)
  const usageStatus = useUsageStatus()
  const isPro = usageStatus.isUnlimited || usageStatus.tier !== "free"
  const voiceMaxSeconds = isPro ? PRO_MAX_DURATION : FREE_MAX_DURATION
  const remainingChecks = usageStatus.isUnlimited ? Infinity : Math.max(0, usageStatus.remaining)

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
      }),
      BoldExtension,
      ItalicExtension,
      UnderlineExtension,
      StrikeExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Start typing or paste your text here...",
        emptyEditorClass: "is-empty",
      }),
      SpellingMark,
      SelectionMark,
      TextIssueHighlight.configure({
        enableBlink: true,
      }),
    ],
    onUpdate: ({ editor }) => {
      const textContent = editor.getText()
      onChange(textContent)

      // Handle text selection
      const { from, to } = editor.state.selection
      if (from !== to && onTextSelection) {
        const selectedText = editor.state.doc.textBetween(from, to, " ")
        const wordAtCursor = getCurrentWord(textContent.substring(0, from), from)
        onTextSelection(selectedText, wordAtCursor.word)
      }

      if (isTamilMode) {
        try {
          const { from } = editor.state.selection
          const docSize = editor.state.doc.content.size

          if (from < 0 || from > docSize) {
            return
          }

          const safeFrom = Math.min(from, docSize)
          const textBefore = editor.state.doc.textBetween(0, safeFrom, " ")
          const currentWord = getCurrentWord(textBefore, textBefore.length)

          if (currentWord.word.length >= 2) {
            const localSuggestions = getInstantSuggestions(currentWord.word)

            if (localSuggestions.length > 0) {
              setCurrentWordRange({
                start: safeFrom - currentWord.word.length,
                end: safeFrom,
              })
              const slice = localSuggestions.slice(0, 4)
              setInlineSuggestions(slice)
              setInlineSelected(0)
              try {
                const coords = editor.view.coordsAtPos(safeFrom)
                const containerRect = editorRef.current?.getBoundingClientRect()
                if (coords && containerRect) {
                  setInlinePosition({
                    top: coords.bottom - containerRect.top + 8,
                    left: coords.left - containerRect.left - 4,
                  })
                }
              } catch (err) {
                console.error("Failed to set inline suggestion position:", err)
              }
              onSuggestionsChange?.(localSuggestions)
            }

            if (currentWordRef.current !== currentWord.word) {
              currentWordRef.current = currentWord.word

              getAISuggestions(currentWord.word)
                .then((aiSuggestions) => {
                  if (currentWordRef.current === currentWord.word && aiSuggestions.length > 0) {
                    onSuggestionsChange?.(aiSuggestions)
                  }
                })
                .catch((error) => {
                  console.error("Failed to get AI suggestions:", error)
                })
            }
          } else {
            onSuggestionsChange?.([])
            setCurrentWordRange(null)
            currentWordRef.current = ""
            setInlineSuggestions([])
            setInlineSelected(0)
          }
        } catch (error) {
          console.error("Failed to get suggestions:", error)
          onSuggestionsChange?.([])
          setCurrentWordRange(null)
          setInlineSuggestions([])
          setInlineSelected(0)
        }
      } else {
        // English mode: clear inline suggestions
        setInlineSuggestions([])
        setCurrentWordRange(null)
        currentWordRef.current = ""
        onSuggestionsChange?.([])
        setInlineSelected(0)
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from !== to && onTextSelection) {
        const selectedText = editor.state.doc.textBetween(from, to, " ")
        const textContent = editor.getText()
        const wordAtCursor = getCurrentWord(textContent.substring(0, from), from)
        onTextSelection(selectedText, wordAtCursor.word)
      }
    },
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none transition-all duration-200 bg-white text-slate-900 p-4 min-h-[500px]",
      },
    },
  })

  useImperativeHandle(ref, () => ({
    applySuggestion: (suggestion: TransliterationSuggestion) => {
      if (!editor || !currentWordRange) return

      try {
        const tr = editor.state.tr
        tr.delete(currentWordRange.start, currentWordRange.end)
        tr.insertText(suggestion.tamil + " ", currentWordRange.start)
        editor.view.dispatch(tr)
        editor.view.focus()

        // Reset state
        onSuggestionsChange?.([])
        setCurrentWordRange(null)
        currentWordRef.current = ""
        setInlineSuggestions([])

        // Restart detection so English/Tamil mode keeps listening
        try {
          editor.view.dispatch(editor.state.tr.setMeta("forceUpdate", true))
          if (isTamilMode) {
            setTimeout(() => {
              const { from } = editor.state.selection
              const textContent = editor.state.doc.textBetween(0, from, " ")
              const currentWord = getCurrentWord(textContent, textContent.length)
              if (currentWord.word.length >= 2) {
                const local = getInstantSuggestions(currentWord.word)
                setInlineSuggestions(local.slice(0, 4))
              }
            }, 50)
          }
        } catch (err) {
          console.error("Failed to restart listener after apply:", err)
        }
      } catch (error) {
        console.error("Error applying suggestion:", error)
      }
    },
    applySpellingCorrection: (suggestion: string, range: { from: number; to: number }) => {
      if (!editor) return
      editor
        .chain()
        .focus()
        .deleteRange({ from: range.from, to: range.to })
        .insertContent(suggestion)
        .run()
    }
  }))

  useEffect(() => {
    if (!editor || spellingErrors.length === 0) return

    const text = editor.getText()
    const transaction = editor.state.tr

    spellingErrors.forEach((error) => {
      const index = text.indexOf(error.word)
      if (index !== -1) {
        const from = index + 1
        const to = from + error.word.length
        transaction.addMark(
          from,
          to,
          editor.schema.marks.spellingMark.create({
            word: error.word,
            suggestions: error.suggestions,
            explanation: error.explanation,
          }),
        )
      }
    })

    editor.view.dispatch(transaction)
  }, [editor, spellingErrors])

  // Update text issues in the extension when they change (avoid infinite loops)
  const lastIssuesKeyRef = useRef<string>("")
  const lastIssueClickRef = useRef<typeof onTextIssueClick | null>(null)
  useEffect(() => {
    if (!editor) return
    const key = JSON.stringify(textIssues || [])
    const handlerChanged = lastIssueClickRef.current !== onTextIssueClick
    if (!handlerChanged && lastIssuesKeyRef.current === key) return

    lastIssuesKeyRef.current = key
    lastIssueClickRef.current = onTextIssueClick

    editor.view.dispatch(
      editor.state.tr.setMeta("textIssueHighlight", {
        issues: textIssues || [],
        onIssueClick: onTextIssueClick,
        enableBlink: true
      })
    )
  }, [editor, textIssues, onTextIssueClick])

  // Sync editor content with value prop
  useEffect(() => {
    if (!editor) return
    const currentContent = editor.getText()
    if (currentContent !== value) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!readOnly)
  }, [editor, readOnly])

  useEffect(() => {
    if (!editor || !editorRef.current) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const spellingError = target.closest('[data-spelling-error="true"]')

      if (spellingError) {
        const word = spellingError.getAttribute("data-word")
        const suggestions = JSON.parse(spellingError.getAttribute("data-suggestions") || "[]")
        const explanation = spellingError.getAttribute("data-explanation")

        if (word) {
          const text = editor.getText()
          const index = text.indexOf(word)
          const from = index + 1
          const to = from + word.length

          onSpellingErrorClick?.({
            word,
            suggestions,
            explanation: explanation || "",
            range: { from, to }
          })
        }
      } else {
        // Clear selection when clicking outside selected text
        if (onTextSelection && !target.closest('[data-selection-mark="true"]')) {
          const { from, to } = editor.state.selection
          if (from === to) {
            onTextSelection("", "")
          }
        }
        if (target.closest('.ProseMirror')) {
          editor.chain().focus().run()
        }
      }
    }

    const editorElement = editorRef.current
    editorElement.addEventListener("click", handleClick)

    return () => {
      editorElement.removeEventListener("click", handleClick)
    }
  }, [editor, onSpellingErrorClick])

  const handleFind = () => {
    if (!editor || !searchTerm.trim()) return
    const docText = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\n")
    const lower = docText.toLowerCase()
    const term = searchTerm.toLowerCase()
    const start = Math.max(editor.state.selection.to - 1, 0)
    let index = lower.indexOf(term, start)
    if (index === -1) index = lower.indexOf(term)
    if (index === -1) return
    const from = index + 1
    const to = from + searchTerm.length
    editor.chain().focus().setTextSelection({ from, to }).run()
  }

  const handleReplace = () => {
    if (!editor || !searchTerm.trim()) return
    const docText = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\n")
    const lower = docText.toLowerCase()
    const term = searchTerm.toLowerCase()
    const start = Math.max(editor.state.selection.to - 1, 0)
    let index = lower.indexOf(term, start)
    if (index === -1) index = lower.indexOf(term)
    if (index === -1) return
    const from = index + 1
    const to = from + searchTerm.length
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .deleteRange({ from, to })
      .insertContent(replaceTerm)
      .run()
  }

  const handleApplyLink = () => {
    if (!editor) return
    const url = linkInput.trim()
    if (!url) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const handleRemoveLink = () => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
  }

  const applyInlineSuggestion = (suggestion: TransliterationSuggestion) => {
    if (!editor || !currentWordRange) return
    try {
      editor
        .chain()
        .focus()
        .deleteRange({ from: currentWordRange.start, to: currentWordRange.end })
        .insertContent(`${suggestion.tamil} `)
        .run()

      setInlineSuggestions([])
      setCurrentWordRange(null)
      currentWordRef.current = ""
      onSuggestionsChange?.([])
      setInlineSelected(0)

      // Restart detection after insert
      try {
        editor.commands.focus()
        editor.view.dispatch(editor.view.state.tr.setMeta("forceUpdate", true))
        if (isTamilMode) {
          setTimeout(() => {
            const { from } = editor.state.selection
            const textContent = editor.state.doc.textBetween(0, from, " ")
            const currentWord = getCurrentWord(textContent, textContent.length)
            if (currentWord.word.length >= 2) {
              const local = getInstantSuggestions(currentWord.word)
              setInlineSuggestions(local.slice(0, 4))
            }
          }, 50)
        }
      } catch (err) {
        console.error("Failed to restart transliteration listener:", err)
      }
    } catch (error) {
      console.error("Failed to apply inline suggestion:", error)
    }
  }

  const handleEditorKeyDown = (event: React.KeyboardEvent) => {
    // Hotkeys for formatting
    if (event.metaKey || event.ctrlKey) {
      const key = event.key.toLowerCase()
      if (key === "b") {
        event.preventDefault()
        editor?.chain().focus().toggleBold().run()
        return
      }
      if (key === "i") {
        event.preventDefault()
        editor?.chain().focus().toggleItalic().run()
        return
      }
      if (key === "u") {
        event.preventDefault()
        editor?.chain().focus().toggleUnderline().run()
        return
      }
      if (key === "s" && event.shiftKey) {
        event.preventDefault()
        editor?.chain().focus().toggleStrike().run()
        return
      }
      if (key === "l" && event.shiftKey) {
        event.preventDefault()
        setIsTamilMode((prev) => !prev)
        return
      }
      if (key === "n" && event.shiftKey) {
        event.preventDefault()
        onModeToggle?.()
        return
      }
    }

    // Inline suggestion key handling only when Tamil mode is on
    if (!isTamilMode) return
    if (inlineSuggestions.length === 0) return
    if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
      event.preventDefault()
      applyInlineSuggestion(inlineSuggestions[Math.max(0, Math.min(inlineSelected, inlineSuggestions.length - 1))])
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setInlineSelected((prev) => (prev + 1) % inlineSuggestions.length)
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setInlineSelected((prev) => (prev - 1 + inlineSuggestions.length) % inlineSuggestions.length)
    }
  }

  const formatSeconds = (totalSeconds: number) => {
    const clamped = Math.max(0, Math.min(totalSeconds, voiceMaxSeconds))
    const minutes = Math.floor(clamped / 60)
    const seconds = clamped % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const pickAudioMimeType = () => {
    if (typeof MediaRecorder === "undefined") return ""
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/wav"]
    return (
      candidates.find((type) => {
        try {
          return MediaRecorder.isTypeSupported(type)
        } catch {
          return false
        }
      }) || ""
    )
  }

  const stopRecordingTimers = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (recordingLimitRef.current) {
      clearTimeout(recordingLimitRef.current)
      recordingLimitRef.current = null
    }
  }

  const stopActiveStream = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop())
      activeStreamRef.current = null
    }
  }

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
    } catch (err) {
      console.error("Failed to stop recorder:", err)
    } finally {
      stopRecordingTimers()
      setIsRecording(false)
    }
  }

  const startRecordingTimers = () => {
    stopRecordingTimers()
    setRecordingSeconds(0)
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => Math.min(prev + 1, voiceMaxSeconds))
    }, 1000)
    recordingLimitRef.current = setTimeout(() => stopRecording(), voiceMaxSeconds * 1000)
  }

  const handleTranscription = async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size === 0) return
    const maxBytes = 10 * 1024 * 1024
    if (audioBlob.size > maxBytes) {
      setRecordingError("Audio is over 10 MB. Please record a shorter clip.")
      return
    }

    setIsTranscribing(true)
    setRecordingError(null)

    try {
      const fd = new FormData()
      fd.append("audio", audioBlob, "voice.webm")

      const response = await fetch("/api/stt", {
        method: "POST",
        body: fd,
      })

      const payload = await response.json().catch(() => ({}))

      if (response.status === 413) {
        setRecordingError("Audio is over 10 MB. Please record a shorter clip.")
        return
      }

      if (!response.ok) {
        setRecordingError(payload?.error || "Transcription failed. Please try again.")
        return
      }

      const text = (payload?.text || "").trim()
      if (!text) {
        setRecordingError("We couldn't hear that. Try speaking again.")
        return
      }

      editor?.chain().focus().insertContent(`${text}${text.endsWith(" ") ? "" : " "}`).run()
    } catch (error) {
      console.error("Transcription error:", error)
      setRecordingError("Transcription failed. Please try again.")
    } finally {
      setIsTranscribing(false)
    }
  }

  const startRecording = async () => {
    if (isTranscribing) return
    if (!isPro && remainingChecks <= 0) return
    setRecordingError(null)
    setRecordingSeconds(0)

    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.mediaDevices) {
      setRecordingError("Recording is not supported on this browser.")
      return
    }

    if (typeof MediaRecorder === "undefined") {
      setRecordingError("Recording is not supported on this browser.")
      return
    }

    const mimeType = pickAudioMimeType()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      activeStreamRef.current = stream
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recordingChunksRef.current = []

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stopRecordingTimers()
        setIsRecording(false)
        stopActiveStream()
        mediaRecorderRef.current = null
        const blob = new Blob(recordingChunksRef.current, { type: mimeType || "audio/webm" })
        recordingChunksRef.current = []
        if (blob.size > 0) {
          handleTranscription(blob)
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      startRecordingTimers()
    } catch (error) {
      console.error("Failed to start recording:", error)
      setRecordingError("Could not access microphone. Please check permissions and try again.")
      stopActiveStream()
      stopRecordingTimers()
      setIsRecording(false)
    }
  }

  useEffect(() => {
    return () => {
      stopRecordingTimers()
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop()
        }
      } catch (err) {
        console.error("Failed to stop recorder on unmount:", err)
      }
      stopActiveStream()
    }
  }, [])

  if (!editor) {
    return null
  }

  return (
    <div
      ref={editorRef}
      className="relative h-full bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col"
      onClick={() => editor?.chain().focus().run()}
    >
      {/* Integrated Toolbar */}
      {showToolbar && (
        <>
          {toolbarMode === "voice" ? (
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-3 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-rose-200 opacity-70 animate-ping" aria-hidden="true" />
                  )}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full border text-white shadow-sm transition ${
                      isRecording
                        ? "border-rose-300 bg-rose-600 hover:bg-rose-700 animate-pulse"
                        : "border-emerald-200 bg-emerald-600 hover:bg-emerald-700"
                    } ${isTranscribing ? "cursor-not-allowed opacity-70" : ""}`}
                    title={isRecording ? "Stop recording" : "Tap to speak"}
                    aria-pressed={isRecording}
                  >
                    <span className="relative z-10">
                      {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </span>
                  </button>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-slate-800">Voice typing</span>
                  <span
                    className={`font-mono text-lg ${
                      isRecording ? "text-rose-700" : isTranscribing ? "text-emerald-700" : "text-slate-600"
                    }`}
                  >
                    {isRecording ? `${formatSeconds(recordingSeconds)} / 1:00` : isTranscribing ? "Processing…" : "Tap to speak"}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {isRecording ? "Recording…" : isTranscribing ? "Cleaning audio…" : "Ready"}
              </div>
            </div>
          ) : (
            <div className="flex items-center flex-wrap gap-3 border-b border-gray-100 bg-white px-3 py-2 sticky top-0 z-10">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="h-9 w-9 rounded-lg transition-all bg-white text-gray-900 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="h-9 w-9 rounded-lg transition-all bg-white text-gray-900 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive("bold") ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Bold"
                >
                  <BoldIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive("italic") ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Italic"
                >
                  <ItalicIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive("underline") ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Underline"
                >
                  <UnderlineIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive("strike") ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive("bulletList") ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive("orderedList") ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => editor.chain().focus().setTextAlign("left").run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive({ textAlign: "left" }) ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign("center").run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive({ textAlign: "center" }) ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign("right").run()}
                  className={`h-9 w-9 rounded-lg transition-all bg-white flex items-center justify-center ${editor.isActive({ textAlign: "right" }) ? "text-gray-900 shadow-inner" : "text-gray-800 hover:bg-gray-100"}`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-9 w-9 rounded-lg transition-all bg-white text-gray-800 hover:bg-gray-100 flex items-center justify-center" title="Add/Remove Link">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-white text-gray-900 border border-slate-200 rounded-lg p-3 shadow-lg">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600">Link URL</label>
                      <input
                        type="url"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="https://"
                        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleApplyLink}
                          className="flex-1 rounded-md bg-teal-600 text-white text-sm px-3 py-1.5 hover:bg-teal-700 transition"
                        >
                          Apply
                        </button>
                        <button
                          onClick={handleRemoveLink}
                          className="flex-1 rounded-md bg-slate-100 text-slate-800 text-sm px-3 py-1.5 hover:bg-slate-200 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-9 w-9 rounded-lg transition-all bg-white text-gray-800 hover:bg-gray-100 flex items-center justify-center" title="Search & Replace">
                      <SearchIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 bg-white text-gray-900 border border-slate-200 rounded-lg p-3 shadow-lg">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Find</label>
                        <input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Type to find..."
                          className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Replace with</label>
                        <input
                          value={replaceTerm}
                          onChange={(e) => setReplaceTerm(e.target.value)}
                          placeholder="Replacement text"
                          className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleFind}
                          className="flex-1 rounded-md bg-slate-900 text-white text-sm px-3 py-1.5 hover:bg-slate-800 transition"
                        >
                          Find
                        </button>
                        <button
                          onClick={handleReplace}
                          className="flex-1 rounded-md bg-slate-100 text-slate-800 text-sm px-3 py-1.5 hover:bg-slate-200 transition"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <button
                  onClick={onModeToggle}
                  className={`h-9 w-9 rounded-full transition-all border ${mode === "news"
                    ? "bg-teal-600 border-teal-600 text-white shadow-[0_0_0_4px_rgba(0,227,193,0.35)] hover:shadow-[0_0_0_5px_rgba(0,227,193,0.45)]"
                    : "bg-transparent border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-200"
                    }`}
                  title="Toggle News Mode"
                  aria-label="Toggle News Mode"
                >
                  <div className="flex items-center justify-center">
                    <Newspaper className="w-4 h-4" />
                  </div>
                </button>
                <button
                  onClick={() => setIsTamilMode(!isTamilMode)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-lg ${isTamilMode ? "bg-teal-700 text-white shadow-sm" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                  {isTamilMode ? "தமிழ்" : "English"}
                </button>
              </div>

              {spellingErrors.length > 0 && (
                <div className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                  {spellingErrors.length} error{spellingErrors.length === 1 ? "" : "s"}
                </div>
              )}
            </div>
          )}
          {recordingError && (
            <div className="px-3 pb-2 text-xs text-red-600">{recordingError}</div>
          )}
        </>
      )}

      <EditorContent
        editor={editor}
        onKeyDown={handleEditorKeyDown}
        className="flex-1 overflow-auto p-4 md:p-6 prose prose-base lg:prose-lg max-w-none focus:outline-none [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:p-0 [&_.ProseMirror]:text-gray-800 [&_.ProseMirror]:leading-relaxed [&_.ProseMirror]:[&:not(p)]:mt-0 [&_.ProseMirror]:[&:not(p)]:mb-0 [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:mt-6 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-4 [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:px-2 [&_.ProseMirror_code]:py-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_pre]:bg-gray-900 [&_.ProseMirror_pre]:text-gray-100 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:hover:text-blue-800 [&_.ProseMirror strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_s]:line-through [&_.ProseMirror_u]:underline [&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']]:pl-0 [&_.ProseMirror_ul[data-type='taskList']_li]:flex [&_.ProseMirror_ul[data-type='taskList']_li]:items-center [&_.ProseMirror_ul[data-type='taskList']_label]:mr-2 [&_.ProseMirror_is-empty::before]:content-['attr(data-placeholder)'] [&_.ProseMirror_is-empty::before]:pointer-events-none [&_.ProseMirror_is-empty::before]:h-0 [&_.ProseMirror_is-empty::before]:float-left [&_.ProseMirror_is-empty::before]:text-gray-400 [&_.ProseMirror_span[data-selection-mark='true']]:cursor-pointer [&_.ProseMirror_span.bg-blue-100]:bg-blue-100 [&_.ProseMirror_span.underline]:underline [&_.ProseMirror_span.decoration-red-500]:decoration-red-500 [&_.ProseMirror_span.decoration-blue-500]:decoration-blue-500 [&_.ProseMirror_span.decoration-yellow-500]:decoration-yellow-500 [&_.ProseMirror_span.decoration-orange-500]:decoration-orange-500 [&_.ProseMirror_span.decoration-blue-600]:decoration-blue-600 [&_.ProseMirror_span.decoration-wavy]:underline-wavy [&_.ProseMirror_span.decoration-dotted]:underline-dotted [&_.ProseMirror_span.decoration-dashed]:underline-dashed [&_.ProseMirror_span.decoration-solid]:underline-solid"
      />

      {inlineSuggestions.length > 0 && (
        <div
          className="absolute z-30 w-72 rounded-3xl border border-slate-200 bg-white shadow-2xl"
          style={{ top: inlinePosition.top, left: inlinePosition.left }}
        >
          <div className="divide-y divide-slate-100">
            {inlineSuggestions.map((s, idx) => (
              <button
                key={`${s.tamil}-${idx}`}
                onClick={() => applyInlineSuggestion(s)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  idx === inlineSelected ? "bg-teal-50" : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center ${
                    idx === inlineSelected ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className={`text-base font-semibold ${idx === inlineSelected ? "text-slate-900" : "text-slate-800"}`}>
                  {s.tamil}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-600">
            Press <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-800">Space</span> to pick the first option
          </div>
        </div>
      )}

      {/* Floating voice control */}
      <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-end gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className={`pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-full border text-white shadow-lg transition ${
            isRecording
              ? "border-rose-300 bg-rose-600 hover:bg-rose-700 animate-pulse"
              : !isPro && remainingChecks <= 0
                ? "border-slate-200 bg-slate-300 text-slate-600 cursor-not-allowed"
                : "border-emerald-200 bg-emerald-600 hover:bg-emerald-700"
          } ${isTranscribing ? "cursor-not-allowed opacity-70" : ""}`}
          aria-pressed={isRecording}
          title={
            isRecording
              ? "Stop recording"
              : !isPro && remainingChecks <= 0
                ? "Upgrade to Pro to keep using voice"
                : "Tap to speak"
          }
        >
          {isRecording && <span className="absolute inset-0 rounded-full bg-rose-200 opacity-60 animate-ping" aria-hidden="true" />}
          <span className="relative z-10">
            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </span>
        </button>
          <div className="pointer-events-auto flex flex-col items-end gap-1">
            <div
              className={`rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${
                isRecording ? "border-rose-200 bg-rose-50 text-rose-700" : isTranscribing ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {isRecording
                ? `${formatSeconds(recordingSeconds)} / ${formatSeconds(voiceMaxSeconds)}`
                : isTranscribing
                  ? "Processing…"
                  : `Voice (${voiceMaxSeconds}s max)`}
            </div>
          </div>
      </div>

      {/* Animated placeholder for empty editor */}
      <style jsx global>{`
        @keyframes thamlyTyping {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes thamlyCaret {
          0%, 49% { border-color: rgba(13, 148, 136, 0.8); }
          50%, 100% { border-color: transparent; }
        }
        .prose-editor.is-empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          opacity: 0.9;
          pointer-events: none;
          position: absolute;
          top: 1rem;
          left: 1rem;
          white-space: nowrap;
          overflow: hidden;
          border-right: 2px solid rgba(13, 148, 136, 0.8);
          font-style: italic;
          animation:
            thamlyTyping 4s steps(28, end) infinite alternate,
            thamlyCaret 0.9s step-end infinite;
        }
      `}</style>
    </div>
  )
})

RichTextEditor.displayName = "RichTextEditor"
