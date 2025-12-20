export interface TransliterationSuggestion {
  romanized: string
  tamil: string
  confidence?: number
  english?: string
}

// Comprehensive Tamil transliteration mapping
const vowels: Record<string, string> = {
  a: "அ",
  aa: "ஆ",
  i: "இ",
  ii: "ஈ",
  u: "உ",
  uu: "ஊ",
  e: "எ",
  ee: "ஏ",
  ai: "ஐ",
  o: "ஒ",
  oo: "ஓ",
  au: "ஔ",
}

const consonants: Record<string, string> = {
  k: "க்",
  ng: "ங்",
  ch: "ச்",
  nj: "ஞ்",
  ñ: "ஞ்",
  t: "ட்",
  n: "ண்",
  th: "த்",
  nh: "ந்",
  p: "ப்",
  m: "ம்",
  y: "ய்",
  r: "ர்",
  l: "ல்",
  v: "வ்",
  zh: "ழ்",
  L: "ள்",
  R: "ற்",
  N: "ன்",
  s: "ஸ்",
  sh: "ஷ்",
  h: "ஹ்",
  j: "ஜ்",
}

const compounds: Record<string, string> = {
  ka: "க",
  kaa: "கா",
  ki: "கி",
  kii: "கீ",
  ku: "கு",
  kuu: "கூ",
  ke: "கெ",
  kee: "கே",
  kai: "கை",
  ko: "கொ",
  koo: "கோ",
  kau: "கௌ",
  nga: "ங",
  ngaa: "ஙா",
  ngi: "ஙி",
  ngii: "ஙீ",
  ngu: "ஙு",
  nguu: "ஙூ",
  nge: "ஙெ",
  ngee: "ஙே",
  ngai: "ஙை",
  ngo: "ஙொ",
  ngoo: "ஙோ",
  ngau: "ஙௌ",
  cha: "ச",
  chaa: "சா",
  chi: "சி",
  chii: "சீ",
  chu: "சு",
  chuu: "சூ",
  che: "செ",
  chee: "சே",
  chai: "சை",
  cho: "சொ",
  choo: "சோ",
  chau: "சௌ",
  ca: "ச",
  caa: "சா",
  ci: "சி",
  cii: "சீ",
  cu: "சு",
  cuu: "சூ",
  ce: "செ",
  cee: "சே",
  cai: "சை",
  co: "சொ",
  coo: "சோ",
  cau: "சௌ",
  nja: "ஞ",
  njaa: "ஞா",
  nji: "ஞி",
  njii: "ஞீ",
  nju: "ஞு",
  njuu: "ஞூ",
  nje: "ஞெ",
  njee: "ஞே",
  njai: "ஞை",
  njo: "ஞொ",
  njoo: "ஞோ",
  njau: "ஞௌ",
  ta: "ட",
  taa: "டா",
  ti: "டி",
  tii: "டீ",
  tu: "டு",
  tuu: "டூ",
  te: "டெ",
  tee: "டே",
  tai: "டை",
  to: "டொ",
  too: "டோ",
  tau: "டௌ",
  na: "ண",
  naa: "ணா",
  ni: "ணி",
  nii: "ணீ",
  nu: "ணு",
  nuu: "ணூ",
  ne: "ணெ",
  nee: "ணே",
  nai: "ணை",
  no: "ணொ",
  noo: "ணோ",
  nau: "ணௌ",
  tha: "த",
  thaa: "தா",
  thi: "தி",
  thii: "தீ",
  thu: "து",
  thuu: "தூ",
  the: "தெ",
  thee: "தே",
  thai: "தை",
  tho: "தொ",
  thoo: "தோ",
  thau: "தௌ",
  nha: "ந",
  nhaa: "நா",
  nhi: "நி",
  nhii: "நீ",
  nhu: "நு",
  nhuu: "நூ",
  nhe: "நெ",
  nhee: "நே",
  nhai: "நை",
  nho: "நொ",
  nhoo: "நோ",
  nhau: "நௌ",
  pa: "ப",
  paa: "பா",
  pi: "பி",
  pii: "பீ",
  pu: "பு",
  puu: "பூ",
  pe: "பெ",
  pee: "பே",
  pai: "பை",
  po: "பொ",
  poo: "போ",
  pau: "பௌ",
  ma: "ம",
  maa: "மா",
  mi: "மி",
  mii: "மீ",
  mu: "மு",
  muu: "மூ",
  me: "மெ",
  mee: "மே",
  mai: "மை",
  mo: "மொ",
  moo: "மோ",
  mau: "மௌ",
  ya: "ய",
  yaa: "யா",
  yi: "யி",
  yii: "யீ",
  yu: "யு",
  yuu: "யூ",
  ye: "யெ",
  yee: "யே",
  yai: "யை",
  yo: "யொ",
  yoo: "யோ",
  yau: "யௌ",
  ra: "ர",
  raa: "ரா",
  ri: "ரி",
  rii: "ரீ",
  ru: "ரு",
  ruu: "ரூ",
  re: "ரெ",
  ree: "ரே",
  rai: "ரை",
  ro: "ரொ",
  roo: "ரோ",
  rau: "ரௌ",
  la: "ல",
  laa: "லா",
  li: "லி",
  lii: "லீ",
  lu: "லு",
  luu: "லூ",
  le: "லெ",
  lee: "லே",
  lai: "லை",
  lo: "லொ",
  loo: "லோ",
  lau: "லௌ",
  va: "வ",
  vaa: "வா",
  vi: "வி",
  vii: "வீ",
  vu: "வு",
  vuu: "வூ",
  ve: "வெ",
  vee: "வே",
  vai: "வை",
  vo: "வொ",
  voo: "வோ",
  vau: "வௌ",
  wa: "வ",
  waa: "வா",
  wi: "வி",
  wii: "வீ",
  wu: "வு",
  wuu: "வூ",
  we: "வெ",
  wee: "வே",
  wai: "வை",
  wo: "வொ",
  woo: "வோ",
  wau: "வௌ",
  zha: "ழ",
  zhaa: "ழா",
  zhi: "ழி",
  zhii: "ழீ",
  zhu: "ழு",
  zhuu: "ழூ",
  zhe: "ழெ",
  zhee: "ழே",
  zhai: "ழை",
  zho: "ழொ",
  zhoo: "ழோ",
  zhau: "ழௌ",
  La: "ள",
  Laa: "ளா",
  Li: "ளி",
  Lii: "ளீ",
  Lu: "ளு",
  Luu: "ளூ",
  Le: "ளெ",
  Lee: "ளே",
  Lai: "ளை",
  Lo: "ளொ",
  Loo: "ளோ",
  Lau: "ளௌ",
  Ra: "ற",
  Raa: "றா",
  Ri: "றி",
  Rii: "றீ",
  Ru: "று",
  Ruu: "றூ",
  Re: "றெ",
  Ree: "றே",
  Rai: "றை",
  Ro: "றொ",
  Roo: "றோ",
  Rau: "றௌ",
  Na: "ன",
  Naa: "னா",
  Ni: "னி",
  Nii: "னீ",
  Nu: "னு",
  Nuu: "னூ",
  Ne: "னெ",
  Nee: "னே",
  Nai: "னை",
  No: "னொ",
  Noo: "னோ",
  Nau: "னௌ",
  sa: "ஸ",
  saa: "ஸா",
  si: "ஸி",
  sii: "ஸீ",
  su: "ஸு",
  suu: "ஸூ",
  se: "ஸெ",
  see: "ஸே",
  sai: "ஸை",
  so: "ஸொ",
  soo: "ஸோ",
  sau: "ஸௌ",
  sha: "ஷ",
  shaa: "ஷா",
  shi: "ஷி",
  shii: "ஷீ",
  shu: "ஷு",
  shuu: "ஷூ",
  she: "ஷெ",
  shee: "ஷே",
  shai: "ஷை",
  sho: "ஷொ",
  shoo: "ஷோ",
  shau: "ஷௌ",
  ha: "ஹ",
  haa: "ஹா",
  hi: "ஹி",
  hii: "ஹீ",
  hu: "ஹு",
  huu: "ஹூ",
  he: "ஹெ",
  hee: "ஹே",
  hai: "ஹை",
  ho: "ஹொ",
  hoo: "ஹோ",
  hau: "ஹௌ",
  ja: "ஜ",
  jaa: "ஜா",
  ji: "ஜி",
  jii: "ஜீ",
  ju: "ஜு",
  juu: "ஜூ",
  je: "ஜெ",
  jee: "ஜே",
  jai: "ஜை",
  jo: "ஜொ",
  joo: "ஜோ",
  jau: "ஜௌ",
}

function transliterateToTamil(input: string): string {
  let result = ""
  let i = 0
  const text = input.toLowerCase()

  while (i < text.length) {
    let matched = false

    for (let len = 3; len >= 1; len--) {
      if (i + len <= text.length) {
        const substr = text.slice(i, i + len)

        if (compounds[substr]) {
          result += compounds[substr]
          i += len
          matched = true
          break
        }

        if (vowels[substr]) {
          result += vowels[substr]
          i += len
          matched = true
          break
        }

        if (consonants[substr]) {
          result += consonants[substr]
          i += len
          matched = true
          break
        }
      }
    }

    if (!matched) {
      result += text[i]
      i++
    }
  }

  return result
}

function generateVariations(input: string): TransliterationSuggestion[] {
  const suggestions: TransliterationSuggestion[] = []
  const base = input.toLowerCase()

  // Variation 1: Direct transliteration
  suggestions.push({
    romanized: base,
    tamil: transliterateToTamil(base),
    confidence: 1.0,
  })

  // Variation 2: With 'u' ending (common in Tamil)
  if (!base.endsWith("u")) {
    const withU = base + "u"
    const tamilWithU = transliterateToTamil(withU)
    if (tamilWithU !== suggestions[0].tamil) {
      suggestions.push({
        romanized: withU,
        tamil: tamilWithU,
        confidence: 0.85,
      })
    }
  }

  // Variation 3: With 'am' ending (common in Tamil)
  if (!base.endsWith("am") && !base.endsWith("m")) {
    const withAm = base + "am"
    const tamilWithAm = transliterateToTamil(withAm)
    if (tamilWithAm !== suggestions[0].tamil && tamilWithAm !== suggestions[1]?.tamil) {
      suggestions.push({
        romanized: withAm,
        tamil: tamilWithAm,
        confidence: 0.8,
      })
    }
  }

  // Variation 4: With 'a' ending
  if (!base.endsWith("a") && base.length > 2) {
    const withA = base + "a"
    const tamilWithA = transliterateToTamil(withA)
    if (
      tamilWithA !== suggestions[0].tamil &&
      tamilWithA !== suggestions[1]?.tamil &&
      tamilWithA !== suggestions[2]?.tamil
    ) {
      suggestions.push({
        romanized: withA,
        tamil: tamilWithA,
        confidence: 0.75,
      })
    }
  }

  return suggestions.filter((s) => s.tamil && s.tamil !== base).slice(0, 4)
}

export function getInstantSuggestions(word: string): TransliterationSuggestion[] {
  if (!word || word.length < 1) return []

  const lowerWord = word.toLowerCase()
  const suggestions = generateVariations(lowerWord)

  return suggestions.slice(0, 4)
}

export function getCurrentWord(text: string, cursorPosition: number): { word: string; start: number; end: number } {
  let start = cursorPosition
  let end = cursorPosition

  while (start > 0 && /[a-zA-Z]/.test(text[start - 1])) {
    start--
  }

  while (end < text.length && /[a-zA-Z]/.test(text[end])) {
    end++
  }

  return {
    word: text.slice(start, end),
    start,
    end,
  }
}

const suggestionCache = new Map<string, { suggestions: TransliterationSuggestion[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000

export async function getAISuggestions(text: string): Promise<TransliterationSuggestion[]> {
  const cacheKey = text.toLowerCase()

  const cached = suggestionCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.suggestions
  }

  try {
    const response = await fetch("/api/transliterate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      return getInstantSuggestions(text)
    }

    const data = await response.json()
    const suggestions = data.suggestions || []

    if (suggestions.length > 0) {
      suggestionCache.set(cacheKey, { suggestions, timestamp: Date.now() })
    }

    return suggestions.slice(0, 4)
  } catch (error) {
    console.error("AI transliteration error:", error)
    return getInstantSuggestions(text)
  }
}
