import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NewLegalDataService {
  constructor() {
    this.initialized = false;
    this.categories = [];
    this.articlesCache = new Map();
    this.userPurchases = [];
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🔧 Initializing New Legal Data Service...');
      
      // Load categories
      await this.loadCategories();
      
      // Load user purchases
      await this.loadUserPurchases();
      
      this.initialized = true;
      console.log('✅ New Legal Data Service initialized successfully');
      console.log(`📚 Available categories: ${this.categories.length}`);
      console.log(`💰 User purchases: ${this.userPurchases.length}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize New Legal Data Service:', error);
      throw error;
    }
  }

  async loadCategories() {
    try {
      const { data, error } = await supabase
        .from('law_category_stats')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      this.categories = data || [];
      console.log(`📋 Loaded ${this.categories.length} law categories`);
      
      return this.categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      throw error;
    }
  }

  async loadUserPurchases() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('👤 No user found, skipping purchase sync');
        return [];
      }

      // Get user's document access
      const { data, error } = await supabase
        .from('document_access')
        .select('document_type')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.warn('Failed to load user purchases:', error);
        return [];
      }

      this.userPurchases = data?.map(item => item.document_type) || [];
      console.log(`💳 User has access to: ${this.userPurchases.join(', ')}`);
      
      return this.userPurchases;
    } catch (error) {
      console.warn('Error loading user purchases:', error);
      return [];
    }
  }

  async getArticles(categoryCode, language = 'en') {
    try {
      const cacheKey = `${categoryCode}_${language}`;
      
      // Check if user has access to this category
      if (!this.userPurchases.includes(categoryCode)) {
        const category = this.categories.find(c => c.code === categoryCode);
        if (category && !category.is_free) {
          throw new Error(`Access denied. Please purchase ${category.name_en} to view articles.`);
        }
      }

      // Check cache first
      if (this.articlesCache.has(cacheKey)) {
        console.log(`📖 Returning cached articles for ${cacheKey}`);
        return this.articlesCache.get(cacheKey);
      }

      console.log(`🔍 Fetching articles for ${categoryCode} in ${language}...`);

      const { data, error } = await supabase
        .from('law_articles_with_category')
        .select('*')
        .eq('category_code', categoryCode)
        .eq('is_active', true)
        .order('article_number');

      if (error) throw error;

      // Transform data to match the expected format
      const articles = (data || []).map(article => ({
        id: article.id,
        article_id: article.article_id,
        title: language === 'fr' ? article.title_fr : article.title_en,
        content: language === 'fr' ? article.content_fr : article.content_en,
        category_code: article.category_code,
        category_name: language === 'fr' ? article.category_name_fr : article.category_name_en,
        article_number: article.article_number,
        version: article.version,
        created_at: article.created_at,
        updated_at: article.updated_at
      }));

      // Cache the articles
      this.articlesCache.set(cacheKey, articles);
      console.log(`📚 Fetched and cached ${articles.length} articles for ${cacheKey}`);

      return articles;
    } catch (error) {
      console.error(`Failed to get articles for ${categoryCode}:`, error);
      throw error;
    }
  }

  async searchArticles(query, categoryCode = null, language = 'en') {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      console.log(`🔍 Searching for "${query}" in ${categoryCode || 'all categories'}`);

      let queryBuilder = supabase
        .from('law_articles_with_category')
        .select('*')
        .eq('is_active', true);

      if (categoryCode) {
        queryBuilder = queryBuilder.eq('category_code', categoryCode);
      }

      // Search in content and title
      if (language === 'fr') {
        queryBuilder = queryBuilder.or(`content_fr.ilike.%${query}%,title_fr.ilike.%${query}%`);
      } else {
        queryBuilder = queryBuilder.or(`content_en.ilike.%${query}%,title_en.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder
        .order('article_number')
        .limit(50);

      if (error) throw error;

      // Transform and filter by user access
      const results = (data || [])
        .filter(article => {
          const category = this.categories.find(c => c.code === article.category_code);
          return this.userPurchases.includes(article.category_code) || (category && category.is_free);
        })
        .map(article => ({
          id: article.id,
          article_id: article.article_id,
          title: language === 'fr' ? article.title_fr : article.title_en,
          content: language === 'fr' ? article.content_fr : article.content_en,
          category_code: article.category_code,
          category_name: language === 'fr' ? article.category_name_fr : article.category_name_en,
          article_number: article.article_number,
          version: article.version,
          created_at: article.created_at,
          updated_at: article.updated_at
        }));

      console.log(`🎯 Found ${results.length} matching articles`);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  getAvailableCategories() {
    return this.categories.map(category => ({
      code: category.code,
      name_en: category.name_en,
      name_fr: category.name_fr,
      description_en: category.description_en,
      description_fr: category.description_fr,
      icon: category.icon,
      color: category.color,
      price: category.price,
      currency: category.currency,
      is_free: category.is_free,
      total_articles: category.total_articles || 0,
      active_articles: category.active_articles || 0,
      has_access: this.userPurchases.includes(category.code) || category.is_free
    }));
  }

  getCategoryInfo(categoryCode) {
    const category = this.categories.find(c => c.code === categoryCode);
    if (!category) return null;

    return {
      code: category.code,
      name_en: category.name_en,
      name_fr: category.name_fr,
      description_en: category.description_en,
      description_fr: category.description_fr,
      icon: category.icon,
      color: category.color,
      price: category.price,
      currency: category.currency,
      is_free: category.is_free,
      total_articles: category.total_articles || 0,
      active_articles: category.active_articles || 0,
      has_access: this.userPurchases.includes(category.code) || category.is_free
    };
  }

  async refreshUserPurchases() {
    await this.loadUserPurchases();
    // Clear article cache since access might have changed
    this.articlesCache.clear();
  }

  async syncPurchaseToDatabase(categoryCode) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Add to document_access table
      const { error } = await supabase
        .from('document_access')
        .insert({
          user_id: user.id,
          document_type: categoryCode,
          status: 'active',
          granted_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }

      // Refresh user purchases
      await this.refreshUserPurchases();
      
      console.log(`✅ Purchase synced for ${categoryCode}`);
    } catch (error) {
      console.error('Failed to sync purchase:', error);
      throw error;
    }
  }

  async getStatistics() {
    await this.initialize();
    
    const stats = {
      total_categories: this.categories.length,
      purchased_categories: this.userPurchases.length,
      free_categories: this.categories.filter(c => c.is_free).length,
      total_articles: this.categories.reduce((sum, cat) => sum + (cat.active_articles || 0), 0),
      accessible_articles: this.categories
        .filter(cat => this.userPurchases.includes(cat.code) || cat.is_free)
        .reduce((sum, cat) => sum + (cat.active_articles || 0), 0)
    };

    return stats;
  }

  clearCache() {
    this.articlesCache.clear();
    console.log('🗑️ Article cache cleared');
  }

  async refreshCategories() {
    await this.loadCategories();
    this.clearCache();
  }
}

// Create singleton instance
const newLegalDataService = new NewLegalDataService();

export default newLegalDataService; 