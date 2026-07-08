import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  perfil: string;
  telefono?: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('aura_user');
    const savedToken = localStorage.getItem('aura_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('aura_user', JSON.stringify(newUser));
    localStorage.setItem('aura_token', newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_token');
    sessionStorage.setItem('aura_cerro_sesion', '1');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
