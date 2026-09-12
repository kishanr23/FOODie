'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session fetch failed', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Simple route guard for protected routes
  useEffect(() => {
    if (!isLoading && !user) {
      const protectedPaths = ['/profile', '/create', '/settings'];
      const isProtected = protectedPaths.some(path => pathname?.startsWith(path));
      
      if (isProtected) {
        router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/')}`);
      }
    }
  }, [isLoading, user, pathname, router]);

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshSession: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
