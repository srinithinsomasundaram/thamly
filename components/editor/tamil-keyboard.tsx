"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Keyboard,
  Type,
  Settings,
  ChevronDown,
  Volume2,
  Save,
  Download
} from "lucide-react"

interface TamilKeyboardProps {
  onKeyClick: (key: string) => void
  onTextInsert: (text: string) => void
  currentText?: string
}

interface KeyboardLayout {
  name: string
  type: "phonetic" | "inscript" | "traditional"
  keys: string[][]
}

const keyboardLayouts: KeyboardLayout[] = [
  {
    name: "Phonetic English",
    type: "phonetic",
    keys: [
      ["௧", "௨", "௩", "௪", "௫", "௬", "௭", "௮", "௯", "௰", "ஜ", "ங", "-"],
      ["ச", "ஞ", "ட", "஠", "஡", "஢", "ண", "த", "஥", "஦", "஧", "ந", "Back"],
      ["ப", "஫", "஬", "஭", "ம", "ய", "ர", "ற", "ல", "ள", "ழ", "வ", "Enter"],
      ["ஶ", "ஷ", "ஸ", "ஹ", "க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "Space", "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன"],
      ["ௐ", "ௐூ", "ை", "ொ", "ோ", "ௌ", "ா", "ெ", "ே", "ை", "ொ", "ோ", "ௌ", "ௌ்"],
      ["ஃ", "ஂ", "஁", "Half", "Full", "Clear", "Help"]
    ]
  },
  {
    name: "Tamil Unicode",
    type: "traditional",
    keys: [
      ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ", "ஃ"],
      ["க்", "க", "கா", "கி", "கீ", "கு", "கூ", "கெ", "கே", "கை", "கொ", "கோ", "கௌ", "Back"],
      ["ச்", "ச", "சா", "சி", "சீ", "சு", "சூ", "செ", "சே", "சை", "சொ", "சோ", "சௌ", "Enter"],
      ["ட்", "ட", "டா", "டி", "டீ", "டு", "டூ", "டெ", "டே", "டை", "டொ", "டோ", "டௌ", "Space", "ண்", "ண", "ணா", "ணி", "ணீ", "ணு", "ணூ", "ணெ", "ணே", "ணை", "ணொ", "ணோ", "ணௌ"],
      ["த்", "த", "தா", "தி", "தீ", "து", "தூ", "தெ", "தே", "தை", "தொ", "தோ", "தௌ", "ந்", "ந", "நா", "நி", "நீ", "நு", "நூ", "நெ", "நே", "நை", "நொ", "நோ", "நௌ"],
      ["ப்", "ப", "பா", "பி", "பீ", "பு", "பூ", "பெ", "பே", "பை", "பொ", "போ", "பௌ", "ம்", "ம", "மா", "மி", "மீ", "மு", "மூ", "மெ", "மே", "மை", "மொ", "மோ", "மௌ"],
      ["ய்", "ய", "யா", "யி", "யீ", "யு", "யூ", "யெ", "யே", "யை", "யொ", "யோ", "யௌ", "ர்", "ர", "ரா", "ரி", "ரீ", "ரு", "ரூ", "ரெ", "ரே", "ரை", "ரொ", "ரோ", "ரௌ"],
      ["ல்", "ல", "லா", "லி", "லீ", "லு", "லூ", "லெ", "லே", "லை", "லொ", "லோ", "லௌ", "வ்", "வ", "வா", "வி", "வீ", "வு", "வூ", "வெ", "வே", "வை", "வொ", "வோ", "வௌ"],
      ["ழ்", "ழ", "ழா", "ழி", "ழீ", "ழு", "ழூ", "ழெ", "ழே", "ழை", "ழொ", "ழோ", "ழௌ", "ள்", "ள", "ளா", "ளி", "ளீ", "ளு", "ளூ", "ளெ", "ளே", "ளை", "ளொ", "ளோ", "ளௌ"],
      ["ற்", "ற", "றா", "றி", "றீ", "று", "றூ", "றெ", "றே", "றை", "றொ", "றோ", "றௌ", "ன்", "ன", "னா", "னி", "னீ", "னு", "னூ", "னெ", "னே", "னை", "னொ", "னோ", "னௌ"],
      ["ஸ்", "ஸ", "ஸா", "ஸி", "ஸீ", "ஸு", "ஸூ", "ஸெ", "ஸே", "ஸை", "ஸொ", "ஸோ", "ஸௌ", "Shift", "Ctrl", "Alt", "Tab", "Caps", "Enter", "←", "→", "↑", "↓"]
    ]
  }
]

const commonPhrases = [
  "வணக்கம்",
  "நன்றி",
  "எப்படி",
  "என்ன",
  "யார்",
  "இங்கே",
  "அங்கே",
  "நான்",
  "நீங்கள்",
  "சரி",
  "மிக்க நன்றி"
]

export function TamilKeyboard({ onKeyClick, onTextInsert, currentText = "" }: TamilKeyboardProps) {
  const [activeLayout, setActiveLayout] = useState(0)
  const [isShifted, setIsShifted] = useState(false)
  const [showPhrases, setShowPhrases] = useState(false)
  const [fontSize, setFontSize] = useState(16)

  const currentLayout = keyboardLayouts[activeLayout]

  const handleKeyClick = (key: string) => {
    if (key === "Back") {
      onKeyClick("backspace")
    } else if (key === "Space") {
      onKeyClick(" ")
    } else if (key === "Enter") {
      onKeyClick("\n")
    } else if (key === "Clear") {
      onTextInsert("")
    } else if (key === "Help") {
      setShowPhrases(!showPhrases)
    } else if (key === "Half" || key === "Full") {
      // Toggle between half and full character width
      // This would need specific implementation
    } else {
      onKeyClick(key)
    }
  }

  const speakText = () => {
    if ('speechSynthesis' in window && currentText) {
      const utterance = new SpeechSynthesisUtterance(currentText)
      utterance.lang = 'ta-IN'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  const saveText = () => {
    if (currentText) {
      const blob = new Blob([currentText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tamil-text-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-4">
      {/* Keyboard Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4" />
          <span className="font-medium text-sm">Tamil Keyboard</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="text-xs px-2 py-1 border rounded bg-background"
          >
            <option value={14}>Small</option>
            <option value={16}>Medium</option>
            <option value={18}>Large</option>
            <option value={20}>Extra Large</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPhrases(!showPhrases)}
            className="h-8 px-2"
          >
            <Type className="w-3 h-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={speakText}
            disabled={!currentText}
            className="h-8 px-2"
          >
            <Volume2 className="w-3 h-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={saveText}
            disabled={!currentText}
            className="h-8 px-2"
          >
            <Save className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Common Phrases */}
      {showPhrases && (
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-500" />
              Common Tamil Phrases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {commonPhrases.map((phrase, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onTextInsert(currentText + phrase)}
                  className="text-xs p-2 h-auto justify-start text-left"
                >
                  {phrase}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard Layout Selector */}
      <div className="flex gap-2">
        {keyboardLayouts.map((layout, index) => (
          <Button
            key={index}
            variant={activeLayout === index ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveLayout(index)}
            className="text-xs"
          >
            {layout.name}
          </Button>
        ))}
      </div>

      {/* Tamil Keyboard */}
      <Card className="bg-card/50">
        <CardContent className="p-3">
          <div className="space-y-2" style={{ fontSize: `${fontSize}px` }}>
            {currentLayout.keys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((key, keyIndex) => {
                  const isSpecialKey = ["Back", "Space", "Enter", "Clear", "Help", "Half", "Full", "Shift", "Ctrl", "Alt", "Tab", "Caps", "←", "→", "↑", "↓"].includes(key)
                  const isWideKey = key === "Space" || key === "Back" || key === "Enter"

                  return (
                    <Button
                      key={keyIndex}
                      variant={isSpecialKey ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleKeyClick(key)}
                      className={`font-mono ${
                        isWideKey
                          ? "flex-1 px-4"
                          : key === "Space"
                          ? "flex-1 px-2"
                          : "px-3 py-2 min-w-[2rem]"
                      } text-sm`}
                      style={{
                        fontSize: `${Math.max(12, fontSize - 4)}px`,
                        fontFamily: /[\u0B80-\u0BFF]/.test(key) ? "'Noto Sans Tamil', sans-serif" : "monospace"
                      }}
                    >
                      {key}
                    </Button>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div>• Click keys to type Tamil characters</div>
        <div>• Use keyboard layout selector to switch between phonetic and Unicode</div>
        <div>• Common phrases section for quick text insertion</div>
        <div>• Current text: {currentText.length} characters</div>
      </div>
    </div>
  )
}
