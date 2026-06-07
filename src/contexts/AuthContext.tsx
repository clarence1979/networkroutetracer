import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (username: string, isAdmin: boolean, openaiApiKey?: string) => void;
  logout: () => void;
  setOpenaiApiKey: (key: string) => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    openaiApiKey: null,
  });

  const login = (username: string, isAdmin: boolean, openaiApiKey?: string) => {
    const user: User = { username, isAdmin };
    localStorage.setItem('auth_user', JSON.stringify(user));
    if (openaiApiKey) {
      localStorage.setItem('openai_api_key', openaiApiKey);
    }

    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      openaiApiKey: openaiApiKey || null,
    });
  };

  const logout = () => {
    // Legacy keys
    localStorage.removeItem('auth_user');
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('OPENAI_API_KEY');
    localStorage.removeItem('SUPABASE_URL');
    localStorage.removeItem('SUPABASE_ANON_KEY');
    // VITE_-prefixed keys from auto-login utility
    localStorage.removeItem('VITE_SUPABASE_URL');
    localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
    localStorage.removeItem('VITE_OPENAI_API_KEY');
    localStorage.removeItem('VITE_CLAUDE_API_KEY');
    localStorage.removeItem('VITE_GEMINI_API_KEY');
    localStorage.removeItem('VITE_REPLICATE_API_KEY');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      openaiApiKey: null,
    });
  };

  const setOpenaiApiKey = (key: string) => {
    localStorage.setItem('openai_api_key', key);
    setAuthState(prev => ({ ...prev, openaiApiKey: key }));
  };

  const setLoading = (loading: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading: loading }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setOpenaiApiKey, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
