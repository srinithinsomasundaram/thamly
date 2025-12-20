// THAMLY NEWS WRITING SYSTEM (TNWS v1.0)
// Purpose: Convert any text into professional news Tamil for media, journalism, portals, breaking news, reports, captions.

// TNWS Number Rules (Rule 3): Never expand huge numbers fully in Tamil letters
function formatNumberTNWS(num: number): string {
  // Compact format for large numbers
  if (num >= 10000000) { // 1 crore and above
    const crores = num / 10000000
    return `₹${crores.toFixed(0).replace(/\B(?=(\d{2})+(?!\d))/g, ",")} கோடி`
  } else if (num >= 100000) { // 1 lakh and above
    const lakhs = num / 100000
    return `${lakhs.toFixed(0).replace(/\B(?=(\d{2})+(?!\d))/g, ",")} லட்சம்`
  } else if (num >= 1000) {
    const thousands = num / 1000
    return `${thousands.toFixed(0)} ஆயிரம்`
  }
  return num.toString()
}

// Tamil numeral converter for small numbers only
const tamilNumbers: { [key: string]: string } = {
  '0': 'பூஜ்ஜம்',
  '1': 'ஒன்று',
  '2': 'இரண்டு',
  '3': 'மூன்று',
  '4': 'நான்கு',
  '5': 'ஐந்து',
  '6': 'ஆறு',
  '7': 'ஏழு',
  '8': 'எட்டு',
  '9': 'ஒன்பது',
  '10': 'பத்து'
}

// Repeated phrases to avoid in news
const repetitivePhrases: Array<{ phrase: string; alternatives: string[] }> = [
  {
    phrase: 'இப்பணி',
    alternatives: ['இந்த நிகழ்வில்', 'தற்போதனை', 'சம்பவதில்', 'விவகாரத்தில்']
  },
  {
    phrase: 'பணிக்கள்',
    alternatives: ['நடவடிக்கைகள்', 'செயல்பாடுகள்', 'செயல்கள்', 'முயற்சிகள்', 'திட்டங்கள்']
  },
  {
    phrase: 'செயல்பாடுகள்',
    alternatives: ['நடவடிக்கைகள்', 'முன்னோடித்தல்கள்', 'தொடர் செயல்கள்', 'முயற்சிகள்', 'நிகழ்வுகள்']
  },
  {
    phrase: 'அறிவிப்படுத்தப்பட்டது',
    alternatives: ['தெரியாகிறது', 'வெளிப்படுத்தப்பட்டது', 'அறிவியாகிறது', 'புரியாகிறது']
  },
  {
    phrase: 'செய்யப்பட்டுள்ளனர்',
    alternatives: ['செய்வார் திட்டமிடுகின்றனர்', 'செயல்பட தொடங்குள்ளனர்', 'மேற்கொண்ட உள்ளனர்']
  }
]

// Generic to specific term mappings
const genericToSpecific: Array<{ generic: string; specific: string[] }> = [
  {
    generic: 'பெரிய',
    specific: ['முக்கிய', 'விரிவான', 'முக்கியமான', 'முக்கியத்தவமான']
  },
  {
    generic: 'அதிகாரிகள்',
    specific: ['அதிகாரிகள்', 'அதிகாரமண்டலாளர்', 'அதிகார அதிகாரிகள்', 'பொதுமைப் பெருமாளர்']
  },
  {
    generic: 'நிகழ்ச்சி',
    specific: ['நிகழ்வு', 'சம்பவம்', 'நிகழ்ச்சிக் கூட்டம்', 'அரசிய நிகழ்ச்சி']
  },
  {
    generic: 'பணிம்',
    specific: ['பணிப்பாடு', 'சேவை', 'முயற்சி', 'செயல்', 'நடவடித்தல்']
  }
]

// News structure patterns
const newsStructures = {
  standard: [
    'ஊர் நாள், [இடம்], [நேரம்] - [முக்கிய நிகழ்வு] [சாதகரமாக].',
    '[நபர்] சம்பந்தா [செயலை] [இடம்] [மாற்றம்/செய்தார்].',
    '[சாதகரமான] இந்த [விவகாரத்தில்] [தாக்கம்] [பாதிராக] உள்ளது.'
  ],
  incident: [
    '[இடம்] உள்ள [இடம்] - [சம்பவம்] [சம்பவத்தில்] [விபத்தம்].',
    '[பாதிராக] [மனிதர்கள்] [காயங்கள்] [மீட்காமாக].',
    '[அதிகாரிகள்] [சம்பவத்திற்கான] [முன்னோடித்தல்] [தகவல்கள் கூறியுள்ளனர்].'
  ],
  announcement: [
    '[நிறுவனம்] - [அமைப்படி] [அறிவித்தனர்] [புதிய அறிவிப்படுத்தனர்].',
    '[திட்டம்] [விரைவாக] [செயல்படத் தொடங்குள்ளது] என [தெரிவித்தனர்] கூறியனர்.',
    '[திட்டம்] [நாள்] [நிகழ்வுக்கு] [தயாராக] [ஏற்பாடுகள்] வழங்கப்படும்.'
  ]
}

// TNWS Number Rules: Convert numbers to TNWS standard format
export function convertToTamilNumbers(text: string): string {
  return text.replace(/\d+/g, (match) => {
    const num = parseInt(match)

    // Use Tamil numerals for very small numbers (1-10) in simple contexts
    if (num <= 10 && tamilNumbers[match]) {
      return tamilNumbers[match]
    }

    // Use TNWS compact format for larger numbers and news contexts
    if (num >= 1) {
      return formatNumberTNWS(num)
    }

    return match
  })
}

// Detect and replace repetitive phrases
export function eliminateRepetition(text: string): string {
  let result = text

  repetitivePhrases.forEach(({ phrase, alternatives }) => {
    const regex = new RegExp(phrase, 'gi')
    let count = 0
    result = result.replace(regex, (found) => {
      count++
      if (count > 1) {
        const alt = alternatives[Math.min(count - 2, alternatives.length - 1)]
        return alt
      }
      return found
    })
  })

  return result
}

// Replace generic terms with specific alternatives
export function replaceGenericTerms(text: string): string {
  let result = text
  const usedTerms: Set<string> = new Set()

  genericToSpecific.forEach(({ generic, specific }) => {
    const regex = new RegExp(generic, 'gi')
    result = result.replace(regex, () => {
      const available = specific.filter(term => !usedTerms.has(term))
      if (available.length > 0) {
        const term = available[0]
        usedTerms.add(term)
        return term
      }
      return specific[0]
    })
  })

  return result
}

// Suggest news structure based on content
export function suggestNewsStructure(content: string, context: string = ''): string[] {
  if (content.includes('விபத்தம்') || content.includes('விபத்தம்')) {
    return newsStructures.incident
  }
  if (content.includes('அறிவித்தனர்') || content.includes('தெரிவித்தனர்')) {
    return newsStructures.announcement
  }
  return newsStructures.standard
}

// Apply neutral passive voice (Rule 2: Use Neutral Passive Voice)
export function applyNeutralPassiveVoice(text: string): string {
  const passiveTransformations = [
    { pattern: /(\w+) கட்டுகிறது/g, replacement: '$1 செயல்படுத்தி வருகிறது' },
    { pattern: /(\w+) கட்டப்படுகிறது/g, replacement: '$1 செயல்படுத்தப்படுகிறது' },
    { pattern: /(\w+) சொன்னார்கள்/g, replacement: 'அதிகாரிகள் தெரிவித்துள்ளனர்' },
    { pattern: /(\w+) பண்ணுகிறாங்க/g, replacement: '$1 மேற்கொண்டு வருகின்றனர்' },
    { pattern: /(\w+) செய்யுறாங்க/g, replacement: '$1 செயல்படுத்தப்பட்டு வருகிறது' },
    { pattern: /மேம்படுத்தப்பட்டு வருகிறது/g, replacement: 'செயல்படுத்தப்படுகிறது' },
    { pattern: /மேம்படுத்தப்பட்டு வருகின்றது/g, replacement: 'செயல்படுத்தப்படுகிறது' }
  ]

  let result = text
  passiveTransformations.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement)
  })

  return result
}

// TNWS Structure Rules (Rule 1): Location → Event → Time → Impact
export function enforceNewsStructure(text: string): string {
  const sentences = text.split(/[.!?]/).filter(s => s.trim())

  return sentences.map(sentence => {
    const trimmed = sentence.trim()

    // TNWS Structure indicators
    const locationIndicators = ['இல்', 'ல்', 'புறவட்டாரம்', 'அருகே', 'அருகில்', 'தென்', 'வட', 'கிழக்கு', 'மேற்கு']
    const eventIndicators = ['விபத்து', 'சம்பவம்', 'நிகழ்வு', 'கூட்டம்', 'போராட்டம்', 'களிப்பணி', 'அறிவிப்பு', 'சடங்கு']
    const timeIndicators = ['நேற்று', 'இன்று', 'நாளை', 'காலை', 'மாலை', 'நடுப்பகல்', 'கடந்த', 'வரும்']
    const impactIndicators = ['காயமடைந்தார்', 'உயிரிழந்தார்', 'மீட்கப்பட்டார்', 'தப்பினார்', 'பாதிக்கப்பட்டார்', 'கைது செய்யப்பட்டனர்', 'தடுப்பப்பட்டனர்']

    // If sentence doesn't follow TNWS structure, try to reorganize
    const hasLocation = locationIndicators.some(ind => trimmed.includes(ind))
    const hasEvent = eventIndicators.some(ind => trimmed.includes(ind))
    const hasTime = timeIndicators.some(ind => trimmed.includes(ind))
    const hasImpact = impactIndicators.some(ind => trimmed.includes(ind))

    // Skip if already properly structured or too simple
    if (hasLocation && hasEvent && (hasTime || hasImpact)) {
      return trimmed
    }

    // Try to structure sentences with multiple elements
    if ((hasEvent || hasImpact) && !hasLocation) {
      // Missing location - can't fully structure without location info
      return trimmed
    }

    return trimmed
  }).join('. ') + (sentences.length > 0 ? '.' : '')
}

// Remove emotional language (Rule 5: Avoid Emotional Language)
export function removeEmotionalLanguage(text: string): string {
  const emotionalWords = [
    'சோகமான', 'அதிர்ச்சிகரமான', 'மகிழ்ச்சியான', 'பரபரப்பான',
    'மோசமான', 'அற்புதமான', 'துயரமான', 'பயங்கரமான'
  ]

  let result = text
  emotionalWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\s*`, 'gi')
    result = result.replace(regex, '')
  })

  // Replace emotional descriptions with factual statements
  const factualReplacements = [
    { pattern: /சோகமான விபத்து/g, replacement: 'விபத்து' },
    { pattern: /அதிர்ச்சிகரமான சம்பவம்/g, replacement: 'சம்பவம்' },
    { pattern: /மகிழ்ச்சியான நிகழ்வு/g, replacement: 'நிகழ்வு' }
  ]

  factualReplacements.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement)
  })

  return result.replace(/\s+/g, ' ').trim()
}

// TNWS Vocabulary Rules (Rule 7): Prefer Standard Words for News
export function applyVocabularyRules(text: string): string {
  // TNWS Standard vocabulary conversions
  const vocabularyMappings = [
    // Professional/Official terms
    { slang: /ஆபிஸ்/g, standard: 'அலுவலகம்' },
    { slang: /ஆபீஸ்/g, standard: 'அலுவலகம்' },
    { slang: /போலீஸ்/g, standard: 'காவல்துறை' },
    { slang: /போலீஸ்/g, standard: 'காவல்துறை' },
    { slang: /டாக்டர்/g, standard: 'மருத்துவர்' },
    { slang: /டாக்டர்கள்/g, standard: 'மருத்துவர்கள்' },
    { slang: /கார்/g, standard: 'வாகனம்' },
    { slang: /கார்கள்/g, standard: 'வாகனங்கள்' },
    { slang: /கோவில்/g, standard: 'கோவில்' }, // Keep same, only use திருக்கோவில் for formal religious contexts

    // Action verbs
    { slang: /சாப்பிட்டாங்க/g, standard: 'உணவருந்துகின்றனர்' },
    { slang: /சாப்பிட்டார்/g, standard: 'உணவருந்தினார்' },
    { slang: /சாப்பிட்டனர்/g, standard: 'உணவருந்தினார்கள்' },
    { slang: /புடிச்சி போயாச்சு/g, standard: 'கைது செய்துள்ளனர்' },
    { slang: /பிடிச்சார்/g, standard: 'கைது செய்யப்பட்டார்' },
    { slang: /போட்ருக்காங்க/g, standard: 'செயல்படுத்துகின்றனர்' },
    { slang: /போட்டாங்க/g, standard: 'செயல்படுத்தினார்கள்' },
    { slang: /போட்டார்/g, standard: 'செயல்படுத்தினார்' },

    // Movement verbs
    { slang: /வந்துட்டாங்க/g, standard: 'வந்துள்ளனர்' },
    { slang: /வந்தாங்க/g, standard: 'வந்தனர்' },
    { slang: /போயிடுச்சு/g, standard: 'சென்றுள்ளனர்' },
    { slang: /போயாங்க/g, standard: 'சென்றனர்' },
    { slang: /போயாள்/g, standard: 'சென்றாள்' },

    // Communication verbs
    { slang: /கேட்டுச்சு/g, standard: 'கேட்டனர்' },
    { slang: /கேட்டாங்க/g, standard: 'கேட்டனர்' },
    { slang: /சொன்னாங்க/g, standard: 'கூறினார்கள்' },
    { slang: /சொன்னார்/g, standard: 'கூறினார்' },
    { slang: /சொல்லிட்டாங்க/g, standard: 'தெரிவித்தனர்' },
    { slang: /சொல்லியிட்டார்/g, standard: 'தெரிவித்தார்' },

    // Time and place
    { slang: /இப்போ/g, standard: 'தற்போது' },
    { slang: /இப்போது/g, standard: 'தற்போது' },
    { slang: /நேரம்/g, standard: 'நேரம்' }, // Keep same
    { slang: /இடம்/g, standard: 'இடம்' }, // Keep same

    // Common expressions
    { slang: /பிரச்னம்/g, standard: 'சிக்கல்' },
    { slang: /பிராப்ளம்/g, standard: 'சிக்கல்' },
    { slang: /வேலை/g, standard: 'பணி' },
    { slang: /வேலைகள்/g, standard: 'பணிகள்' },
    { slang: /ஜாப்/g, standard: 'வேலை' },
    { slang: /பணம்/g, standard: 'பணம்' } // Keep same for money contexts
  ]

  let result = text
  vocabularyMappings.forEach(({ slang, standard }) => {
    result = result.replace(slang, standard)
  })

  return result
}

// Add professional source attribution (Rule 8)
export function addProfessionalAttribution(text: string): string {
  const attributionPatterns = [
    { pattern: /(\w+) சொன்னார்/g, replacement: 'அதிகாரிகள் தெரிவித்தனர்' },
    { pattern: /(\w+) கூறினார்/g, replacement: '$1 தெரிவித்தனர்' },
    { pattern: /தெரியும்/g, replacement: 'அறிவிக்கப்பட்டுள்ளது' },
    { pattern: /வந்தது/g, replacement: 'வெளியிடப்பட்டது' }
  ]

  let result = text
  attributionPatterns.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement)
  })

  // Ensure proper attribution format
  if (!result.includes('தெரிவித்தனர்') && !result.includes('அறிவிக்கப்பட்டுள்ளது')) {
    if (result.includes('அதிகாரி')) {
      result += ' அதிகாரிகள் தெரிவித்தனர்.'
    }
  }

  return result
}

// Format facts as list for reports (Rule 9: Use List-Based Facts)
export function formatAsListIfReport(text: string): string {
  // Check if this looks like a report with multiple facts
  const factIndicators = ['செலவு', 'தொகை', 'தூரம்', 'நிலையங்கள்', 'திட்டம்', 'மொத்தம்']
  const factCount = factIndicators.reduce((count, indicator) =>
    text.includes(indicator) ? count + 1 : count, 0)

  if (factCount >= 2) {
    // Convert to list format
    const facts: string[] = []
    factIndicators.forEach(indicator => {
      const regex = new RegExp(`[^.]*${indicator}[^.]*`, 'gi')
      const matches = text.match(regex)
      if (matches) {
        matches.forEach(match => {
          facts.push(`➤ ${match.trim()}`)
        })
      }
    })

    if (facts.length > 0) {
      return facts.join('\n')
    }
  }

  return text
}

// Remove repetitive phrases with same meaning (Issue Fix)
export function removeDuplicateMeanings(text: string): string {
  const duplicatePatterns = [
    { pattern: /வேகமாக நடைபெற்று வருகின்றன.*?வேகம் பெற்றுள்ளது/g, replacement: 'வேகம் பெற்று நடைபெற்று வருகிறது' },
    { pattern: /விரைவாக நடைபெற்று வருகின்றன.*?வேகம் பெற்றுள்ளது/g, replacement: 'விரைவாக நடைபெற்று வருகிறது' },
    { pattern: /தீவிரமாக நடைபெற்று வருகின்றன.*?வேகம் பெற்றுள்ளது/g, replacement: 'தீவிரமாக நடைபெற்று வருகிறது' }
  ]

  let result = text
  duplicatePatterns.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement)
  })

  return result
}

// Fix directional terms to standard form
export function fixDirectionalTerms(text: string): string {
  const directionalFixes = [
    { pattern: /தெற்கு சென்னை/g, replacement: 'தென் சென்னை' },
    { pattern: /வடக்கு சென்னை/g, replacement: 'வட சென்னை' },
    { pattern: /கிழக்கு சென்னை/g, replacement: 'கிழக்கு சென்னை' },
    { pattern: /மேற்கு சென்னை/g, replacement: 'மேற்கு சென்னை' },
    { pattern: /தெற்கு மாவட்டம்/g, replacement: 'தென் மாவட்டம்' },
    { pattern: /வடக்கு மாவட்டம்/g, replacement: 'வட மாவட்டம்' }
  ]

  let result = text
  directionalFixes.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement)
  })

  return result
}

// Fix distance terminology
export function fixDistanceTerminology(text: string): string {
  const distanceFixes = [
    { pattern: /(\d+)\s*கி\.?\s*மீ\.?\s*தூரமுள்ள/g, replacement: '$1 கி.மீ நீளமுடைய' },
    { pattern: /(\d+)\s*கிலோமீட்டர்\s*தூரமுள்ள/g, replacement: '$1 கிலோமீட்டர் நீளமுடைய' },
    { pattern: /(\d+)\s*கி.மீ\.*\s*தூரமுள்ள/g, replacement: '$1 கி.மீ நீளமுடைய' }
  ]

  let result = text
  distanceFixes.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement)
  })

  return result
}

// Complete infrastructure lists properly
export function completeInfrastructureList(text: string): string {
  // Check for infrastructure-related sentences that seem incomplete
  const infraKeywords = ['உள்கட்டமைப்பு', 'சாலை', 'பாலம்', 'சுரங்கப்பாதை', 'நிலையம்', 'வசதி']
  const sentences = text.split(/[.!?]/).filter(s => s.trim())

  return sentences.map(sentence => {
    const trimmed = sentence.trim()

    // Check if this is about infrastructure and seems incomplete
    if (infraKeywords.some(keyword => trimmed.includes(keyword)) &&
        trimmed.length > 10 &&
        !trimmed.includes('மேம்படுத்தப்பட்டு') &&
        !trimmed.includes('செயல்படுத்தப்படுகிறது') &&
        !trimmed.includes('உள்ளது') &&
        !trimmed.includes('முடிவடையும்')) {

      // Complete with appropriate infrastructure action
      if (trimmed.includes('பணி')) {
        return `${trimmed} செயல்படுத்தப்படுகிறது`
      } else if (trimmed.includes('உருவாக்கம்')) {
        return `${trimmed} முடிவடையும்`
      } else {
        return `${trimmed} விரைவில் முடிங்கும்`
      }
    }

    return trimmed
  }).join('. ') + (sentences.length > 0 ? '.' : '')
}

// Complete sentences with work intensification (Rule 6: No Assumptions + Final Sentence Enhancement)
export function completeWithIntensification(text: string): string {
  // Split into sentences
  const sentences = text.split(/[.!?]/).filter(s => s.trim())

  return sentences.map(sentence => {
    const trimmed = sentence.trim()

    // If sentence ends abruptly or seems incomplete, add intensification
    if (
      trimmed.length > 0 &&
      !trimmed.endsWith('.') &&
      !trimmed.includes('வருகிறது') &&
      !trimmed.includes('படுகிறது') &&
      !trimmed.includes('தெரிவித்தனர்') &&
      !trimmed.includes('அறிவித்தனர்') &&
      !trimmed.includes('கூறினார்')
    ) {
      // Check if it's about work/effort and needs intensification
      const workIndicators = ['பணி', 'வேலை', 'முயற்சி', 'செயல்', 'செயல்பாடு', 'திட்டம்']

      if (workIndicators.some(indicator => trimmed.includes(indicator))) {
        return `${trimmed} வேகம் பெற்றுள்ளது`
      }

      // For other incomplete sentences
      if (trimmed.includes('இல்') || trimmed.includes('அருகே')) {
        return `${trimmed} தொடர்பான விசாரணை நடைபெற்று வருகிறது`
      }
    }

    return trimmed
  }).join('. ') + (sentences.length > 0 ? '.' : '')
}

// TNWS Tense Rules (Rule 4): Appropriate tenses for different situations
export function applyTenseRules(text: string): string {
  // Ongoing work: "நடைபெற்று வருகிறது / செயல்படுத்தப்படுகிறது"
  // Completed event: "நடைபெற்றது / முடிவடைந்தது"
  // Future result: "குறையும் / அமலுக்கு வரும்"
  // Reports/quotes: "தெரிவித்துள்ளனர் / கூறப்பட்டுள்ளது"

  const tenseCorrections = [
    // Ongoing work corrections
    { pattern: /நடைபெற்று கொண்டு இருக்கிறது/g, replacement: 'நடைபெற்று வருகிறது' },
    { pattern: /செயல்பட்டு கொண்டு இருக்கிறது/g, replacement: 'செயல்படுத்தப்படுகிறது' },
    { pattern: /நடக்கிறது/g, replacement: 'நடைபெற்று வருகிறது' },

    // Completed event corrections
    { pattern: /நடந்து விட்டது/g, replacement: 'நடைபெற்றது' },
    { pattern: /முடிந்து விட்டது/g, replacement: 'முடிவடைந்தது' },
    { pattern: /நடந்தது/g, replacement: 'நடைபெற்றது' },

    // Report/quote corrections
    { pattern: /சொன்னார்கள்/g, replacement: 'தெரிவித்துள்ளனர்' },
    { pattern: /சொன்னார்/g, replacement: 'தெரிவித்தார்' },
    { pattern: /கூறினார்கள்/g, replacement: 'கூறப்பட்டுள்ளது' },
    { pattern: /தெரிவித்தார்கள்/g, replacement: 'தெரிவித்துள்ளனர்' },

    // Time-specific tense corrections
    { pattern: /நேற்று.*?நடைபெற்று வருகிறது/g, replacement: 'நடைபெற்றது' },
    { pattern: /இன்று.*?நடைபெற்றது/g, replacement: 'இன்று நடைபெற்று வருகிறது' },
    { pattern: /நாளை.*?நடைபெற்றது/g, replacement: 'நாளை நடைபெறும்' }
  ]

  let result = text
  tenseCorrections.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement)
  })

  return result
}

// THAMLY NEWS WRITING SYSTEM (TNWS v1.0) - Complete Enhancement Process
export function enhanceForNewsTone(text: string): string {
  // TNWS Thamly AI Code Logic Implementation
  // if text is English: → full Tamil translation + news tone
  // if text is Tanglish: → transliterate + convert to news tone
  // if text is Tamil casual: → rewrite → passive + official tone + numeric rules
  // always: → apply structure rule + tense rule + source attribution + crisp news format

  // Step 1: Apply TNWS Vocabulary Rules (Rule 7) - Convert slang to standard Tamil
  let enhanced = applyVocabularyRules(text)

  // Step 2: Apply TNWS Structure Rules (Rule 1) - Location → Event → Time → Impact
  enhanced = enforceNewsStructure(enhanced)

  // Step 3: Apply TNWS Tense Rules (Rule 4) - Appropriate tenses for situations
  enhanced = applyTenseRules(enhanced)

  // Step 4: Apply TNWS Voice Rules (Rule 5) - Passive always preferred for news
  enhanced = applyNeutralPassiveVoice(enhanced)

  // Step 5: Apply TNWS Number Rules (Rule 3) - Compact format, never expand huge numbers
  enhanced = convertToTamilNumbers(enhanced)

  // Step 6: Apply TNWS Tone Rules (Rule 2) - Remove emotional language, keep neutral/factual
  enhanced = removeEmotionalLanguage(enhanced)

  // Step 7: Eliminate repetitions and duplicate meanings
  enhanced = eliminateRepetition(enhanced)
  enhanced = removeDuplicateMeanings(enhanced)

  // Step 8: Replace generic terms with specific alternatives
  enhanced = replaceGenericTerms(enhanced)

  // Step 9: Fix directional terms and distance terminology
  enhanced = fixDirectionalTerms(enhanced)
  enhanced = fixDistanceTerminology(enhanced)

  // Step 10: Apply TNWS Citation Rules (Rule 9) - Professional attribution
  enhanced = addProfessionalAttribution(enhanced)

  // Step 11: Apply TNWS Spelling & Punctuation Rules (Rule 6) - Official Tamil, full stops only
  enhanced = enhanced.replace(/\.\.\./g, '.') // Replace ellipses with full stops
  enhanced = enhanced.replace(/[,.]{2,}/g, '.') // Replace multiple punctuation with single full stop

  // Step 12: Apply TNWS Fact Completeness Rule (Rule 8) - Complete incomplete facts
  enhanced = completeInfrastructureList(enhanced)
  enhanced = completeWithIntensification(enhanced)

  // Step 13: Format as list if it's a report with multiple facts
  enhanced = formatAsListIfReport(enhanced)

  return enhanced.trim()
}

// Analyze subject continuity
export function analyzeSubjectContinuity(text: string): {
  subjects: string[]
  issues: string[]
  suggestions: string[]
} {
  const sentences = text.split(/[.!?]/).filter(s => s.trim())
  const subjects: string[] = []
  const issues: string[] = []
  const suggestions: string[] = []

  // Identify subjects in each sentence
  sentences.forEach((sentence, index) => {
    const words = sentence.split(/\s+/)
    // Look for person/place names or organizations
    const potentialSubjects = words.filter(word =>
      word.length > 3 &&
      (word[0] === word[0].toUpperCase() ||
       word.includes('அதிகார') ||
       word.includes('தொழில்'))
    )

    if (potentialSubjects.length > 0) {
      subjects.push(...potentialSubjects)
    }
  })

  // Check for sudden subject shifts
  for (let i = 1; i < subjects.length; i++) {
    if (subjects[i] !== subjects[i-1]) {
      // Check if the shift is abrupt (no transition words)
      issues.push(`Subject shift from "${subjects[i-1]}" to "${subjects[i]}"`)
      suggestions.push(`Add transition: "${subjects[i-1]}க்கு அடுத்தமாக, ${subjects[i]}..."`)
    }
  }

  return { subjects, issues, suggestions }
}

// TNWS Headline Rules (Rule 10 - VERY IMPORTANT): Headlines must NOT use verbs with "-கிறது/-ப்படுகிறது"
export function optimizeHeadlineTNWS(text: string): string {
  // TNWS: Remove present continuous and passive present tense from headlines
  const headlineVerbPatterns = [
    // Remove present continuous (-கிறது) endings
    { pattern: /\s+நடக்கிறது.*$/g, replacement: ' வேகமெடுக்கும்' },
    { pattern: /\s+செயல்படுகிறது.*$/g, replacement: ' செயல்படும்' },
    { pattern: /\s+நடைபெற்று வருகிறது.*$/g, replacement: ' வேகமெடுக்கும்' },
    { pattern: /\s+நடந்து கொண்டு இருக்கிறது.*$/g, replacement: ' தொடர்கிறது' },
    { pattern: /\s+போகிறது.*$/g, replacement: ' செல்கிறது' },
    { pattern: /\s+வருகிறது.*$/g, replacement: ' வரும்' },
    { pattern: /\s+பேசுகிறது.*$/g, replacement: ' அறிக்கை' },

    // Remove passive present (-ப்படுகிறது) endings
    { pattern: /\s+செயல்படுத்தப்படுகிறது.*$/g, replacement: ' செயல்படுத்தம்' },
    { pattern: /\s+அறிவிக்கப்படுகிறது.*$/g, replacement: ' அறிவிப்பு' },
    { pattern: /\s+கட்டப்படுகிறது.*$/g, replacement: ' கட்டமைப்பு' },
    { pattern: /\s+எடுக்கப்படுகிறது.*$/g, replacement: ' முடிவெடுப்பு' },
    { pattern: /\s+மேற்கொள்ளப்படுகிறது.*$/g, replacement: ' முயற்சி' },

    // Clean up endings
    { pattern: /\s+நடந்துள்ளது.*$/g, replacement: ' நிறைவு' },
    { pattern: /\s+முடிந்துள்ளது.*$/g, replacement: ' நிறைவு' }
  ]

  let optimized = text.trim()

  // Apply TNWS headline verb transformations
  headlineVerbPatterns.forEach(({ pattern, replacement }) => {
    optimized = optimized.replace(pattern, replacement)
  })

  // If text looks like a headline (short, < 15 words) and still has undesirable endings
  const words = optimized.split(/\s+/)
  if (words.length <= 15) {
    // TNWS: Convert to professional noun-phrase headlines
    if (optimized.includes('விரிவாக்கம்')) {
      optimized = optimized.replace(/விரிவாக்கம்.*$/, 'விரிவாக்கம் வேகமெடுக்கும்')
    }
    if (optimized.includes('அறிவிப்பு') && !optimized.includes('அறிவிப்பு')) {
      optimized = optimized.replace(/.*$/, 'முக்கிய அறிவிப்பு')
    }
    if (optimized.includes('சந்திப்பு')) {
      optimized = optimized.replace(/சந்திப்பு.*$/, 'முக்கிய சந்திப்பு')
    }
    if (optimized.includes('மாநாடு')) {
      optimized = optimized.replace(/மாநாடு.*$/, 'மாநாட்டு முடிவு')
    }
  }

  return optimized.trim()
}

// Generate comprehensive TNWS news enhancement suggestions
export function generateNewsEnhancements(text: string): {
  enhancedText: string
  structureSuggestions: string[]
  continuityAnalysis: ReturnType<typeof analyzeSubjectContinuity>
  optimizedHeadline?: string
} {
  const enhancedText = enhanceForNewsTone(text)
  const structureSuggestions = suggestNewsStructure(text)
  const continuityAnalysis = analyzeSubjectContinuity(text)

  // Generate TNWS optimized headline if text is short enough to be a headline
  const optimizedHeadline = text.split(/\s+/).length <= 15 ? optimizeHeadlineTNWS(enhancedText) : undefined

  return {
    enhancedText,
    structureSuggestions,
    continuityAnalysis,
    optimizedHeadline
  }
}