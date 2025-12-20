"use client"

import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { Node as ProsemirrorNode } from "@tiptap/pm/model"

interface TextIssue {
  id: string
  type: "spelling" | "grammar" | "translation"
  text: string
  from: number
  to: number
  suggestion: string
  color: string
}

export interface TextIssueHighlightOptions {
  issues: TextIssue[]
  onIssueClick?: (issue: TextIssue) => void
  enableBlink?: boolean
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textIssueHighlight: {
      /**
       * Update text issues
       */
      setIssues: (issues: TextIssue[]) => ReturnType
      /**
       * Clear all issues
       */
      clearIssues: () => ReturnType
    }
  }
}

// Floating popup management
let currentPopup: HTMLElement | null = null
let hideTimeout: NodeJS.Timeout | null = null

function showFloatingPopup(target: HTMLElement, issue: TextIssue, onIssueClick?: (issue: TextIssue) => void) {
  hideFloatingPopup() // Clear any existing popup

  const popup = document.createElement('div')
  popup.className = 'thamly-floating-popup'

  const typeColors = {
    spelling: { dot: '#ef4444', label: 'Spelling' },
    grammar: { dot: '#f59e0b', label: 'Grammar' },
    translation: { dot: '#10b981', label: 'Translation' }
  }

  const theme = typeColors[issue.type] || { dot: '#6b7280', label: issue.type }

  popup.innerHTML = `
    <div class="thamly-popup-header">
      <div class="thamly-popup-dot" style="background-color: ${theme.dot}"></div>
      <span>${theme.label}</span>
    </div>
    <div class="thamly-popup-original">${issue.text}</div>
    <div class="thamly-popup-suggestion">${issue.suggestion}</div>
    <div class="thamly-popup-reason">${issue.type === 'translation' ? 'Click to translate' : 'Click to correct'}</div>
    <div class="thamly-popup-actions">
      <button class="thamly-popup-btn thamly-popup-accept">Accept</button>
      <button class="thamly-popup-btn thamly-popup-ignore">Ignore</button>
    </div>
  `

  // Position the popup
  const rect = target.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  popup.style.left = `${rect.left + scrollLeft}px`
  popup.style.top = `${rect.bottom + scrollTop + 5}px`

  // Add to DOM
  document.body.appendChild(popup)

  // Trigger animation
  requestAnimationFrame(() => {
    popup.classList.add('show')
  })

  // Handle button clicks
  const acceptBtn = popup.querySelector('.thamly-popup-accept') as HTMLButtonElement
  const ignoreBtn = popup.querySelector('.thamly-popup-ignore') as HTMLButtonElement

  acceptBtn.addEventListener('click', () => {
    if (onIssueClick) {
      onIssueClick(issue)
    }
    hideFloatingPopup()
  })

  ignoreBtn.addEventListener('click', () => {
    hideFloatingPopup()
  })

  // Keep popup visible when hovering over it
  popup.addEventListener('mouseenter', () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
    }
  })

  popup.addEventListener('mouseleave', () => {
    hideFloatingPopup()
  })

  currentPopup = popup
}

function hideFloatingPopup() {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }

  if (currentPopup) {
    currentPopup.classList.remove('show')
    hideTimeout = setTimeout(() => {
      if (currentPopup && currentPopup.parentNode) {
        currentPopup.parentNode.removeChild(currentPopup)
        currentPopup = null
      }
    }, 200) // Wait for fade out animation
  }
}

export const TextIssueHighlight = Extension.create<TextIssueHighlightOptions>({
  name: "textIssueHighlight",

  addOptions() {
    return {
      issues: [],
      onIssueClick: () => {},
      enableBlink: true,
    }
  },

  addStorage() {
    return {
      issues: [] as TextIssue[],
      onIssueClick: (issue: TextIssue) => {},
      enableBlink: true,
    }
  },

  addCommands() {
    return {
      setIssues:
        (issues) =>
        ({ editor }) => {
          this.storage.issues = issues
          editor.view.dispatch(
            editor.view.state.tr.setMeta("textIssueHighlight", { issues })
          )
          return true
        },
      clearIssues:
        () =>
        ({ editor }) => {
          this.storage.issues = []
          editor.view.dispatch(
            editor.view.state.tr.setMeta("textIssueHighlight", { issues: [] })
          )
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey("textIssueHighlight")

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return {
              decorations: DecorationSet.empty,
              issues: [],
              onIssueClick: (issue: TextIssue) => {},
              enableBlink: true,
            }
          },
          apply(tr, oldState, oldStateInstance, newState) {
            // Initialize state if undefined
            if (!oldState) {
              oldState = {
                decorations: DecorationSet.empty,
                issues: [],
                onIssueClick: (issue: TextIssue) => {},
                enableBlink: true,
              }
            }

            // Update issues from meta
            let { issues, onIssueClick, enableBlink } = oldState
            const meta = tr.getMeta("textIssueHighlight")

            if (meta) {
              if (meta.issues) issues = meta.issues
              if (meta.onIssueClick) onIssueClick = meta.onIssueClick
              if (meta.enableBlink !== undefined) enableBlink = meta.enableBlink
            }

            // Update decorations
            if (tr.docChanged || meta) {
              const decorations: any[] = []

              issues.forEach((issue: TextIssue) => {
                try {
                  const from = Math.min(issue.from, tr.doc.content.size)
                  const to = Math.min(issue.to, tr.doc.content.size)

                  if (from >= 0 && to <= tr.doc.content.size && from < to) {
                    const decoration = Decoration.inline(from, to, {
                      style: `
                        position: relative;
                        border-bottom: 3px solid ${issue.color};
                        cursor: pointer;
                        transition: all 0.2s ease;
                        ${enableBlink ? `
                          animation: blinkIssue 2s ease-in-out;
                          animation-iteration-count: 3;
                        ` : ''}
                        &:hover {
                          background-color: ${issue.color}20;
                          border-bottom-width: 4px;
                          z-index: 1;
                        }
                      `,
                      class: `text-issue-${issue.type}`,
                      title: `${issue.type}: ${issue.suggestion}`,
                      "data-issue-id": issue.id,
                      "data-issue-type": issue.type,
                      "data-issue-text": issue.text,
                      "data-issue-suggestion": issue.suggestion,
                    })

                    decorations.push(decoration)
                  }
                } catch (error) {
                  console.warn("Invalid decoration range:", issue, error)
                }
              })

              return {
                decorations: DecorationSet.create(tr.doc, decorations),
                issues,
                onIssueClick,
                enableBlink,
              }
            }

            return oldState
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state)?.decorations
          },
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement
            const issueId = target.getAttribute("data-issue-id")
            const pluginState = pluginKey.getState(view.state)

            if (issueId && pluginState && pluginState.issues) {
              const issue = pluginState.issues.find((i: TextIssue) => i.id === issueId)
              if (issue && pluginState.onIssueClick) {
                pluginState.onIssueClick(issue)
                return true
              }
            }

            return false
          },
          handleDOMEvents: {
            mouseover: (view, event) => {
              const target = event.target as HTMLElement
              const issueId = target.getAttribute("data-issue-id")

              if (issueId) {
                const pluginState = pluginKey.getState(view.state)
                if (pluginState && pluginState.issues) {
                  const issue = pluginState.issues.find((i: TextIssue) => i.id === issueId)
                  if (issue) {
                    showFloatingPopup(target, issue, pluginState.onIssueClick)
                  }
                }
              }
              return false
            },
            mouseleave: (view, event) => {
              const target = event.target as HTMLElement
              const issueId = target.getAttribute("data-issue-id")

              if (issueId) {
                hideFloatingPopup()
              }
              return false
            },
          },
        },
      }),
    ]
  },

  addCSS() {
    return `
      @keyframes blinkIssue {
        0%, 50% {
          opacity: 1;
          border-bottom-color: currentColor;
        }
        25%, 75% {
          opacity: 0.3;
          border-bottom-color: transparent;
        }
      }

      .text-issue-spelling {
        border-bottom-color: #ef4444 !important;
      }

      .text-issue-grammar {
        border-bottom-color: #f59e0b !important;
      }

      .text-issue-translation {
        border-bottom-color: #10b981 !important;
      }

      /* Floating popup styles */
      .thamly-floating-popup {
        position: absolute;
        z-index: 10000;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        padding: 12px;
        min-width: 280px;
        max-width: 400px;
        opacity: 0;
        transform: translateY(-5px);
        transition: all 0.2s ease;
        pointer-events: none;
      }

      .thamly-floating-popup.show {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .thamly-popup-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 12px;
        font-weight: 600;
        color: #1f2937;
      }

      .thamly-popup-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .thamly-popup-original {
        background: #fef2f2;
        border-left: 3px solid #ef4444;
        padding: 8px;
        margin-bottom: 8px;
        border-radius: 4px;
        font-size: 13px;
        color: #1f2937;
      }

      .thamly-popup-suggestion {
        background: #f0fdf4;
        border-left: 3px solid #10b981;
        padding: 8px;
        margin-bottom: 8px;
        border-radius: 4px;
        font-size: 13px;
        color: #1f2937;
        font-weight: 500;
      }

      .thamly-popup-reason {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 12px;
        line-height: 1.4;
      }

      .thamly-popup-actions {
        display: flex;
        gap: 8px;
      }

      .thamly-popup-btn {
        flex: 1;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .thamly-popup-accept {
        background: #8b5cf6;
        color: white;
      }

      .thamly-popup-accept:hover {
        background: #7c3aed;
      }

      .thamly-popup-ignore {
        background: #f3f4f6;
        color: #6b7280;
        border: 1px solid #e5e7eb;
      }

      .thamly-popup-ignore:hover {
        background: #e5e7eb;
        color: #4b5563;
      }

      @keyframes tooltipFadeIn {
        to { opacity: 1; }
      }
    `
  },
})