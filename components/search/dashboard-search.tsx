"use client"

import { DynamicSearch } from "./dynamic-search"

interface DashboardSearchProps {
  onResultClick?: (result: any) => void
  className?: string
}

export function DashboardSearch({ onResultClick, className }: DashboardSearchProps) {
  return (
    <DynamicSearch
      type="drafts"
      placeholder="Search your drafts..."
      onResultClick={onResultClick}
      className={className}
    />
  )
}