"use client"

import { DynamicSearch } from "./dynamic-search"

interface TrashSearchProps {
  onResultClick?: (result: any) => void
  className?: string
}

export function TrashSearch({ onResultClick, className }: TrashSearchProps) {
  return (
    <DynamicSearch
      type="trash"
      placeholder="Search deleted drafts..."
      onResultClick={onResultClick}
      className={className}
    />
  )
}