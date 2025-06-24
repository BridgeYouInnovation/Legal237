import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const transactionId = searchParams.get('transaction_id');
  const reference = searchParams.get('reference');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!transactionId) {
        setError('No transaction ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payment/status/${transactionId}`);
        const data = await response.json();

        if (data.success) {
          setPaymentData(data);
        } else {
          setError(data.error || 'Payment verification failed');
        }
      } catch (err) {
        setError('Failed to verify payment status');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [transactionId]);

  const handleReturnToApp = () => {
    // Try to redirect back to mobile app
    const deepLink = `legal237://payment/success?transaction_id=${transactionId}`;
    window.location.href = deepLink;
    
    // Fallback: show instructions after a delay
    setTimeout(() => {
      alert('Please return to the Legal237 app to continue');
    }, 2000);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verifying your payment...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box textAlign="center">
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Return to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" sx={{ mb: 3 }}>
          <CheckCircleIcon 
            sx={{ fontSize: 80, color: 'success.main', mb: 2 }} 
          />
          <Typography variant="h4" color="success.main" gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your payment has been processed successfully.
          </Typography>
        </Box>

        {paymentData && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Transaction ID:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {paymentData.transaction_id?.slice(0, 8)}...
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Amount:
                </Typography>
                <Typography variant="body2">
                  {paymentData.amount?.toLocaleString()} {paymentData.currency}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Method:
                </Typography>
                <Typography variant="body2">
                  {paymentData.payment_method}
                </Typography>
              </Box>
              {reference && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Reference:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {reference}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Document:
                </Typography>
                <Typography variant="body2">
                  {paymentData.document_type?.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          Your document access has been activated. You can now view the purchased legal document in your Legal237 mobile app.
        </Alert>

        <Box textAlign="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleReturnToApp}
            sx={{ mr: 2 }}
          >
            Return to App
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentSuccess; 