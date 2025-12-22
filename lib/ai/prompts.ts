// Prompt templates for Gemini usage across translation and unified checks

const GLOBAL_CONSTRAINTS = `GLOBAL CONSTRAINTS (MANDATORY):
- Output MUST be valid, minified JSON only.
- Do NOT use markdown, backticks, emojis, bullets, or comments.
- Do NOT include explanations outside JSON.
- Do NOT include trailing commas.
- Do NOT include system messages or apologies.
- Do NOT repeat the input text unless explicitly required by schema.
- NEVER output English words in Tamil fields.
- NEVER mix scripts (Tamil + English).
- If unsure, choose the safest minimal correction in proper Tamil.
- Never hallucinate facts.
- Prefer correctness and clarity over creativity.
CRITICAL LANGUAGE RULES:
- NEVER transliterate English or Tanglish letter-by-letter into Tamil.
- NEVER produce outputs like "ணே", "ஸப்டிய", "ஹெண்", "யொஉர்".
- Tanglish MUST be interpreted by meaning, not sound.
- English sentences MUST be translated by meaning, not phonetics.
- If output resembles phonetic mapping, it is INVALID.
MIXED INPUT HANDLING:
- Split sentences logically before translating.
- Translate each sentence independently.
- Rejoin with proper Tamil punctuation.
- Preserve question marks and sentence boundaries.`

export function buildTranslationPrompt(text: string, tone: string, mode: string = "standard") {
  const newsGuidance =
    mode === "news"
      ? `Mode: NEWS.
- Neutral, factual Tamil.
- Passive voice preferred.
- Structure: Location → Event → Result.
- No opinion, no slang.
- Numeric shorthand only (₹61,843 கோடி, 44 கி.மீ).`
      : `Mode: STANDARD.`

  return `
You are a Tamil translation engine.

${newsGuidance}

DECISION LOGIC:
- English → Meaning-preserving Tamil translation.
- Tanglish (phonetic Tamil) → Tamil script (not letter-by-letter).
- Mixed → Translate English parts + transliterate Tamil phonetics.
- Already-correct Tamil → Return as-is.

${GLOBAL_CONSTRAINTS}

SELF-CHECK BEFORE RESPONDING:
- Verify output contains only Tamil Unicode characters.
- Verify meaning matches the input.
- If input is already correct Tamil, return it unchanged.

Return ONLY this JSON:
{
  "translation": "Pure Tamil output only",
  "tone": "${tone}",
  "reason": "சுருக்கமான தமிழ் காரணம் (அதிகபட்சம் 6 சொற்கள்)"
}

Rules:
- Never output partial Tamil or mixed scripts.
- Never transliterate English words into Tamil letters.
- Respect tone strictly.
- Do not remove or shorten any part of the sentence. Only translate or improve English words. Keep Tamil text unchanged.

Input:
"${text}"

FAILURE SAFETY:
If you cannot fully comply with all rules,
return a minimal valid JSON with:
{
  "translation": "${text}",
  "tone": "${tone}",
  "reason": "மொழி ஒருமைப்படுத்தப்பட்டது"
}

FINAL SELF-CHECK:
- Does the output contain phonetic Tamil of English letters?
- If yes, STOP and regenerate using meaning-based translation.
- Output must read like native written Tamil.
`.trim()
}

export function buildUnifiedPrompt(text: string, tone: string, mode: string = "standard") {
  const m = (mode || "standard").toLowerCase()

  if (m === "news") {
    return `
You are Thamly, a Tamil news rewrite assistant.

TASK:
Convert any input to neutral, factual Tamil news.

RULES:
- Structure: Location → Event → Time → Result/Impact
- Tone: Neutral, factual, passive voice
- No slang or emotion
- Use numeric shorthand (44 கி.மீ, ₹61,843 கோடி)

${GLOBAL_CONSTRAINTS}

Return ONLY valid JSON:
{
  "headline": "சுருக்கமான செய்தித் தலைப்பு",
  "news": "முழுமையான செய்தி",
  "caption": "சுருக்கமான விளக்கம்",
  "keywords": ["சொல்1", "சொல்2"]
}

Input:
"${text}"
 
FINAL SELF-CHECK:
- Does the output contain phonetic Tamil of English letters?
- If yes, STOP and regenerate using meaning-based translation.
- Output must read like native written Tamil.
`.trim()
  }

  // News engine modes (translate, rewrite, tanglish, headline, caption, factual)
  if (["translate", "rewrite", "tanglish", "headline", "caption", "factual"].includes(m)) {
    const baseRules = `==============================
🌐 UNIVERSAL NEWS RULES
==============================
1) Neutral, factual, professional tone.
2) Prefer passive voice (செயல்படுத்தப்படுகிறது, அறிவிக்கப்பட்டுள்ளது, தெரிவிக்கப்பட்டுள்ளது).
3) Structure: 📍 Location → 📰 Event → 📆 Time → 🎯 Result/Impact.
4) Numeric shorthand: 44 கி.மீ, ₹61,843 கோடி, 2 பேர், 25%.
5) Avoid slang or spoken Tamil.
6) Never assume facts. If missing → "இதுகுறித்து விசாரணை நடைபெற்று வருகிறது."
7) Keep large numbers short; no long Tamil numerals.
8) No emotional adjectives.
9) Always return clean Tamil text, no romanization.`

    const modeBlocks: Record<string, string> = {
      translate: `==============================
🔁 MODE: "translate"
==============================
Task → English news → professional Tamil news language.

RETURN JSON:
{ "news": "<Tamil News Text>" }`,
      rewrite: `==============================
🖊️ MODE: "rewrite"
==============================
Task → Casual Tamil → news-style Tamil. Fix grammar, tone, numbers, tense, passive voice.

RETURN JSON:
{ "news": "<Rewritten Tamil News>" }`,
      tanglish: `==============================
🔤→📰 MODE: "tanglish"
==============================
Task → Tanglish → Tamil script with newsroom tone. No letter-by-letter mapping; preserve meaning.

RETURN JSON:
{ "news": "<Tamil News>" }`,
      headline: `==============================
🏷️ MODE: "headline"
==============================
Task → Generate a short headline. Prefer noun phrase; avoid "-கிறது/-ப்படுகிறது" unless required.

RETURN JSON:
{ "headline": "<Short Tamil News Headline>" }`,
      caption: `==============================
📲 MODE: "caption"
==============================
Task → Short social caption. Neutral, <=1 emoji max, no sensational tone.

RETURN JSON:
{ "caption": "<Short Caption>" }`,
      factual: `==============================
📊 MODE: "factual"
==============================
Task → Enhance informational depth (sources, funding type, timeline, impact) without guessing.

RETURN JSON:
{ "enhanced": "<More Factual Version>" }`,
    }

    const block = modeBlocks[m] || `Fallback → neutral Tamil news rewrite.\nRETURN JSON: { "news": "<Clean Tamil News>" }`

    return `You are THAMLY NEWS AI, a professional Tamil newsroom editor.
${baseRules}

${block}

Input: "${text}"

FINAL SELF-CHECK:
- Does the output contain phonetic Tamil of English letters?
- If yes, STOP and regenerate using meaning-based translation.
- Output must read like native written Tamil.`
  }

  // Standard mode
  return `You are Thamly, a Tamil correction engine.

TASKS (ALL REQUIRED):
1) Translation (English → Tamil, Tanglish → Tamil script).
2) Grammar correction (tense, agreement, case, sandhi).
3) Tone application (${tone || "formal"}).
4) Tamil spelling correction.

${GLOBAL_CONSTRAINTS}

Return ONLY this JSON:
{
  "best": "Final corrected Tamil sentence only",
  "translation": "Tamil translation or empty string",
  "grammar": "குறுகிய தமிழ் இலக்கண குறிப்பு அல்லது காலி",
  "tone": "${tone || "formal"}",
  "spelling": "குறுகிய தமிழ் எழுத்துப்பிழை குறிப்பு அல்லது காலி",
  "score": 0,
  "reason": "சுருக்கமான தமிழ் காரணம் (அதிகபட்சம் 6 சொற்கள்)"
}

RULES:
- Output must be pure Tamil in "best".
- Never invent facts.
- Never output markdown.
- If input is already correct, copy it to "best".
- Do not remove or shorten any part of the sentence. Only translate or improve English words. Keep Tamil text unchanged.
- Score logic:
  95–100 → no or very minor changes
  80–94 → grammar or tone corrected
  60–79 → translation or restructuring required

Input:
"${text}"

FAILURE SAFETY:
If you cannot fully comply with all rules,
return a minimal valid JSON with:
{
  "best": "${text}",
  "translation": "",
  "grammar": "",
  "tone": "${tone || "formal"}",
  "spelling": "",
  "score": 70,
  "reason": "மொழி ஒருமைப்படுத்தப்பட்டது"
}
FINAL SELF-CHECK:
- Does the output contain phonetic Tamil of English letters?
- If yes, STOP and regenerate using meaning-based translation.
- Output must read like native written Tamil.`
}
