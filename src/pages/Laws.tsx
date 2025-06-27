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

interface LegalArticle {
  id: string;
  article_id: string;
  title: string;
  book: string;
  law_type: string;
  language: string;
  text: string;
  created_at: string;
  updated_at?: string;
}

const Laws: React.FC = () => {
  const [articles, setArticles] = useState<LegalArticle[]>([]);
  const [availableLawTypes, setAvailableLawTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<LegalArticle | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [customLawType, setCustomLawType] = useState('');

  const [formData, setFormData] = useState({
    article_id: '',
    title: '',
    book: '',
    law_type: '',
    language: '',
    text: '',
  });

  useEffect(() => {
    fetchArticles();
    fetchAvailableLawTypes();
  }, []);

  const fetchArticles = async () => {
    try {
      console.log('Fetching articles...');
      
      const { data, error, count } = await supabaseAdmin
        .from('legal_articles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('Articles fetch result:', { data, error, count });

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }

      setArticles(data || []);
      console.log(`Successfully loaded ${data?.length || 0} articles`);
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      setError(`Failed to fetch articles: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableLawTypes = async () => {
    try {
      console.log('Fetching available law types...');
      const { data, error } = await supabaseAdmin
        .from('legal_articles')
        .select('law_type')
        .order('law_type');

      if (error) {
        console.error('Error fetching law types:', error);
        throw error;
      }

      console.log('Raw law types data:', data);

      // Extract unique law types
      const uniqueTypes = new Set(data?.map(item => item.law_type).filter(Boolean) || []);
      const types = Array.from(uniqueTypes);
      setAvailableLawTypes(types);
      console.log('Available law types:', types);
    } catch (error) {
      console.error('Error fetching law types:', error);
      setAvailableLawTypes(['penal_code', 'criminal_procedure']);
    }
  };

  const handleOpenDialog = (article?: LegalArticle) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        article_id: article.article_id,
        title: article.title,
        book: article.book,
        law_type: article.law_type,
        language: article.language,
        text: article.text,
      });
    } else {
      setEditingArticle(null);
      setFormData({
        article_id: '',
        title: '',
        book: '',
        law_type: '',
        language: '',
        text: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingArticle(null);
    setCustomLawType('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      // Validate required fields
      if (!formData.article_id.trim()) {
        setError('Article ID is required');
        return;
      }
      
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }
      
      if (!formData.text.trim()) {
        setError('Text content is required');
        return;
      }
      
      if (!formData.language) {
        setError('Language is required');
        return;
      }
      
      // Use custom law type if provided
      const lawTypeToUse = formData.law_type === 'custom' ? customLawType.trim() : formData.law_type;
      
      if (!lawTypeToUse) {
        setError('Please select or enter a law type');
        return;
      }

      const dataToSubmit = {
        article_id: formData.article_id.trim(),
        title: formData.title.trim(),
        book: formData.book.trim(),
        law_type: lawTypeToUse,
        language: formData.language,
        text: formData.text.trim(),
      };

      console.log('Submitting data:', dataToSubmit);
      
      if (editingArticle) {
        // Update existing article
        const { error } = await supabaseAdmin
          .from('legal_articles')
          .update(dataToSubmit)
          .eq('id', editingArticle.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        setSuccess('Article updated successfully');
      } else {
        // Create new article
        const { error } = await supabaseAdmin
          .from('legal_articles')
          .insert([dataToSubmit]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        setSuccess('Article created successfully');
      }

      fetchArticles();
      fetchAvailableLawTypes(); // Refresh law types in case a new one was added
      handleCloseDialog();
    } catch (error: any) {
      console.error('Submit error details:', error);
      setError(error.message || 'An error occurred while saving the article');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        const { error } = await supabaseAdmin
          .from('legal_articles')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setSuccess('Article deleted successfully');
        fetchArticles();
      } catch (error: any) {
        setError(error.message || 'Failed to delete article');
      }
    }
  };

  // Bulk import functionality
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(0);

    try {
      const fileContent = await file.text();
      let articlesData: any[] = [];

      if (file.name.endsWith('.json')) {
        articlesData = JSON.parse(fileContent);
      } else if (file.name.endsWith('.csv')) {
        articlesData = parseCSV(fileContent);
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }

      if (!Array.isArray(articlesData)) {
        throw new Error('File must contain an array of articles');
      }

      // Validate and process articles
      const validArticles = articlesData.map((article, index) => {
        if (!article.article_id || !article.title || !article.text || !article.law_type || !article.language) {
          throw new Error(`Article at index ${index} is missing required fields`);
        }

        return {
          article_id: String(article.article_id),
          title: String(article.title),
          book: String(article.book || ''),
          law_type: String(article.law_type),
          language: String(article.language),
          text: String(article.text),
        };
      });

      // Import in batches
      const batchSize = 50;
      for (let i = 0; i < validArticles.length; i += batchSize) {
        const batch = validArticles.slice(i, i + batchSize);
        
        const { error } = await supabaseAdmin
          .from('legal_articles')
          .insert(batch);

        if (error) throw error;

        setImportProgress(Math.round(((i + batch.length) / validArticles.length) * 100));
      }

      setSuccess(`Successfully imported ${validArticles.length} articles`);
      fetchArticles();
      setBulkImportOpen(false);
    } catch (error: any) {
      setError(error.message || 'Failed to import articles');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  // Parse CSV content
  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const articles = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const article: any = {};

      headers.forEach((header, index) => {
        article[header] = values[index] || '';
      });

      articles.push(article);
    }

    return articles;
  };

  // Export articles as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(articles, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `legal_articles_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'penal_code': return 'primary';
      case 'criminal_procedure': return 'secondary';
      default: return 'default';
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'en': return 'info';
      case 'fr': return 'success';
      default: return 'default';
    }
  };

  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      
      // Test basic connection first
      const { data: testData, error: testError } = await supabaseAdmin
        .from('legal_articles')
        .select('count')
        .limit(1);

      console.log('Connection test result:', { testData, testError });

      if (testError) {
        setError(`Connection test failed: ${testError.message}`);
        return;
      }

      // If connection works, try to fetch data
      const { data, error } = await supabaseAdmin
        .from('legal_articles')
        .select('id, article_id, title, law_type, language')
        .limit(5);

      console.log('Sample data fetch:', { data, error });

      if (error) {
        setError(`Data fetch failed: ${error.message}`);
      } else {
        setSuccess(`Connection successful! Found ${data?.length || 0} articles.`);
      }
    } catch (error: any) {
      console.error('Test connection error:', error);
      setError(`Test failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Laws Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setBulkImportOpen(true)}
          >
            Bulk Import
          </Button>
          <Button
            variant="outlined"
            onClick={testConnection}
            color="info"
          >
            Test Connection
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Law
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Article ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Book</TableCell>
              <TableCell>Law Type</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell>{article.article_id}</TableCell>
                <TableCell>{article.title}</TableCell>
                <TableCell>{article.book}</TableCell>
                <TableCell>
                  <Chip 
                    label={(article.law_type || 'unknown').replace('_', ' ').toUpperCase()}
                    color={getDocumentTypeColor(article.law_type || 'unknown') as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={(article.language || 'unknown').toUpperCase()}
                    color={getLanguageColor(article.language || 'unknown') as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(article)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(article.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingArticle ? 'Edit Law Article' : 'Add New Law Article'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Article ID"
              value={formData.article_id}
              onChange={(e) => setFormData({ ...formData, article_id: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Book"
              value={formData.book}
              onChange={(e) => setFormData({ ...formData, book: e.target.value })}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>Law Type</InputLabel>
              <Select
                value={formData.law_type}
                onChange={(e) => setFormData({ ...formData, law_type: e.target.value })}
                label="Law Type"
              >
                {availableLawTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</MenuItem>
                ))}
                <MenuItem value="custom">+ Add New Law Type</MenuItem>
              </Select>
            </FormControl>

            {formData.law_type === 'custom' && (
              <TextField
                label="New Law Type"
                value={customLawType}
                onChange={(e) => setCustomLawType(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                fullWidth
                required
                placeholder="e.g., civil_code, commercial_law"
                helperText="Use lowercase with underscores (e.g., civil_code)"
              />
            )}

            <FormControl fullWidth required>
              <InputLabel>Language</InputLabel>
              <Select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                label="Language"
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">French</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Text Content"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              fullWidth
              multiline
              rows={6}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingArticle ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportOpen} onClose={() => setBulkImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Import Articles</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a JSON or CSV file containing multiple law articles. The file should include the following fields:
              article_id, title, book, law_type, language, text
            </Typography>
            
            {importing && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Importing articles... {importProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={importProgress} />
              </Box>
            )}

            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              disabled={importing}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px dashed #ccc',
                borderRadius: '8px',
                cursor: importing ? 'not-allowed' : 'pointer',
                backgroundColor: importing ? '#f5f5f5' : 'transparent'
              }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>CSV Format:</strong> First row should contain headers: article_id,title,book,law_type,language,text<br/>
              <strong>JSON Format:</strong> Array of objects with the same field names
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkImportOpen(false)} disabled={importing}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Laws; 