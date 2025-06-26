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
  const [redirecting, setRedirecting] = useState(false);

  // Get transaction info from URL parameters
  const transactionId = searchParams.get('transaction_id') || searchParams.get('app_transaction_ref');
  const transactionRef = searchParams.get('transaction_ref');
  const status = searchParams.get('status');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const handlePaymentReturn = async () => {
      try {
        // If we have status and it's successful, try to redirect immediately
        if (status === 'successful' || status === 'completed') {
          setRedirecting(true);
          
          // Create payment data from URL parameters for immediate display
          const urlPaymentData = {
            transaction_id: transactionId,
            transaction_ref: transactionRef,
            status: status,
            amount: amount ? parseInt(amount) : null,
            currency: 'XAF'
          };
          
          setPaymentData(urlPaymentData);
          setLoading(false);
          
          // Attempt to redirect back to mobile app immediately
          setTimeout(() => {
            const deepLink = `legal237://payment/success?transaction_id=${transactionId}&status=${status}`;
            window.location.href = deepLink;
          }, 1000);
          
          return;
        }

        if (!transactionId) {
          // No transaction ID, but we might still be coming from a successful payment
          // Try to redirect back to the app anyway
          setError('Payment completed - returning to app');
          setLoading(false);
          
          setTimeout(() => {
            const deepLink = 'legal237://payment/success';
            window.location.href = deepLink;
          }, 2000);
          
          return;
        }

        // Try to verify payment with our backend
        const response = await fetch(`/.netlify/functions/api/payment/status/${transactionId}`);
        const data = await response.json();

        if (data.success) {
          setPaymentData(data);
          
          // If payment is successful, redirect to mobile app
          if (data.status === 'completed' || data.status === 'successful') {
            setRedirecting(true);
            setTimeout(() => {
              const deepLink = `legal237://payment/success?transaction_id=${transactionId}&status=${data.status}`;
              window.location.href = deepLink;
            }, 2000);
          }
        } else {
          setError(data.error || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Unable to verify payment status');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentReturn();
  }, [transactionId, transactionRef, status, amount]);

  const handleReturnToApp = () => {
    const deepLink = transactionId 
      ? `legal237://payment/success?transaction_id=${transactionId}`
      : 'legal237://dashboard';
    
    window.location.href = deepLink;
    
    // Fallback: show instructions after a delay
    setTimeout(() => {
      alert('If the app did not open automatically, please open Legal237 manually');
    }, 3000);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {redirecting ? 'Redirecting to Legal237 app...' : 'Verifying your payment...'}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error && !paymentData) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign="center">
            <CheckCircleIcon 
              sx={{ fontSize: 80, color: 'success.main', mb: 2 }} 
            />
            <Typography variant="h4" color="success.main" gutterBottom>
              Payment Successful!
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Your payment has been processed. You will be redirected to the Legal237 app automatically.
            </Alert>
            <Button 
              variant="contained" 
              onClick={handleReturnToApp}
              sx={{ mt: 2 }}
              size="large"
            >
              Return to Legal237 App
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
              {paymentData.transaction_id && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction ID:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {paymentData.transaction_id.slice(0, 12)}...
                  </Typography>
                </Box>
              )}
              {paymentData.amount && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Amount:
                  </Typography>
                  <Typography variant="body2">
                    {paymentData.amount.toLocaleString()} {paymentData.currency || 'XAF'}
                  </Typography>
                </Box>
              )}
              {paymentData.payment_method && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method:
                  </Typography>
                  <Typography variant="body2">
                    {paymentData.payment_method}
                  </Typography>
                </Box>
              )}
              {(transactionRef || paymentData.transaction_ref) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Reference:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {(transactionRef || paymentData.transaction_ref)?.slice(0, 12)}...
                  </Typography>
                </Box>
              )}
              {paymentData.document_type && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Document:
                  </Typography>
                  <Typography variant="body2">
                    {paymentData.document_type.replace('_', ' ').toUpperCase()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        <Alert severity="success" sx={{ mb: 3 }}>
          Your document access has been activated! You can now view the purchased legal document in your Legal237 mobile app.
        </Alert>

        {redirecting && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Redirecting to Legal237 app automatically...
          </Alert>
        )}

        <Box textAlign="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleReturnToApp}
            sx={{ mr: 2 }}
          >
            Return to Legal237 App
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