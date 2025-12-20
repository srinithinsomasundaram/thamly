"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Search, FileText, Calendar, Settings, Trash2, CreditCard, Zap, Filter, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export type SearchType = "drafts" | "settings" | "trash" | "subscription" | "billing" | "all"

interface DynamicSearchProps {
  type: SearchType
  placeholder?: string
  className?: string
  onResultClick?: (result: any) => void
}

interface SearchResult {
  id: string
  title: string
  description?: string
  content?: string
  status?: string
  created_at: string
  updated_at: string
  type?: string
  category?: string
}

export function DynamicSearch({
  type,
  placeholder,
  className = "",
  onResultClick
}: DynamicSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  // Placeholder text based on search type
  const getPlaceholder = () => {
    if (placeholder) return placeholder
    switch (type) {
      case "drafts":
        return "Search your drafts..."
      case "trash":
        return "Search deleted drafts..."
      case "settings":
        return "Search settings..."
      case "subscription":
        return "Search subscription options..."
      case "billing":
        return "Search billing records..."
      default:
        return "Search everything..."
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim() || !user) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const supabase = createClient()
        let searchResults: SearchResult[] = []

        // Search based on type
        switch (type) {
          case "drafts":
          case "all":
            searchResults = await searchDrafts(supabase, query, "all", "updated_at")
            break
          case "trash":
            searchResults = await searchTrash(supabase, query, "updated_at")
            break
          case "settings":
            searchResults = await searchSettings(query)
            break
          case "subscription":
            searchResults = await searchSubscription(query)
            break
          case "billing":
            searchResults = await searchBilling(supabase, query, "updated_at")
            break
        }

        // Deduplicate by composite key to avoid duplicate IDs across sources
        const deduped = [] as SearchResult[]
        const seen = new Set<string>()
        for (const item of searchResults) {
          const key = `${item.type || "item"}-${item.id}`
          if (seen.has(key)) continue
          seen.add(key)
          deduped.push(item)
        }

        setResults(deduped.slice(0, 10)) // Limit results
        setIsOpen(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [query, user, type])

  const searchDrafts = async (supabase: any, query: string, status: string, sort: string) => {
    let queryBuilder = supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)

    if (status !== "all") {
      queryBuilder = queryBuilder.eq('status', status)
    }

    const { data, error } = await queryBuilder
      .order(sort, { ascending: false })
      .limit(10)

    if (error) throw error
    return (data || []).map((item: any) => ({
      ...item,
      type: "draft",
      path: `/editor/${item.id}`,
    }))
  }

  const searchTrash = async (supabase: any, query: string, sort: string) => {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'deleted')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
      .order(sort, { ascending: false })
      .limit(10)

    if (error) throw error
    return (data || []).map((item: any) => ({
      ...item,
      type: "trash",
      path: `/trash?id=${item.id}`,
    }))
  }

  const searchSettings = async (query: string) => {
    const now = new Date().toISOString()
    const settingsData = [
      {
        id: "profile",
        title: "Profile Settings",
        description: "Update your profile information and avatar",
        category: "settings",
        type: "settings",
        path: "/settings#profile",
        created_at: now,
        updated_at: now
      },
      {
        id: "account",
        title: "Account Settings",
        description: "Manage your account preferences",
        category: "settings",
        type: "settings",
        path: "/settings#account",
        created_at: now,
        updated_at: now
      },
      {
        id: "subscription",
        title: "Subscription Management",
        description: "View and manage your subscription plan",
        category: "billing",
        type: "settings",
        path: "/subscription",
        created_at: now,
        updated_at: now
      },
      {
        id: "notifications",
        title: "Notification Preferences",
        description: "Configure email and app notifications",
        category: "settings",
        type: "settings",
        path: "/settings#notifications",
        created_at: now,
        updated_at: now
      },
      {
        id: "privacy",
        title: "Privacy Settings",
        description: "Control your privacy and data settings",
        category: "settings",
        type: "settings",
        path: "/settings#privacy",
        created_at: now,
        updated_at: now
      }
    ]

    return settingsData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    )
  }

  const searchSubscription = async (query: string) => {
    const now = new Date().toISOString()
    const subscriptionData = [
      {
        id: "free",
        title: "Free Plan",
        description: "30 daily suggestions, core checks, save drafts",
        category: "subscription",
        type: "subscription",
        path: "/subscription",
        created_at: now,
        updated_at: now
      },
      {
        id: "pro",
        title: "Pro Plan",
        description: "Unlimited drafting, advanced checks, sync",
        category: "subscription",
        type: "subscription",
        path: "/subscription",
        created_at: now,
        updated_at: now
      },
      {
        id: "enterprise",
        title: "Enterprise Plan",
        description: "Unlimited features, priority support",
        category: "subscription",
        type: "subscription",
        path: "/subscription",
        created_at: now,
        updated_at: now
      }
    ]

    return subscriptionData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    )
  }

  const searchBilling = async (supabase: any, query: string, sort: string) => {
    // This would search payments/billing history when implemented
    return []
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    setQuery("")

    if (onResultClick) {
      onResultClick(result)
      return
    }

    if ((result as any).path) {
      router.push((result as any).path as string)
      return
    }

    // Default navigation based on result type
    switch (result.type) {
      case "settings":
        router.push("/settings")
        break
      case "subscription":
        router.push("/subscription")
        break
      case "billing":
        router.push("/billing")
        break
      default:
        if (result.status === "deleted") {
          router.push(`/trash`)
        } else {
          router.push(`/editor/${result.id}`)
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (!content) return ""
    return content.length > maxLength ? content.substring(0, maxLength) + "..." : content
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    const regex = new RegExp(`(${highlight})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-yellow-900 px-1 rounded">{part}</mark> : part
    )
  }

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case "settings":
        return <Settings className="w-5 h-5 text-blue-600" />
      case "subscription":
        return <CreditCard className="w-5 h-5 text-green-600" />
      case "billing":
        return <Zap className="w-5 h-5 text-purple-600" />
      default:
        if (result.status === "deleted") {
          return <Trash2 className="w-5 h-5 text-red-600" />
        }
        return <FileText className="w-5 h-5 text-teal-600" />
    }
  }

  const getResultBadge = (result: SearchResult) => {
    if (result.status === "deleted") {
      return <Badge variant="destructive">Deleted</Badge>
    }
    if (result.status && result.status !== "draft") {
      return <Badge variant="secondary">{result.status}</Badge>
    }
    if (result.type === "settings") {
      return <Badge variant="outline">Settings</Badge>
    }
    if (result.type === "subscription") {
      return <Badge variant="outline">Subscription</Badge>
    }
    return null
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={getPlaceholder()}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="pl-10 pr-4 bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 transition-all-smooth"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              {!user ? (
                <div>
                  <p className="mb-2">Sign in to search</p>
                  <Button size="sm" onClick={() => router.push('/auth/login')} className="mt-2">
                    Sign In
                  </Button>
                </div>
              ) : query.trim() ? (
                `No ${type} found matching your search`
              ) : (
                `Type to search ${type}`
              )}
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {results.length} {results.length === 1 ? 'Result' : 'Results'}
                </p>
                <Filter className="w-3 h-3 text-gray-400" />
              </div>
              {results.map((result) => {
                const resultKey = `${result.type || "item"}-${result.id}`
                return (
                <button
                  key={resultKey}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getResultIcon(result)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {highlightText(result.title || "Untitled", query)}
                        </h4>
                        <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                      {result.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {highlightText(result.description, query)}
                        </p>
                      )}
                      {result.content && !result.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {highlightText(truncateContent(result.content), query)}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(result.updated_at)}
                        </div>
                        {getResultBadge(result)}
                      </div>
                    </div>
                  </div>
                </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
