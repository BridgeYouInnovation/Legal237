import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Avatar,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { supabaseAdmin } from '../lib/supabase';

interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedUsers = data.users.map(user => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at,
      }));

      setUsers(transformedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (user: User) => {
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    } else if (user.phone) {
      return 'P';
    }
    return 'U';
  };

  const getVerificationStatus = (user: User) => {
    if (user.email && user.email_confirmed_at) {
      return { label: 'Email Verified', color: 'success' as const };
    } else if (user.phone && user.phone_confirmed_at) {
      return { label: 'Phone Verified', color: 'success' as const };
    } else {
      return { label: 'Unverified', color: 'warning' as const };
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
      <Typography variant="h4" component="h1" gutterBottom>
        Users Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search users by email, phone, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Total Users: {users.length}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Showing {filteredUsers.length} users
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Last Sign In</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => {
                const status = getVerificationStatus(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                          {getInitials(user)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {user.email || user.phone || 'Anonymous User'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {user.id.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {user.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="caption">{user.email}</Typography>
                          </Box>
                        )}
                        {user.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="caption">{user.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.last_sign_in_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredUsers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchQuery ? 'No users match your search criteria' : 'No users found'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Users; 