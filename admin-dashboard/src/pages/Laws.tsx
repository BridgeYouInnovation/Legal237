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
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { supabaseAdmin } from '../lib/supabase';

interface LawCategory {
  id: string;
  code: string;
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  article_prefix_en?: string;
  article_prefix_fr?: string;
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
  article_prefix_en: string;
  article_prefix_fr: string;
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
  const [tabValue, setTabValue] = useState(0);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'article'; id: string; name: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<LawCategory | null>(null);
  const [editingArticle, setEditingArticle] = useState<LawArticle | null>(null);
  
  // Form states
  const [newCategory, setNewCategory] = useState<NewCategoryForm>({
    code: '',
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    article_prefix_en: '',
    article_prefix_fr: '',
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
      resetCategoryForm();
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

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    setDeleteTarget({ type: 'category', id: categoryId, name: categoryName });
    setShowDeleteDialog(true);
  };

  const handleDeleteArticle = (articleId: string, articleName: string) => {
    setDeleteTarget({ type: 'article', id: articleId, name: articleName });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      if (deleteTarget.type === 'category') {
        const { error } = await supabaseAdmin
          .from('law_categories')
          .delete()
          .eq('id', deleteTarget.id);

        if (error) throw error;
        
        loadCategories();
        if (selectedCategory === deleteTarget.id) {
          setSelectedCategory(null);
          setArticles([]);
        }
      } else {
        const { error } = await supabaseAdmin
          .from('law_articles')
          .delete()
          .eq('id', deleteTarget.id);

        if (error) throw error;
        
        if (selectedCategory) {
          loadArticles(selectedCategory);
        }
        loadCategories();
      }
      
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err) {
      setError(`Failed to delete ${deleteTarget.type}`);
      console.error(err);
    }
  };

  const handleCreateArticle = async () => {
    try {
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
      resetArticleForm();
      if (selectedCategory) {
        loadArticles(selectedCategory);
      }
      loadCategories();
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

  const resetCategoryForm = () => {
    setNewCategory({
      code: '',
      name_en: '',
      name_fr: '',
      description_en: '',
      description_fr: '',
      article_prefix_en: '',
      article_prefix_fr: '',
      icon: 'document-text',
      color: '#3B82F6',
      price: 1000,
      is_free: false
    });
  };

  const resetArticleForm = () => {
    setNewArticle({
      category_id: '',
      article_id: '',
      title_en: '',
      title_fr: '',
      content_en: '',
      content_fr: ''
    });
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
        article_prefix_en: category.article_prefix_en || '',
        article_prefix_fr: category.article_prefix_fr || '',
        icon: category.icon || 'document-text',
        color: category.color || '#3B82F6',
        price: category.price,
        is_free: category.is_free
      });
    } else {
      setEditingCategory(null);
      resetCategoryForm();
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading laws...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Laws Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openCategoryModal()}
        >
          Add New Law Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Categories" />
        <Tab label="Articles" disabled={!selectedCategory} />
      </Tabs>

      {tabValue === 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {categories.map((category) => (
            <Card
              key={category.id}
              sx={{
                width: 300,
                cursor: 'pointer',
                border: selectedCategory === category.code ? 2 : 1,
                borderColor: selectedCategory === category.code ? 'primary.main' : 'divider',
              }}
              onClick={() => {
                setSelectedCategory(category.code);
                setTabValue(1);
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {category.name_en}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCategoryModal(category);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id, category.name_en);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {category.description_en}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={`${category.active_articles || 0} articles`}
                    size="small"
                    color="primary"
                  />
                  <Chip
                    label={category.is_free ? 'FREE' : `${category.price} ${category.currency}`}
                    size="small"
                    color={category.is_free ? 'success' : 'default'}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tabValue === 1 && selectedCategory && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              Articles - {categories.find(c => c.code === selectedCategory)?.name_en}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openArticleModal()}
            >
              Add New Article
            </Button>
          </Box>

          {articles.map((article) => (
            <Accordion key={article.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                  <Typography variant="h6">
                    Article {article.article_id}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openArticleModal(article);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArticle(article.id, `Article ${article.article_id}`);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {article.title_en && (
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {article.title_en}
                  </Typography>
                )}
                <Typography variant="body2" paragraph>
                  {article.content_en.substring(0, 300)}
                  {article.content_en.length > 300 && '...'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date(article.updated_at).toLocaleDateString()}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onClose={() => setShowCategoryModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Law Category' : 'Add New Law Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Code"
              value={newCategory.code}
              onChange={(e) => setNewCategory({...newCategory, code: e.target.value})}
              fullWidth
              disabled={!!editingCategory}
              helperText="e.g., civil_code"
            />
            <TextField
              label="English Name"
              value={newCategory.name_en}
              onChange={(e) => setNewCategory({...newCategory, name_en: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="French Name"
              value={newCategory.name_fr}
              onChange={(e) => setNewCategory({...newCategory, name_fr: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="English Description"
              value={newCategory.description_en}
              onChange={(e) => setNewCategory({...newCategory, description_en: e.target.value})}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="French Description"
              value={newCategory.description_fr}
              onChange={(e) => setNewCategory({...newCategory, description_fr: e.target.value})}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Article Prefix (English)"
              value={newCategory.article_prefix_en}
              onChange={(e) => setNewCategory({...newCategory, article_prefix_en: e.target.value})}
              fullWidth
              helperText="e.g., Article, Section, Chapter"
              placeholder="Article"
            />
            <TextField
              label="Article Prefix (French)"
              value={newCategory.article_prefix_fr}
              onChange={(e) => setNewCategory({...newCategory, article_prefix_fr: e.target.value})}
              fullWidth
              helperText="e.g., Article, Section, Chapitre"
              placeholder="Article"
            />
            <TextField
              label="Price (XAF)"
              type="number"
              value={newCategory.price}
              onChange={(e) => setNewCategory({...newCategory, price: parseInt(e.target.value)})}
              fullWidth
              disabled={newCategory.is_free}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newCategory.is_free}
                  onChange={(e) => setNewCategory({...newCategory, is_free: e.target.checked})}
                />
              }
              label="Free Access"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCategoryModal(false)}>Cancel</Button>
          <Button
            onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
            variant="contained"
          >
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Article Modal */}
      <Dialog open={showArticleModal} onClose={() => setShowArticleModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingArticle ? 'Edit Article' : 'Add New Article'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Article ID"
              value={newArticle.article_id}
              onChange={(e) => setNewArticle({...newArticle, article_id: e.target.value})}
              fullWidth
              required
              helperText="e.g., 1, 1-1, 2"
            />
            <FormControl fullWidth disabled={!!editingArticle}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newArticle.category_id}
                onChange={(e) => setNewArticle({...newArticle, category_id: e.target.value})}
                label="Category"
              >
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name_en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="English Title"
              value={newArticle.title_en}
              onChange={(e) => setNewArticle({...newArticle, title_en: e.target.value})}
              fullWidth
            />
            <TextField
              label="French Title"
              value={newArticle.title_fr}
              onChange={(e) => setNewArticle({...newArticle, title_fr: e.target.value})}
              fullWidth
            />
            <TextField
              label="English Content"
              value={newArticle.content_en}
              onChange={(e) => setNewArticle({...newArticle, content_en: e.target.value})}
              fullWidth
              multiline
              rows={8}
              required
            />
            <TextField
              label="French Content"
              value={newArticle.content_fr}
              onChange={(e) => setNewArticle({...newArticle, content_fr: e.target.value})}
              fullWidth
              multiline
              rows={8}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowArticleModal(false)}>Cancel</Button>
          <Button
            onClick={editingArticle ? handleUpdateArticle : handleCreateArticle}
            variant="contained"
          >
            {editingArticle ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deleteTarget?.name}?
            {deleteTarget?.type === 'category' && ' This will also delete all articles in this category.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Laws; 