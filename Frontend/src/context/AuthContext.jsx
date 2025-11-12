import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Try to get user info based on stored user type
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const type = storedUser.userType;

      if (type === 'donor') {
        const response = await authService.checkDonorAuth();
        setUser(response.data.user);
        setUserType('donor');
      } else if (type === 'volunteer') {
        const response = await authService.checkVolunteerAuth();
        setUser(response.data.user);
        setUserType('volunteer');
      }
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setUserType(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setUserType(userData.userType);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserType(null);
  };

  const value = {
    user,
    userType,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

