"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  Wand2,
  Languages,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Globe,
  GraduationCap,
  MessageCircle,
  Target,
  Zap,
  Copy,
  Trash2,
  RefreshCw
} from "lucide-react"
import { analyzeText, createDebouncedAnalyzer } from "@/lib/ai/client"
import { thanglishConverter, RealTimeConverter } from "@/lib/ai/thanglish-converter"

interface DemoEditorProps {
  className?: string
}

export function DemoEditor({ className }: DemoEditorProps) {
  const [content, setContent] = useState("Welcome to Thamly! Try typing in English, Tamil, or Thanglish to see the magic happen. For example, type 'naan vanthean' to see it convert to Tamil.")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("write")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [tamilConversion, setTamilConversion] = useState("")
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)

  const converter = useRef(new RealTimeConverter(300))
  const debouncedAnalyze = useRef(createDebouncedAnalyzer(1000))

  // Sample suggestions for demo
  const sampleSuggestions = [
    "Continue the story with an exciting twist",
    "Make this more professional",
    "Add emotional depth to this paragraph",
    "Simplify this for better readability"
  ]

  // Handle live Tamil conversion
  useEffect(() => {
    if (!content.trim()) {
      setTamilConversion("")
      return
    }

    const debouncedConvert = converter.current.createDebouncedConverter((original, converted) => {
      setTamilConversion(converted)
    })

    debouncedConvert(content)
  }, [content])

  // Analyze content
  useEffect(() => {
    if (!content.trim()) {
      setAnalysis(null)
      setSuggestions([])
      return
    }

    setIsAnalyzing(true)

    // Simulate AI analysis for demo
    const timer = setTimeout(() => {
      const mockAnalysis = {
        grammarIssues: content.includes("Welcome") ? [] : [
          {
            type: "Spelling",
            message: "Consider checking spelling",
            original: content.slice(0, 20) + "...",
            suggestion: content.slice(0, 20) + "..."
          }
        ],
        translations: {
          toEnglish: content.replace(/நான்/g, "I").replace(/வணக்கம்/g, "welcome").replace(/இருக்கிறாய்/g, "how are you"),
          toHindi: "मैं आपका स्वागत हूं",
          toSimplifiedTamil: content
        },
        improvements: {
          formal: content.charAt(0).toUpperCase() + content.slice(1),
          informal: content.toLowerCase(),
          academic: content,
          concise: content.split(' ').slice(0, 10).join(' ') + "..."
        },
        paragraphAnalysis: {
          tone: "Friendly",
          readability: "Clear",
          sentiment: "Positive",
          clarity: 0.85,
          coherence: 0.90
        },
        nextWords: ["experience", "writing", "assistant", "today"]
      }

      // Generate contextual suggestions
      const words = content.toLowerCase().split(' ')
      const lastWord = words[words.length - 1]

      let newSuggestions = []
      if (lastWord === "welcome" || lastWord === "welcome!") {
        newSuggestions = ["Welcome to Thamly! Your AI writing assistant", "Welcome aboard! Let's create something amazing", "Welcome to the future of writing"]
      } else if (lastWord.includes("thamly")) {
        newSuggestions = ["Thamly helps you write better, faster", "Thamly is your AI-powered writing companion", "Thamly transforms your writing experience"]
      } else if (lastWord === "magic") {
        newSuggestions = ["magic happens here", "magic of AI writing", "magic that transforms words"]
      } else {
        newSuggestions = sampleSuggestions
      }

      setAnalysis(mockAnalysis)
      setSuggestions(newSuggestions.slice(0, 3))
      setIsAnalyzing(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [content])

  const handleApplySuggestion = (suggestion: string) => {
    setContent(suggestion)
    setSelectedSuggestion(null)
  }

  const handleQuickAction = (action: string) => {
    switch(action) {
      case "email":
        setContent(`Subject: Introduction to Thamly\n\nDear Team,\n\nI wanted to introduce you to Thamly, our AI-powered writing assistant that helps create amazing content in seconds.\n\nBest regards,\nYour Name`)
        break
      case "blog":
        setContent(`# The Future of AI Writing\n\nIn today's digital world, artificial intelligence is revolutionizing how we create and consume content. Writing, once considered a purely human skill, is now being augmented by sophisticated AI tools that can generate, edit, and improve text in remarkable ways.\n\nThis transformation is not about replacing human writers but empowering them with tools that enhance creativity and productivity.`)
        break
      case "social":
        setContent(`🚀 Just tried Thamly AI writing assistant and I'm blown away! ✍️\n\nThis tool helps me:\n• Write emails 10x faster 📧\n• Generate creative content 🎨\n• Check grammar automatically ✅\n\n#AI #Writing #Productivity\n\nHighly recommend to all content creators out there! 👍`)
        break
      case "tamil":
        setContent("வணக்கம்! நான் தமிழில் ஒரு தமிழ் உரையாது. தமிழில் கலையில் எழுத்தியில், வார்த்தம், மற்றும் பயன்களுக்கு சிறந்த AI உதவிகள் வழங்குகிறோர். உடன் விரைவில் உங்கள் எழுத்தும் எளிதமாக கொள்ளுங்கள்.")
        break
      case "clear":
        setContent("")
        setTamilConversion("")
        setAnalysis(null)
        setSuggestions([])
        break
    }
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Try Thamly AI Assistant</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Demo Mode
            </Badge>
          </div>
          <CardDescription>
            Experience the power of AI writing assistance. Try typing, converting, or using our smart suggestions!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction("email")}
              className="text-xs"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction("blog")}
              className="text-xs"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Blog Post
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction("social")}
              className="text-xs"
            >
              <Globe className="w-3 h-3 mr-1" />
              Social Media
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction("tamil")}
              className="text-xs"
            >
              <Languages className="w-3 h-3 mr-1" />
              Tamil
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuickAction("clear")}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>

          {/* Main Editor */}
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing here to see AI magic happen... Try typing in English, Tamil, or Thanglish!"
              className="min-h-[200px] p-4 text-base border-2 focus:border-primary/50 transition-colors"
            />
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
              {content.length} characters
            </div>
          </div>

          {/* Tamil Conversion */}
          {tamilConversion && tamilConversion !== content && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Tamil Conversion
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(tamilConversion)}
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="text-sm p-3 bg-white/50 rounded border-l-4 border-green-500">
                  {tamilConversion}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wand2 className="w-4 h-4" />
                AI Suggestions
                {isAnalyzing && <RefreshCw className="w-3 h-3 animate-spin" />}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                      selectedSuggestion === suggestion ? 'border-primary/50 bg-primary/5' : 'border-border/50'
                    }`}
                    onClick={() => handleApplySuggestion(suggestion)}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm line-clamp-2">{suggestion}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Panel */}
          {analysis && (
            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">AI Analysis</span>
                <div className="flex gap-2 text-xs">
                  <Badge className={analysis.paragraphAnalysis.tone === "Friendly" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                    {analysis.paragraphAnalysis.tone}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(analysis.paragraphAnalysis.readability)}% readable
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-8">
                  <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
                  <TabsTrigger value="improve" className="text-xs">Improve</TabsTrigger>
                  <TabsTrigger value="translate" className="text-xs">Translate</TabsTrigger>
                  <TabsTrigger value="grammar" className="text-xs">Grammar</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="insights" className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sentiment:</span>
                        <Badge variant="outline">{analysis.paragraphAnalysis.sentiment}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clarity:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-red-500 to-green-500 h-full"
                              style={{ width: `${analysis.paragraphAnalysis.clarity * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{Math.round(analysis.paragraphAnalysis.clarity * 100)}%</span>
                        </div>
                      </div>
                    </div>
                    {analysis.nextWords && (
                      <div className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                        <span className="text-xs text-primary font-medium">Continue with:</span> {" "}
                        <span className="font-semibold">{analysis.nextWords}</span>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="improve" className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-500">
                        <span className="text-xs font-medium text-blue-700">Formal:</span>
                        <div>{analysis.improvements.formal}</div>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border-l-2 border-green-500">
                        <span className="text-xs font-medium text-green-700">Casual:</span>
                        <div>{analysis.improvements.informal}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="translate" className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">English:</span>
                        <div className="p-2 bg-muted/30 rounded">{analysis.translations.toEnglish}</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Hindi:</span>
                        <div className="p-2 bg-muted/30 rounded">{analysis.translations.toHindi}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="grammar" className="space-y-3">
                    {analysis.grammarIssues && analysis.grammarIssues.length === 0 ? (
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <span className="text-green-700 font-medium">Perfect Grammar!</span>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {analysis.grammarIssues.map((issue: any, index: number) => (
                          <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border-l-2 border-yellow-500">
                            <span className="font-medium text-yellow-700">{issue.type}:</span> {issue.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}

          {/* Demo CTA */}
          <div className="flex items-center justify-center pt-4 border-t border-border/50">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Ready to experience the full power of Thamly?
              </p>
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                Start Writing Free
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}