"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Search, FileText, Calendar, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  id: string
  title: string
  description?: string
  content?: string
  status: string
  created_at: string
  updated_at: string
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

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
    const searchDrafts = async () => {
      if (!query.trim()) {
        setResults([])
        setIsOpen(false)
        return
      }

      if (!user) {
        setResults([])
        setIsOpen(true)
        return
      }

      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('drafts')
          .select('*')
          .eq('user_id', user.id)
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
          .eq('status', 'draft')
          .order('updated_at', { ascending: false })
          .limit(10)

        if (error) throw error
        setResults(data || [])
        setIsOpen(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(searchDrafts, 300)
    return () => clearTimeout(timeoutId)
  }, [query, user])

  const handleResultClick = (result: SearchResult) => {
    router.push(`/editor/${result.id}`)
    setIsOpen(false)
    setQuery("")
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

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search your drafts..."
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
                  <p className="mb-2">Sign in to search your drafts</p>
                  <Button size="sm" onClick={() => router.push('/auth/login')} className="mt-2">
                    Sign In
                  </Button>
                </div>
              ) : query.trim() ? (
                "No drafts found matching your search"
              ) : (
                "Type to search your drafts"
              )}
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {results.length} {results.length === 1 ? 'Result' : 'Results'}
                </p>
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-teal-600" />
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
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(result.updated_at)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}