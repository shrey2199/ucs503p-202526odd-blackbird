import axios from 'axios';
import { API_URL } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if this is a login request (failed login should show error, not redirect)
      const isLoginRequest = error.config?.url?.includes('/users/login');
      const isHungerSpotLoginRequest = error.config?.url?.includes('/hungerSpots/login');
      const isSignupRequest = error.config?.url?.includes('/users/signup');
      const isVerifyRequest = error.config?.url?.includes('/users/verify');
      const isPasswordUpdateRequest = error.config?.url?.includes('/me/password') || 
                                      error.config?.url?.includes('/updateMyPassword') ||
                                      error.config?.url?.includes('/users/updateMyPassword');
      
      // Only redirect if it's not an auth-related request and we're not already on login page
      if (!isLoginRequest && !isHungerSpotLoginRequest && !isSignupRequest && !isVerifyRequest && !isPasswordUpdateRequest) {
        // Token expired or invalid - only redirect if not already on login/signup pages
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/verify-otp' && currentPath !== '/hunger-spot/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('hungerSpot');
          // Redirect to appropriate login page based on current path
          if (currentPath.startsWith('/hunger-spot')) {
            window.location.href = '/hunger-spot/login';
          } else {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

