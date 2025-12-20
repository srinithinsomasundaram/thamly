/**
 * Usage tracking utilities for THAMLY AI Assistant
 */

// Usage limits per subscription tier
export const USAGE_LIMITS = {
  free: 100,      // 100 AI calls per day
  pro: 2000,      // 2000 AI calls per day
  enterprise: Infinity // Unlimited
}

export interface UsageRecord {
  date: string // YYYY-MM-DD format
  count: number
  lastReset: string // ISO timestamp
}

const STORAGE_KEY = 'thamly_ai_usage'
const RATE_LIMIT_KEY = 'thamly_rate_limit'
const RATE_LIMIT_WINDOW = 60000 // 1 minute in milliseconds
const MAX_REQUESTS_PER_MINUTE = 120

/**
 * Get current usage for today
 */
export function getTodayUsage(): UsageRecord {
  const today = new Date().toISOString().split('T')[0]

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { date: today, count: 0, lastReset: new Date().toISOString() }
    }

    const usage: UsageRecord = JSON.parse(stored)

    // Reset if it's a new day
    if (usage.date !== today) {
      const newUsage: UsageRecord = {
        date: today,
        count: 0,
        lastReset: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage))
      return newUsage
    }

    return usage
  } catch (error) {
    console.error('Error reading usage:', error)
    return { date: today, count: 0, lastReset: new Date().toISOString() }
  }
}

/**
 * Increment usage count
 */
export function incrementUsage(): { success: boolean; remaining: number; limit: number } {
  const usage = getTodayUsage()
  const profile = getCurrentProfile()
  const limit = profile?.subscription_tier ? (USAGE_LIMITS[profile.subscription_tier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free) : USAGE_LIMITS.free

  // Check if already at limit
  if (usage.count >= limit && limit !== Infinity) {
    return { success: false, remaining: 0, limit }
  }

  try {
    const newUsage: UsageRecord = {
      ...usage,
      count: usage.count + 1
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage))

    return {
      success: true,
      remaining: Math.max(0, limit - newUsage.count),
      limit
    }
  } catch (error) {
    console.error('Error incrementing usage:', error)
    return { success: false, remaining: 0, limit }
  }
}

/**
 * Check rate limiting (requests per minute)
 */
export function checkRateLimit(): { allowed: boolean; resetIn: number } {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    const now = Date.now()

    if (!stored) {
      // First request
      const rateData = {
        count: 1,
        windowStart: now
      }
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateData))
      return { allowed: true, resetIn: RATE_LIMIT_WINDOW }
    }

    const rateData = JSON.parse(stored)
    const timeSinceStart = now - rateData.windowStart

    // Reset window if expired
    if (timeSinceStart >= RATE_LIMIT_WINDOW) {
      const newRateData = {
        count: 1,
        windowStart: now
      }
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newRateData))
      return { allowed: true, resetIn: RATE_LIMIT_WINDOW }
    }

    // Check if over limit
    if (rateData.count >= MAX_REQUESTS_PER_MINUTE) {
      return {
        allowed: false,
        resetIn: RATE_LIMIT_WINDOW - timeSinceStart
      }
    }

    // Increment count
    const newRateData = {
      ...rateData,
      count: rateData.count + 1
    }
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newRateData))

    return {
      allowed: true,
      resetIn: RATE_LIMIT_WINDOW - timeSinceStart
    }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return { allowed: true, resetIn: RATE_LIMIT_WINDOW }
  }
}

/**
 * Get usage stats for display
 */
export function getUsageStats() {
  const usage = getTodayUsage()
  const profile = getCurrentProfile()
  const limit = profile?.subscription_tier ? (USAGE_LIMITS[profile.subscription_tier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free) : USAGE_LIMITS.free
  const percentage = limit === Infinity ? 0 : Math.round((usage.count / limit) * 100)

  return {
    used: usage.count,
    limit,
    remaining: Math.max(0, limit - usage.count),
    percentage,
    isPro: profile?.subscription_tier && profile.subscription_tier !== 'free'
  }
}

/**
 * Get current user profile from local storage or context
 */
function getCurrentProfile() {
  try {
    // Try to get from localStorage first
    const profile = localStorage.getItem('user_profile')
    if (profile) {
      return JSON.parse(profile)
    }
  } catch (error) {
    console.error('Error getting profile:', error)
  }
  return null
}

/**
 * Reset usage data (for testing or admin)
 */
export function resetUsage() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(RATE_LIMIT_KEY)
}

/**
 * Update user profile in storage
 */
export function updateProfile(profile: any) {
  try {
    localStorage.setItem('user_profile', JSON.stringify(profile))
  } catch (error) {
    console.error('Error updating profile:', error)
  }
}
