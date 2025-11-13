import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { hungerSpotService } from '../services/hungerSpotService';

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
  const [hungerSpot, setHungerSpot] = useState(null);
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

      // Check if it's a hunger spot or user
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const storedHungerSpot = JSON.parse(localStorage.getItem('hungerSpot') || '{}');
      
      if (storedHungerSpot._id) {
        // Try to verify hunger spot auth (we'll need to add this endpoint or use existing)
        // For now, just set from localStorage
        setHungerSpot(storedHungerSpot);
        setUserType('hungerSpot');
      } else if (storedUser.userType) {
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
      }
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('hungerSpot');
      setUser(null);
      setHungerSpot(null);
      setUserType(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('hungerSpot');
    setUser(userData);
    setHungerSpot(null);
    setUserType(userData.userType);
  };

  const loginHungerSpot = (hungerSpotData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('hungerSpot', JSON.stringify(hungerSpotData));
    localStorage.removeItem('user');
    setHungerSpot(hungerSpotData);
    setUser(null);
    setUserType('hungerSpot');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('hungerSpot');
    setUser(null);
    setHungerSpot(null);
    setUserType(null);
  };

  const updateHungerSpot = (updatedHungerSpot) => {
    localStorage.setItem('hungerSpot', JSON.stringify(updatedHungerSpot));
    setHungerSpot(updatedHungerSpot);
  };

  const value = {
    user,
    hungerSpot,
    userType,
    loading,
    login,
    loginHungerSpot,
    logout,
    checkAuth,
    updateHungerSpot,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

