"use client"

import { DynamicSearch } from "./dynamic-search"

interface EditorSearchProps {
  onResultClick?: (result: any) => void
  className?: string
}

export function EditorSearch({ onResultClick, className }: EditorSearchProps) {
  return (
    <DynamicSearch
      type="drafts"
      placeholder="Search your drafts..."
      onResultClick={onResultClick}
      className={className}
    />
  )
}