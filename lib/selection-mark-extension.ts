import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface SelectionMarkOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    selectionMark: {
      /**
       * Set a selection mark
       */
      setSelectionMark: (attributes?: { text: string, issues: string[] }) => ReturnType
      /**
       * Toggle a selection mark
       */
      toggleSelectionMark: (attributes?: { text: string, issues: string[] }) => ReturnType
      /**
       * Unset a selection mark
       */
      unsetSelectionMark: () => ReturnType
    }
  }
}

export const SelectionMark = Extension.create<SelectionMarkOptions>({
  name: 'selectionMark',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      text: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-text'),
        renderHTML: (attributes: any) => {
          if (!attributes.text) {
            return {}
          }

          return {
            'data-text': attributes.text,
          }
        },
      },
      issues: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-issues'),
        renderHTML: (attributes: any) => {
          if (!attributes.issues) {
            return {}
          }

          return {
            'data-issues': attributes.issues,
            class: getIssueClass(attributes.issues)
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-selection-mark="true"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }: any) {
    return ['span', { ...HTMLAttributes, 'data-selection-mark': 'true' }, 0]
  },

  addCommands() {
    return {
      setSelectionMark:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      toggleSelectionMark:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes)
        },
      unsetSelectionMark:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('selectionMark'),
        props: {
          decorations(state) {
            const { doc, selection, schema } = state
            const { from, to, empty } = selection

            if (empty) {
              return null
            }

            const markType = schema.marks.selectionMark
            if (!markType) return null

            const deco = Decoration.inline(
              from,
              to,
              { 'data-selection-mark': 'true' },
              {
                inclusiveStart: false,
                inclusiveEnd: false,
                mark: markType.create({
                  text: doc.textBetween(from, to, ' '),
                  issues: ['selected'],
                }),
              }
            )

            return DecorationSet.create(doc, [deco])
          },
        },
        // Add view props to handle click events for deselecting
        view() {
          return {
            update(view, prevState) {
              const { state } = view
              const { selection } = state
              const { from, to, empty } = selection

              // Clear selection when clicking outside
              if (empty && !prevState.selection.empty) {
                // Selection was cleared, decorations will be automatically updated
                return
              }
            }
          }
        }
      }),
    ]
  },
})

function getIssueClass(issues: string): string {
  const issueClasses: Record<string, string> = {
    spelling: 'underline decoration-red-500 decoration-wavy',
    grammar: 'underline decoration-blue-500 decoration-dotted',
    clarity: 'underline decoration-yellow-500 decoration-dashed',
    'tamil-spelling': 'underline decoration-orange-500 decoration-wavy',
    selected: 'bg-blue-100 underline decoration-blue-600 decoration-solid'
  }

  const issueArray = Array.isArray(issues) ? issues : [issues]
  return issueArray.map((issue: string) => issueClasses[issue] || issueClasses.selected).join(' ')
}
