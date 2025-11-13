import api from './api';

// Auth API calls
export const authService = {
  // Signup
  signup: async (userData) => {
    const response = await api.post('/users/signup', userData);
    return response.data;
  },

  // Resend OTP
  resendOtp: async (phone, userType) => {
    const response = await api.post('/users/resendOtp', { phone, userType });
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

  // Update password
  updatePassword: async (passwordCurrent, password, passwordConfirm) => {
    const response = await api.patch('/users/updateMyPassword', {
      passwordCurrent,
      password,
      passwordConfirm
    });
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.patch('/users/updateMe', profileData);
    return response.data;
  },

  // Forgot password - send OTP
  forgotPassword: async (phone) => {
    const response = await api.post('/users/forgotpassword', { phone });
    return response.data;
  },

  // Reset password - verify OTP and set new password
  resetPassword: async (otp, password, passwordConfirm) => {
    const response = await api.patch('/users/resetPassword', {
      otp,
      password,
      passwordConfirm
    });
    return response.data;
  },
};

