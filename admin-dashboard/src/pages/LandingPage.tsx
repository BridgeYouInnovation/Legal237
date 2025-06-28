import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Link,
  Paper,
  Chip,
} from '@mui/material';
import {
  PhoneAndroid,
  Gavel,
  MenuBook,
  Search,
  Star,
  Apple,
  Android,
  Language,
  Security,
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <MenuBook sx={{ fontSize: 40, color: '#2E7D32' }} />,
      title: 'Comprehensive Legal Library',
      description: 'Access all Cameroonian laws including Penal Code, Criminal Procedure, Civil Code, Labor Code, Commercial Code, and Family Code.',
    },
    {
      icon: <Search sx={{ fontSize: 40, color: '#2E7D32' }} />,
      title: 'Smart Search',
      description: 'Find specific articles, laws, and legal procedures instantly with our advanced search functionality.',
    },
    {
      icon: <Gavel sx={{ fontSize: 40, color: '#2E7D32' }} />,
      title: 'Find Qualified Lawyers',
      description: 'Connect with verified lawyers near you. Browse profiles, specializations, and contact information.',
    },
    {
      icon: <Language sx={{ fontSize: 40, color: '#2E7D32' }} />,
      title: 'Bilingual Support',
      description: 'Access all content in both English and French, reflecting Cameroons bilingual nature.',
    },
    {
      icon: <PhoneAndroid sx={{ fontSize: 40, color: '#2E7D32' }} />,
      title: 'Mobile First',
      description: 'Designed for mobile use with offline access to your purchased legal documents.',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: '#2E7D32' }} />,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade security and reliable cloud infrastructure.',
    },
  ];

  const stats = [
    { number: '6+', label: 'Legal Codes' },
    { number: '1000+', label: 'Articles' },
    { number: '100+', label: 'Lawyers' },
    { number: '5000+', label: 'Users' },
  ];

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
              <Link href="/" sx={{ color: '#2E7D32', textDecoration: 'none', fontWeight: 500 }}>
                Home
              </Link>
              <Link href="/contact" sx={{ color: '#666', textDecoration: 'none', fontWeight: 500 }}>
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
      <Box sx={{ bgcolor: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                Cameroon's Premier Legal App
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}>
                Access all Cameroonian laws, find qualified lawyers, and get legal guidance - all in one app.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Apple />}
                  sx={{ bgcolor: 'white', color: '#2E7D32', fontWeight: 600, px: 4, py: 1.5 }}
                >
                  Download for iOS
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Android />}
                  sx={{ borderColor: 'white', color: 'white', fontWeight: 600, px: 4, py: 1.5 }}
                >
                  Download for Android
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} sx={{ color: '#FFD700', fontSize: 20 }} />
                  ))}
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  4.8/5 stars from 2,000+ users
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <PhoneAndroid sx={{ fontSize: 300, opacity: 0.8 }} />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={2}
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: 'white',
                minWidth: 200,
                flex: '1 1 200px',
              }}
            >
              <Typography variant="h3" sx={{ color: '#2E7D32', fontWeight: 700, mb: 1 }}>
                {stat.number}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                {stat.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 2, fontWeight: 700, color: '#2E7D32' }}>
            Why Choose Legal237?
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 6, color: '#666', fontWeight: 400 }}>
            Everything you need for legal research and professional connections in Cameroon
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 4, 
            justifyContent: 'center' 
          }}>
            {features.map((feature, index) => (
              <Card
                key={index}
                elevation={2}
                sx={{
                  minWidth: 300,
                  flex: '1 1 300px',
                  maxWidth: 400,
                  borderRadius: 3,
                  p: 2,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Lawyer CTA Section */}
      <Box sx={{ bgcolor: '#2E7D32', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center' }}>
            <Box sx={{ flex: 2 }}>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                Are you a lawyer?
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, fontWeight: 400 }}>
                Join our platform and connect with clients across Cameroon. Increase your visibility and grow your practice.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label="Free Listing" sx={{ bgcolor: 'white', color: '#2E7D32' }} />
                <Chip label="Client Connections" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                <Chip label="Practice Management" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </Box>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                href="/lawyer-application"
                sx={{
                  bgcolor: 'white',
                  color: '#2E7D32',
                  fontWeight: 600,
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                }}
              >
                Apply Now
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Gavel sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Legal237
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                Your trusted companion for navigating Cameroonian law. Access comprehensive legal resources and connect with qualified professionals.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href="/" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Home</Link>
                <Link href="/contact" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Contact Us</Link>
                <Link href="/lawyer-application" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>For Lawyers</Link>
                <Link href="/privacy-policy" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Privacy Policy</Link>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Contact Info
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                Email: support@legal237.com
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                Phone: +237 XXX XXX XXX
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Yaoundé, Cameroon
              </Typography>
            </Box>
          </Box>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', mt: 4, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2024 Legal237. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 