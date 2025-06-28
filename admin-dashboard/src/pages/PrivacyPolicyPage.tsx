import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Link,
  Paper,
  Divider,
} from '@mui/material';
import {
  Gavel,
  Security,
} from '@mui/icons-material';

const PrivacyPolicyPage: React.FC = () => {
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
              <Link href="/lawyer-application" sx={{ color: '#666', textDecoration: 'none', fontWeight: 500 }}>
                For Lawyers
              </Link>
              <Link href="/privacy-policy" sx={{ color: '#2E7D32', textDecoration: 'none', fontWeight: 500 }}>
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
      <Box sx={{ bgcolor: '#2E7D32', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            Privacy Policy
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 400 }}>
            How we protect and handle your personal information
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
            Last updated: December 2024
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 6, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Security sx={{ fontSize: 40, color: '#2E7D32', mr: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
              Your Privacy Matters
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ mb: 4, color: '#666', lineHeight: 1.8 }}>
            At Legal237, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
            mobile application and website.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
            1. Information We Collect
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, color: '#666', lineHeight: 1.8 }}>
            We may collect personal information that you voluntarily provide to us when you register for an account, 
            make a purchase, contact us for support, or apply to be listed as a lawyer. This includes name, email address, 
            phone number, professional credentials, and payment information.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
            2. How We Use Your Information
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: '#666', lineHeight: 1.8 }}>
            We use your information to provide and maintain our services, process transactions, send important updates, 
            improve our app experience, verify lawyer credentials, provide customer support, and comply with legal obligations.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
            3. Data Security
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: '#666', lineHeight: 1.8 }}>
            We implement appropriate technical and organizational security measures to protect your personal information, 
            including SSL/TLS encryption, encrypted storage, regular security audits, access controls, and secure payment processing.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
            4. Your Rights
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: '#666', lineHeight: 1.8 }}>
            You have the right to access, correct, or delete your personal information. You can also opt-out of marketing 
            communications and delete your account at any time. We retain your information only as long as necessary.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ bgcolor: '#f8f9fa', p: 4, borderRadius: 2, border: '1px solid #e9ecef' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
              Contact Us
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, color: '#666', lineHeight: 1.8 }}>
              If you have any questions about this Privacy Policy, please contact us:
            </Typography>

            <Box sx={{ color: '#666' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> privacy@legal237.com
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Phone:</strong> +237 XXX XXX XXX
              </Typography>
              <Typography variant="body1">
                <strong>Address:</strong> Yaoundé, Cameroon
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

export default PrivacyPolicyPage; 