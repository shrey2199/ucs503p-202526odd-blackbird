import api from './api';

// Donor API calls
export const donorService = {
  // Create donation
  createDonation: async (donationData) => {
    const response = await api.post('/donor/donations', donationData);
    return response.data;
  },

  // Get donor's donations (uses authenticated user's ID)
  getDonations: async () => {
    const response = await api.get(`/donor/food`);
    return response.data;
  },

  // Get nearest hunger spots for selection
  getNearestHungerSpots: async (latitude, longitude, foodCategory, foodDescription = '') => {
    const response = await api.get('/donor/hunger-spots', {
      params: {
        latitude,
        longitude,
        foodCategory,
        foodDescription
      }
    });
    return response.data;
  },

  // Update donation status
  updateDonationStatus: async (donationId, status) => {
    const response = await api.patch(`/donor/donations/${donationId}/status`, { status });
    return response.data;
  },

  // Cancel donation
  cancelDonation: async (donationId) => {
    const response = await api.delete(`/donor/donations/${donationId}`);
    return response.data;
  },
};

