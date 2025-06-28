import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';

// Public Pages
import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import LawyerApplicationPage from './pages/LawyerApplicationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Admin Components
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import Laws from './pages/Laws';
import Lawyers from './pages/Lawyers';
import Users from './pages/Users';
import Subscriptions from './pages/Subscriptions';
import Login from './pages/Login';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import PaymentFailed from './pages/PaymentFailed';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
    },
    secondary: {
      main: '#C62828',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <TopBar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

const DebugInfo: React.FC = () => {
  const { user, loading, supabaseError } = useAuth();
  
  return (
    <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom>
        Debug Information
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Current URL:</strong> {window.location.href}
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Supabase Error:</strong> {supabaseError || 'None'}
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Environment:</strong>
        <br />
        - Supabase URL: {process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Not set'}
        <br />
        - Supabase Key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => window.location.href = '/admin-dashboard/login'}
        sx={{ mt: 2 }}
      >
        Go to Login
      </Button>
    </Box>
  );
};

const AdminRoutes: React.FC = () => {
  const { user, loading, supabaseError } = useAuth();

  console.log('AdminRoutes render:', { user: !!user, loading, supabaseError });
  console.log('Current pathname:', window.location.pathname);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
        sx={{ backgroundColor: '#f0f0f0', border: '2px solid red' }}
      >
        <div style={{ fontSize: '24px', color: 'blue' }}>Loading authentication...</div>
        {supabaseError && (
          <div style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>
            Error: {supabaseError}
          </div>
        )}
      </Box>
    );
  }

  // If there's a Supabase error, still show login page but with error message
  if (supabaseError) {
    console.error('Supabase error detected:', supabaseError);
  }

  if (!user) {
    console.log('No user, showing login routes');
    console.log('Should redirect to login if on admin-dashboard route');
    
    return (
      <div style={{ backgroundColor: 'yellow', minHeight: '100vh', padding: '20px' }}>
        <h1 style={{ color: 'red' }}>AdminRoutes - No User</h1>
        <p>Current path: {window.location.pathname}</p>
        <Routes>
          <Route path="/admin-dashboard/login" element={<Login />} />
          <Route path="/admin-dashboard/debug" element={<DebugInfo />} />
          <Route path="/admin-dashboard/payment/success" element={<PaymentSuccess />} />
          <Route path="/admin-dashboard/payment/cancelled" element={<PaymentCancelled />} />
          <Route path="/admin-dashboard/payment/failed" element={<PaymentFailed />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <div>
                <p>Redirecting to login...</p>
                <Navigate to="/admin-dashboard/login" replace />
              </div>
            } 
          />
          <Route path="/admin-dashboard/*" element={<Navigate to="/admin-dashboard/login" replace />} />
        </Routes>
      </div>
    );
  }

  console.log('User authenticated, showing admin layout');
  return (
    <div style={{ backgroundColor: 'lightgreen', minHeight: '100vh' }}>
      <h1 style={{ color: 'darkgreen' }}>AdminRoutes - User Authenticated</h1>
      <AdminLayout>
        <Routes>
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard/laws" element={<Laws />} />
          <Route path="/admin-dashboard/lawyers" element={<Lawyers />} />
          <Route path="/admin-dashboard/users" element={<Users />} />
          <Route path="/admin-dashboard/subscriptions" element={<Subscriptions />} />
          <Route path="/admin-dashboard/debug" element={<DebugInfo />} />
          <Route path="/admin-dashboard/login" element={<Navigate to="/admin-dashboard" replace />} />
          <Route path="/admin-dashboard/*" element={<Navigate to="/admin-dashboard" replace />} />
        </Routes>
      </AdminLayout>
    </div>
  );
};

const App: React.FC = () => {
  console.log('App component rendering');
  console.log('Current location:', window.location.href);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ border: '3px solid blue', minHeight: '100vh' }}>
        <h1 style={{ color: 'blue', textAlign: 'center' }}>Legal237 App Root</h1>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/lawyer-application" element={<LawyerApplicationPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin-dashboard/*" element={<AdminRoutes />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App;
