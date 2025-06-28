import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Link,
  Checkbox,
  FormControlLabel,
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
  CheckCircle,
  People,
  TrendingUp,
  Visibility,
  Language as LanguageIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
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
    specialization: '',
    experience: '',
    acceptTerms: false,
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
      hero: {
        title: 'Join Legal237 as a Lawyer',
        subtitle: 'Connect with clients across Cameroon and grow your practice with our platform',
        benefits: [
          'Free Professional Listing',
          'Direct Client Connections',
          'Practice Management Tools'
        ]
      },
      form: {
        title: 'Lawyer Application Form',
        subtitle: 'Please fill out the form below to apply for listing on our platform',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email Address',
        phone: 'Phone Number',
        barNumber: 'Bar Association Number',
        firmName: 'Law Firm Name (Optional)',
        city: 'City',
        specialization: 'Area of Specialization',
        experience: 'Years of Experience',
        acceptTerms: 'I accept the terms and conditions and agree to the professional standards of Legal237',
        submit: 'Submit Application',
        submitting: 'Submitting...',
        success: 'Thank you for your application! We will review your information and contact you within 3-5 business days.',
        error: 'Failed to submit application. Please try again.',
      },
      whyJoin: {
        title: 'Why Join Legal237?',
        subtitle: 'Expand your practice and reach more clients with our comprehensive platform',
        features: [
          {
            title: 'Increased Visibility',
            description: 'Get discovered by clients searching for legal services in your area of expertise.'
          },
          {
            title: 'Quality Clients',
            description: 'Connect with serious clients who are actively seeking legal representation.'
          },
          {
            title: 'Professional Growth',
            description: 'Access tools and resources to help you manage and grow your practice.'
          }
        ]
      }
    },
    fr: {
      nav: {
        home: 'Accueil',
        contact: 'Contact',
        forLawyers: 'Pour Avocats',
        privacy: 'Confidentialité',
      },
      hero: {
        title: 'Rejoignez Legal237 en tant qu\'Avocat',
        subtitle: 'Connectez-vous avec des clients à travers le Cameroun et développez votre cabinet avec notre plateforme',
        benefits: [
          'Inscription Professionnelle Gratuite',
          'Connexions Clients Directes',
          'Outils de Gestion de Cabinet'
        ]
      },
      form: {
        title: 'Formulaire de Candidature d\'Avocat',
        subtitle: 'Veuillez remplir le formulaire ci-dessous pour postuler à l\'inscription sur notre plateforme',
        firstName: 'Prénom',
        lastName: 'Nom de Famille',
        email: 'Adresse Email',
        phone: 'Numéro de Téléphone',
        barNumber: 'Numéro du Barreau',
        firmName: 'Nom du Cabinet (Optionnel)',
        city: 'Ville',
        specialization: 'Domaine de Spécialisation',
        experience: 'Années d\'Expérience',
        acceptTerms: 'J\'accepte les termes et conditions et j\'adhère aux normes professionnelles de Legal237',
        submit: 'Soumettre la Candidature',
        submitting: 'Soumission en cours...',
        success: 'Merci pour votre candidature! Nous examinerons vos informations et vous contacterons dans 3-5 jours ouvrables.',
        error: 'Échec de la soumission de la candidature. Veuillez réessayer.',
      },
      whyJoin: {
        title: 'Pourquoi Rejoindre Legal237?',
        subtitle: 'Développez votre cabinet et atteignez plus de clients avec notre plateforme complète',
        features: [
          {
            title: 'Visibilité Accrue',
            description: 'Soyez découvert par des clients recherchant des services juridiques dans votre domaine d\'expertise.'
          },
          {
            title: 'Clients de Qualité',
            description: 'Connectez-vous avec des clients sérieux qui recherchent activement une représentation juridique.'
          },
          {
            title: 'Croissance Professionnelle',
            description: 'Accédez aux outils et ressources pour vous aider à gérer et développer votre cabinet.'
          }
        ]
      }
    }
  };

  const currentContent = content[language];

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (field === 'acceptTerms') {
      setFormData({ ...formData, [field]: event.target.checked });
    } else {
      setFormData({ ...formData, [field]: event.target.value });
    }
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.acceptTerms) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'lawyer-application',
          data: formData
        })
      });

      if (response.ok) {
        setSubmitted(true);
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
    { label: currentContent.nav.contact, href: '/contact', active: false },
    { label: currentContent.nav.forLawyers, href: '/lawyer-application', active: true },
    { label: currentContent.nav.privacy, href: '/privacy-policy', active: false },
  ];

  const benefits = [
    { icon: <People sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.whyJoin.features[0] },
    { icon: <TrendingUp sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.whyJoin.features[1] },
    { icon: <Visibility sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.whyJoin.features[2] },
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

      {/* Hero Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%)',
          color: 'white', 
          py: { xs: 8, md: 12 },
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
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontWeight: 900, 
                mb: 3, 
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                px: { xs: 2, md: 0 }
              }}
            >
              {currentContent.hero.title}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4, 
                opacity: 0.95, 
                fontWeight: 400,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '1rem', md: '1.25rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              {currentContent.hero.subtitle}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 2, md: 3 }, 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              px: { xs: 2, md: 0 }
            }}>
              {currentContent.hero.benefits.map((benefit, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    px: { xs: 2, md: 3 },
                    py: 1.5,
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    minWidth: { xs: '100%', sm: 'auto' }
                  }}
                >
                  <CheckCircle sx={{ fontSize: 20 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Why Join Section */}
      <Box sx={{ bgcolor: 'white', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900, 
                mb: 3, 
                color: '#2E7D32',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              {currentContent.whyJoin.title}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#666', 
                fontWeight: 400,
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '1rem', md: '1.25rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              {currentContent.whyJoin.subtitle}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 4, 
            justifyContent: 'center',
            px: { xs: 2, md: 0 }
          }}>
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  minWidth: { xs: '100%', md: 350 },
                  flex: '1 1 350px',
                  maxWidth: { xs: '100%', md: 400 },
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: 'linear-gradient(145deg, #2E7D32 0%, #1B5E20 100%)',
                  color: 'white',
                  transition: 'all 0.4s ease',
                  '&:hover': {
                    transform: { xs: 'none', md: 'translateY(-12px) scale(1.02)' },
                    boxShadow: '0 25px 50px rgba(46, 125, 50, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box 
                    sx={{ 
                      mb: 3,
                      p: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.7, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                    {benefit.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Application Form */}
      <Container maxWidth="lg" sx={{ py: 8, mt: { xs: -2, md: -4 }, position: 'relative', zIndex: 2 }}>
        <Card elevation={8} sx={{ borderRadius: 4, overflow: 'hidden', mx: { xs: 2, md: 0 } }}>
          <Box 
            sx={{ 
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
              color: 'white',
              p: { xs: 4, md: 6 },
              textAlign: 'center'
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '1.75rem', md: '3rem' } }}>
              {currentContent.form.title}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, fontSize: { xs: '1rem', md: '1.25rem' } }}>
              {currentContent.form.subtitle}
            </Typography>
          </Box>
          
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            {submitted ? (
              <Box sx={{ textAlign: 'center', py: { xs: 6, md: 8 } }}>
                <CheckCircle sx={{ fontSize: { xs: 60, md: 80 }, color: '#2E7D32', mb: 3 }} />
                <Alert 
                  severity="success" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.2rem' }, 
                    mb: 4,
                    '& .MuiAlert-message': { width: '100%' }
                  }}
                >
                  {currentContent.form.success}
                </Alert>
                <Button
                  variant="outlined"
                  href="/"
                  sx={{
                    color: '#2E7D32',
                    borderColor: '#2E7D32',
                    px: 4,
                    py: 2,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    fontWeight: 600,
                  }}
                >
                  Return to Home
                </Button>
              </Box>
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
                    label={currentContent.form.firstName}
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    required
                    variant="outlined"
                    sx={{ flex: 1 }}
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label={currentContent.form.lastName}
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    required
                    variant="outlined"
                    sx={{ flex: 1 }}
                    disabled={loading}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
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
                  <TextField
                    fullWidth
                    label={currentContent.form.phone}
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    required
                    variant="outlined"
                    sx={{ flex: 1 }}
                    disabled={loading}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                  <TextField
                    fullWidth
                    label={currentContent.form.barNumber}
                    value={formData.barNumber}
                    onChange={handleChange('barNumber')}
                    required
                    variant="outlined"
                    sx={{ flex: 1 }}
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label={currentContent.form.firmName}
                    value={formData.firmName}
                    onChange={handleChange('firmName')}
                    variant="outlined"
                    sx={{ flex: 1 }}
                    disabled={loading}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                  <TextField
                    fullWidth
                    label={currentContent.form.city}
                    value={formData.city}
                    onChange={handleChange('city')}
                    required
                    variant="outlined"
                    sx={{ flex: 1 }}
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label={currentContent.form.experience}
                    type="number"
                    value={formData.experience}
                    onChange={handleChange('experience')}
                    required
                    variant="outlined"
                    sx={{ flex: 1 }}
                    disabled={loading}
                  />
                </Box>

                <TextField
                  fullWidth
                  label={currentContent.form.specialization}
                  value={formData.specialization}
                  onChange={handleChange('specialization')}
                  required
                  variant="outlined"
                  sx={{ mb: 4 }}
                  disabled={loading}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.acceptTerms}
                      onChange={handleChange('acceptTerms')}
                      required
                      sx={{ color: '#2E7D32' }}
                      disabled={loading}
                    />
                  }
                  label={
                    <Typography variant="body1" sx={{ color: '#666', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                      {currentContent.form.acceptTerms}
                    </Typography>
                  }
                  sx={{ mb: 4, alignItems: 'flex-start' }}
                />

                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={!formData.acceptTerms || loading}
                    sx={{
                      bgcolor: '#2E7D32',
                      px: { xs: 6, md: 8 },
                      py: 3,
                      fontSize: { xs: '1rem', md: '1.2rem' },
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
                        {currentContent.form.submitting}
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
      </Container>
    </Box>
  );
};

export default LawyerApplicationPage; 