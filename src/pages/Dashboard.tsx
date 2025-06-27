import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  People,
  Gavel,
  Person,
  TrendingUp,
} from '@mui/icons-material';
import { supabaseAdmin } from '../lib/supabase';

interface DashboardStats {
  totalUsers: number;
  totalLaws: number;
  totalLawyers: number;
  totalSubscriptions: number;
}

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value.toLocaleString()}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ color: 'white', fontSize: 32 }}>
            {icon}
          </Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalLaws: 0,
    totalLawyers: 0,
    totalSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users count using admin API
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
        }

        // Fetch laws count from legal_articles
        const { count: lawsCount } = await supabaseAdmin
          .from('legal_articles')
          .select('*', { count: 'exact', head: true });

        // Fetch lawyers count
        const { count: lawyersCount } = await supabaseAdmin
          .from('lawyers')
          .select('*', { count: 'exact', head: true });

        // Fetch subscriptions count (users who have made payments)
        const { count: subscriptionsCount } = await supabaseAdmin
          .from('payment_records')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersData?.users?.length || 0,
          totalLaws: lawsCount || 0,
          totalLawyers: lawyersCount || 0,
          totalSubscriptions: subscriptionsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People />}
            color="#2E7D32"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <StatCard
            title="Total Laws"
            value={stats.totalLaws}
            icon={<Gavel />}
            color="#C62828"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <StatCard
            title="Total Lawyers"
            value={stats.totalLawyers}
            icon={<Person />}
            color="#1565C0"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <StatCard
            title="Subscriptions"
            value={stats.totalSubscriptions}
            icon={<TrendingUp />}
            color="#E65100"
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '2 1 500px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography color="textSecondary">
              Activity tracking will be implemented here
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 300px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography color="textSecondary">
              Quick action buttons will be added here
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 