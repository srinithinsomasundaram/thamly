"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  TrendingUp,
  RefreshCw,
  Languages,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Globe,
  GraduationCap,
  MessageCircle,
  Target,
  Zap,
  Keyboard
} from "lucide-react"
import { analyzeText, createDebouncedAnalyzer, getGrammarErrorCount, getReadabilityScore, getToneColor, getReadabilityColor, type AIAnalysis } from "@/lib/ai/client"
import { thanglishConverter, RealTimeConverter } from "@/lib/ai/thanglish-converter"
import { TamilKeyboard } from "./tamil-keyboard"

interface AIAssistantPanelProps {
  content: string
  isAnalyzing: boolean
}

export function AIAssistantPanel({ content, isAnalyzing }: AIAssistantPanelProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("convert")
  const [liveConversion, setLiveConversion] = useState("")
  const [conversionHistory, setConversionHistory] = useState<Array<{original: string, converted: string, timestamp: Date}>>([])
  const [showKeyboard, setShowKeyboard] = useState(false)
  const converter = useRef(new RealTimeConverter(200)) // 200ms debounce for live conversion

  // Create debounced analyzer
  const debouncedAnalyze = createDebouncedAnalyzer(1500)

  // Live conversion effect
  useEffect(() => {
    if (!content.trim()) {
      setLiveConversion("")
      return
    }

    const debouncedConvert = converter.current.createDebouncedConverter((original, converted) => {
      setLiveConversion(converted)
      // Add to conversion history if different from content
      if (converted !== original) {
        setConversionHistory(prev => [
          { original, converted, timestamp: new Date() },
          ...prev.slice(0, 4) // Keep only last 5 conversions
        ])
      }
    })

    debouncedConvert(content)
  }, [content])

  // Analyze content when it changes
  useEffect(() => {
    if (!content.trim()) {
      setAnalysis(null)
      return
    }

    debouncedAnalyze(content, "all", (result) => {
      setAnalysis(result)
    })
  }, [content, debouncedAnalyze])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const result = await analyzeText(content, "all")
      setAnalysis(result)
    } catch (error) {
      console.error("Failed to refresh analysis:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!content.trim()) {
    return (
      <div className="w-80 border border-border/50 rounded-lg bg-card/30 backdrop-blur overflow-hidden">
        <div className="p-4 text-center text-sm text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Start writing to see AI-powered assistance
          <div className="text-xs mt-2 text-muted-foreground">
            Grammar • Spelling • Translation • Improvements
          </div>
        </div>
      </div>
    )
  }

  const grammarCount = getGrammarErrorCount(analysis || {})
  const readabilityScore = getReadabilityScore(analysis || {})

  return (
    <div className="w-80 border border-border/50 rounded-lg bg-card/30 backdrop-blur overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            THAMLY AI
            {analysis?.error && (
              <Badge variant="destructive" className="text-xs">Offline</Badge>
            )}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isAnalyzing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>Grammar: {grammarCount} issues</span>
          <span>•</span>
          <span>Readability: {Math.round(readabilityScore * 100)}%</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-6 h-8">
            <TabsTrigger value="convert" className="text-xs">Convert</TabsTrigger>
            <TabsTrigger value="grammar" className="text-xs">Grammar</TabsTrigger>
            <TabsTrigger value="keyboard" className="text-xs">Keyboard</TabsTrigger>
            <TabsTrigger value="translate" className="text-xs">Translate</TabsTrigger>
            <TabsTrigger value="improve" className="text-xs">Improve</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
          </TabsList>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {/* Live Conversion Tab */}
          <TabsContent value="convert" className="mt-0">
            <div className="p-4 space-y-4">
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Languages className="w-4 h-4 text-green-500" />
                    Live Thanglish to Tamil Converter
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Type in Thanglish or English to see real-time Tamil conversion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Your Input</div>
                    <div className="text-sm p-2 bg-muted/30 rounded min-h-[60px] max-h-[120px] overflow-y-auto">
                      {content || "Start typing..."}
                    </div>
                  </div>

                  {liveConversion && liveConversion !== content && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Tamil Conversion
                      </div>
                      <div className="text-sm p-3 bg-green-50 dark:bg-green-950/20 rounded border-l-2 border-green-500">
                        {liveConversion}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(liveConversion)
                        }}
                      >
                        Copy Tamil Text
                      </Button>
                    </div>
                  )}

                  {!liveConversion && content.trim() && (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">
                        No conversion needed - text appears to be in Tamil already
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversion History */}
              {conversionHistory.length > 0 && (
                <Card className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      Recent Conversions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {conversionHistory.map((item, index) => (
                        <div key={index} className="text-xs p-2 bg-muted/20 rounded border-l-2 border-blue-300">
                          <div className="font-medium text-red-600 mb-1 truncate">
                            {item.original}
                          </div>
                          <div className="text-green-600 truncate">
                            → {item.converted}
                          </div>
                          <div className="text-muted-foreground">
                            {item.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Tips */}
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div>• Type <code className="bg-muted px-1 rounded">naan vanthean</code> → நான் வந்தேன்</div>
                    <div>• Type <code className="bg-muted px-1 rounded">how are you</code> → எப்படி இருக்கிறாய்</div>
                    <div>• Type <code className="bg-muted px-1 rounded">enga ponga</code> → இங்கே போங்க</div>
                    <div>• Common words: <code className="bg-muted px-1 rounded">vanakkam</code>, <code className="bg-muted px-1 rounded">nandri</code>, <code className="bg-muted px-1 rounded">sari</code></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tamil Keyboard Tab */}
          <TabsContent value="keyboard" className="mt-0">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">Tamil Virtual Keyboard</span>
                  <Badge variant="outline" className="text-xs">Click to type</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className="h-7 text-xs"
                >
                  {showKeyboard ? "Hide" : "Show"} Keyboard
                </Button>
              </div>

              {/* Tamil Keyboard Component */}
              {showKeyboard && (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <TamilKeyboard
                    onKeyClick={(key) => {
                      // Handle keyboard clicks
                      if (key === "backspace") {
                        // This would integrate with the editor
                        console.log("Backspace pressed")
                      } else {
                        // This would insert the character at cursor position
                        console.log("Key pressed:", key)
                      }
                    }}
                    onTextInsert={(text) => {
                      // This would update the editor content
                      console.log("Text inserted:", text)
                    }}
                    currentText={content}
                  />
                </div>
              )}

              {/* Keyboard Shortcuts */}
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-muted/20 rounded">
                      <div className="font-medium">Ctrl + Space</div>
                      <div className="text-muted-foreground">Toggle Tamil mode</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded">
                      <div className="font-medium">Tab + Enter</div>
                      <div className="text-muted-foreground">Accept suggestion</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded">
                      <div className="font-medium">Arrow Keys</div>
                      <div className="text-muted-foreground">Navigate suggestions</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded">
                      <div className="font-medium">Escape</div>
                      <div className="text-muted-foreground">Close suggestions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Typing Guide */}
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Typing Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <strong>Phonetic Typing:</strong> Type Tamil words using English letters
                        <div className="text-muted-foreground">naan → நான், vanakkam → வணக்கம்</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-green-100 text-green-600 rounded flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <strong>Direct Tamil:</strong> Use the virtual keyboard for Unicode Tamil
                        <div className="text-muted-foreground">Click keys to type அ, ஆ, இ characters</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <strong>Smart Suggestions:</strong> AI-powered word predictions
                        <div className="text-muted-foreground">Get Tamil word suggestions as you type</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Grammar & Spelling Tab */}
          <TabsContent value="grammar" className="mt-0">
            <div className="p-4 space-y-4">
              {/* Grammar Issues */}
              {analysis?.grammarIssues && analysis.grammarIssues.length > 0 && (
                <Card className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Grammar Issues ({analysis.grammarIssues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.grammarIssues.map((issue, index) => (
                        <div key={index} className="border-l-2 border-yellow-500 pl-3 py-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {issue.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {issue.message}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="line-through text-red-500">{issue.original}</span>
                            <span className="mx-2">→</span>
                            <span className="text-green-600">{issue.suggestion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Spelling Issues */}
              {analysis?.spellingIssues && analysis.spellingIssues.length > 0 && (
                <Card className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Spelling ({analysis.spellingIssues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.spellingIssues.map((issue, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-red-500">{issue.word}</span>
                          <div className="flex items-center gap-2">
                            <span>→</span>
                            <span className="text-green-600">{issue.suggestion}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(issue.confidence * 100)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success State */}
              {grammarCount === 0 && !analysis?.error && (
                <Card className="bg-card/50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <h3 className="font-medium text-green-700">Perfect Grammar!</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        No grammar or spelling issues detected
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Translation Tab */}
          <TabsContent value="translate" className="mt-0">
            <div className="p-4 space-y-4">
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Languages className="w-4 h-4 text-blue-500" />
                    Translations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">English</div>
                    <div className="text-sm p-2 bg-muted/30 rounded">
                      {analysis?.translations?.toEnglish || "Loading..."}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Hindi</div>
                    <div className="text-sm p-2 bg-muted/30 rounded">
                      {analysis?.translations?.toHindi || "Loading..."}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Simplified Tamil</div>
                    <div className="text-sm p-2 bg-muted/30 rounded">
                      {analysis?.translations?.toSimplifiedTamil || "Loading..."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Improvements Tab */}
          <TabsContent value="improve" className="mt-0">
            <div className="p-4 space-y-4">
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    Writing Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis?.improvements && (
                    <>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <GraduationCap className="w-3 h-3" />
                          Formal
                        </div>
                        <div className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-500">
                          {analysis.improvements.formal}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <MessageCircle className="w-3 h-3" />
                          Casual
                        </div>
                        <div className="text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded border-l-2 border-green-500">
                          {analysis.improvements.informal}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <BookOpen className="w-3 h-3" />
                          Academic
                        </div>
                        <div className="text-sm p-2 bg-purple-50 dark:bg-purple-950/20 rounded border-l-2 border-purple-500">
                          {analysis.improvements.academic}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <Target className="w-3 h-3" />
                          Concise
                        </div>
                        <div className="text-sm p-2 bg-orange-50 dark:bg-orange-950/20 rounded border-l-2 border-orange-500">
                          {analysis.improvements.concise}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Smart Compose */}
              {analysis?.nextWords && (
                <Card className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Smart Compose
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <span className="text-muted-foreground">Continue with:</span>{" "}
                      <span className="font-medium">{analysis.nextWords}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-0">
            <div className="p-4 space-y-4">
              {/* Paragraph Analysis */}
              {analysis?.paragraphAnalysis && (
                <>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Writing Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tone</span>
                        <Badge className={getToneColor(analysis.paragraphAnalysis.tone)}>
                          {analysis.paragraphAnalysis.tone}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Readability</span>
                        <Badge className={getReadabilityColor(analysis.paragraphAnalysis.readability)}>
                          {analysis.paragraphAnalysis.readability}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Sentiment</span>
                        <Badge variant="outline">
                          {analysis.paragraphAnalysis.sentiment}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Clarity</span>
                          <span className="text-sm font-medium">
                            {Math.round(analysis.paragraphAnalysis.clarity * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-green-500"
                            style={{ width: `${analysis.paragraphAnalysis.clarity * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Coherence</span>
                          <span className="text-sm font-medium">
                            {Math.round(analysis.paragraphAnalysis.coherence * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-green-500"
                            style={{ width: `${analysis.paragraphAnalysis.coherence * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suggestions */}
                  {analysis?.suggestions && analysis.suggestions.length > 0 && (
                    <Card className="bg-card/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Suggestions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-2">
                          {analysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}