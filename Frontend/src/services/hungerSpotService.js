import api from './api';

// Hunger Spot API calls
export const hungerSpotService = {
  // Get all hunger spots (for dropdown)
  getAllHungerSpots: async () => {
    const response = await api.get('/hungerSpots');
    return response.data;
  },

  // Login
  login: async (hungerSpotId, password) => {
    const response = await api.post('/hungerSpots/login', { hungerSpotId, password });
    return response.data;
  },

  // Get donations for authenticated hunger spot
  getDonations: async () => {
    const response = await api.get('/hungerSpots/me/donations');
    return response.data;
  },

  // Update active status for authenticated hunger spot
  updateActiveStatus: async (isActive) => {
    const response = await api.patch('/hungerSpots/me/status', { isActive });
    return response.data;
  },

  // Update password
  updatePassword: async (passwordCurrent, password, passwordConfirm) => {
    const response = await api.patch('/hungerSpots/me/password', {
      passwordCurrent,
      password,
      passwordConfirm
    });
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.patch('/hungerSpots/me', profileData);
    return response.data;
  },

  // Mark donation as delivered
  markDonationDelivered: async (donationId) => {
    const response = await api.patch(`/hungerSpots/me/donations/${donationId}/delivered`);
    return response.data;
  },
};


