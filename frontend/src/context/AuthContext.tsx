import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../lib/api';

export interface User {
  id: string; fullName: string; email: string;
  role: 'student' | 'recruiter' | 'university_admin';
  creditScore: number; avatarUrl?: string; resumeUrl?: string;
  university?: string; major?: string; graduationYear?: string;
  location?: string; bio?: string; phone?: string;
  linkedinUrl?: string; githubUrl?: string; websiteUrl?: string;
  organization?: string; jobTitle?: string;
  adminUniversity?: string; adminDepartment?: string;
  subscriptionStatus?: string; subscriptionExpiry?: string;
}

interface AuthContextType {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: object) => Promise<User>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('procred_token');
    const stored = localStorage.getItem('procred_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
        authAPI.getMe()
          .then(res => { setUser(res.data.user); localStorage.setItem('procred_user', JSON.stringify(res.data.user)); })
          .catch(() => { localStorage.removeItem('procred_token'); localStorage.removeItem('procred_user'); setUser(null); })
          .finally(() => setLoading(false));
      } catch { localStorage.removeItem('procred_token'); localStorage.removeItem('procred_user'); setUser(null); setLoading(false); }
    } else { setLoading(false); }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authAPI.login({ email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('procred_token', token);
    localStorage.setItem('procred_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (data: object): Promise<User> => {
    const res = await authAPI.register(data);
    const { token, user: u } = res.data;
    localStorage.setItem('procred_token', token);
    localStorage.setItem('procred_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('procred_token');
    localStorage.removeItem('procred_user');
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('procred_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
