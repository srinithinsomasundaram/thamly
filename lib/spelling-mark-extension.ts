import { Mark } from "@tiptap/core"

export const SpellingMark = Mark.create({
  name: "spellingMark",
  parseHTML() {
    return [
      {
        tag: "span[data-spelling-error]",
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        ...HTMLAttributes,
        "data-spelling-error": "true",
        class: "underline decoration-red-500 decoration-wavy cursor-help",
      },
    ]
  },
  addAttributes() {
    return {
      word: {
        default: null,
      },
      suggestions: {
        default: [],
      },
      explanation: {
        default: "",
      },
    }
  },
})
