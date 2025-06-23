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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { supabaseAdmin } from '../lib/supabase';

interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  location: string;
  years_experience: number;
  bar_number: string;
  profile_image_url?: string;
  created_at: string;
}

const Lawyers: React.FC = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    location: '',
    years_experience: 0,
    bar_number: '',
    profile_image_url: '',
  });

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('lawyers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLawyers(data || []);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      setError('Failed to fetch lawyers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (lawyer?: Lawyer) => {
    if (lawyer) {
      setEditingLawyer(lawyer);
      setFormData({
        name: lawyer.name,
        email: lawyer.email,
        phone: lawyer.phone,
        specialization: lawyer.specialization,
        location: lawyer.location,
        years_experience: lawyer.years_experience,
        bar_number: lawyer.bar_number,
        profile_image_url: lawyer.profile_image_url || '',
      });
    } else {
      setEditingLawyer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        location: '',
        years_experience: 0,
        bar_number: '',
        profile_image_url: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLawyer(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (editingLawyer) {
        const { error } = await supabaseAdmin
          .from('lawyers')
          .update(formData)
          .eq('id', editingLawyer.id);

        if (error) throw error;
        setSuccess('Lawyer updated successfully');
      } else {
        const { error } = await supabaseAdmin
          .from('lawyers')
          .insert([formData]);

        if (error) throw error;
        setSuccess('Lawyer added successfully');
      }

      fetchLawyers();
      handleCloseDialog();
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lawyer?')) {
      try {
        const { error } = await supabaseAdmin
          .from('lawyers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setSuccess('Lawyer deleted successfully');
        fetchLawyers();
      } catch (error: any) {
        setError(error.message || 'Failed to delete lawyer');
      }
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
          Lawyers Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Lawyer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Profile</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lawyers.map((lawyer) => (
              <TableRow key={lawyer.id}>
                <TableCell>
                  <Avatar 
                    src={lawyer.profile_image_url} 
                    alt={lawyer.name}
                    sx={{ width: 40, height: 40 }}
                  >
                    {lawyer.name.charAt(0)}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {lawyer.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Bar #{lawyer.bar_number}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={lawyer.specialization} size="small" />
                </TableCell>
                <TableCell>{lawyer.location}</TableCell>
                <TableCell>{lawyer.years_experience} years</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="caption">{lawyer.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="caption">{lawyer.phone}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(lawyer)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(lawyer.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLawyer ? 'Edit Lawyer' : 'Add New Lawyer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Specialization"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Years of Experience"
              type="number"
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
              fullWidth
              required
            />
            
            <TextField
              label="Bar Number"
              value={formData.bar_number}
              onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Profile Image URL (Optional)"
              value={formData.profile_image_url}
              onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingLawyer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Lawyers; 