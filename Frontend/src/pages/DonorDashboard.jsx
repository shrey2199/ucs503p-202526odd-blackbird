import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { donorService } from '../services/donorService';
import Layout from '../components/Layout';
import LocationMap from '../components/LocationMap';

const DonorDashboard = () => {
  const { user } = useAuth();
  const { showToast, showConfirm } = useToast();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormClosing, setIsFormClosing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [hungerSpots, setHungerSpots] = useState([]);
  const [selectedHungerSpot, setSelectedHungerSpot] = useState(null);
  const [showHungerSpotSelection, setShowHungerSpotSelection] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loadingHungerSpots, setLoadingHungerSpots] = useState(false);
  const [formData, setFormData] = useState({
    foodDetails: {
      category: '',
      description: '',
      quantity: '',
      unit: 'kg',
      expiryTime: '',
    },
    pickupLocation: {
      address: '',
      coordinates: {
        latitude: '',
        longitude: '',
      },
    },
    donorWilling: false,
  });

  useEffect(() => {
    if (user?._id) {
      loadDonations();
    }
  }, [user]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const response = await donorService.getDonations();
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please select location on map.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          pickupLocation: {
            ...prev.pickupLocation,
            coordinates: {
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            },
          },
        }));
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access or select location on map.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please select location on map.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or select location on map.';
            break;
          default:
            errorMessage += 'Please select location on map.';
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const useStoredLocation = () => {
    if (!user?.location?.coordinates || user.location.coordinates.length !== 2) {
      setLocationError('No stored location found. Please use "Get My Location" or select on map.');
      return;
    }
    // User location is stored as [longitude, latitude]
    const [longitude, latitude] = user.location.coordinates;
    setFormData((prev) => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        coordinates: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
      },
    }));
    setLocationError('');
  };

  const handleMapLocationChange = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      pickupLocation: {
        ...prev.pickupLocation,
        coordinates: {
          latitude: lat.toString(),
          longitude: lng.toString(),
        },
      },
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('foodDetails.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        foodDetails: {
          ...prev.foodDetails,
          [field]: value,
        },
      }));
    } else if (name.startsWith('pickupLocation.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        pickupLocation: {
          ...prev.pickupLocation,
          [field]: value,
        },
      }));
    } else if (name.startsWith('coordinates.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        pickupLocation: {
          ...prev.pickupLocation,
          coordinates: {
            ...prev.pickupLocation.coordinates,
            [field]: value,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If donor is willing to deliver, show hunger spot selection first
    if (formData.donorWilling) {
      try {
        setLoadingHungerSpots(true);
        const response = await donorService.getNearestHungerSpots(
          formData.pickupLocation.coordinates.latitude,
          formData.pickupLocation.coordinates.longitude,
          formData.foodDetails.category,
          formData.foodDetails.description
        );
        
        if (response.data.hungerSpots && response.data.hungerSpots.length > 0) {
          setHungerSpots(response.data.hungerSpots);
          setShowHungerSpotSelection(true);
        } else {
          showToast('No matching hunger spots found. Please uncheck "I can deliver myself" to notify volunteers.', 'error');
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to fetch hunger spots', 'error');
      } finally {
        setLoadingHungerSpots(false);
      }
      return;
    }

    // If donor is not willing, proceed with normal flow
    await createDonation();
  };

  const handleHungerSpotSelect = (hungerSpot) => {
    setSelectedHungerSpot(hungerSpot);
    setShowHungerSpotSelection(false);
    setShowConfirmation(true);
  };

  const handleConfirmDonation = async () => {
    await createDonation(selectedHungerSpot._id);
  };

  const createDonation = async (hungerSpotId = null) => {
    try {
      setLoading(true);
      const donationData = {
        ...formData,
        selectedHungerSpotId: hungerSpotId
      };
      
      await donorService.createDonation(donationData);
      handleCloseForm();
      setFormData({
        foodDetails: {
          category: '',
          description: '',
          quantity: '',
          unit: 'kg',
          expiryTime: '',
        },
        pickupLocation: {
          address: '',
          coordinates: {
            latitude: '',
            longitude: '',
          },
        },
        donorWilling: false,
      });
      setSelectedHungerSpot(null);
      setShowConfirmation(false);
      setShowHungerSpotSelection(false);
      setHungerSpots([]);
      loadDonations();
      showToast('Donation created successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create donation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormClosing(true);
    setTimeout(() => {
      setShowForm(false);
      setIsFormClosing(false);
      setShowHungerSpotSelection(false);
      setShowConfirmation(false);
      setSelectedHungerSpot(null);
      setHungerSpots([]);
    }, 200); // Faster animation duration
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setIsFormClosing(false);
  };

  const handleStatusUpdate = async (donationId, newStatus) => {
    try {
      setLoading(true);
      await donorService.updateDonationStatus(donationId, newStatus);
      loadDonations();
      showToast('Status updated successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDonation = async (donationId) => {
    const confirmed = await showConfirm('Are you sure you want to cancel this donation?');
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      await donorService.cancelDonation(donationId);
      loadDonations();
      showToast('Donation cancelled successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to cancel donation', 'error');
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
      cancelled: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };


  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-1 sm:mb-2">
              Donor Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your food donations and track their status</p>
          </div>
          <button
            onClick={() => showForm ? handleCloseForm() : handleOpenForm()}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
              showForm
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                : 'bg-gradient-to-r from-primary-600 to-green-600 text-white hover:from-primary-700 hover:to-green-700'
            }`}
          >
            {showForm ? '✕ Cancel' : '+ Create Donation'}
          </button>
        </div>

        {/* Create Donation Form */}
        {showForm && (
          <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-out ${
            isFormClosing 
              ? 'opacity-0 scale-[0.92] -translate-y-[15px] pointer-events-none' 
              : 'opacity-100 scale-100 translate-y-0 animate-fade-in-slide-down'
          }`}>
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="text-3xl sm:text-4xl mr-2 sm:mr-3">🎁</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Create New Donation</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Food Category
                  </label>
                  <input
                    type="text"
                    name="foodDetails.category"
                    value={formData.foodDetails.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                    placeholder="e.g., Fresh Food, Fast Food"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="foodDetails.quantity"
                      value={formData.foodDetails.quantity}
                      onChange={handleChange}
                      required
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                    />
                    <select
                      name="foodDetails.unit"
                      value={formData.foodDetails.unit}
                      onChange={handleChange}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                    >
                      <option value="kg">kg</option>
                      <option value="pieces">pieces</option>
                      <option value="packets">packets</option>
                      <option value="portions">portions</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="foodDetails.description"
                  value={formData.foodDetails.description}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base"
                  rows="3"
                  placeholder="Describe the food items..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Expiry Time
                </label>
                <input
                  type="datetime-local"
                  name="foodDetails.expiryTime"
                  value={formData.foodDetails.expiryTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                />
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Pickup Address
                  </label>
                  <input
                    type="text"
                    name="pickupLocation.address"
                    value={formData.pickupLocation.address}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base"
                    placeholder="Enter full address"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
                      📍 Pickup Location Coordinates
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {user?.location?.coordinates && (
                        <button
                          type="button"
                          onClick={useStoredLocation}
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2"
                        >
                          <span>💾</span>
                          <span className="hidden sm:inline">Use Stored Location</span>
                          <span className="sm:hidden">Stored</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-green-600 rounded-lg hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2"
                      >
                        {locationLoading ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>Getting Location...</span>
                          </>
                        ) : (
                          <>
                            <span>📍</span>
                            <span>Get My Location</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {locationError && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-lg">
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm">{locationError}</p>
                    </div>
                  )}

                  {/* Interactive Map */}
                  <LocationMap
                    latitude={formData.pickupLocation.coordinates.latitude}
                    longitude={formData.pickupLocation.coordinates.longitude}
                    onLocationChange={handleMapLocationChange}
                    storedLocation={user?.location && showForm && !isFormClosing ? user.location : null}
                  />
                  
                  {/* Hidden coordinate inputs for form validation */}
                  <input
                    type="hidden"
                    name="coordinates.latitude"
                    value={formData.pickupLocation.coordinates.latitude}
                    required
                  />
                  <input
                    type="hidden"
                    name="coordinates.longitude"
                    value={formData.pickupLocation.coordinates.longitude}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                <input
                  type="checkbox"
                  name="donorWilling"
                  checked={formData.donorWilling}
                  onChange={handleChange}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400 rounded focus:ring-primary-500"
                />
                <label className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  I can deliver myself (if unchecked, volunteer will be notified)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || loadingHungerSpots}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                {loadingHungerSpots ? 'Finding Hunger Spots...' : loading ? 'Creating...' : '✨ Create Donation'}
              </button>
            </form>
          </div>
        )}

        {/* Hunger Spot Selection Modal */}
        {showHungerSpotSelection && (
          <>
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[9998]" onClick={() => setShowHungerSpotSelection(false)} />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-primary-200 dark:border-primary-700 max-w-2xl w-full p-4 sm:p-6 animate-modal-pop-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Select Hunger Spot</h3>
                  <button
                    onClick={() => setShowHungerSpotSelection(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">Select a hunger spot to deliver your donation:</p>
                <div className="space-y-2 sm:space-y-3 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                  {hungerSpots.map((spot, index) => {
                    // Extract coordinates: GeoJSON format is [longitude, latitude], Google Maps needs [latitude, longitude]
                    const coordinates = spot.location?.coordinates;
                    const googleMapsUrl = coordinates && coordinates.length === 2
                      ? `https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}`
                      : null;

                    return (
                      <button
                        key={spot._id}
                        onClick={() => handleHungerSpotSelect(spot)}
                        className="w-full p-3 sm:p-4 text-left bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <span className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400">#{index + 1}</span>
                              <h4 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200 truncate">{spot.name}</h4>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                📍 {spot.location?.address || 'Address not available'}
                              </p>
                              {googleMapsUrl && (
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-xs sm:text-sm flex items-center gap-1 underline transition-colors whitespace-nowrap"
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
                            {spot.contactPerson && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                👤 {spot.contactPerson.name || 'Contact person'}
                              </p>
                            )}
                          </div>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && selectedHungerSpot && (
          <>
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[9998]" onClick={() => setShowConfirmation(false)} />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-green-200 dark:border-green-700 max-w-md w-full p-4 sm:p-6 animate-modal-pop-in">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✅</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Confirm Donation</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">You will deliver to:</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <h4 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200 mb-1 sm:mb-2">{selectedHungerSpot.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                    📍 {selectedHungerSpot.location?.address || 'Address not available'}
                  </p>
                  {selectedHungerSpot.contactPerson && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      👤 {selectedHungerSpot.contactPerson.name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setSelectedHungerSpot(null);
                    }}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-sm sm:text-base transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDonation}
                    disabled={loading}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? 'Creating...' : 'Confirm & Create'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Donations List */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="text-2xl sm:text-3xl mr-2 sm:mr-3">📋</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">My Donations</h2>
            <span className="ml-2 sm:ml-4 px-2 sm:px-3 py-1 bg-gradient-to-r from-primary-100 to-green-100 dark:from-primary-900/30 dark:to-green-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs sm:text-sm font-semibold">
              {donations.length}
            </span>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading donations...</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📦</div>
              <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 font-medium">No donations yet</p>
              <p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 mt-2">Create your first donation to get started!</p>
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
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex items-start text-gray-600 dark:text-gray-400">
                      <span className="mr-1 sm:mr-2 flex-shrink-0">📍</span>
                      <span className="break-words">Pickup: {donation.pickupLocation?.address}</span>
                    </div>
                    {donation.assignedHungerSpot && (
                      <div className="flex items-start text-gray-600 dark:text-gray-400">
                        <span className="mr-1 sm:mr-2 flex-shrink-0">🏠</span>
                        <span className="break-words">
                          Delivery: {donation.assignedHungerSpot.name} - {donation.assignedHungerSpot.location?.address}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <span className="mr-1 sm:mr-2">🕒</span>
                      <span className="text-xs sm:text-sm">{new Date(donation.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Finding Volunteer Animation for Non-Donor-Willing Pending Donations */}
                  {!donation.donorWilling && donation.status === 'pending' && (
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-semibold">Finding Volunteer...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Update Buttons for Donor-Willing Donations */}
                  {donation.donorWilling && donation.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                      <button
                        onClick={() => handleStatusUpdate(donation._id, 'in_transit')}
                        disabled={loading}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🚗 In Transit
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(donation._id, 'delivered')}
                        disabled={loading}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✅ Delivered
                      </button>
                    </div>
                  )}

                  {donation.donorWilling && donation.status === 'in_transit' && (
                    <button
                      onClick={() => handleStatusUpdate(donation._id, 'delivered')}
                      disabled={loading}
                      className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✅ Mark as Delivered
                    </button>
                  )}

                  {/* Cancel Button - Show for donor-willing (any status except cancelled/rejected) or non-donor-willing pending */}
                  {((donation.donorWilling && donation.status !== 'cancelled' && donation.status !== 'rejected') || (!donation.donorWilling && donation.status === 'pending')) && (
                    <button
                      onClick={() => handleCancelDonation(donation._id)}
                      disabled={loading}
                      className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ❌ Cancel Donation
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DonorDashboard;
