import { createContext, useContext, useState, useCallback } from 'react';
import { consultants, gcClients } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));

    // Check consultant
    const consultant = consultants.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );
    if (consultant) {
      const userData = { ...consultant, role: 'consultant' };
      setUser(userData);
      setLoading(false);
      return { success: true, user: userData };
    }

    // Check GC clients
    const gc = gcClients.find(
      (g) => g.contact_email.toLowerCase() === email.toLowerCase()
    );
    if (gc) {
      const userData = {
        id: gc.id,
        email: gc.contact_email,
        full_name: gc.contact_name,
        company_name: gc.company_name,
        role: 'gc',
      };
      setUser(userData);
      setLoading(false);
      return { success: true, user: userData };
    }

    setLoading(false);
    return { success: false, error: 'Invalid email or password' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
