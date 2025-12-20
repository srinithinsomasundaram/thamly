"use client"

import {
  Undo2,
  Redo2,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Search,
  ChevronDown,
} from "lucide-react"
import { useState } from "react"

export function Toolbar() {
  const [openStyle, setOpenStyle] = useState(false)

  return (
    <div className="w-full border-b border-gray-200 flex items-center gap-2 px-4 py-3 bg-white">
      {/* Undo / Redo */}
      <button className="toolbar-btn" title="Undo">
        <Undo2 size={18} />
      </button>

      <button className="toolbar-btn" title="Redo">
        <Redo2 size={18} />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* Text Style - A icon for text formatting */}
      <div className="relative">
        <button
          onClick={() => setOpenStyle(!openStyle)}
          className="toolbar-btn flex items-center gap-1"
          title="Text Color"
        >
          <Type size={18} />
          <ChevronDown size={14} />
        </button>

        {openStyle && (
          <div className="absolute mt-1 bg-white shadow-lg border border-gray-200 rounded-md w-40 z-20 top-full left-0">
            <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
              Normal text
            </div>
            <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
              Heading 1
            </div>
            <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
              Heading 2
            </div>
            <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors">
              Heading 3
            </div>
          </div>
        )}
      </div>

      <button className="toolbar-btn" title="Bold">
        <Bold size={18} />
      </button>

      <button className="toolbar-btn" title="Italic">
        <Italic size={18} />
      </button>

      <button className="toolbar-btn" title="Underline">
        <Underline size={18} />
      </button>

      <button className="toolbar-btn" title="Strikethrough">
        <Strikethrough size={18} />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* List buttons */}
      <button className="toolbar-btn" title="Bullet List">
        <List size={18} />
      </button>

      <button className="toolbar-btn" title="Numbered List">
        <ListOrdered size={18} />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      <div className="flex items-center gap-1">
        <button className="toolbar-btn" title="Align Left">
          <AlignLeft size={18} />
        </button>
        <button className="toolbar-btn" title="Align Center">
          <AlignCenter size={18} />
        </button>
        <button className="toolbar-btn" title="Align Right">
          <AlignRight size={18} />
        </button>
        <button className="toolbar-btn" title="Justify">
          <AlignJustify size={18} />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* Link */}
      <button className="toolbar-btn" title="Insert Link">
        <Link size={18} />
      </button>

      {/* Search */}
      <button className="toolbar-btn" title="Search">
        <Search size={18} />
      </button>

      <button className="ml-auto px-3 py-1.5 border border-gray-300 rounded-full text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        தமிழ்
      </button>
    </div>
  )
}
