import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  username?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = await transformSupabaseUser(session.user);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userData = await transformSupabaseUser(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const transformSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    // For demo purposes, we'll assign roles based on email domain
    // In a real app, you'd store roles in a separate table
    const role = supabaseUser.email?.includes('admin') ? 'administrator' : 'user';
    const username = supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user';
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      username,
      role,
    };
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', { email, password: '***' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error details:', error);
        setIsLoading(false);
        return { success: false, error: `Login failed: ${error.message}` };
      }

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Login catch error:', error);
      setIsLoading(false);
      return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const signup = async (email: string, password: string, username?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting signup with:', { email, password: '***', username });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error details:', error);
        setIsLoading(false);
        return { success: false, error: `Signup failed: ${error.message}` };
      }

      setIsLoading(false);
      
      // Check if email confirmation is required
      if (data?.user && !data.session) {
        return { success: true, error: 'Please check your email to confirm your account before signing in.' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Signup catch error:', error);
      setIsLoading(false);
      return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        signup,
        logout, 
        isAuthenticated: !!user, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
