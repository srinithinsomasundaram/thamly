"use client"

import { DynamicSearch } from "./dynamic-search"

interface BillingSearchProps {
  onResultClick?: (result: any) => void
  className?: string
}

export function BillingSearch({ onResultClick, className }: BillingSearchProps) {
  return (
    <DynamicSearch
      type="billing"
      placeholder="Search billing records..."
      onResultClick={onResultClick}
      className={className}
    />
  )
}
