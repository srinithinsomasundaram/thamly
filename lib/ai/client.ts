// Client-side AI helper functions

export interface AIAnalysis {
  cleanedText?: string
  grammarIssues?: Array<{
    type: "grammar" | "spelling" | "punctuation" | "syntax"
    original: string
    suggestion: string
    message: string
    position: { start: number; end: number }
  }>
  spellingIssues?: Array<{
    word: string
    suggestion: string
    confidence: number
  }>
  translations?: {
    toEnglish: string
    toHindi: string
    toSimplifiedTamil: string
  }
  paragraphAnalysis?: {
    tone: "formal" | "informal" | "academic" | "casual" | "poetic"
    readability: "easy" | "moderate" | "complex"
    sentiment: "positive" | "neutral" | "negative"
    clarity: number
    coherence: number
  }
  improvements?: {
    formal: string
    informal: string
    academic: string
    concise: string
    expanded: string
  }
  suggestions?: string[]
  nextWords?: string
  smartCompose?: string
  error?: boolean
}

export async function analyzeText(text: string, features: string = "all"): Promise<AIAnalysis | null> {
  try {
    const response = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, features }),
    })

    if (!response.ok) {
      console.error("AI Analysis failed:", response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error analyzing text:", error)
    return null
  }
}

// Debounced analysis for real-time features
export function createDebouncedAnalyzer(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null
  let lastAbortController: AbortController | null = null

  return (text: string, features: string = "all", callback: (result: AIAnalysis | null) => void) => {
    // Cancel previous request
    if (lastAbortController) {
      lastAbortController.abort()
    }

    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Create new abort controller for this request
    const abortController = new AbortController()
    lastAbortController = abortController

    // Set new timeout
    timeoutId = setTimeout(async () => {
      try {
        const result = await analyzeText(text, features)
        if (!abortController.signal.aborted) {
          callback(result)
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Debounced analysis error:", error)
          callback(null)
        }
      }
    }, delay)
  }
}

// Specific analysis functions
export async function checkGrammar(text: string): Promise<AIAnalysis | null> {
  return analyzeText(text, "grammar")
}

export async function translateText(text: string): Promise<AIAnalysis | null> {
  return analyzeText(text, "translation")
}

export async function getImprovements(text: string): Promise<AIAnalysis | null> {
  return analyzeText(text, "improvements")
}

// Utility functions
export function getGrammarErrorCount(analysis: AIAnalysis): number {
  return (analysis.grammarIssues?.length || 0) + (analysis.spellingIssues?.length || 0)
}

export function getReadabilityScore(analysis: AIAnalysis): number {
  const clarity = analysis.paragraphAnalysis?.clarity || 0.5
  const coherence = analysis.paragraphAnalysis?.coherence || 0.5
  return (clarity + coherence) / 2
}

export function getToneColor(tone: string): string {
  switch (tone) {
    case "formal": return "text-blue-600"
    case "informal": return "text-green-600"
    case "academic": return "text-purple-600"
    case "casual": return "text-orange-600"
    case "poetic": return "text-pink-600"
    default: return "text-gray-600"
  }
}

export function getReadabilityColor(readability: string): string {
  switch (readability) {
    case "easy": return "text-green-600"
    case "moderate": return "text-yellow-600"
    case "complex": return "text-red-600"
    default: return "text-gray-600"
  }
}