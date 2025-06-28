import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { supabaseAdmin } from '../lib/supabase';
import './Laws.css';

interface LawCategory {
  id: string;
  code: string;
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  icon?: string;
  color?: string;
  price: number;
  currency: string;
  display_order: number;
  is_active: boolean;
  is_free: boolean;
  total_articles?: number;
  active_articles?: number;
  last_updated?: string;
}

interface LawArticle {
  id: string;
  category_id: string;
  article_number: number;
  article_id: string;
  title_en?: string;
  title_fr?: string;
  content_en: string;
  content_fr: string;
  display_order: number;
  is_active: boolean;
  version: number;
  category_code?: string;
  category_name_en?: string;
  created_at: string;
  updated_at: string;
}

interface NewCategoryForm {
  code: string;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  icon: string;
  color: string;
  price: number;
  is_free: boolean;
}

interface NewArticleForm {
  category_id: string;
  article_id: string;
  title_en: string;
  title_fr: string;
  content_en: string;
  content_fr: string;
}

const Laws: React.FC = () => {
  const [categories, setCategories] = useState<LawCategory[]>([]);
  const [articles, setArticles] = useState<LawArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LawCategory | null>(null);
  const [editingArticle, setEditingArticle] = useState<LawArticle | null>(null);
  
  // Form states
  const [newCategory, setNewCategory] = useState<NewCategoryForm>({
    code: '',
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    icon: 'document-text',
    color: '#3B82F6',
    price: 1000,
    is_free: false
  });
  
  const [newArticle, setNewArticle] = useState<NewArticleForm>({
    category_id: '',
    article_id: '',
    title_en: '',
    title_fr: '',
    content_en: '',
    content_fr: ''
  });

  // Available icons for categories
  const availableIcons = [
    'gavel', 'scale-balanced', 'users', 'briefcase', 'hard-hat', 'home',
    'document-text', 'book-open', 'shield-check', 'building-office',
    'banknotes', 'academic-cap', 'heart', 'truck', 'globe-alt'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadArticles(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('law_category_stats')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError('Failed to load law categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async (categoryId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('law_articles_with_category')
        .select('*')
        .eq('category_code', categoryId)
        .order('article_number');

      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      setError('Failed to load articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const maxOrder = Math.max(...categories.map(c => c.display_order), 0);
      
      const { error } = await supabaseAdmin
        .from('law_categories')
        .insert([{
          ...newCategory,
          display_order: maxOrder + 1
        }]);

      if (error) throw error;
      
      setShowCategoryModal(false);
      setNewCategory({
        code: '',
        name_en: '',
        name_fr: '',
        description_en: '',
        description_fr: '',
        icon: 'document-text',
        color: '#3B82F6',
        price: 1000,
        is_free: false
      });
      loadCategories();
    } catch (err) {
      setError('Failed to create category');
      console.error(err);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    try {
      const { error } = await supabaseAdmin
        .from('law_categories')
        .update(newCategory)
        .eq('id', editingCategory.id);

      if (error) throw error;
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      setError('Failed to update category');
      console.error(err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this law category? This will also delete all articles in this category.')) {
      return;
    }
    
    try {
      const { error } = await supabaseAdmin
        .from('law_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      
      loadCategories();
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
        setArticles([]);
      }
    } catch (err) {
      setError('Failed to delete category');
      console.error(err);
    }
  };

  const handleCreateArticle = async () => {
    try {
      // Get the next article number
      const maxNumber = Math.max(...articles.map(a => a.article_number), 0);
      
      const { error } = await supabaseAdmin
        .from('law_articles')
        .insert([{
          ...newArticle,
          article_number: maxNumber + 1,
          display_order: maxNumber + 1
        }]);

      if (error) throw error;
      
      setShowArticleModal(false);
      setNewArticle({
        category_id: '',
        article_id: '',
        title_en: '',
        title_fr: '',
        content_en: '',
        content_fr: ''
      });
      if (selectedCategory) {
        loadArticles(selectedCategory);
      }
      loadCategories(); // Refresh stats
    } catch (err) {
      setError('Failed to create article');
      console.error(err);
    }
  };

  const handleUpdateArticle = async () => {
    if (!editingArticle) return;
    
    try {
      const { error } = await supabaseAdmin
        .from('law_articles')
        .update({
          article_id: newArticle.article_id,
          title_en: newArticle.title_en,
          title_fr: newArticle.title_fr,
          content_en: newArticle.content_en,
          content_fr: newArticle.content_fr
        })
        .eq('id', editingArticle.id);

      if (error) throw error;
      
      setShowArticleModal(false);
      setEditingArticle(null);
      if (selectedCategory) {
        loadArticles(selectedCategory);
      }
    } catch (err) {
      setError('Failed to update article');
      console.error(err);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }
    
    try {
      const { error } = await supabaseAdmin
        .from('law_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      
      if (selectedCategory) {
        loadArticles(selectedCategory);
      }
      loadCategories(); // Refresh stats
    } catch (err) {
      setError('Failed to delete article');
      console.error(err);
    }
  };

  const openCategoryModal = (category?: LawCategory) => {
    if (category) {
      setEditingCategory(category);
      setNewCategory({
        code: category.code,
        name_en: category.name_en,
        name_fr: category.name_fr,
        description_en: category.description_en || '',
        description_fr: category.description_fr || '',
        icon: category.icon || 'document-text',
        color: category.color || '#3B82F6',
        price: category.price,
        is_free: category.is_free
      });
    } else {
      setEditingCategory(null);
      setNewCategory({
        code: '',
        name_en: '',
        name_fr: '',
        description_en: '',
        description_fr: '',
        icon: 'document-text',
        color: '#3B82F6',
        price: 1000,
        is_free: false
      });
    }
    setShowCategoryModal(true);
  };

  const openArticleModal = (article?: LawArticle) => {
    if (article) {
      setEditingArticle(article);
      setNewArticle({
        category_id: article.category_id,
        article_id: article.article_id,
        title_en: article.title_en || '',
        title_fr: article.title_fr || '',
        content_en: article.content_en,
        content_fr: article.content_fr
      });
    } else {
      setEditingArticle(null);
      setNewArticle({
        category_id: selectedCategory || '',
        article_id: '',
        title_en: '',
        title_fr: '',
        content_en: '',
        content_fr: ''
      });
    }
    setShowArticleModal(true);
  };

  if (loading && categories.length === 0) {
    return <div className="laws-loading">Loading laws...</div>;
  }

  return (
    <div className="laws-container">
      <div className="laws-header">
        <h1>Laws Management</h1>
        <button 
          className="btn-primary"
          onClick={() => openCategoryModal()}
        >
          Add New Law Category
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="laws-content">
        {/* Categories Section */}
        <div className="laws-categories">
          <h2>Law Categories</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className={`category-card ${selectedCategory === category.code ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(category.code)}
              >
                <div className="category-header">
                  <div className="category-icon" style={{ color: category.color }}>
                    <i className={`fas fa-${category.icon}`}></i>
                  </div>
                  <div className="category-actions">
                    <button 
                      className="btn-icon"
                      onClick={(e) => { e.stopPropagation(); openCategoryModal(category); }}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-icon btn-danger"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <h3>{category.name_en}</h3>
                <p className="category-description">{category.description_en}</p>
                <div className="category-stats">
                  <span className="stat">
                    <i className="fas fa-file-text"></i> {category.active_articles || 0} articles
                  </span>
                  <span className="stat price">
                    {category.is_free ? 'FREE' : `${category.price} ${category.currency}`}
                  </span>
                </div>
                <div className="category-status">
                  <span className={`status ${category.is_active ? 'active' : 'inactive'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Articles Section */}
        {selectedCategory && (
          <div className="laws-articles">
            <div className="articles-header">
              <h2>
                Articles - {categories.find(c => c.code === selectedCategory)?.name_en}
              </h2>
              <button 
                className="btn-secondary"
                onClick={() => openArticleModal()}
              >
                Add New Article
              </button>
            </div>

            <div className="articles-list">
              {articles.map((article) => (
                <div key={article.id} className="article-card">
                  <div className="article-header">
                    <div className="article-info">
                      <span className="article-number">Article {article.article_id}</span>
                      <span className="article-version">v{article.version}</span>
                    </div>
                    <div className="article-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => openArticleModal(article)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => handleDeleteArticle(article.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="article-content">
                    <div className="article-title">
                      <strong>EN:</strong> {article.title_en || 'No title'}
                    </div>
                    <div className="article-title">
                      <strong>FR:</strong> {article.title_fr || 'Pas de titre'}
                    </div>
                    <div className="article-text">
                      <p>
                        <strong>EN:</strong> {article.content_en.substring(0, 200)}
                        {article.content_en.length > 200 && '...'}
                      </p>
                      <p>
                        <strong>FR:</strong> {article.content_fr.substring(0, 200)}
                        {article.content_fr.length > 200 && '...'}
                      </p>
                    </div>
                  </div>
                  <div className="article-footer">
                    <span className="article-date">
                      Updated: {new Date(article.updated_at).toLocaleDateString()}
                    </span>
                    <span className={`article-status ${article.is_active ? 'active' : 'inactive'}`}>
                      {article.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Law Category' : 'Add New Law Category'}</h2>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    value={newCategory.code}
                    onChange={(e) => setNewCategory({...newCategory, code: e.target.value})}
                    placeholder="e.g., civil_code"
                    disabled={!!editingCategory}
                  />
                </div>
                <div className="form-group">
                  <label>Icon</label>
                  <select
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>English Name *</label>
                  <input
                    type="text"
                    value={newCategory.name_en}
                    onChange={(e) => setNewCategory({...newCategory, name_en: e.target.value})}
                    placeholder="Civil Code"
                  />
                </div>
                <div className="form-group">
                  <label>French Name *</label>
                  <input
                    type="text"
                    value={newCategory.name_fr}
                    onChange={(e) => setNewCategory({...newCategory, name_fr: e.target.value})}
                    placeholder="Code Civil"
                  />
                </div>
                <div className="form-group">
                  <label>English Description</label>
                  <textarea
                    value={newCategory.description_en}
                    onChange={(e) => setNewCategory({...newCategory, description_en: e.target.value})}
                    placeholder="Description in English"
                  />
                </div>
                <div className="form-group">
                  <label>French Description</label>
                  <textarea
                    value={newCategory.description_fr}
                    onChange={(e) => setNewCategory({...newCategory, description_fr: e.target.value})}
                    placeholder="Description en français"
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Price (XAF)</label>
                  <input
                    type="number"
                    value={newCategory.price}
                    onChange={(e) => setNewCategory({...newCategory, price: parseInt(e.target.value)})}
                    disabled={newCategory.is_free}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newCategory.is_free}
                      onChange={(e) => setNewCategory({...newCategory, is_free: e.target.checked})}
                    />
                    Free Access
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
              >
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && (
        <div className="modal-overlay" onClick={() => setShowArticleModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingArticle ? 'Edit Article' : 'Add New Article'}</h2>
              <button className="modal-close" onClick={() => setShowArticleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Article ID *</label>
                  <input
                    type="text"
                    value={newArticle.article_id}
                    onChange={(e) => setNewArticle({...newArticle, article_id: e.target.value})}
                    placeholder="e.g., 1, 1-1, 2"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newArticle.category_id}
                    onChange={(e) => setNewArticle({...newArticle, category_id: e.target.value})}
                    disabled={!!editingArticle}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>English Title</label>
                  <input
                    type="text"
                    value={newArticle.title_en}
                    onChange={(e) => setNewArticle({...newArticle, title_en: e.target.value})}
                    placeholder="Article title in English"
                  />
                </div>
                <div className="form-group full-width">
                  <label>French Title</label>
                  <input
                    type="text"
                    value={newArticle.title_fr}
                    onChange={(e) => setNewArticle({...newArticle, title_fr: e.target.value})}
                    placeholder="Titre de l'article en français"
                  />
                </div>
                <div className="form-group full-width">
                  <label>English Content *</label>
                  <textarea
                    rows={8}
                    value={newArticle.content_en}
                    onChange={(e) => setNewArticle({...newArticle, content_en: e.target.value})}
                    placeholder="Article content in English"
                  />
                </div>
                <div className="form-group full-width">
                  <label>French Content *</label>
                  <textarea
                    rows={8}
                    value={newArticle.content_fr}
                    onChange={(e) => setNewArticle({...newArticle, content_fr: e.target.value})}
                    placeholder="Contenu de l'article en français"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowArticleModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={editingArticle ? handleUpdateArticle : handleCreateArticle}
              >
                {editingArticle ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Laws; 