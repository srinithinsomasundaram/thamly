/**
 * Sentence detection utilities for THAMLY AI Assistant
 */

// Tamil sentence-ending punctuation
const TAMIL_SENTENCE_ENDERS = ['.', '!', '?', '।', '॥']

// Mixed language sentence patterns
const SENTENCE_PATTERNS = [
  /\.[\s]+/g,        // Period followed by space
  /[!?][\s]+/g,       // Exclamation/Question mark followed by space
  /।[\s]+/g,         // Tamil danda followed by space
  /॥[\s]+/g,         // Tamil double danda followed by space
  /\n\s*/g,           // Newline
]

/**
 * Detect sentence boundaries in text
 * @param text The text to analyze
 * @param cursor Current cursor position
 * @returns Object with sentence info
 */
export function detectSentenceAtCursor(text: string, cursor?: number) {
  const textUpToCursor = cursor !== undefined ? text.slice(0, cursor) : text

  // Find the last sentence ender before cursor
  let lastSentenceEnd = -1
  for (let i = textUpToCursor.length - 1; i >= 0; i--) {
    const char = textUpToCursor[i]
    if (TAMIL_SENTENCE_ENDERS.includes(char)) {
      lastSentenceEnd = i
      break
    }
    // Also break at newlines
    if (char === '\n') {
      lastSentenceEnd = i
      break
    }
  }

  // Extract current sentence
  const sentenceStart = lastSentenceEnd + 1
  const currentSentence = text.slice(sentenceStart).trim()

  // Find the next sentence ender
  let nextSentenceEnd = -1
  for (let i = Math.max(sentenceStart, cursor || 0); i < text.length; i++) {
    const char = text[i]
    if (TAMIL_SENTENCE_ENDERS.includes(char)) {
      nextSentenceEnd = i
      break
    }
    if (char === '\n') {
      nextSentenceEnd = i
      break
    }
  }

  const fullSentence = nextSentenceEnd !== -1
    ? text.slice(sentenceStart, nextSentenceEnd + 1).trim()
    : text.slice(sentenceStart).trim()

  return {
    currentSentence,
    fullSentence,
    start: sentenceStart,
    end: nextSentenceEnd !== -1 ? nextSentenceEnd + 1 : text.length,
    isComplete: nextSentenceEnd !== -1,
    hasSentenceEnders: TAMIL_SENTENCE_ENDERS.some(end => fullSentence.includes(end))
  }
}

/**
 * Extract all sentences from text
 * @param text The text to split into sentences
 * @returns Array of sentences
 */
export function extractSentences(text: string): string[] {
  const sentences: string[] = []
  let currentStart = 0

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const isSentenceEnd = TAMIL_SENTENCE_ENDERS.includes(char) || char === '\n'

    if (isSentenceEnd) {
      const sentence = text.slice(currentStart, i + 1).trim()
      if (sentence.length > 0) {
        sentences.push(sentence)
      }
      currentStart = i + 1
    }
  }

  // Add remaining text as last sentence if it has content
  const remaining = text.slice(currentStart).trim()
  if (remaining.length > 0) {
    sentences.push(remaining)
  }

  return sentences
}

/**
 * Check if a text ends with sentence punctuation
 * @param text The text to check
 * @returns boolean indicating if it ends properly
 */
export function endsWithSentencePunctuation(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0) return false

  const lastChar = trimmed[trimmed.length - 1]
  return TAMIL_SENTENCE_ENDERS.includes(lastChar)
}

/**
 * Get the nearest complete sentence around a text selection
 * @param text Full text
 * @param selectionStart Selection start position
 * @param selectionEnd Selection end position
 * @returns The complete sentence containing the selection
 */
export function getCompleteSentenceFromSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number
): string {
  // Find sentence start
  let sentenceStart = selectionStart
  for (let i = selectionStart - 1; i >= 0; i--) {
    const char = text[i]
    if (TAMIL_SENTENCE_ENDERS.includes(char) || char === '\n') {
      sentenceStart = i + 1
      break
    }
    if (i === 0) sentenceStart = 0
  }

  // Find sentence end
  let sentenceEnd = selectionEnd
  for (let i = selectionEnd; i < text.length; i++) {
    const char = text[i]
    if (TAMIL_SENTENCE_ENDERS.includes(char) || char === '\n') {
      sentenceEnd = i + 1
      break
    }
    if (i === text.length - 1) sentenceEnd = text.length
  }

  return text.slice(sentenceStart, sentenceEnd).trim()
}