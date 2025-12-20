export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const

export const USAGE_LIMITS = {
  // Daily call limits; adjust here to change production quotas
  free: 30,
  pro: 2000,
  enterprise: Infinity,
} as const

export const AI_TYPES = {
  EXPAND: "expand",
  SUMMARIZE: "summarize",
  IMPROVE: "improve",
  CREATIVE: "creative",
} as const
