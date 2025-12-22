// Shared Tamil-only output helpers

export const SAFE_TAMIL_REASON = "ஆங்கில பகுதி சரியான தமிழாக மாற்றப்பட்டது"

export const REASONS = {
  TRANSLATION: SAFE_TAMIL_REASON,
  GRAMMAR: "இலக்கண திருத்தம் செய்யப்பட்டது",
  SPELLING: "எழுத்துப்பிழை திருத்தப்பட்டது",
  MIXED: "மொழி ஒருமைப்படுத்தப்பட்டது",
} as const
export const ALLOWED_TAMIL_REASONS = new Set<string>(Object.values(REASONS))

export function isPureTamil(text: string) {
  return /^[\u0B80-\u0BFF\s.,?!]+$/.test(text || "")
}

export function sanitizeReason(reason?: string) {
  if (reason && isPureTamil(reason) && ALLOWED_TAMIL_REASONS.has(reason.trim())) {
    return reason.trim()
  }
  return SAFE_TAMIL_REASON
}

export function buildFinalOutput(input: string, corrected: string, reason?: string) {
  const safeReason = sanitizeReason(reason)
  return {
    original: input,
    corrected,
    reason: safeReason,
  }
}
