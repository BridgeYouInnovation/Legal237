import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Components
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

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancelled" element={<PaymentCancelled />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ProtectedLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/laws" element={<Laws />} />
        <Route path="/lawyers" element={<Lawyers />} />
        <Route path="/users" element={<Users />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProtectedLayout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
