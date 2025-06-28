import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  AppBar,
  Toolbar,
  Link,
  Paper,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Gavel,
  CheckCircle,
  Business,
  Send,
} from '@mui/icons-material';

const LawyerApplicationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    barNumber: '',
    firmName: '',
    city: '',
    acceptTerms: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Application submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
        <AppBar position="static" sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Container maxWidth="lg">
            <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Gavel sx={{ color: '#2E7D32', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 700 }}>
                  Legal237
                </Typography>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <CheckCircle sx={{ fontSize: 80, color: '#2E7D32', mb: 3 }} />
            <Typography variant="h3" sx={{ mb: 3, fontWeight: 700, color: '#2E7D32' }}>
              Application Submitted!
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, color: '#666' }}>
              Thank you for your interest in joining Legal237. We'll review your application and get back to you within 3-5 business days.
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/"
              sx={{ bgcolor: '#2E7D32', color: 'white', fontWeight: 600, px: 4, py: 1.5 }}
            >
              Return to Home
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Navigation */}
      <AppBar position="static" sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Gavel sx={{ color: '#2E7D32', mr: 1, fontSize: 28 }} />
              <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 700 }}>
                Legal237
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Link href="/" sx={{ color: '#666', textDecoration: 'none', fontWeight: 500 }}>
                Home
              </Link>
              <Link href="/contact" sx={{ color: '#666', textDecoration: 'none', fontWeight: 500 }}>
                Contact
              </Link>
              <Link href="/lawyer-application" sx={{ color: '#2E7D32', textDecoration: 'none', fontWeight: 500 }}>
                For Lawyers
              </Link>
              <Link href="/privacy-policy" sx={{ color: '#666', textDecoration: 'none', fontWeight: 500 }}>
                Privacy
              </Link>
              <Button
                variant="contained"
                href="/admin-dashboard"
                sx={{ bgcolor: '#2E7D32', color: 'white', fontWeight: 600 }}
              >
                Admin Login
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ bgcolor: '#2E7D32', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            Join Legal237
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 400, mb: 4 }}>
            Connect with clients across Cameroon and grow your legal practice
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', p: 3, textAlign: 'center' }}>
              <Business sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Expand Your Practice
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Connect with clients across Cameroon
              </Typography>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* Application Form */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#2E7D32' }}>
            Lawyer Application Form
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
            Please provide accurate information. All applications are verified with the Cameroon Bar Association.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Bar Number"
                name="barNumber"
                value={formData.barNumber}
                onChange={handleInputChange}
                required
                helperText="Your official bar registration number"
              />
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
            </Box>

            <TextField
              fullWidth
              label="Law Firm/Organization"
              name="firmName"
              value={formData.firmName}
              onChange={handleInputChange}
              required
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  required
                />
              }
              label="I agree to the Terms of Service and Privacy Policy. I confirm that all information provided is accurate and I am a licensed lawyer in Cameroon."
            />

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<Send />}
                disabled={!formData.acceptTerms}
                sx={{
                  bgcolor: '#2E7D32',
                  color: 'white',
                  fontWeight: 600,
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                }}
              >
                Submit Application
              </Button>
              <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
                We'll review your application within 3-5 business days
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Gavel sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Legal237
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2024 Legal237. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LawyerApplicationPage; 