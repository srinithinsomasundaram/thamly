// Prompt templates for Gemini usage across translation and unified checks

export function buildTranslationPrompt(text: string, tone: string, mode: string = "standard") {
  const newsGuidance =
    mode === "news"
      ? `Mode: NEWS. Neutral, factual Tamil news. No slang/opinion. Prefer passive. Location → Event → Result. Avoid letter-by-letter transliteration. Use concise numbers (₹61,843 கோடி, 44 கி.மீ).`
      : "Mode: STANDARD."

  return `You are a Tamil translation assistant. Choose the right action:
- If the input is proper English, translate it to Tamil (no character-by-character mapping).
- If it is Tamil written phonetically (Thanglish), render it in Tamil script.
- If it is mixed, translate English parts and transliterate Tamil phonetic parts.
- Respect the requested tone: formal | neutral | friendly | media/news.
${newsGuidance}

Return ONLY valid JSON:
{
  "translation": "Tamil output",
  "reason": "short reason in English explaining translation choice and tone applied",
  "tone": "<tone-used>"
}

Constraints:
- Never output letter-by-letter Tamil (e.g., "how" ≠ "ஹொw").
- Prefer meaning-preserving translation for English sentences.
- Use culturally appropriate, respectful Tamil when tone=formal/media or mode=news.

Input: "${text}"
Tone: "${tone}"`
}

export function buildUnifiedPrompt(text: string, tone: string, mode: string = "standard") {
  const m = (mode || "standard").toLowerCase()

  if (m === "news") {
    return `You are Thamly, a Tamil news rewrite assistant. Convert any input to neutral, factual Tamil news.
- Structure: Location → Event → Time → Result/Impact
- Tone: Neutral, factual, passive voice preferred; no slang or emotion
- Numbers: Use compact numeric format (44 கி.மீ, ₹61,843 கோடி, 2 பேர், 25%)
- Language: Formal Tamil (e.g., கூறப்பட்டுள்ளது, தெரிவிக்கப்பட்டுள்ளது), no spoken slang
- Headlines: Short, noun-phrase when possible; avoid unnecessary "-கிறது/-ப்படுகிறது"
- Error handling: If details missing, say "இதுகுறித்து விசாரணை நடைபெற்று வருகிறது."
- Translation logic: English → Tamil news; Tanglish → meaningful Tamil (not letter-by-letter); casual Tamil → formal news Tamil
- Cleanup: remove duplicate/looping phrases; fix proper nouns/initials; complete sentences; avoid unfinished claims

Return ONLY this JSON:
{
  "headline": "<Short crisp news headline in Tamil>",
  "news": "<Full rewritten professional news article in Tamil>",
  "caption": "<One short social caption in Tamil>",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Input: "${text}"
Tone: "${tone || "formal"}"`
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

Input: "${text}"`
  }

  // Standard mode
  return `You are Thamly, a Tamil writing assistant. Perform all four tasks together on the text below:
1) Translation: English → Tamil if the sentence is English; Thanglish → Tamil script if phonetic.
2) Grammar: Fix tense, agreement, case, sandhi (புணர்ச்சி) errors.
3) Tone: Apply requested tone (formal | neutral | friendly | media/news); default formal.
4) Spelling: Fix Tamil spelling, including phonetic mistakes and regional variants.

Mode: ${mode}. Keep meaning faithful.

Return ONLY valid JSON:
{
  "best": "Final Tamil sentence",
  "translation": "If applied; else empty",
  "grammar": "Grammar fix or empty",
  "tone": "Applied tone",
  "spelling": "Spelling fix or empty",
  "score": 0-100,
  "hint": "Short rationale in English"
}

Rules:
- No character-by-character Tamil from English words.
- Keep meaning intact; do not invent facts.
- Use honorific verbs when tone=formal/media and context demands respect.
- Keep code/URLs in English as-is.

Input: "${text}"
Tone: "${tone || "formal"}"`
}
