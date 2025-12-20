export function detectLastWord(text: string): string {
  const parts = text.split(/\s+/)
  return parts[parts.length - 1] || ""
}

export function getCaretCoordinates(textarea: HTMLTextAreaElement, pos: number): { left: number; top: number } {
  const div = document.createElement("div")
  const style = window.getComputedStyle(textarea)

  for (const prop of Array.from(style)) {
    ;(div.style as any)[prop] = style.getPropertyValue(prop)
  }

  div.style.position = "absolute"
  div.style.visibility = "hidden"
  div.style.whiteSpace = "pre-wrap"
  div.style.wordWrap = "break-word"

  const valueBeforeCaret = textarea.value.substring(0, pos)
  div.textContent = valueBeforeCaret

  const span = document.createElement("span")
  span.textContent = textarea.value.substring(pos) || "."
  div.appendChild(span)

  document.body.appendChild(div)
  const rect = span.getBoundingClientRect()
  const divRect = div.getBoundingClientRect()
  const textareaRect = textarea.getBoundingClientRect()

  document.body.removeChild(div)

  return {
    left: rect.left - textareaRect.left,
    top: rect.top - textareaRect.top,
  }
}

export async function getTamilSuggestions(word: string, context = ""): Promise<string[]> {
  if (!word || word.trim().length === 0) return []

  try {
    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, context }),
    })

    if (!res.ok) return []

    const data = await res.json()
    return data.suggestions || []
  } catch (error) {
    console.error("[v0] Error fetching suggestions:", error)
    return []
  }
}
