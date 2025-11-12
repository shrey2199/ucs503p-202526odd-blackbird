import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { volunteerService } from '../services/volunteerService';
import Layout from '../components/Layout';
import api from '../services/api';

const AcceptDonation = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const { user, userType, loading: authLoading } = useAuth();
  const { showToast, showConfirm } = useToast();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in, redirect to login with return path
        navigate('/login', { state: { returnTo: `/volunteer/accept/${foodId}` } });
        return;
      }
      if (userType !== 'volunteer') {
        setError('Only volunteers can accept donations');
        return;
      }
      loadDonation();
    }
  }, [user, userType, authLoading, foodId, navigate]);

  const loadDonation = async () => {
    try {
      setLoading(true);
      // Get donation details using the new endpoint
      const response = await api.get(`/volunteer/food/${foodId}`);
      setDonation(response.data.data.donation);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donation details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    const confirmed = await showConfirm('Are you sure you want to accept this donation?');
    if (!confirmed) {
      return;
    }

    try {
      setAccepting(true);
      await volunteerService.acceptFoodDelivery(foodId);
      showToast('Donation accepted successfully! Donor and Hunger Spot have been notified.', 'success');
      navigate('/volunteer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept donation. It may have already been accepted.');
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center py-8 sm:py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !donation) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center py-6 sm:py-8">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 text-base sm:text-lg font-semibold mb-3 sm:mb-4">{error}</p>
            <button
              onClick={() => navigate('/volunteer/dashboard')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎁</div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
              Accept Donation
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Review the details before accepting</p>
          </div>
          
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-lg">
              <p className="text-sm sm:text-base text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          {donation && donation.foodDetails ? (
            <>
              <div className="space-y-4 sm:space-y-5 mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-primary-50 to-green-50 dark:from-primary-900/30 dark:to-green-900/30 rounded-xl p-4 sm:p-6 border-2 border-primary-200 dark:border-primary-700">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <div className="text-2xl sm:text-3xl mr-2 sm:mr-3">🍱</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {donation.foodDetails.category}
                    </h3>
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-primary-600 dark:text-primary-400 mb-2">
                    {donation.foodDetails.quantity} {donation.foodDetails.unit}
                  </p>
                  {donation.foodDetails.description && (
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 p-2 sm:p-3 rounded-lg">
                      {donation.foodDetails.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600">
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">📍 Pickup Location</p>
                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-medium mb-2 break-words">{donation.pickupLocation?.address}</p>
                    {donation.pickupLocation?.coordinates && donation.pickupLocation.coordinates.length === 2 && (
                      <a
                        href={`https://www.google.com/maps?q=${donation.pickupLocation.coordinates[1]},${donation.pickupLocation.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-xs sm:text-sm flex items-center gap-1 underline transition-colors"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="hidden sm:inline">View on Maps</span>
                        <span className="sm:hidden">Maps</span>
                      </a>
                    )}
                  </div>

                  {donation.assignedHungerSpot ? (
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600">
                      <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">🏠 Drop Location (Hunger Spot)</p>
                      <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-medium mb-1">
                        {donation.assignedHungerSpot.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                        {donation.assignedHungerSpot.location?.address}
                      </p>
                      {donation.assignedHungerSpot.location?.coordinates && donation.assignedHungerSpot.location.coordinates.length === 2 && (
                        <a
                          href={`https://www.google.com/maps?q=${donation.assignedHungerSpot.location.coordinates[1]},${donation.assignedHungerSpot.location.coordinates[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-xs sm:text-sm flex items-center gap-1 underline transition-colors"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="hidden sm:inline">View on Maps</span>
                          <span className="sm:hidden">Maps</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-3 sm:p-4 border-2 border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30">
                      <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">🏠 Drop Location</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">No hunger spot assigned yet</p>
                    </div>
                  )}

                  {donation.foodDetails.expiryTime && (
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600">
                      <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">⏰ Expiry Time</p>
                      <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-medium">
                        {new Date(donation.foodDetails.expiryTime).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {donation.status && (
                  <div className="bg-white dark:bg-gray-700 rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600">
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Status</p>
                    <span className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${
                      donation.status === 'pending' 
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                    }`}>
                      {donation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {donation.status === 'pending' || !donation.status ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  {accepting ? 'Accepting...' : '✅ Accept This Donation'}
                </button>
              ) : (
                <div className="p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl">
                  <p className="text-sm sm:text-base text-yellow-800 dark:text-yellow-300 font-semibold text-center">
                    ⚠️ This donation has already been accepted by another volunteer.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 text-center">
                You are about to accept a donation. Click the button below to confirm.
              </p>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                {accepting ? 'Accepting...' : '✅ Accept This Donation'}
              </button>
            </div>
          )}

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={() => navigate('/volunteer/dashboard')}
              className="text-sm sm:text-base text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold hover:underline"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AcceptDonation;
