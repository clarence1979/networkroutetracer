import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (username: string, isAdmin: boolean, openaiApiKey?: string) => void;
  logout: () => void;
  setOpenaiApiKey: (key: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    openaiApiKey: null,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    const storedApiKey = localStorage.getItem('openai_api_key');

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          openaiApiKey: storedApiKey,
        });
      } catch {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

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
    localStorage.removeItem('auth_user');
    localStorage.removeItem('openai_api_key');
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

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setOpenaiApiKey }}>
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
