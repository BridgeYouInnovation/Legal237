import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Link,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Gavel,
  Language as LanguageIcon,
} from '@mui/icons-material';

const PrivacyPolicyPage: React.FC = () => {
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
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 2025',
      sections: [
        {
          title: 'Information We Collect',
          content: 'We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This may include your name, email address, phone number, and professional information if you are a lawyer.'
        },
        {
          title: 'How We Use Your Information',
          content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and promotional offers.'
        },
        {
          title: 'Information Sharing',
          content: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information with trusted partners who help us operate our platform.'
        },
        {
          title: 'Data Security',
          content: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.'
        },
        {
          title: 'Your Rights',
          content: 'You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us. Contact us if you wish to exercise these rights.'
        },
        {
          title: 'Changes to This Policy',
          content: 'We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "last updated" date.'
        },
        {
          title: 'Contact Information',
          content: 'If you have any questions about this privacy policy, please contact us at support@legal237.com or call us at +237 682 310 407. You can also reach us at our office in Douala, Cameroon.'
        }
      ]
    },
    fr: {
      nav: {
        home: 'Accueil',
        contact: 'Contact',
        forLawyers: 'Pour Avocats',
        privacy: 'Confidentialité',
      },
      title: 'Politique de Confidentialité',
      lastUpdated: 'Dernière mise à jour : Janvier 2025',
      sections: [
        {
          title: 'Informations que Nous Collectons',
          content: 'Nous collectons les informations que vous nous fournissez directement, par exemple lorsque vous créez un compte, utilisez nos services ou nous contactez. Cela peut inclure votre nom, adresse e-mail, numéro de téléphone et informations professionnelles si vous êtes avocat.'
        },
        {
          title: 'Comment Nous Utilisons Vos Informations',
          content: 'Nous utilisons les informations que nous collectons pour fournir, maintenir et améliorer nos services, traiter les transactions, vous envoyer des avis techniques et des messages de support, et communiquer avec vous sur les produits, services et offres promotionnelles.'
        },
        {
          title: 'Partage d\'Informations',
          content: 'Nous ne vendons, n\'échangeons ou ne transférons pas vos informations personnelles à des tiers sans votre consentement, sauf comme décrit dans cette politique. Nous pouvons partager vos informations avec des partenaires de confiance qui nous aident à exploiter notre plateforme.'
        },
        {
          title: 'Sécurité des Données',
          content: 'Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre l\'accès non autorisé, l\'altération, la divulgation ou la destruction. Cependant, aucune méthode de transmission sur Internet n\'est sécurisée à 100%.'
        },
        {
          title: 'Vos Droits',
          content: 'Vous avez le droit d\'accéder, de mettre à jour ou de supprimer vos informations personnelles. Vous pouvez également vous désinscrire de certaines communications de notre part. Contactez-nous si vous souhaitez exercer ces droits.'
        },
        {
          title: 'Modifications de Cette Politique',
          content: 'Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique sur cette page et en mettant à jour la date de "dernière mise à jour".'
        },
        {
          title: 'Informations de Contact',
          content: 'Si vous avez des questions sur cette politique de confidentialité, veuillez nous contacter à support@legal237.com ou appelez-nous au +237 682 310 407. Vous pouvez également nous joindre à notre bureau de Douala, Cameroun.'
        }
      ]
    }
  };

  const currentContent = content[language];

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
                  color: '#666', 
                  textDecoration: 'none', 
                  fontWeight: 500,
                  fontSize: '1rem',
                  '&:hover': { color: '#2E7D32' }
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
                  color: '#2E7D32', 
                  textDecoration: 'none', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  '&:hover': { color: '#1B5E20' }
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
              variant="h6" 
              sx={{ 
                opacity: 0.9, 
                fontWeight: 400,
              }}
            >
              {currentContent.lastUpdated}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 8, mt: -4, position: 'relative', zIndex: 2 }}>
        <Card 
          elevation={8} 
          sx={{ 
            borderRadius: 4,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(46, 125, 50, 0.1)',
          }}
        >
          <CardContent sx={{ p: 6 }}>
            {currentContent.sections.map((section, index) => (
              <Box key={index} sx={{ mb: 4 }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 700, 
                    color: '#2E7D32',
                    borderBottom: '2px solid #2E7D32',
                    pb: 1
                  }}
                >
                  {section.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.8, 
                    color: '#444',
                    fontSize: '1.1rem'
                  }}
                >
                  {section.content}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
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

export default PrivacyPolicyPage; 