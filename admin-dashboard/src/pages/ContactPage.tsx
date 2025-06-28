import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Link,
  Paper,
  Alert,
} from '@mui/material';
import {
  Gavel,
  Email,
  Phone,
  LocationOn,
  Send,
} from '@mui/icons-material';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

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
              <Link href="/contact" sx={{ color: '#2E7D32', textDecoration: 'none', fontWeight: 500 }}>
                Contact
              </Link>
              <Link href="/lawyer-application" sx={{ color: '#666', textDecoration: 'none', fontWeight: 500 }}>
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
            Contact Us
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Have questions? We're here to help you navigate Cameroon's legal landscape.
          </Typography>
        </Container>
      </Box>

      {/* Contact Content */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6 }}>
          {/* Contact Information */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: '#2E7D32' }}>
              Get in Touch
            </Typography>
            
            <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Email sx={{ color: '#2E7D32', mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    support@legal237.com
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Phone sx={{ color: '#2E7D32', mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Phone
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    +237 XXX XXX XXX
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <LocationOn sx={{ color: '#2E7D32', mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Location
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    Yaoundé, Cameroon
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Contact Form */}
          <Box sx={{ flex: 2 }}>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#2E7D32' }}>
                Send us a Message
              </Typography>
              
              {submitted && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Thank you for your message! We'll get back to you within 24 hours.
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  multiline
                  rows={6}
                  variant="outlined"
                  placeholder="Tell us how we can help you..."
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Send />}
                  sx={{
                    bgcolor: '#2E7D32',
                    color: 'white',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    alignSelf: 'flex-start',
                  }}
                >
                  Send Message
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
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

export default ContactPage; 