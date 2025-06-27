import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import legalDataService from './legalDataService'

class SearchService {
  constructor() {
    this.searchHistory = []
    this.popularSearches = []
    this.searchCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  async initialize() {
    try {
      await this.loadSearchHistory()
      await this.loadPopularSearches()
      console.log('Search Service initialized successfully')
    } catch (error) {
      console.error('Error initializing Search Service:', error)
    }
  }

  // Enhanced search that combines local and remote data
  async searchArticles(query, options = {}) {
    const {
      language = 'en',
      lawType = null, // 'penal_code' or 'criminal_procedure'
      limit = 50,
      useCache = true,
      searchMode = 'hybrid' // 'local', 'remote', 'hybrid'
    } = options

    if (!query || query.trim().length < 2) {
      return { results: [], source: 'none', totalCount: 0 }
    }

    const searchKey = `${query}_${language}_${lawType}_${limit}`
    
    // Check cache first
    if (useCache && this.searchCache.has(searchKey)) {
      const cached = this.searchCache.get(searchKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    let results = []
    let source = 'local'
    let totalCount = 0

    try {
      if (searchMode === 'remote' || searchMode === 'hybrid') {
        // Try Supabase search first
        const supabaseResults = await this.searchSupabase(query, { language, lawType, limit })
        if (supabaseResults.results.length > 0) {
          results = supabaseResults.results
          source = 'remote'
          totalCount = supabaseResults.totalCount
        }
      }

      // Fallback to local search or combine results
      if (searchMode === 'local' || (searchMode === 'hybrid' && results.length === 0)) {
        const localResults = await this.searchLocal(query, { language, lawType, limit })
        if (searchMode === 'hybrid' && results.length > 0) {
          // Combine and deduplicate results
          results = this.combineResults(results, localResults.results)
          source = 'hybrid'
        } else {
          results = localResults.results
          source = 'local'
          totalCount = localResults.totalCount
        }
      }

      const searchResult = {
        results: results.slice(0, limit),
        source,
        totalCount,
        query,
        timestamp: Date.now()
      }

      // Cache the results
      if (useCache) {
        this.searchCache.set(searchKey, {
          data: searchResult,
          timestamp: Date.now()
        })
      }

      // Add to search history
      await this.addToSearchHistory(query, language, lawType, results.length)

      return searchResult

    } catch (error) {
      console.error('Search error:', error)
      // Fallback to local search on error
      const localResults = await this.searchLocal(query, { language, lawType, limit })
      return {
        ...localResults,
        source: 'local_fallback',
        error: error.message
      }
    }
  }

  // Search using Supabase
  async searchSupabase(query, options = {}) {
    const { language = 'en', lawType = null, limit = 50 } = options

    try {
      let supabaseQuery = supabase
        .from('legal_articles')
        .select('*')
        .eq('language', language)
        .or(`text.ilike.%${query}%,title.ilike.%${query}%,article_id.ilike.%${query}%`)
        .order('article_id')
        .limit(limit)

      if (lawType) {
        supabaseQuery = supabaseQuery.eq('law_type', lawType)
      }

      const { data, error, count } = await supabaseQuery

      if (error) {
        throw error
      }

      // Transform Supabase results to match local format
      const results = data.map(article => ({
        id: article.article_id,
        title: article.title || '',
        text: article.text,
        book: article.book || '',
        documentType: article.law_type,
        language: article.language,
        score: this.calculateRelevanceScore(article, query),
        snippet: this.getSearchSnippet(article.text, query),
        source: 'supabase'
      }))

      // Sort by relevance
      results.sort((a, b) => b.score - a.score)

      return {
        results,
        totalCount: count || results.length
      }

    } catch (error) {
      console.error('Supabase search error:', error)
      throw error
    }
  }

  // Search using local data
  async searchLocal(query, options = {}) {
    const { language = 'en', lawType = null, limit = 50 } = options

    try {
      const results = await legalDataService.searchDocuments(query, language, lawType)
      
      return {
        results: results.slice(0, limit),
        totalCount: results.length
      }
    } catch (error) {
      console.error('Local search error:', error)
      return { results: [], totalCount: 0 }
    }
  }

  // Advanced search with multiple filters
  async advancedSearch(filters) {
    const {
      query,
      language = 'en',
      lawType = null,
      book = null,
      articleRange = null, // { start: '1', end: '100' }
      dateRange = null,
      limit = 50
    } = filters

    try {
      let supabaseQuery = supabase
        .from('legal_articles')
        .select('*')
        .eq('language', language)

      // Add text search
      if (query && query.trim()) {
        supabaseQuery = supabaseQuery.or(`text.ilike.%${query}%,title.ilike.%${query}%,article_id.ilike.%${query}%`)
      }

      // Add filters
      if (lawType) {
        supabaseQuery = supabaseQuery.eq('law_type', lawType)
      }

      if (book) {
        supabaseQuery = supabaseQuery.eq('book', book)
      }

      if (articleRange) {
        // This is a simplified range search - you might need to adjust based on your article ID format
        supabaseQuery = supabaseQuery.gte('article_id', articleRange.start).lte('article_id', articleRange.end)
      }

      if (dateRange) {
        supabaseQuery = supabaseQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      }

      const { data, error } = await supabaseQuery.order('article_id').limit(limit)

      if (error) {
        throw error
      }

      const results = data.map(article => ({
        id: article.article_id,
        title: article.title || '',
        text: article.text,
        book: article.book || '',
        documentType: article.law_type,
        language: article.language,
        score: query ? this.calculateRelevanceScore(article, query) : 1,
        snippet: query ? this.getSearchSnippet(article.text, query) : article.text.substring(0, 150) + '...',
        source: 'supabase'
      }))

      if (query) {
        results.sort((a, b) => b.score - a.score)
      }

      return {
        results,
        totalCount: results.length,
        filters
      }

    } catch (error) {
      console.error('Advanced search error:', error)
      // Fallback to basic local search
      return await this.searchLocal(query || '', { language, lawType, limit })
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query, language = 'en') {
    if (!query || query.length < 2) {
      return []
    }

    try {
      // Get suggestions from search history
      const historySuggestions = this.searchHistory
        .filter(item => 
          item.query.toLowerCase().includes(query.toLowerCase()) && 
          item.language === language
        )
        .slice(0, 3)
        .map(item => ({
          text: item.query,
          type: 'history',
          count: item.resultCount
        }))

      // Get suggestions from popular searches
      const popularSuggestions = this.popularSearches
        .filter(item => 
          item.query.toLowerCase().includes(query.toLowerCase()) && 
          item.language === language
        )
        .slice(0, 3)
        .map(item => ({
          text: item.query,
          type: 'popular',
          count: item.searchCount
        }))

      // Get article title suggestions from Supabase
      const { data } = await supabase
        .from('legal_articles')
        .select('title, article_id')
        .eq('language', language)
        .ilike('title', `%${query}%`)
        .limit(5)

      const titleSuggestions = (data || []).map(article => ({
        text: article.title,
        type: 'article',
        articleId: article.article_id
      }))

      // Combine and deduplicate
      const allSuggestions = [...historySuggestions, ...popularSuggestions, ...titleSuggestions]
      const uniqueSuggestions = allSuggestions.filter((item, index, self) => 
        index === self.findIndex(t => t.text.toLowerCase() === item.text.toLowerCase())
      )

      return uniqueSuggestions.slice(0, 8)

    } catch (error) {
      console.error('Error getting search suggestions:', error)
      return []
    }
  }

  // Helper methods
  calculateRelevanceScore(article, query) {
    let score = 0
    const queryLower = query.toLowerCase()
    
    // Higher score for matches in title and article ID
    if (article.title && article.title.toLowerCase().includes(queryLower)) score += 10
    if (article.article_id && article.article_id.toLowerCase().includes(queryLower)) score += 15
    
    // Score for text matches
    if (article.text) {
      const textMatches = (article.text.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length
      score += textMatches
    }

    return score
  }

  getSearchSnippet(text, query, maxLength = 150) {
    if (!text || !query) return text?.substring(0, maxLength) + '...' || ''
    
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text.substring(0, maxLength) + '...'

    const start = Math.max(0, index - 50)
    const end = Math.min(text.length, index + maxLength - 50)
    
    let snippet = text.substring(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'

    return snippet
  }

  combineResults(remoteResults, localResults) {
    const combined = [...remoteResults]
    const remoteIds = new Set(remoteResults.map(r => r.id))
    
    localResults.forEach(local => {
      if (!remoteIds.has(local.id)) {
        combined.push({ ...local, source: 'local' })
      }
    })

    return combined.sort((a, b) => b.score - a.score)
  }

  // Search history management
  async addToSearchHistory(query, language, lawType, resultCount) {
    try {
      const searchItem = {
        query: query.trim(),
        language,
        lawType,
        resultCount,
        timestamp: new Date().toISOString()
      }

      // Remove duplicate
      this.searchHistory = this.searchHistory.filter(item => 
        !(item.query === searchItem.query && item.language === searchItem.language)
      )

      // Add to beginning
      this.searchHistory.unshift(searchItem)

      // Keep only last 50 searches
      this.searchHistory = this.searchHistory.slice(0, 50)

      await this.saveSearchHistory()
      await this.updatePopularSearches(query, language)

    } catch (error) {
      console.error('Error adding to search history:', error)
    }
  }

  async updatePopularSearches(query, language) {
    try {
      const existing = this.popularSearches.find(item => 
        item.query === query && item.language === language
      )

      if (existing) {
        existing.searchCount += 1
        existing.lastSearched = new Date().toISOString()
      } else {
        this.popularSearches.push({
          query,
          language,
          searchCount: 1,
          lastSearched: new Date().toISOString()
        })
      }

      // Sort by search count and keep top 20
      this.popularSearches.sort((a, b) => b.searchCount - a.searchCount)
      this.popularSearches = this.popularSearches.slice(0, 20)

      await this.savePopularSearches()

    } catch (error) {
      console.error('Error updating popular searches:', error)
    }
  }

  getSearchHistory(language = null) {
    if (language) {
      return this.searchHistory.filter(item => item.language === language)
    }
    return this.searchHistory
  }

  getPopularSearches(language = null) {
    if (language) {
      return this.popularSearches.filter(item => item.language === language)
    }
    return this.popularSearches
  }

  async clearSearchHistory() {
    try {
      this.searchHistory = []
      await AsyncStorage.removeItem('search_history')
    } catch (error) {
      console.error('Error clearing search history:', error)
    }
  }

  // Storage methods
  async saveSearchHistory() {
    try {
      await AsyncStorage.setItem('search_history', JSON.stringify(this.searchHistory))
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  async loadSearchHistory() {
    try {
      const stored = await AsyncStorage.getItem('search_history')
      if (stored) {
        this.searchHistory = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading search history:', error)
      this.searchHistory = []
    }
  }

  async savePopularSearches() {
    try {
      await AsyncStorage.setItem('popular_searches', JSON.stringify(this.popularSearches))
    } catch (error) {
      console.error('Error saving popular searches:', error)
    }
  }

  async loadPopularSearches() {
    try {
      const stored = await AsyncStorage.getItem('popular_searches')
      if (stored) {
        this.popularSearches = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading popular searches:', error)
      this.popularSearches = []
    }
  }

  // Clear cache
  clearCache() {
    this.searchCache.clear()
  }

  // Get search statistics
  getSearchStats() {
    return {
      totalSearches: this.searchHistory.length,
      uniqueQueries: new Set(this.searchHistory.map(s => s.query)).size,
      popularSearches: this.popularSearches.slice(0, 10),
      recentSearches: this.searchHistory.slice(0, 10),
      cacheSize: this.searchCache.size
    }
  }
}

// Create and export singleton instance
const searchService = new SearchService()
export default searchService 