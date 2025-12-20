"use client"

import { DynamicSearch } from "./dynamic-search"

interface SettingsSearchProps {
  onResultClick?: (result: any) => void
  className?: string
}

export function SettingsSearch({ onResultClick, className }: SettingsSearchProps) {
  return (
    <DynamicSearch
      type="settings"
      placeholder="Search settings..."
      onResultClick={onResultClick}
      className={className}
    />
  )
}