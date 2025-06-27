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
import ErrorIcon from '@mui/icons-material/Error';

const PaymentFailed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const transactionId = searchParams.get('transaction_id');
  const error = searchParams.get('error');

  const handleReturnToApp = () => {
    const deepLink = `legal237://payment/failed?transaction_id=${transactionId}&error=${encodeURIComponent(error || '')}`;
    window.location.href = deepLink;
    
    setTimeout(() => {
      alert('Please return to the Legal237 app to continue');
    }, 2000);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" sx={{ mb: 3 }}>
          <ErrorIcon 
            sx={{ fontSize: 80, color: 'error.main', mb: 2 }} 
          />
          <Typography variant="h4" color="error.main" gutterBottom>
            Payment Failed
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Unfortunately, your payment could not be processed.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Error:</strong> {error}
            </Typography>
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          Please check your payment details and try again. If the problem persists, contact customer support.
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

export default PaymentFailed; 