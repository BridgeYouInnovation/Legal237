import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

const PaymentCancelled: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const transactionId = searchParams.get('transaction_id');

  const handleReturnToApp = () => {
    const deepLink = `legal237://payment/cancelled?transaction_id=${transactionId}`;
    window.location.href = deepLink;
    
    setTimeout(() => {
      alert('Please return to the Legal237 app to continue');
    }, 2000);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" sx={{ mb: 3 }}>
          <CancelIcon 
            sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} 
          />
          <Typography variant="h4" color="warning.main" gutterBottom>
            Payment Cancelled
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your payment has been cancelled. No charges were made.
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          You can retry the payment anytime to access your legal documents.
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

export default PaymentCancelled; 