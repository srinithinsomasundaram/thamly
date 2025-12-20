"use client"

import { DynamicSearch } from "./dynamic-search"

interface SubscriptionSearchProps {
  onResultClick?: (result: any) => void
  className?: string
}

export function SubscriptionSearch({ onResultClick, className }: SubscriptionSearchProps) {
  return (
    <DynamicSearch
      type="subscription"
      placeholder="Search subscription options..."
      onResultClick={onResultClick}
      className={className}
    />
  )
}