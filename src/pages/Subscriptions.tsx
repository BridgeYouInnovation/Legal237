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
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { supabaseAdmin } from '../lib/supabase';

interface PaymentRecord {
  id: string;
  user_id: string;
  document_type: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  user_email?: string;
  user_phone?: string;
}

const Subscriptions: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, searchQuery, statusFilter, documentFilter]);

  const fetchPayments = async () => {
    try {
      // Fetch payment records without trying to join auth.users directly
      const { data: paymentData, error: paymentError } = await supabaseAdmin
        .from('payment_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentError) throw paymentError;

      // For each payment record, fetch user info separately if user_id exists
      const transformedPayments = await Promise.all(
        (paymentData || []).map(async (payment) => {
          let userEmail = null;
          let userPhone = null;

          if (payment.user_id) {
            try {
              // Fetch user info from auth.users using admin API
              const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(payment.user_id);
              
              if (!userError && userData.user) {
                userEmail = userData.user.email;
                userPhone = userData.user.phone;
              }
            } catch (error) {
              console.log('Could not fetch user data for user_id:', payment.user_id);
            }
          }

          return {
            ...payment,
            user_email: userEmail,
            user_phone: userPhone,
          };
        })
      );

      setPayments(transformedPayments);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(payment => 
        payment.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.user_phone?.includes(searchQuery) ||
        payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Apply document type filter
    if (documentFilter !== 'all') {
      filtered = filtered.filter(payment => payment.document_type === documentFilter);
    }

    setFilteredPayments(filtered);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'penal_code':
        return 'Penal Code';
      case 'criminal_procedure':
        return 'Criminal Procedure';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const totalRevenue = payments
    .filter(p => p.status === 'completed' || p.status === 'success')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscriptions & Payments
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by user, transaction ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Document</InputLabel>
          <Select
            value={documentFilter}
            onChange={(e) => setDocumentFilter(e.target.value)}
            label="Document"
          >
            <MenuItem value="all">All Documents</MenuItem>
            <MenuItem value="penal_code">Penal Code</MenuItem>
            <MenuItem value="criminal_procedure">Criminal Procedure</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="primary">
            {payments.length}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Transactions
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="success.main">
            {totalRevenue.toLocaleString()} XAF
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Revenue
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" color="info.main">
            {payments.filter(p => p.status === 'completed' || p.status === 'success').length}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Successful Payments
          </Typography>
        </Paper>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {payment.user_email || payment.user_phone || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {payment.user_id.slice(0, 8)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getDocumentTypeLabel(payment.document_type)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PaymentIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {payment.amount.toLocaleString()} {payment.currency}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={payment.status.toUpperCase()}
                      color={getStatusColor(payment.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payment.payment_method || 'Mobile Money'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {payment.transaction_id || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(payment.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredPayments.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchQuery || statusFilter !== 'all' || documentFilter !== 'all' 
                ? 'No payments match your filter criteria' 
                : 'No payment records found'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Subscriptions; 