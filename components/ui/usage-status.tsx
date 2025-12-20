"use client"

import { useEffect, useState } from "react"
import { getUsageStats } from "@/lib/utils/usage-tracking"

interface UsageStatusProps {
  className?: string
}

export function UsageStatus({ className = "" }: UsageStatusProps) {
  const [stats, setStats] = useState(() => getUsageStats())

  useEffect(() => {
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      setStats(getUsageStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const { used, limit, remaining, percentage, isPro } = stats

  if (limit === Infinity) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <span className="text-purple-600 font-medium">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
            Unlimited
          </span>
        </span>
      </div>
    )
  }

  const getStatusColor = () => {
    if (percentage >= 90) return "text-red-600 bg-red-50 border-red-200"
    if (percentage >= 70) return "text-orange-600 bg-orange-50 border-orange-200"
    if (percentage >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-green-600 bg-green-50 border-green-200"
  }

  const statusColor = getStatusColor()

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 font-medium">
          {isPro ? "Pro" : "Free"} Usage
        </span>
        <span className={`text-xs px-2 py-1 rounded-full border ${statusColor}`}>
          {used}/{limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            percentage >= 90 ? 'bg-red-500' :
            percentage >= 70 ? 'bg-orange-500' :
            percentage >= 50 ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {remaining <= 10 && (
        <div className="text-xs text-center text-orange-600 font-medium">
          {remaining} request{remaining === 1 ? '' : 's'} left
        </div>
      )}
    </div>
  )
}