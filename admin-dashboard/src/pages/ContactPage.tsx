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
  Alert,
  IconButton,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Gavel,
  Email,
  Phone,
  LocationOn,
  Language as LanguageIcon,
} from '@mui/icons-material';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (lang: 'en' | 'fr') => {
    setLanguage(lang);
    setAnchorEl(null);
  };

  const content = {
    en: {
      nav: {
        home: 'Home',
        contact: 'Contact',
        forLawyers: 'For Lawyers',
        privacy: 'Privacy',
      },
      title: 'Contact Us',
      subtitle: 'Get in touch with our team. We\'re here to help you with any questions about Legal237.',
      contactInfo: {
        email: {
          title: 'Email Us',
          value: 'support@legal237.com',
          description: 'Send us an email and we\'ll respond within 24 hours'
        },
        phone: {
          title: 'Call Us',
          value: '+237 682 310 407',
          description: 'Available Monday to Friday, 9 AM to 6 PM'
        },
        location: {
          title: 'Visit Us',
          value: 'Douala, Cameroon',
          description: 'Our headquarters in the economic capital'
        }
      },
      form: {
        title: 'Send us a Message',
        name: 'Full Name',
        email: 'Email Address',
        subject: 'Subject',
        message: 'Message',
        submit: 'Send Message',
        success: 'Thank you for your message! We\'ll get back to you soon.',
      }
    },
    fr: {
      nav: {
        home: 'Accueil',
        contact: 'Contact',
        forLawyers: 'Pour Avocats',
        privacy: 'Confidentialité',
      },
      title: 'Contactez-nous',
      subtitle: 'Entrez en contact avec notre équipe. Nous sommes là pour vous aider avec toutes vos questions sur Legal237.',
      contactInfo: {
        email: {
          title: 'Envoyez-nous un Email',
          value: 'support@legal237.com',
          description: 'Envoyez-nous un email et nous répondrons dans les 24 heures'
        },
        phone: {
          title: 'Appelez-nous',
          value: '+237 682 310 407',
          description: 'Disponible du lundi au vendredi, de 9h à 18h'
        },
        location: {
          title: 'Visitez-nous',
          value: 'Douala, Cameroun',
          description: 'Notre siège social dans la capitale économique'
        }
      },
      form: {
        title: 'Envoyez-nous un Message',
        name: 'Nom Complet',
        email: 'Adresse Email',
        subject: 'Sujet',
        message: 'Message',
        submit: 'Envoyer le Message',
        success: 'Merci pour votre message! Nous vous répondrons bientôt.',
      }
    }
  };

  const currentContent = content[language];

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Navigation */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                component="img"
                src="/app-icon.png"
                alt="Legal237"
                sx={{ 
                  height: 32, 
                  width: 32, 
                  mr: 2,
                  borderRadius: 1,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Gavel sx={{ color: '#2E7D32', mr: 1, fontSize: 32, display: 'none' }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#2E7D32', 
                  fontWeight: 800,
                  fontSize: '1.75rem',
                  letterSpacing: '-0.5px'
                }}
              >
                Legal237
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Link 
                href="/" 
                sx={{ 
                  color: '#666', 
                  textDecoration: 'none', 
                  fontWeight: 500,
                  fontSize: '1rem',
                  '&:hover': { color: '#2E7D32' }
                }}
              >
                {currentContent.nav.home}
              </Link>
              <Link 
                href="/contact" 
                sx={{ 
                  color: '#2E7D32', 
                  textDecoration: 'none', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  '&:hover': { color: '#1B5E20' }
                }}
              >
                {currentContent.nav.contact}
              </Link>
              <Link 
                href="/lawyer-application" 
                sx={{ 
                  color: '#666', 
                  textDecoration: 'none', 
                  fontWeight: 500,
                  fontSize: '1rem',
                  '&:hover': { color: '#2E7D32' }
                }}
              >
                {currentContent.nav.forLawyers}
              </Link>
              <Link 
                href="/privacy-policy" 
                sx={{ 
                  color: '#666', 
                  textDecoration: 'none', 
                  fontWeight: 500,
                  fontSize: '1rem',
                  '&:hover': { color: '#2E7D32' }
                }}
              >
                {currentContent.nav.privacy}
              </Link>
              
              {/* Language Switcher */}
              <IconButton
                onClick={handleLanguageClick}
                sx={{
                  bgcolor: alpha('#2E7D32', 0.1),
                  color: '#2E7D32',
                  '&:hover': { bgcolor: alpha('#2E7D32', 0.2) }
                }}
              >
                <LanguageIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleLanguageClose}
                sx={{ mt: 1 }}
              >
                <MenuItem 
                  onClick={() => handleLanguageSelect('en')}
                  selected={language === 'en'}
                >
                  🇺🇸 English
                </MenuItem>
                <MenuItem 
                  onClick={() => handleLanguageSelect('fr')}
                  selected={language === 'fr'}
                >
                  🇫🇷 Français
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Header */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%)',
          color: 'white', 
          py: 8,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontWeight: 900, 
                mb: 3, 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {currentContent.title}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                opacity: 0.95, 
                fontWeight: 400,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              {currentContent.subtitle}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8, mt: -4, position: 'relative', zIndex: 2 }}>
        {/* Contact Info Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 8, justifyContent: 'center' }}>
          <Card
            elevation={8}
            sx={{
              minWidth: 300,
              flex: '1 1 300px',
              maxWidth: 350,
              borderRadius: 4,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid rgba(46, 125, 50, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box 
                sx={{ 
                  mb: 3,
                  p: 2,
                  bgcolor: '#2E7D32',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Email sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2E7D32' }}>
                {currentContent.contactInfo.email.title}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {currentContent.contactInfo.email.value}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                {currentContent.contactInfo.email.description}
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={8}
            sx={{
              minWidth: 300,
              flex: '1 1 300px',
              maxWidth: 350,
              borderRadius: 4,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid rgba(46, 125, 50, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box 
                sx={{ 
                  mb: 3,
                  p: 2,
                  bgcolor: '#2E7D32',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Phone sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2E7D32' }}>
                {currentContent.contactInfo.phone.title}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {currentContent.contactInfo.phone.value}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                {currentContent.contactInfo.phone.description}
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={8}
            sx={{
              minWidth: 300,
              flex: '1 1 300px',
              maxWidth: 350,
              borderRadius: 4,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid rgba(46, 125, 50, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box 
                sx={{ 
                  mb: 3,
                  p: 2,
                  bgcolor: '#2E7D32',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocationOn sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2E7D32' }}>
                {currentContent.contactInfo.location.title}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {currentContent.contactInfo.location.value}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                {currentContent.contactInfo.location.description}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Contact Form */}
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Card elevation={8} sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                color: 'white',
                p: 4,
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {currentContent.form.title}
              </Typography>
            </Box>
            <CardContent sx={{ p: 6 }}>
              {submitted ? (
                <Alert 
                  severity="success" 
                  sx={{ 
                    fontSize: '1.1rem', 
                    textAlign: 'center',
                    '& .MuiAlert-message': { width: '100%' }
                  }}
                >
                  {currentContent.form.success}
                </Alert>
              ) : (
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label={currentContent.form.name}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      fullWidth
                      label={currentContent.form.email}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label={currentContent.form.subject}
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />
                  <TextField
                    fullWidth
                    label={currentContent.form.message}
                    multiline
                    rows={6}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    sx={{ mb: 4 }}
                  />
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      sx={{
                        bgcolor: '#2E7D32',
                        px: 6,
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(46, 125, 50, 0.3)',
                        '&:hover': {
                          bgcolor: '#1B5E20',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 40px rgba(46, 125, 50, 0.4)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {currentContent.form.submit}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
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