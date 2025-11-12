import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { volunteerService } from '../services/volunteerService';
import Layout from '../components/Layout';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const { showToast, showConfirm } = useToast();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const response = await volunteerService.getDonations();
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (foodId) => {
    const confirmed = await showConfirm('Are you sure you want to accept this donation?');
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      await volunteerService.acceptFoodDelivery(foodId);
      showToast('Donation accepted successfully! Donor and Hunger Spot have been notified.', 'success');
      loadDonations();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to accept donation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (foodId, status) => {
    try {
      setLoading(true);
      await volunteerService.updateFoodStatus(foodId, status);
      showToast('Status updated successfully!', 'success');
      loadDonations();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white',
      volunteer_assigned: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
      in_transit: 'bg-gradient-to-r from-purple-400 to-purple-500 text-white',
      delivered: 'bg-gradient-to-r from-green-400 to-green-500 text-white',
      rejected: 'bg-gradient-to-r from-red-400 to-red-500 text-white',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-1 sm:mb-2">
            Volunteer Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Track your accepted donations and update delivery status</p>
        </div>

        {/* Donations List */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="text-2xl sm:text-3xl mr-2 sm:mr-3">🚚</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">My Accepted Donations</h2>
            <span className="ml-2 sm:ml-4 px-2 sm:px-3 py-1 bg-gradient-to-r from-primary-100 to-green-100 dark:from-primary-900/30 dark:to-green-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs sm:text-sm font-semibold">
              {donations.length}
            </span>
          </div>
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading donations...</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📭</div>
              <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 font-medium">No donations assigned yet</p>
              <p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 mt-2">You'll receive WhatsApp notifications when donations need volunteers near you!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {donations.map((donation) => (
                <div
                  key={donation._id}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1 sm:mb-2">
                        <div className="text-xl sm:text-2xl mr-1 sm:mr-2">🍱</div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 truncate">
                          {donation.foodDetails.category}
                        </h3>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-primary-600 dark:text-primary-400 mb-1">
                        {donation.foodDetails.quantity} {donation.foodDetails.unit}
                      </p>
                    </div>
                    <span
                      className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold shadow-md flex-shrink-0 ${getStatusColor(
                        donation.status
                      )}`}
                    >
                      {donation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {donation.foodDetails.description && (
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded-lg">
                      {donation.foodDetails.description}
                    </p>
                  )}
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="mr-2">📍</span>
                        <span className="truncate">Pickup: {donation.pickupLocation?.address}</span>
                      </div>
                      {donation.pickupLocation?.coordinates && donation.pickupLocation.coordinates.length === 2 && (
                        <a
                          href={`https://www.google.com/maps?q=${donation.pickupLocation.coordinates[1]},${donation.pickupLocation.coordinates[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-xs flex items-center gap-1 underline transition-colors whitespace-nowrap"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Maps
                        </a>
                      )}
                    </div>
                    {donation.assignedHungerSpot && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                        <div className="flex items-center flex-1 min-w-0">
                          <span className="mr-2">🏠</span>
                          <span className="truncate">
                            Delivery: {donation.assignedHungerSpot.name} - {donation.assignedHungerSpot.location?.address}
                          </span>
                        </div>
                        {donation.assignedHungerSpot.location?.coordinates && donation.assignedHungerSpot.location.coordinates.length === 2 && (
                          <a
                            href={`https://www.google.com/maps?q=${donation.assignedHungerSpot.location.coordinates[1]},${donation.assignedHungerSpot.location.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-xs flex items-center gap-1 underline transition-colors whitespace-nowrap"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Maps
                          </a>
                        )}
                      </div>
                    )}
                    <div className="flex items-center text-gray-500 dark:text-gray-500">
                      <span className="mr-1 sm:mr-2">🕒</span>
                      <span className="text-xs sm:text-sm">Assigned: {new Date(donation.assignmentTime || donation.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {donation.status === 'volunteer_assigned' && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                      <button
                        onClick={() => handleStatusUpdate(donation._id, 'in_transit')}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        🚗 In Transit
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(donation._id, 'delivered')}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        ✅ Delivered
                      </button>
                    </div>
                  )}

                  {donation.status === 'in_transit' && (
                    <button
                      onClick={() => handleStatusUpdate(donation._id, 'delivered')}
                      className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      ✅ Mark as Delivered
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-start">
            <div className="text-3xl sm:text-4xl mr-2 sm:mr-4 flex-shrink-0">💡</div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200 mb-1 sm:mb-2">How it works</h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                You will receive WhatsApp notifications when new donations need volunteers near your location. 
                Click the link in the message to accept a donation, or check your dashboard for updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VolunteerDashboard;
