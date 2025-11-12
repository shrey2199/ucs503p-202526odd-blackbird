import api from './api';

// Auth API calls
export const authService = {
  // Signup
  signup: async (userData) => {
    const response = await api.post('/users/signup', userData);
    return response.data;
  },

  // Verify OTP
  verifyOtp: async (phone, otp, userType) => {
    const response = await api.post('/users/verify', { phone, otp, userType });
    return response.data;
  },

  // Login
  login: async (phoneNumber, password, userType) => {
    const response = await api.post('/users/login', { phoneNumber, password, userType });
    return response.data;
  },

  // Check auth status (for donor)
  checkDonorAuth: async () => {
    const response = await api.get('/donor/me');
    return response.data;
  },

  // Check auth status (for volunteer)
  checkVolunteerAuth: async () => {
    const response = await api.get('/volunteer/me');
    return response.data;
  },
};

