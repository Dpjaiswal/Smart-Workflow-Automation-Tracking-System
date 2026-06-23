import React, { createContext, useContext, useState, useEffect } from 'react';

export const API_BASE = 'http://localhost:8000';

interface UserSession {
  token: string;
  role: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('swats-session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('swats-session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    const session: UserSession = {
      token: data.access_token,
      role: data.role,
      email: data.email,
      full_name: data.full_name,
    };

    setUser(session);
    localStorage.setItem('swats-session', JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('swats-session');
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    };
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        getAuthHeaders,
        isAdmin,
        isManager,
        isEmployee,
        isClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
