import React, { useState } from 'react';
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
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PhoneAndroid,
  Gavel,
  MenuBook,
  Search,
  Star,
  Apple,
  Android,
  Language as LanguageIcon,
  Security,
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowForward,
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
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
        title: "Cameroon's Premier Legal App",
        subtitle: "Access all Cameroonian laws, find qualified lawyers, and get legal guidance - all in one app.",
        downloadIos: 'Download for iOS',
        downloadAndroid: 'Download for Android',
        rating: '4.8/5 stars from 2,000+ users',
        learnMore: 'Learn More',
      },
      stats: {
        legalCodes: 'Legal Codes',
        articles: 'Articles', 
        lawyers: 'Lawyers',
        users: 'Users',
      },
      features: {
        title: 'Why Choose Legal237?',
        subtitle: 'Everything you need for legal research and professional connections in Cameroon',
        items: [
          {
            title: 'Comprehensive Legal Library',
            description: 'Access all Cameroonian laws including Penal Code, Criminal Procedure, Civil Code, Labor Code, Commercial Code, and Family Code.',
          },
          {
            title: 'Smart Search',
            description: 'Find specific articles, laws, and legal procedures instantly with our advanced search functionality.',
          },
          {
            title: 'Find Qualified Lawyers',
            description: 'Connect with verified lawyers near you. Browse profiles, specializations, and contact information.',
          },
          {
            title: 'Bilingual Support',
            description: 'Access all content in both English and French, reflecting Cameroon\'s bilingual nature.',
          },
          {
            title: 'Mobile First',
            description: 'Designed for mobile use with offline access to your purchased legal documents.',
          },
          {
            title: 'Secure & Reliable',
            description: 'Your data is protected with enterprise-grade security and reliable cloud infrastructure.',
          },
        ]
      },
      lawyerCta: {
        title: 'Are you a lawyer?',
        subtitle: 'Join our platform and connect with clients across Cameroon. Increase your visibility and grow your practice.',
        features: ['Free Listing', 'Client Connections', 'Practice Management'],
        button: 'Apply Now',
      },
      footer: {
        description: 'Your trusted companion for navigating Cameroonian law. Access comprehensive legal resources and connect with qualified professionals.',
        quickLinks: 'Quick Links',
        contactInfo: 'Contact Info',
        email: 'Email: support@legal237.com',
        phone: 'Phone: +237 682 310 407',
        address: 'Douala, Cameroon',
        copyright: '© 2025 Legal237. All rights reserved.',
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
        title: "L'Application Juridique Premier du Cameroun",
        subtitle: "Accédez à toutes les lois camerounaises, trouvez des avocats qualifiés et obtenez des conseils juridiques - le tout dans une seule application.",
        downloadIos: 'Télécharger pour iOS',
        downloadAndroid: 'Télécharger pour Android',
        rating: '4.8/5 étoiles de 2 000+ utilisateurs',
        learnMore: 'En Savoir Plus',
      },
      stats: {
        legalCodes: 'Codes Juridiques',
        articles: 'Articles',
        lawyers: 'Avocats',
        users: 'Utilisateurs',
      },
      features: {
        title: 'Pourquoi Choisir Legal237?',
        subtitle: 'Tout ce dont vous avez besoin pour la recherche juridique et les connexions professionnelles au Cameroun',
        items: [
          {
            title: 'Bibliothèque Juridique Complète',
            description: 'Accédez à toutes les lois camerounaises y compris le Code Pénal, la Procédure Pénale, le Code Civil, le Code du Travail, le Code Commercial et le Code de la Famille.',
          },
          {
            title: 'Recherche Intelligente',
            description: 'Trouvez instantanément des articles, lois et procédures juridiques spécifiques avec notre fonctionnalité de recherche avancée.',
          },
          {
            title: 'Trouvez des Avocats Qualifiés',
            description: 'Connectez-vous avec des avocats vérifiés près de chez vous. Parcourez les profils, spécialisations et informations de contact.',
          },
          {
            title: 'Support Bilingue',
            description: 'Accédez à tout le contenu en anglais et en français, reflétant la nature bilingue du Cameroun.',
          },
          {
            title: 'Mobile d\'Abord',
            description: 'Conçu pour une utilisation mobile avec accès hors ligne à vos documents juridiques achetés.',
          },
          {
            title: 'Sécurisé et Fiable',
            description: 'Vos données sont protégées par une sécurité de niveau entreprise et une infrastructure cloud fiable.',
          },
        ]
      },
      lawyerCta: {
        title: 'Êtes-vous avocat?',
        subtitle: 'Rejoignez notre plateforme et connectez-vous avec des clients à travers le Cameroun. Augmentez votre visibilité et développez votre pratique.',
        features: ['Inscription Gratuite', 'Connexions Clients', 'Gestion de Cabinet'],
        button: 'Postuler Maintenant',
      },
      footer: {
        description: 'Votre compagnon de confiance pour naviguer dans le droit camerounais. Accédez à des ressources juridiques complètes et connectez-vous avec des professionnels qualifiés.',
        quickLinks: 'Liens Rapides',
        contactInfo: 'Informations de Contact',
        email: 'Email: support@legal237.com',
        phone: 'Téléphone: +237 682 310 407',
        address: 'Douala, Cameroun',
        copyright: '© 2025 Legal237. Tous droits réservés.',
      }
    }
  };

  const currentContent = content[language];

  const navigationItems = [
    { label: currentContent.nav.home, href: '/', active: true },
    { label: currentContent.nav.contact, href: '/contact', active: false },
    { label: currentContent.nav.forLawyers, href: '/lawyer-application', active: false },
    { label: currentContent.nav.privacy, href: '/privacy-policy', active: false },
  ];

  const features = [
    { icon: <MenuBook sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.features.items[0] },
    { icon: <Search sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.features.items[1] },
    { icon: <Gavel sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.features.items[2] },
    { icon: <LanguageIcon sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.features.items[3] },
    { icon: <PhoneAndroid sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.features.items[4] },
    { icon: <Security sx={{ fontSize: 48, color: '#fff' }} />, ...currentContent.features.items[5] },
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

  const stats = [
    { number: '6+', label: currentContent.stats.legalCodes },
    { number: '1000+', label: currentContent.stats.articles },
    { number: '100+', label: currentContent.stats.lawyers },
    { number: '5000+', label: currentContent.stats.users },
  ];

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
                  // Fallback to gavel icon if image doesn't load
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
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'center' }}>
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontWeight: 900, 
                  mb: 3, 
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                  lineHeight: 1.1,
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  background: 'linear-gradient(45deg, #fff 30%, #e8f5e8 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
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
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  lineHeight: 1.6,
                  maxWidth: '600px',
                  mx: { xs: 'auto', md: 0 }
                }}
              >
                {currentContent.hero.subtitle}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Apple />}
                  sx={{ 
                    bgcolor: 'white', 
                    color: '#2E7D32', 
                    fontWeight: 700, 
                    px: 4, 
                    py: 2,
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    '&:hover': { 
                      bgcolor: '#f8f9fa',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {currentContent.hero.downloadIos}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Android />}
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white', 
                    fontWeight: 700, 
                    px: 4, 
                    py: 2,
                    borderRadius: 3,
                    borderWidth: 2,
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {currentContent.hero.downloadAndroid}
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Box sx={{ display: 'flex' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} sx={{ color: '#FFD700', fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                  ))}
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  {currentContent.hero.rating}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '120%',
                    height: '120%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 3s ease-in-out infinite',
                  },
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.5, transform: 'translate(-50%, -50%) scale(1)' },
                    '50%': { opacity: 0.8, transform: 'translate(-50%, -50%) scale(1.1)' },
                  }
                }}
              >
                <Box
                  component="img"
                  src="/app-icon.png"
                  alt="Legal237 App"
                  sx={{ 
                    height: { xs: 200, md: 300 }, 
                    width: { xs: 200, md: 300 },
                    borderRadius: 4,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))',
                  }}
                  onError={(e) => {
                    // Fallback to phone icon if image doesn't load
                    e.currentTarget.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; width: 300px; background: rgba(255,255,255,0.1); border-radius: 16px; border: 2px solid rgba(255,255,255,0.2);"><svg style="width: 150px; height: 150px; color: white;" viewBox="0 0 24 24"><path fill="currentColor" d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21C5,22.11 5.89,23 7,23H17C18.11,23 19,22.11 19,21V3C19,1.89 18.11,1 17,1Z"/></svg></div>';
                    e.currentTarget.parentNode?.appendChild(fallback);
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8, mt: -4, position: 'relative', zIndex: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={8}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 4,
                bgcolor: 'white',
                minWidth: 200,
                flex: '1 1 200px',
                maxWidth: 250,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid rgba(46, 125, 50, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                }
              }}
            >
              <Typography variant="h2" sx={{ color: '#2E7D32', fontWeight: 900, mb: 1, fontSize: '3rem' }}>
                {stat.number}
              </Typography>
              <Typography variant="h6" sx={{ color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                {stat.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'white', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900, 
                mb: 3, 
                color: '#2E7D32',
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              {currentContent.features.title}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#666', 
                fontWeight: 400,
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              {currentContent.features.subtitle}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {features.map((feature, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  minWidth: 350,
                  flex: '1 1 350px',
                  maxWidth: 400,
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: 'linear-gradient(145deg, #2E7D32 0%, #1B5E20 100%)',
                  color: 'white',
                  transition: 'all 0.4s ease',
                  '&:hover': {
                    transform: 'translateY(-12px) scale(1.02)',
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
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Lawyer CTA Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          color: 'white', 
          py: 10,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Cpath d="M20 20c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20zm0-20c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20z"/%3E%3C/g%3E%3C/svg%3E")',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'center' }}>
            <Box sx={{ flex: 2, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h3" sx={{ mb: 3, fontWeight: 900, fontSize: { xs: '2.5rem', md: '3rem' } }}>
                {currentContent.lawyerCta.title}
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.95, fontWeight: 400, lineHeight: 1.6, maxWidth: '600px' }}>
                {currentContent.lawyerCta.subtitle}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                {currentContent.lawyerCta.features.map((feature, index) => (
                  <Chip 
                    key={index}
                    label={feature} 
                    sx={{ 
                      bgcolor: index === 0 ? 'white' : 'rgba(255,255,255,0.2)', 
                      color: index === 0 ? '#2E7D32' : 'white',
                      fontWeight: 600,
                      px: 2,
                      py: 1,
                      fontSize: '1rem'
                    }} 
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                href="/lawyer-application"
                sx={{
                  bgcolor: 'white',
                  color: '#2E7D32',
                  fontWeight: 700,
                  px: 6,
                  py: 3,
                  fontSize: '1.2rem',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  '&:hover': { 
                    bgcolor: '#f8f9fa',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 15px 45px rgba(0,0,0,0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {currentContent.lawyerCta.button}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, mb: 6 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  component="img"
                  src="/app-icon.png"
                  alt="Legal237"
                  sx={{ 
                    height: 40, 
                    width: 40, 
                    mr: 2,
                    borderRadius: 1,
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Gavel sx={{ mr: 1, fontSize: 40, display: 'none' }} />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Legal237
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.8, mb: 2, lineHeight: 1.7, maxWidth: '400px' }}>
                {currentContent.footer.description}
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                {currentContent.footer.quickLinks}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Link href="/" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                  {currentContent.nav.home}
                </Link>
                <Link href="/contact" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                  {currentContent.nav.contact}
                </Link>
                <Link href="/lawyer-application" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                  {currentContent.nav.forLawyers}
                </Link>
                <Link href="/privacy-policy" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                  {currentContent.nav.privacy}
                </Link>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                {currentContent.footer.contactInfo}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  {currentContent.footer.email}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  {currentContent.footer.phone}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  {currentContent.footer.address}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              {currentContent.footer.copyright}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 