import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hungerSpotService } from '../services/hungerSpotService';
import Layout from '../components/Layout';

const HungerSpotDashboard = () => {
  const { hungerSpot, updateHungerSpot } = useAuth();
  const { showToast } = useToast();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (hungerSpot?._id) {
      loadDonations();
    }
  }, [hungerSpot]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const response = await hungerSpotService.getDonations();
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error loading donations:', error);
      showToast('Failed to load donations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      volunteer_assigned: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      in_transit: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      delivered: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      cancelled: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200',
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleActive = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await hungerSpotService.updateActiveStatus(newStatus);
      updateHungerSpot(response.data.hungerSpot);
      showToast(
        `Hunger spot ${newStatus ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error updating status:', error);
      showToast(
        error.response?.data?.message || 'Failed to update status',
        'error'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
                Hunger Spot Dashboard
              </h1>
              {hungerSpot && (
                <div className="mt-2">
                  <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 font-semibold">
                    {hungerSpot.name}
                  </p>
                  {hungerSpot.location?.address && (
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      📍 {hungerSpot.location.address}
                    </p>
                  )}
                </div>
              )}
            </div>
            {hungerSpot && (
              <div className="flex items-center gap-3 sm:gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-md">
                <span className={`text-sm sm:text-base font-semibold ${hungerSpot.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {hungerSpot.isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hungerSpot.isActive}
                    onChange={(e) => handleToggleActive(e.target.checked)}
                    disabled={updatingStatus}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                </label>
                {updatingStatus && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400"></div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
              Donations Received
            </h2>
            <button
              onClick={loadDonations}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄' : '↻'} Refresh
            </button>
          </div>

          {loading && donations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                No donations received yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {donations.map((donation) => (
                <div
                  key={donation._id}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 sm:p-6 border-2 border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
                          {donation.foodDetails.category}
                        </h3>
                        <span
                          className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold shadow-md flex-shrink-0 ${getStatusColor(
                            donation.status
                          )}`}
                        >
                          {donation.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      {donation.foodDetails.description && (
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-2 bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded-lg">
                          {donation.foodDetails.description}
                        </p>
                      )}
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Quantity: {donation.foodDetails.quantity} {donation.foodDetails.unit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                    {donation.donorId && (
                      <div className="flex items-start text-gray-600 dark:text-gray-400">
                        <span className="mr-1 sm:mr-2 flex-shrink-0">👤</span>
                        <span className="break-words">
                          Donor: {donation.donorId.fullName}
                          {donation.donorId.organizationType && ` (${donation.donorId.organizationType})`}
                          {donation.donorId.phoneNumber && ` - ${donation.donorId.phoneNumber}`}
                        </span>
                      </div>
                    )}
                    {donation.volunteerId && (
                      <div className="flex items-start text-gray-600 dark:text-gray-400">
                        <span className="mr-1 sm:mr-2 flex-shrink-0">🚚</span>
                        <span className="break-words">
                          Volunteer: {donation.volunteerId.fullName}
                          {donation.volunteerId.phoneNumber && ` - ${donation.volunteerId.phoneNumber}`}
                        </span>
                      </div>
                    )}
                    {donation.pickupLocation?.address && (
                      <div className="flex items-start text-gray-600 dark:text-gray-400">
                        <span className="mr-1 sm:mr-2 flex-shrink-0">📍</span>
                        <span className="break-words">Pickup: {donation.pickupLocation.address}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <span className="mr-1 sm:mr-2">🕒</span>
                      <span className="text-xs sm:text-sm">
                        Received: {formatDate(donation.createdAt)}
                      </span>
                    </div>
                    {donation.deliveryTime && (
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <span className="mr-1 sm:mr-2">✅</span>
                        <span className="text-xs sm:text-sm">
                          Delivered: {formatDate(donation.deliveryTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HungerSpotDashboard;


