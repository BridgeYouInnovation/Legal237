import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  supabaseError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session with improved error handling
    const getSession = async () => {
      try {
        // Check if environment variables are available
        if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
          console.error('Supabase environment variables not found');
          setSupabaseError('Supabase configuration missing');
          setLoading(false);
          return;
        }

        console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
        console.log('Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase session error:', error);
          setSupabaseError(`Authentication error: ${error.message}`);
        } else {
          console.log('Supabase session retrieved successfully');
          setSupabaseError(null);
        }
        
        setUser(session?.user ?? null);
      } catch (error: any) {
        console.error('Failed to get session:', error);
        setSupabaseError(`Connection error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes with error handling
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch (error: any) {
      console.error('Failed to set up auth listener:', error);
      setSupabaseError(`Auth listener error: ${error.message}`);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (supabaseError) {
        return { error: { message: 'Authentication service unavailable' } };
      }

      console.log('Attempting to sign in with:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
      } else {
        console.log('Sign in successful');
        setSupabaseError(null);
      }
      
      return { error };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return { error: { message: error.message || 'Sign in failed' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    supabaseError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 