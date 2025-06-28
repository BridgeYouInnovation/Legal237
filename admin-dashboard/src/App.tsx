import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

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

const AdminRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/admin-dashboard/login" element={<Login />} />
        <Route path="/admin-dashboard/payment/success" element={<PaymentSuccess />} />
        <Route path="/admin-dashboard/payment/cancelled" element={<PaymentCancelled />} />
        <Route path="/admin-dashboard/payment/failed" element={<PaymentFailed />} />
        <Route path="/admin-dashboard/*" element={<Navigate to="/admin-dashboard/login" replace />} />
      </Routes>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/admin-dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard/laws" element={<Laws />} />
        <Route path="/admin-dashboard/lawyers" element={<Lawyers />} />
        <Route path="/admin-dashboard/users" element={<Users />} />
        <Route path="/admin-dashboard/subscriptions" element={<Subscriptions />} />
        <Route path="/admin-dashboard/login" element={<Navigate to="/admin-dashboard" replace />} />
        <Route path="/admin-dashboard/*" element={<Navigate to="/admin-dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
};

export default App;
