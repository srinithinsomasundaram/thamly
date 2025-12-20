"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Languages,
  Type,
  Settings,
  RefreshCw,
  Copy,
  Download,
  Volume2,
  Eye,
  Edit3,
  Sparkles
} from "lucide-react"
import { thanglishConverter, RealTimeConverter } from "@/lib/ai/thanglish-converter"

interface InlineTamilConverterProps {
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  className?: string
}

interface ConversionMode {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

export function InlineTamilConverter({
  content,
  onContentChange,
  placeholder = "Start typing in English or Thanglish...",
  className = ""
}: InlineTamilConverterProps) {
  const [mode, setMode] = useState("realtime")
  const [convertedText, setConvertedText] = useState("")
  const [originalText, setOriginalText] = useState("")
  const [isConverting, setIsConverting] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [conversionHistory, setConversionHistory] = useState<Array<{
    original: string
    converted: string
    timestamp: Date
    mode: string
  }>>([])
  const [keyboardLayout, setKeyboardLayout] = useState("phonetic")
  const converterRef = useRef<RealTimeConverter>(new RealTimeConverter(150))

  const conversionModes: ConversionMode[] = [
    {
      id: "realtime",
      name: "Real-time",
      description: "Convert as you type",
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: "thanglish",
      name: "Thanglish",
      description: "Tamil written in English",
      icon: <Type className="w-4 h-4" />
    },
    {
      id: "tamil",
      name: "Pure Tamil",
      description: "Tamil to Tamil",
      icon: <Languages className="w-4 h-4" />
    }
  ]

  const keyboardLayouts = [
    { id: "phonetic", name: "Phonetic" },
    { id: "inscript", name: "InScript" },
    { id: "transliteration", name: "Transliteration" }
  ]

  // Real-time conversion effect
  useEffect(() => {
    if (mode === "realtime" && content.trim()) {
      const debouncedConverter = converterRef.current.createDebouncedConverter((original, converted) => {
        setConvertedText(converted)
        setOriginalText(original)

        // Add to history if conversion changed
        if (converted !== original) {
          setConversionHistory(prev => [
            { original, converted, timestamp: new Date(), mode },
            ...prev.slice(0, 9) // Keep last 10 conversions
          ])
        }
      })

      debouncedConverter(content)
    } else if (mode !== "realtime") {
      setConvertedText("")
      setOriginalText("")
    }
  }, [content, mode])

  const handleManualConvert = useCallback(() => {
    if (!content.trim()) return

    setIsConverting(true)
    try {
      let result = content

      switch (mode) {
        case "thanglish":
          result = converterRef.current.convert(content)
          break
        case "tamil":
          // Keep as is if already Tamil, otherwise convert
          const converted = converterRef.current.convert(content)
          result = converted !== content ? converted : content
          break
        default:
          result = content
      }

      setConvertedText(result)
      setOriginalText(content)

      // Add to history
      setConversionHistory(prev => [
        { original: content, converted: result, timestamp: new Date(), mode },
        ...prev.slice(0, 9)
      ])
    } catch (error) {
      console.error("Conversion error:", error)
      setConvertedText(content)
    } finally {
      setIsConverting(false)
    }
  }, [content, mode])

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleSwapText = () => {
    if (convertedText && convertedText !== content) {
      onContentChange(convertedText)
    }
  }

  const handleConvertHistory = (item: typeof conversionHistory[0]) => {
    onContentChange(item.original)
    setConvertedText(item.converted)
    setMode(item.mode)
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ta-IN'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  const getConversionStats = () => {
    if (!convertedText || convertedText === originalText) {
      return { percentage: 0, wordsConverted: 0, totalWords: 0 }
    }

    const originalWords = originalText.split(/\s+/).filter(w => w.length > 0)
    const totalWords = content.split(/\s+/).filter(w => w.length > 0)
    const convertedWords = originalWords.filter(w => {
      const converted = converterRef.current.convert(w)
      return converted !== w
    }).length

    return {
      percentage: totalWords.length > 0 ? Math.round((convertedWords / totalWords.length) * 100) : 0,
      wordsConverted: convertedWords,
      totalWords: totalWords.length
    }
  }

  const stats = getConversionStats()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Conversion Mode Selector */}
      <div className="flex items-center gap-4">
        <Tabs value={mode} onValueChange={setMode} className="flex-1">
          <TabsList className="grid w-full grid-cols-3 h-8">
            {conversionModes.map((conversionMode) => (
              <TabsTrigger key={conversionMode.id} value={conversionMode.id} className="text-xs">
                <div className="flex items-center gap-1">
                  {conversionMode.icon}
                  <span>{conversionMode.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <select
            value={keyboardLayout}
            onChange={(e) => setKeyboardLayout(e.target.value)}
            className="text-xs px-2 py-1 border rounded bg-background"
          >
            {keyboardLayouts.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-8 px-2"
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[200px] p-4 border border-border/50 rounded-lg bg-card/30 backdrop-blur resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm"
          style={{ direction: /[\u0B80-\u0BFF]/.test(content) ? 'ltr' : 'ltr' }}
        />

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onContentChange("")}
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            title="Clear"
          >
            ×
          </Button>
        </div>
      </div>

      {/* Manual Convert Button for non-realtime modes */}
      {mode !== "realtime" && (
        <div className="flex justify-center">
          <Button
            onClick={handleManualConvert}
            disabled={isConverting || !content.trim()}
            className="gap-2"
          >
            {isConverting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Languages className="w-4 h-4" />
            )}
            Convert to Tamil
          </Button>
        </div>
      )}

      {/* Preview and Results */}
      {showPreview && (mode === "realtime" || convertedText) && (
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">Tamil Output</span>
                {stats.percentage > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {stats.percentage}% converted
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyText(convertedText)}
                  className="h-6 w-6 p-0"
                  title="Copy Tamil text"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(convertedText)}
                  className="h-6 w-6 p-0"
                  title="Speak Tamil text"
                >
                  <Volume2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapText}
                  className="h-6 w-6 p-0"
                  title="Use Tamil text as input"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div
              className="min-h-[100px] p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800 text-sm leading-relaxed"
              style={{ direction: 'ltr' }}
            >
              {convertedText || (
                <span className="text-muted-foreground">
                  {mode === "realtime"
                    ? "Start typing to see Tamil conversion..."
                    : "Click 'Convert to Tamil' to see the result"}
                </span>
              )}
            </div>

            {stats.totalWords > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{stats.wordsConverted} of {stats.totalWords} words converted</span>
                <span>Keyboard: {keyboardLayout}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conversion History */}
      {conversionHistory.length > 0 && (
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                Recent Conversions
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConversionHistory([])}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            </div>

            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {conversionHistory.map((item, index) => (
                <div
                  key={index}
                  className="p-2 bg-muted/20 rounded border-l-2 border-blue-300 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleConvertHistory(item)}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <Badge variant="outline" className="text-xs">
                      {conversionModes.find(m => m.id === item.mode)?.name}
                    </Badge>
                    <span>{item.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm">
                    <div className="text-red-600 truncate mb-1">{item.original}</div>
                    <div className="text-green-600 truncate">→ {item.converted}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}