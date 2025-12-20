"use client"

import { ArrowLeft } from "lucide-react"

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Drafts</span>
          </button>
          <h1 className="text-xl font-normal text-gray-900">Untitled draft</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors text-sm font-medium">
            <span>✨</span>
            <span>Go Pro</span>
          </button>
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
            <span>Saved just now</span>
          </div>
        </div>
      </div>
    </header>
  )
}
