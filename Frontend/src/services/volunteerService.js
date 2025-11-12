import api from './api';

// Volunteer API calls
export const volunteerService = {
  // Get volunteer's donations
  getDonations: async () => {
    const response = await api.get('/volunteer/food');
    return response.data;
  },

  // Accept food delivery
  acceptFoodDelivery: async (foodId) => {
    const response = await api.post(`/volunteer/accept/food/${foodId}`);
    return response.data;
  },

  // Update food status
  updateFoodStatus: async (foodId, status) => {
    const response = await api.patch(`/volunteer/update-status/${foodId}`, { status });
    return response.data;
  },
};

