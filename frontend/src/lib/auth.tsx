import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from './api';

interface User {
  id: number;
  email: string;
  role: 'buyer' | 'supplier';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have a token in localStorage first
        const token = localStorage.getItem('access_token');
        if (token) {
          apiClient.setAccessToken(token);
          const userData = await apiClient.getCurrentUser();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        // User not authenticated
        setUser(null);
        apiClient.clearToken();
        localStorage.removeItem('access_token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    localStorage.setItem('access_token', response.access_token);
    // Get user data after successful login
    const userData = await apiClient.getCurrentUser();
    setUser(userData);
  };

  const register = async (email: string, password: string, role: string) => {
    const response = await apiClient.register(email, password, role);
    localStorage.setItem('access_token', response.access_token);
    // Get user data after successful registration
    const userData = await apiClient.getCurrentUser();
    setUser(userData);
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
    apiClient.clearToken();
    localStorage.removeItem('access_token');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};




