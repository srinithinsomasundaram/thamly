"use client"

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WritingInsightsProps {
  wordCount: number
  charCount: number
  readingTime: number
  typingSpeed: number
  detectedTone: "formal" | "casual" | "creative" | "neutral"
}

export function WritingInsights({
  wordCount,
  charCount,
  readingTime,
  typingSpeed,
  detectedTone,
}: WritingInsightsProps) {
  const historyData = [
    { time: "10:00", words: 50, speed: 15 },
    { time: "10:30", words: 120, speed: 18 },
    { time: "11:00", words: 250, speed: 22 },
    { time: "11:30", words: 400, speed: 25 },
    { time: "12:00", words: wordCount, speed: typingSpeed },
  ]

  const toneColor = {
    formal: "bg-blue-500",
    casual: "bg-green-500",
    creative: "bg-purple-500",
    neutral: "bg-gray-500",
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Words</p>
            <p className="text-3xl font-bold transition-all duration-300">{wordCount}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Reading Time</p>
            <p className="text-3xl font-bold transition-all duration-300">{readingTime} min</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Characters</p>
            <p className="text-3xl font-bold transition-all duration-300">{charCount}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Speed</p>
            <p className="text-3xl font-bold transition-all duration-300">{typingSpeed} c/s</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-3">Detected Tone</p>
        <div className="flex gap-2">
          {["formal", "casual", "creative", "neutral"].map((tone) => (
            <Badge
              key={tone}
              variant={detectedTone === tone ? "default" : "secondary"}
              className={`transition-all duration-300 cursor-default ${
                detectedTone === tone ? toneColor[tone as keyof typeof toneColor] : ""
              }`}
            >
              {tone}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-3">Writing Progress</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="words" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-3">Typing Speed</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="speed" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
