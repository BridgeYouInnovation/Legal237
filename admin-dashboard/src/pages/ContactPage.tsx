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
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Gavel,
  Email,
  Phone,
  LocationOn,
  Language as LanguageIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
        sending: 'Sending...',
        success: 'Thank you for your message! We\'ll get back to you soon.',
        error: 'Failed to send message. Please try again.',
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
        sending: 'Envoi en cours...',
        success: 'Merci pour votre message! Nous vous répondrons bientôt.',
        error: 'Échec de l\'envoi du message. Veuillez réessayer.',
      }
    }
  };

  const currentContent = content[language];

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'contact',
          data: formData
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || currentContent.form.error);
      }
    } catch (err) {
      setError(currentContent.form.error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { label: currentContent.nav.home, href: '/', active: false },
    { label: currentContent.nav.contact, href: '/contact', active: true },
    { label: currentContent.nav.forLawyers, href: '/lawyer-application', active: false },
    { label: currentContent.nav.privacy, href: '/privacy-policy', active: false },
  ];

  const MobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          bgcolor: '#f8fafc',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 700 }}>
          Menu
        </Typography>
        <IconButton onClick={handleMobileMenuToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.href}>
            <Link
              href={item.href}
              sx={{
                color: item.active ? '#2E7D32' : '#666',
                textDecoration: 'none',
                fontWeight: item.active ? 600 : 500,
                width: '100%',
                py: 1,
                '&:hover': { color: '#2E7D32' }
              }}
              onClick={handleMobileMenuToggle}
            >
              <ListItemText primary={item.label} />
            </Link>
          </ListItem>
        ))}
        <ListItem>
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
        </ListItem>
      </List>
    </Drawer>
  );

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

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {navigationItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    sx={{ 
                      color: item.active ? '#2E7D32' : '#666', 
                      textDecoration: 'none', 
                      fontWeight: item.active ? 600 : 500,
                      fontSize: '1rem',
                      '&:hover': { color: '#2E7D32' }
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
                
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
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                onClick={handleMobileMenuToggle}
                sx={{ color: '#2E7D32' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Menu */}
      <MobileMenu />

      {/* Language Menu for Mobile */}
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

      {/* Header */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%)',
          color: 'white', 
          py: { xs: 6, md: 8 },
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
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
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
                lineHeight: 1.6,
                fontSize: { xs: '1rem', md: '1.25rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              {currentContent.subtitle}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, mt: { xs: -2, md: -4 }, position: 'relative', zIndex: 2 }}>
        {/* Contact Info Cards */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 3, md: 4 }, 
          mb: { xs: 6, md: 8 }, 
          justifyContent: 'center' 
        }}>
          <Card
            elevation={8}
            sx={{
              minWidth: { xs: '100%', md: 300 },
              flex: '1 1 300px',
              maxWidth: { xs: '100%', md: 350 },
              borderRadius: 4,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid rgba(46, 125, 50, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: { xs: 'none', md: 'translateY(-8px)' },
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
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
                <Email sx={{ fontSize: { xs: 28, md: 32 }, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2E7D32', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                {currentContent.contactInfo.email.title}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {currentContent.contactInfo.email.value}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6, fontSize: { xs: '0.875rem', md: '1rem' } }}>
                {currentContent.contactInfo.email.description}
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={8}
            sx={{
              minWidth: { xs: '100%', md: 300 },
              flex: '1 1 300px',
              maxWidth: { xs: '100%', md: 350 },
              borderRadius: 4,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid rgba(46, 125, 50, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: { xs: 'none', md: 'translateY(-8px)' },
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
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
                <Phone sx={{ fontSize: { xs: 28, md: 32 }, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2E7D32', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                {currentContent.contactInfo.phone.title}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {currentContent.contactInfo.phone.value}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6, fontSize: { xs: '0.875rem', md: '1rem' } }}>
                {currentContent.contactInfo.phone.description}
              </Typography>
            </CardContent>
          </Card>

          <Card
            elevation={8}
            sx={{
              minWidth: { xs: '100%', md: 300 },
              flex: '1 1 300px',
              maxWidth: { xs: '100%', md: 350 },
              borderRadius: 4,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid rgba(46, 125, 50, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: { xs: 'none', md: 'translateY(-8px)' },
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
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
                <LocationOn sx={{ fontSize: { xs: 28, md: 32 }, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2E7D32', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                {currentContent.contactInfo.location.title}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {currentContent.contactInfo.location.value}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6, fontSize: { xs: '0.875rem', md: '1rem' } }}>
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
                p: { xs: 3, md: 4 },
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {currentContent.form.title}
              </Typography>
            </Box>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
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
                <Box component="form" onSubmit={handleSubmit}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                    <TextField
                      fullWidth
                      label={currentContent.form.name}
                      value={formData.name}
                      onChange={handleChange('name')}
                      required
                      variant="outlined"
                      sx={{ flex: 1 }}
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label={currentContent.form.email}
                      type="email"
                      value={formData.email}
                      onChange={handleChange('email')}
                      required
                      variant="outlined"
                      sx={{ flex: 1 }}
                      disabled={loading}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label={currentContent.form.subject}
                    value={formData.subject}
                    onChange={handleChange('subject')}
                    required
                    variant="outlined"
                    sx={{ mb: 3 }}
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label={currentContent.form.message}
                    multiline
                    rows={6}
                    value={formData.message}
                    onChange={handleChange('message')}
                    required
                    variant="outlined"
                    sx={{ mb: 4 }}
                    disabled={loading}
                  />
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        bgcolor: '#2E7D32',
                        px: { xs: 4, md: 6 },
                        py: 2,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        fontWeight: 700,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(46, 125, 50, 0.3)',
                        '&:hover': {
                          bgcolor: '#1B5E20',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 40px rgba(46, 125, 50, 0.4)',
                        },
                        '&:disabled': {
                          bgcolor: '#ccc',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                          {currentContent.form.sending}
                        </>
                      ) : (
                        currentContent.form.submit
                      )}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactPage; 