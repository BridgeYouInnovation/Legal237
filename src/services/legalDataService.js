import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

class LegalDataService {
  constructor() {
    this.documentsCache = {};
    this.bookmarks = [];
    this.searchHistory = [];
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Initialize the service
  async initialize() {
    try {
      await this.loadBookmarks();
      await this.loadSearchHistory();
      console.log('Legal Data Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Legal Data Service:', error);
    }
  }

  // Fetch documents from database
  async fetchDocumentsFromDatabase(documentType, language) {
    try {
      console.log(`Fetching ${documentType} documents in ${language} from database...`);
      
      const { data, error } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('law_type', documentType)
        .eq('language', language)
        .order('article_id', { ascending: true });

      if (error) {
        console.error('Database fetch error:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} articles from database`);
      
      // Transform database format to app format
      const transformedData = data?.map(article => ({
        id: article.article_id || 'unknown',
        title: article.title != null ? article.title : 'Untitled',
        text: article.text || '',
        book: article.book || '',
        documentType: documentType,
        language: language,
        created_at: article.created_at,
        updated_at: article.updated_at
      })) || [];

      return transformedData;
    } catch (error) {
      console.error(`Error fetching ${documentType} documents:`, error);
      return [];
    }
  }

  // Get document types available in database
  async getAvailableDocumentTypes() {
    try {
      const { data, error } = await supabase
        .from('legal_articles')
        .select('law_type')
        .order('law_type');

      if (error) throw error;

      // Extract unique law types
      const types = [...new Set(data?.map(item => item.law_type).filter(Boolean) || [])];
      console.log('Available document types:', types);
      return types;
    } catch (error) {
      console.error('Error fetching document types:', error);
      return ['penal_code', 'criminal_procedure']; // fallback
    }
  }

  // Get document with caching
  async getDocument(type, language = 'en') {
    const cacheKey = `${type}_${language}`;
    console.log(`Getting document with key: ${cacheKey}`);

    // Check cache first
    const cached = this.documentsCache[cacheKey];
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      console.log(`Returning cached data for ${cacheKey} (${cached.data.length} articles)`);
      return cached.data;
    }

    // Fetch from database
    const data = await this.fetchDocumentsFromDatabase(type, language);
    
    // Cache the result
    this.documentsCache[cacheKey] = {
      data,
      timestamp: now
    };

    console.log(`Cached ${data.length} articles for ${cacheKey}`);
    return data;
  }

  // Clear cache to force refresh
  clearCache() {
    this.documentsCache = {};
    console.log('Document cache cleared');
  }

  // Search across documents (now from database)
  async searchDocuments(query, language = 'en', documentType = null) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    let results = [];

    try {
      // Determine which documents to search
      if (documentType) {
        const articles = await this.getDocument(documentType, language);
        results = this.performSearch(articles, searchTerm, documentType);
      } else {
        // Search all document types
        const types = await this.getAvailableDocumentTypes();
        
        for (const type of types) {
          const articles = await this.getDocument(type, language);
          const typeResults = this.performSearch(articles, searchTerm, type);
          results = results.concat(typeResults);
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score);

      // Save search to history
      this.addToSearchHistory(query, language, documentType);

      return results.slice(0, 50); // Limit to top 50 results
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  // Perform search on articles array
  performSearch(articles, searchTerm, documentType) {
    const results = [];

    articles.forEach(article => {
      // Safely build search text with null checks
      const searchText = `${article.id || ''} ${article.title || ''} ${article.text || ''}`.toLowerCase();
      
      if (searchText.includes(searchTerm)) {
        // Calculate relevance score
        let score = 0;
        
        // Higher score for matches in title and ID (with null checks)
        if (article.title && article.title.toLowerCase().includes(searchTerm)) score += 10;
        if (article.id && article.id.toLowerCase().includes(searchTerm)) score += 15;
        
        // Score for text matches (with null check)
        if (article.text) {
          const textMatches = (article.text.toLowerCase().match(new RegExp(searchTerm, 'g')) || []).length;
          score += textMatches;
        }

        results.push({
          ...article,
          documentType,
          score,
          snippet: this.getSearchSnippet(article.text || '', searchTerm)
        });
      }
    });

    return results;
  }

  // Get search snippet
  getSearchSnippet(text, searchTerm, maxLength = 150) {
    if (!text || !searchTerm) return text?.substring(0, maxLength) + '...' || '';
    
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text.substring(0, maxLength) + '...';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + maxLength - 50);
    
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  // Get article by ID
  async getArticleById(id, documentType, language = 'en') {
    const document = await this.getDocument(documentType, language);
    return document.find(article => article.id === id);
  }

  // Get articles by hierarchy (book, chapter, etc.)
  async getArticlesByHierarchy(hierarchy, documentType, language = 'en') {
    try {
      const document = await this.getDocument(documentType, language);
      
      if (!document || !document.length) {
        return [];
      }

      // Filter articles based on hierarchy criteria
      let filteredArticles = document;

      // First try exact book match
      if (hierarchy.book) {
        const bookMatches = document.filter(article => 
          article.book && article.book.toLowerCase().includes(hierarchy.book.toLowerCase())
        );
        
        if (bookMatches.length > 0) {
          filteredArticles = bookMatches;
        }
      }

      // Then try chapter match within book results
      if (hierarchy.chapter && filteredArticles.length > 0) {
        const chapterMatches = filteredArticles.filter(article => 
          article.chapter && article.chapter.toLowerCase().includes(hierarchy.chapter.toLowerCase())
        );
        
        if (chapterMatches.length > 0) {
          filteredArticles = chapterMatches;
        }
      }

      // If no specific matches found, return articles from the same document type
      if (filteredArticles.length === 0 || filteredArticles.length === document.length) {
        // Return a random sample of articles from the same document type
        const shuffled = [...document].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
      }

      return filteredArticles;
    } catch (error) {
      console.error('Error getting articles by hierarchy:', error);
      return [];
    }
  }

  // Get document structure (books, chapters, etc.)
  async getDocumentStructure(documentType, language = 'en') {
    const document = await this.getDocument(documentType, language);
    
    if (!document.length) return {};

    const structure = {
      books: new Set(),
      chapters: new Set(),
      parts: new Set(),
      titleSections: new Set()
    };

    document.forEach(article => {
      if (article.book) structure.books.add(article.book);
      if (article.chapter) structure.chapters.add(article.chapter);
      if (article.part) structure.parts.add(article.part);
      if (article.title_section) structure.titleSections.add(article.title_section);
    });

    return {
      books: Array.from(structure.books).sort(),
      chapters: Array.from(structure.chapters).sort(),
      parts: Array.from(structure.parts).sort(),
      titleSections: Array.from(structure.titleSections).sort()
    };
  }

  // Get statistics (now dynamic from database)
  async getStatistics() {
    try {
      const types = await this.getAvailableDocumentTypes();
      const stats = {
        total: 0,
        by_document: {},
        by_language: { en: 0, fr: 0 }
      };

      for (const type of types) {
        const enArticles = await this.getDocument(type, 'en');
        const frArticles = await this.getDocument(type, 'fr');
        
        stats.by_document[`${type}_en`] = enArticles.length;
        stats.by_document[`${type}_fr`] = frArticles.length;
        stats.by_language.en += enArticles.length;
        stats.by_language.fr += frArticles.length;
        stats.total += enArticles.length + frArticles.length;
      }

      console.log('Generated statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Error generating statistics:', error);
      return {
        total: 0,
        by_document: {},
        by_language: { en: 0, fr: 0 }
      };
    }
  }

  // Get all available law types for home screen
  async getAvailableLawTypes() {
    try {
      const types = await this.getAvailableDocumentTypes();
      const lawTypes = [];

      for (const type of types) {
        const enArticles = await this.getDocument(type, 'en');
        const frArticles = await this.getDocument(type, 'fr');
        
        // Create law type info
        const lawType = {
          id: type,
          documentType: type,
          articleCount: {
            en: enArticles.length,
            fr: frArticles.length
          }
        };

        lawTypes.push(lawType);
      }

      return lawTypes;
    } catch (error) {
      console.error('Error fetching available law types:', error);
      return [];
    }
  }

  // Bookmark management
  async addBookmark(article, documentType, language) {
    try {
      const bookmark = {
        id: `${documentType}_${language}_${article.id}`,
        article,
        documentType,
        language,
        timestamp: new Date().toISOString()
      };

      this.bookmarks = this.bookmarks.filter(b => b.id !== bookmark.id);
      this.bookmarks.unshift(bookmark);

      await this.saveBookmarks();
      return true;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return false;
    }
  }

  async removeBookmark(bookmarkId) {
    try {
      this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
      await this.saveBookmarks();
      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  }

  isBookmarked(article, documentType, language) {
    const bookmarkId = `${documentType}_${language}_${article.id}`;
    return this.bookmarks.some(b => b.id === bookmarkId);
  }

  getBookmarks() {
    return this.bookmarks;
  }

  async saveBookmarks() {
    try {
      await AsyncStorage.setItem('legal_bookmarks', JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }

  async loadBookmarks() {
    try {
      const bookmarks = await AsyncStorage.getItem('legal_bookmarks');
      this.bookmarks = bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      this.bookmarks = [];
    }
  }

  // Search history management
  async addToSearchHistory(query, language, documentType) {
    try {
      const historyItem = {
        query,
        language,
        documentType,
        timestamp: new Date().toISOString()
      };

      // Remove duplicates
      this.searchHistory = this.searchHistory.filter(
        h => !(h.query === query && h.language === language && h.documentType === documentType)
      );

      this.searchHistory.unshift(historyItem);
      this.searchHistory = this.searchHistory.slice(0, 20); // Keep only last 20 searches

      await this.saveSearchHistory();
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  }

  getSearchHistory() {
    return this.searchHistory;
  }

  async clearSearchHistory() {
    try {
      this.searchHistory = [];
      await this.saveSearchHistory();
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  async saveSearchHistory() {
    try {
      await AsyncStorage.setItem('legal_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  async loadSearchHistory() {
    try {
      const history = await AsyncStorage.getItem('legal_search_history');
      this.searchHistory = history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      this.searchHistory = [];
    }
  }

  // Get lawyers from database
  async getLawyers() {
    try {
      const { data, error } = await supabase
        .from('lawyers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching lawyers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      return [];
    }
  }

  // Get lawyers by specialization
  async getLawyersBySpecialization(specialization) {
    try {
      const { data, error } = await supabase
        .from('lawyers')
        .select('*')
        .eq('specialization', specialization)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching lawyers by specialization:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching lawyers by specialization:', error);
      return [];
    }
  }

  // Get lawyers by location
  async getLawyersByLocation(location) {
    try {
      const { data, error } = await supabase
        .from('lawyers')
        .select('*')
        .eq('location', location)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching lawyers by location:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching lawyers by location:', error);
      return [];
    }
  }
}

// Create and export singleton instance
const legalDataService = new LegalDataService();
export default legalDataService; 