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
};


