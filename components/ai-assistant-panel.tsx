"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle, Wand2 } from "lucide-react"
import { AISuggestionCard, type AISuggestion } from "@/components/ai-suggestion-card"
import { getInstantSuggestions } from "@/lib/tamil-transliterator"
import { generateNewsEnhancements } from "@/lib/ai/news-enhancer"
import { useUserProfile } from "@/components/providers/user-provider"

type UsageCounts = {
  translation: number
  grammar: number
  spelling: number
  improvement: number
  total: number
}

interface AIAssistantPanelProps {
  text: string
  isAnalyzing?: boolean
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDeselectSelection?: () => void
  selectedText?: string
  selectedTextVersion?: number
  wordAtCursor?: string
  mode?: "standard" | "news" | "blog" | "academic" | "email"
  onUsageUpdate?: (data: { counts: UsageCounts }) => void
  defaultTone?: "formal" | "casual" | "informal" | "neutral"
}

export function AIAssistantPanel({
  text,
  isAnalyzing,
  onApplySuggestion,
  onDeselectSelection,
  selectedText,
  selectedTextVersion = 0,
  wordAtCursor,
  mode = "standard",
  onUsageUpdate,
  defaultTone = "formal",
}: AIAssistantPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [liveTranslation, setLiveTranslation] = useState("")
  const [translationTimeout, setTranslationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [mounted, setMounted] = useState(true)
  const prevTextRef = useRef("")
  const [lastTranslatedText, setLastTranslatedText] = useState("")
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedTone, setSelectedTone] = useState<"formal" | "casual" | "informal" | "neutral">(
    (defaultTone as any) || "formal",
  )
  const defaultUsage: UsageCounts = {
    translation: 0,
    grammar: 0,
    spelling: 0,
    improvement: 0,
    total: 0,
  }
  const { profile, refresh } = useUserProfile()
  const [usageCounts, setUsageCounts] = useState<UsageCounts>(defaultUsage)
  const DAILY_LIMIT = 30
  const tier = (profile?.subscription_tier || "free").toString().toLowerCase()
  const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at as any) : null
  const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at as any) : null
  const now = new Date()
  const trialActive =
    (profile?.is_trial_active && trialEnd && now <= trialEnd) ||
    (profile?.trial_used && trialStart && trialEnd && now <= trialEnd && tier !== "pro")
  const isFreeTier = !trialActive && tier === "free"
  const newsBlocked = isFreeTier && mode === "news"
  const effectiveMode = newsBlocked ? "standard" : mode
  const hasExceededLimit = isFreeTier && usageCounts.total >= DAILY_LIMIT

  const syncUsage = async () => {
    try {
      const res = await fetch("/api/ai/usage")
      if (!res.ok) return
      const data = await res.json()
      if (data?.counts) {
        setUsageCounts(data.counts)
        onUsageUpdate?.({ counts: data.counts })
        refresh().catch((err) => {
          console.error("Failed to refresh profile after usage sync", err)
        })
      }
    } catch (err) {
      console.error("Failed to sync usage", err)
    }
  }

  useEffect(() => {
    syncUsage()
  }, [])

  const recordUsage = (type: "translation" | "grammar" | "spelling" | "improvement") => {
    fetch("/api/ai/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: type }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.counts) {
          setUsageCounts(data.counts)
          onUsageUpdate?.({ counts: data.counts })
          refresh().catch((err) => {
            console.error("Failed to refresh profile after recording usage", err)
          })
        }
      })
      .catch((err) => {
        console.error("Failed to record usage", err)
      })
  }

  const tryConsume = (type: "translation" | "grammar" | "spelling" | "improvement") => {
    if (hasExceededLimit) {
      return false
    }
    const nextCounts: UsageCounts = {
      ...usageCounts,
      total: usageCounts.total + 1,
      [type]: (usageCounts as any)[type] + 1,
    }
    setUsageCounts(nextCounts)
    recordUsage(type)
    onUsageUpdate?.({ counts: nextCounts })
    return true
  }

  const detectLanguage = useMemo(() => {
    return (input: string): "eng" | "tam" | "thanglish" | "mixed" => {
      const textVal = input || ""
      const words = textVal.split(/\s+/).filter(Boolean)
      if (words.length === 0) return "mixed"

      const tamilChars = (textVal.match(/[\u0B80-\u0BFF]/g) || []).length
      const asciiChars = (textVal.match(/[A-Za-z]/g) || []).length
      const totalChars = Math.max(textVal.length, 1)

      const tamilRatio = tamilChars / totalChars
      const asciiRatio = asciiChars / totalChars

      const phoneticWords = [
        "epdi","epadi","vanga","vanakkam","sapadu","sariya","sari","enna","ennada","ennapa",
        "engayo","irukinga","ponga","seri","pa","da","machan","machaa","podu","saapidu",
        "seriyaa","vaa","po","poitu","varala","venum","seiyya","seiya","irukken","irukku"
      ]
      const romanWords = words.filter(w => /^[A-Za-z']+$/.test(w))
      const phoneticHits = romanWords.filter(w => phoneticWords.some(p => w.toLowerCase().includes(p)))

      if (tamilRatio > 0.8) return "tam"
      if (asciiRatio > 0.6 && phoneticHits.length === 0) return "eng"
      if (phoneticHits.length / Math.max(romanWords.length, 1) > 0.5) return "thanglish"
      return "mixed"
    }
  }, [])

  // Real-time translation effect - improved state management with debouncing
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    // Clear existing timeout
    if (translationTimeout) {
      clearTimeout(translationTimeout)
    }

    const translateText = async () => {
      const trimmedText = text.trim()

      // Clear existing translation immediately when starting new translation
      setLiveTranslation("")
      setIsTranslating(true)

      if (hasExceededLimit) {
        setLiveTranslation("Daily free limit reached. Upgrade for unlimited AI.")
        setIsTranslating(false)
        return
      }

      // Don't translate if text is empty, too short, or contains Tamil characters
      if (!trimmedText || trimmedText.length < 2 || /[\u0B80-\u0BFF]/.test(trimmedText)) {
        setIsTranslating(false)
        return
      }

      // Quick Thanglish detection
      const commonThanglishWords = [
        'naan', 'neenga', 'enna', 'epdi', 'enga', 'vaanga', 'poitu', 'vanthu', 'irukken', 'irukku',
        'pesunga', 'sollunga', 'kelaunga', 'theriyala', 'theriyum', 'seyya', 'pani', 'veetla'
      ]

      const words = trimmedText.toLowerCase().split(/\s+/)
      const hasThanglishWords = words.some(word =>
        commonThanglishWords.includes(word.replace(/[^\w]/g, ''))
      )

      // Check if it's English or Thanglish that needs translation
      const hasEnglishContent = /^[a-zA-Z\s.,!?]+$/.test(trimmedText)
      const shouldTranslate = (hasEnglishContent || hasThanglishWords) && words.length >= 1

      if (shouldTranslate) {
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmedText, tone: selectedTone, mode: effectiveMode }),
          })

          if (response.ok) {
            const data = await response.json()
            let translatedText = data.translation

            // Apply news-specific enhancements if in news mode
            if (effectiveMode === "news") {
              const enhancement = generateNewsEnhancements(translatedText)
              translatedText = enhancement.enhancedText

              // Add structure and continuity insights
              if (enhancement.structureSuggestions.length > 0) {
                console.log("[v0] News structure suggestions:", enhancement.structureSuggestions)
              }
              if (enhancement.continuityAnalysis.issues.length > 0) {
                console.log("[v0] Subject continuity issues:", enhancement.continuityAnalysis)
              }
            }

            setLiveTranslation(translatedText)
          } else if (response.status === 403 && newsBlocked) {
            setLiveTranslation("News mode is Pro-only. Upgrade to use news rewrites.")
          }
        } catch (error) {
          console.error("[v0] Live translation error:", error)
        } finally {
          setIsTranslating(false)
        }
      } else {
        setIsTranslating(false)
      }
    }

    // Only translate if text is valid
    if (text && text.trim().length > 0) {
      const timeout = setTimeout(() => {
        translateText()
      }, 1200)

      setTranslationTimeout(timeout)
    } else {
      setLiveTranslation("")
      setIsTranslating(false)
    }

    // Cleanup timeout on unmount
    return () => {
      if (translationTimeout) {
        clearTimeout(translationTimeout)
      }
    }
  }, [text, selectedTone, effectiveMode, newsBlocked, hasExceededLimit])

  useEffect(() => {
    const analyzeText = async () => {
      if (hasExceededLimit) {
        setSuggestions([])
        setLoading(false)
        return
      }

      if (!text || text.trim().length === 0 || isAnalyzing) {
        setSuggestions([])
        setLoading(false)
        return
      }

      setLoading(true)
      const trimmedText = text.trim()
      if (trimmedText !== prevTextRef.current) {
        // New input: clear cached translations/suggestions state
        setLiveTranslation("")
        setIsTranslating(false)
        prevTextRef.current = trimmedText
      }
      const lang = detectLanguage(trimmedText)
      let transformedSuggestions: AISuggestion[] = []
      const selectedLang = selectedText?.trim() ? detectLanguage(selectedText.trim()) : null

      // 1. If we have selected text, use comprehensive check API
      if (selectedText && selectedText.trim().length > 0) {
        const hasTamilInSelection = /[\u0B80-\u0BFF]/.test(selectedText)

        try {
          const comprehensiveResponse = await fetch("/api/comprehensive-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: selectedText.trim(),
              context: trimmedText,
              selectedWord: wordAtCursor || "",
              tone: selectedTone,
              mode,
            }),
          })

          if (comprehensiveResponse.ok) {
            const comprehensiveData = await comprehensiveResponse.json()

            if (comprehensiveData.success && comprehensiveData.result) {
              const result = comprehensiveData.result

              // Only add grammar/spelling cards for non-English selections
      if (selectedLang !== "eng") {
        const mappedType =
          result.type === 'tamil-spelling' ? 'spelling' :
          result.type === 'grammar' ? 'grammar' :
          result.type === 'spelling' ? 'spelling' : 'improvement'

        if (tryConsume(mappedType)) {
          transformedSuggestions.push({
            id: `comprehensive-${Date.now()}-${Math.random()}`,
            type: result.type === 'tamil-spelling' ? 'tamil-spelling' :
                  result.type === 'grammar' ? 'grammar' :
                  result.type === 'spelling' ? 'spelling' : 'improvement',
            title: result.type === 'tamil-spelling' ? 'Tamil Spelling Correction' :
                  result.type === 'grammar' ? 'Grammar Correction' :
                  result.type === 'spelling' ? 'Spelling Correction' : 'Improvement',
            original: result.original,
            suggested: Array.isArray(result.suggestions) ? result.suggestions.join(", ") : result.suggestions || result.suggested || "",
            reason: result.reason,
          })
        }
      }

              // Always offer translation for English/Thanglish selections
              if (selectedLang === "eng" || selectedLang === "thanglish" || selectedLang === "mixed") {
                if (hasExceededLimit) {
                  transformedSuggestions.push({
                    id: `translation-${Date.now()}`,
                    type: "translation",
                    title: "Daily limit reached",
                    original: selectedText.trim(),
                    suggested: "Free limit reached (30/day). Upgrade to continue AI rewrites.",
                    reason: "Upgrade to continue today.",
                  })
                  // Skip making a request when over the limit
                  return
                }
                try {
                  const translateResponse = await fetch("/api/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: selectedText.trim(), tone: selectedTone, mode: effectiveMode }),
                  })
                  if (translateResponse.ok) {
                    const translateData = await translateResponse.json()
                    let suggestedText = translateData.translation

                    // Apply news-specific enhancements if in news mode
                    if (effectiveMode === "news") {
                      const enhancement = generateNewsEnhancements(suggestedText)
                      suggestedText = enhancement.enhancedText
                    }

                    transformedSuggestions.push({
                      id: `translation-${Date.now()}`,
                      type: "translation",
                      title: effectiveMode === "news" ? "News Rewrite" : "English to Tamil Translation",
                      original: selectedText.trim(),
                      suggested: suggestedText,
                      reason: translateData.reason || (effectiveMode === "news" ? "News mode: neutral, factual rewrite." : `Translated to Tamil (${selectedTone}).`),
                    })
                  } else if (translateResponse.status === 403 && newsBlocked) {
                    transformedSuggestions.push({
                      id: `translation-${Date.now()}`,
                      type: "translation",
                      title: "Upgrade required",
                      original: selectedText.trim(),
                      suggested: "News mode is Pro-only. Upgrade to unlock news rewrites.",
                      reason: "Upgrade to Pro to use News mode.",
                    })
                  }
                } catch (err) {
                  console.error("[v0] Selection translation error:", err)
                }
              }
            }
          }
        } catch (error) {
          console.error("[v0] Comprehensive check error:", error)
        }
      } else {
        // 2. Regular analysis for full text when nothing is selected
        const words = trimmedText.split(/\s+/).filter(word => word.length > 0)

        // Detect actual Tamil Unicode characters
        const actualTamilWords = words.filter(word => /[\u0B80-\u0BFF]/.test(word))
        const hasTamilContent = actualTamilWords.length > 0

        // Detect English/Thanglish words
        const englishOrThanglishWords = words.filter(word => /^[a-zA-Z\s\.,\!\?]+$/.test(word))
        const isThanglish = detectThanglish(trimmedText)

        // Check for Tamil spelling errors first (highest priority)
        if (hasTamilContent && words.length >= 2) {
          try {
            const spellingResponse = await fetch("/api/tamil-spelling-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: trimmedText }),
            })

            if (spellingResponse.ok) {
              const spellingData = await spellingResponse.json()

              if (spellingData.hasErrors && spellingData.suggestions) {
                spellingData.suggestions.forEach((spellingError: any) => {
                if (tryConsume("spelling")) {
                  transformedSuggestions.push({
                    id: `tamil-spelling-${Date.now()}-${Math.random()}`,
                    type: "tamil-spelling",
                    title: "Tamil Spelling Correction",
                    original: spellingError.word,
                    suggested: spellingError.suggestions.join(", "),
                    reason: spellingError.reason,
                    position: spellingError.position,
                  })
                }
              })
            }
          }
          } catch (spellingError) {
            console.error("[v0] Tamil spelling check error:", spellingError)
          }
        }

        // If English/Thanglish present, add translation card
        if (englishOrThanglishWords.length > 0) {
          // 1) Predefined transliteration pass (primary) - only for Thanglish
          if (isThanglish) {
            const transliterationSuggestion = buildTransliterationSuggestion(trimmedText)
            if (transliterationSuggestion) {
              if (tryConsume("translation")) {
                transformedSuggestions.push(transliterationSuggestion)
              }
            }
          }

          // 2) AI translation (English and Thanglish)
          try {
            const title = isThanglish ? "Thanglish to Tamil Translation" : "English to Tamil Translation"
            const textToTranslate = trimmedText.length > 500 ? trimmedText.substring(0, 500) + "..." : trimmedText

            const translateResponse = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: textToTranslate, tone: selectedTone, mode }),
            })

            if (translateResponse.ok) {
              const translateData = await translateResponse.json()
              let suggestedText = translateData.translation

              // Apply news-specific enhancements if in news mode
              if (mode === "news") {
                const enhancement = generateNewsEnhancements(suggestedText)
                suggestedText = enhancement.enhancedText
              }

              const reason =
                translateData.reason ||
                (mode === "news"
                  ? "Rewritten for neutral, factual news tone."
                  : isThanglish
                    ? `Thanglish to Tamil conversion (${trimmedText.length > 500 ? 'partial due to length' : 'complete'})`
                    : `English to Tamil translation (${trimmedText.length > 500 ? 'partial due to length' : 'complete'})`)

              if (tryConsume("translation")) {
                transformedSuggestions.push({
                  id: `translation-${Date.now()}`,
                  type: mode === "news" ? "news" : "translation",
                  title: mode === "news" ? "News Rewrite" : title,
                  original: trimmedText,
                  suggested: suggestedText,
                  reason: reason,
                  tone: mode === "news" ? "news" : translateData.tone,
                })
              }
            }
          } catch (translationError) {
            console.error("[v0] Translation error:", translationError)
          }
        }
      }

      // Deduplicate by type+original+suggested and cap total
      const uniqueMap = new Map<string, AISuggestion>()
      transformedSuggestions.forEach((s) => {
        const key = `${s.type}-${s.original ?? ""}-${s.suggested}`
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, s)
        }
      })

      // Fallback: suggest alternatives for single-word selections when nothing else matched
      if (
        selectedText &&
        selectedText.trim().split(/\s+/).length === 1 &&
        (selectedLang !== "tam" || !/[\u0B80-\u0BFF]/.test(selectedText))
      ) {
        const altWords = buildAlternativeWords(selectedText.trim(), mode)
        if (altWords.length > 0 && tryConsume("improvement")) {
          const altSuggestion: AISuggestion = {
            id: `alts-${Date.now()}`,
            type: "improvement",
            title: "Alternative wording",
            original: selectedText.trim(),
            suggested: altWords.join(", "),
            reason: "Context-aware alternatives based on your sentence.",
          }
          const key = `${altSuggestion.type}-${altSuggestion.original}-${altSuggestion.suggested}`
          uniqueMap.set(key, altSuggestion)
        }
      }

      const capped = Array.from(uniqueMap.values())
        .filter((suggestion) => (suggestion.suggested ?? "").trim().length > 0)
        .slice(0, 5)
      if (mounted) {
        setSuggestions(capped)
      }
      setLoading(false)
    }

    // Add debouncing to reduce API calls
    const timeoutId = setTimeout(() => {
      analyzeText().catch(() => {
        if (mounted) setLoading(false)
      })
    }, 1200)

    return () => clearTimeout(timeoutId)
  }, [
    text,
    isAnalyzing,
    lastTranslatedText,
    selectedText || "",
    selectedTextVersion,
    wordAtCursor || "",
    mounted,
    refreshToken,
    selectedTone,
    mode,
  ])

  const buildAlternativeWords = (word: string, currentMode: AIAssistantPanelProps["mode"]) => {
    const base = word.toLowerCase()
    const pools: Record<string, string[]> = {
      news: ["stated", "reported", "announced", "noted", "confirmed", "said"],
      academic: ["analyze", "evaluate", "summarize", "highlight", "demonstrate", "present"],
      email: ["clarify", "confirm", "request", "share", "follow up", "update"],
      blog: ["explore", "unpack", "dive", "share", "break down", "explain"],
      standard: ["improve", "refine", "clarify", "simplify", "strengthen", "enhance"],
    }
    const pool = pools[currentMode || "standard"] || pools.standard
    return pool.filter((w) => w !== base).slice(0, 5)
  }

  // Helper function to detect Thanglish
  const detectThanglish = (text: string): boolean => {
    const commonThanglishWords = [
      'naan', 'neenga', 'enna', 'epdi', 'enga', 'vaanga', 'poitu', 'vanthu', 'irukken', 'irukku',
      'pesunga', 'sollunga', 'kelaunga', 'theriyala', 'theriyum', 'seyya', 'pani', 'veetla',
      'school', 'college', 'office', 'friend', 'family', 'love', 'happy', 'sad', 'angry',
      'good', 'bad', 'nice', 'awesome', 'super', 'bro', 'sister', 'mama', 'chithappa'
    ]

    const words = text.toLowerCase().split(/\s+/)
    const thanglishWordsFound = words.filter(word =>
      commonThanglishWords.includes(word.replace(/[^\w]/g, ''))
    )

    // Be strict: only treat as Thanglish when we see phonetic hits
    return thanglishWordsFound.length > 0
  }

  // Build predefined transliteration-based suggestion for full text (only when text looks like Thanglish)
  const buildTransliterationSuggestion = (input: string): AISuggestion | null => {
    if (!detectThanglish(input)) return null

    const words = input.split(/\s+/)
    if (words.length === 0) return null

    const mapped = words.map((word) => {
      const clean = word.replace(/[^a-zA-Z']/g, "")
      if (!clean) return word
      const options = getInstantSuggestions(clean)
      return options.length > 0 ? options[0].tamil : word
    })

    const joined = mapped.join(" ")
    if (joined === input) return null

    return {
      id: `predefined-${Date.now()}`,
      type: mode === "news" ? "news" : "translation",
      title: mode === "news" ? "News Rewrite" : "Thanglish → Tamil (predefined)",
      original: input,
      suggested: joined,
      reason: mode === "news" ? "News-mode rewrite using predefined phonetic mapping; AI will refine." : "Converted using predefined transliteration mappings; AI will refine if needed.",
    }
  }

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    onApplySuggestion?.(suggestion)
    // Keep panel open and trigger re-analysis for next selection/text
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
    setRefreshToken((prev) => prev + 1)
  }

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id))
  }

  const handleApplyAll = () => {
    if (shouldShowLiveTranslationCard && liveTranslationSuggestion) {
      handleApplyLiveSuggestionCard()
    }
    suggestions.forEach((s) => onApplySuggestion?.(s))
    setSuggestions([])
  }

  const handleApplyLiveTranslation = () => {
    if (liveTranslation && onApplySuggestion) {
      console.log("[v0] Applying live translation:", liveTranslation)
      onApplySuggestion({
        id: `live-translation-${Date.now()}`,
        type: 'translation',
        title: 'Live Translation',
        original: text,
        suggested: liveTranslation,
        reason: `Real-time translation from English/Thanglish to Tamil (tone: ${selectedTone})`
      })
      // Clear after applying - let the next text change trigger new translation
      setLiveTranslation("")
      setIsTranslating(false)
      setLastTranslatedText("")
    }
  }

  const langForRender = detectLanguage(text || "")
  const hasTamilScript = /[\u0B80-\u0BFF]/.test(text)
  const hasTranslationCard = suggestions.some((s) => s.type === "translation")
  const shouldShowLiveTranslationCard = Boolean(
    liveTranslation &&
    !hasTranslationCard &&
    !hasTamilScript &&
    (langForRender === "eng" || langForRender === "thanglish" || langForRender === "mixed")
  )

  const liveTranslationSuggestion: AISuggestion | null = shouldShowLiveTranslationCard
    ? {
        id: "live-translation",
        type: "translation",
        title: "English → Tamil",
        original: text.trim(),
        suggested: liveTranslation,
        reason: `Auto-translated while you type (tone: ${selectedTone}).`,
      }
    : null

  const handleApplyLiveSuggestionCard = () => {
    handleApplyLiveTranslation()
  }

  const handleDismissLiveTranslation = () => {
    setLiveTranslation("")
    setIsTranslating(false)
    setLastTranslatedText("")
  }

  const totalSuggestions = suggestions.length + (shouldShowLiveTranslationCard ? 1 : 0)
  const showPerfect = totalSuggestions === 0 && !loading && !isTranslating

  return (
    <>
      <div className="w-full max-w-[460px] md:w-[440px] lg:w-[460px] h-full flex flex-col rounded-2xl border border-slate-200 bg-white shadow-md sticky top-4 overflow-hidden">
        <div className="border-b border-teal-200 bg-white px-4 py-3 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-teal-700 ai-logo-glow" />
            <p className="text-sm font-semibold text-teal-900">AI Assistant</p>
            <div className="ml-auto text-xs font-semibold text-teal-800">
              {loading ? "Analyzing…" : `${totalSuggestions} suggestion${totalSuggestions === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
          {isTranslating && !liveTranslation && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Translating English → Tamil…
            </div>
          )}

        {showPerfect && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <div>
              <div className="font-semibold">Your text looks perfect</div>
              <div className="text-xs text-emerald-700">No issues detected by Thamly AI.</div>
            </div>
          </div>
        )}

        {(suggestions.length > 0 || shouldShowLiveTranslationCard) && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-emerald-200 text-emerald-700">
                <CheckCircle className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-emerald-900">
                  {totalSuggestions} suggestion{totalSuggestions === 1 ? "" : "s"} found
                </p>
                <p className="text-xs text-emerald-700">Smart Tamil fixes ready</p>
              </div>
            </div>
            <button
              onClick={handleApplyAll}
          className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 transition"
            >
              Accept All
            </button>
          </div>
        )}

        {shouldShowLiveTranslationCard && liveTranslationSuggestion && (
          <AISuggestionCard
            suggestion={liveTranslationSuggestion}
            onApply={(_s) => handleApplyLiveSuggestionCard()}
            onDismiss={(_id) => handleDismissLiveTranslation()}
          />
        )}

        {suggestions.map((suggestion) => (
            <AISuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={handleApplySuggestion}
              onDismiss={handleDismissSuggestion}
            />
          ))}
        {suggestions.length === 0 && !loading && !shouldShowLiveTranslationCard && !isTranslating && (
          <p className="text-xs text-slate-500 text-center">
            Waiting for something to improve…
          </p>
        )}
        {hasExceededLimit && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 text-center space-y-2">
            <p>You’ve used {DAILY_LIMIT} AI checks today. Please come back tomorrow for more AI assistance or upgrade.</p>
            <button
              className="rounded-full bg-amber-600 px-4 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open("/subscription/upgrade", "_blank")
                }
              }}
            >
              Upgrade
            </button>
          </div>
        )}
        </div>
        <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          Thamly AI may make mistakes. Please review before applying.
        </div>
      </div>
    </>
  )
}

// Local keyframes for logo glow
;(() => {
  if (typeof document === "undefined") return
  const id = "ai-assistant-logo-glow-keyframes"
  if (document.getElementById(id)) return
  const style = document.createElement("style")
  style.id = id
  style.innerHTML = `
    @keyframes logoGlow {
      0% { filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.6)); }
      50% { filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.95)); }
      100% { filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.6)); }
    }
    .ai-logo-glow {
      animation: logoGlow 2.5s ease-in-out infinite;
    }
  `
  document.head.appendChild(style)
})()
