"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, setAuthToken } from '@/lib/api';
import type { DevLoginRequest } from '@/lib/types';

// Helper functions to manage cookies for dev login
const setCookie = (name: string, value: string, days: number) => {
  if (typeof document === 'undefined') return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

const eraseCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; Max-Age=-99999999; path=/;';
}

interface AuthContextType {
  user: { id: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: DevLoginRequest) => Promise<void>; // Dev login
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const loadUserFromDevToken = useCallback((tokenValue: string | null) => {
    if (tokenValue) {
        try {
            const decoded = JSON.parse(atob(tokenValue.split('.')[1]));
            setUser({ id: decoded.sub }); // 'sub' claim for user_id
            setToken(tokenValue);
        } catch (e) {
            console.error("Invalid dev token format", e);
            eraseCookie('auth_token');
            setToken(null);
            setUser(null);
        }
    }
  }, []);

  // On mount, load user from the dev token cookie (no Firebase dependency)
  useEffect(() => {
    const devToken = getCookie('auth_token');
    if (devToken) {
      loadUserFromDevToken(devToken);
    } else {
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, [loadUserFromDevToken]);

  const login = async (data: DevLoginRequest) => {
    const response = await api.devLogin(data);
    const { access_token } = response;
    setCookie('auth_token', access_token, 7);
    loadUserFromDevToken(access_token);
    const redirectTo = searchParams.get('redirect_to');
    router.replace(redirectTo || '/dashboard');
  };

  const logout = async () => {
    eraseCookie('auth_token');
    setToken(null);
    setUser(null);
    router.replace('/login');
  };

  const value = {
    user,
    token,
    isAuthenticated: !isLoading && !!token && !!user,
    login,
    logout,
    isLoading
  };

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><p>Loading ClarityCompass...</p></div>;
  }

  return (
    <AuthContext.Provider value={value}>
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
