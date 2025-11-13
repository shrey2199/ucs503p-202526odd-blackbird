import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import Layout from '../components/Layout';
import LocationMap from '../components/LocationMap';

const UserAccount = () => {
  const { user, updateUser, logout, userType } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    passwordCurrent: '',
    password: '',
    passwordConfirm: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    organizationType: '',
    latitude: '',
    longitude: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Initialize profile form when user loads
  useEffect(() => {
    if (user) {
      const [longitude, latitude] = user.location?.coordinates || [0, 0];
      setProfileForm({
        fullName: user.fullName || '',
        organizationType: user.organizationType || '',
        latitude: latitude.toString(),
        longitude: longitude.toString()
      });
    }
  }, [user]);

  // Organization types for donors
  const ORGANIZATION_TYPES = ['restaurant', 'wedding', 'event', 'institution', 'individual'];

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleLocationChange = (lat, lng) => {
    setProfileForm({
      ...profileForm,
      latitude: lat.toString(),
      longitude: lng.toString()
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser. Please use the map to select a location.', 'error');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setProfileForm({
          ...profileForm,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        showToast('Failed to get your location. Please use the map to select a location.', 'error');
      }
    );
  };

  const useStoredLocation = () => {
    if (user?.location?.coordinates && user.location.coordinates.length === 2) {
      const [longitude, latitude] = user.location.coordinates;
      setProfileForm({
        ...profileForm,
        latitude: latitude.toString(),
        longitude: longitude.toString()
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.password !== passwordForm.passwordConfirm) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (passwordForm.password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    try {
      setUpdatingPassword(true);
      await authService.updatePassword(
        passwordForm.passwordCurrent,
        passwordForm.password,
        passwordForm.passwordConfirm
      );
      
      // Show success toast and redirect after user clicks OK
      showToast('Password changed successfully. Please log in again with your new password.', 'success', () => {
        // This callback runs when user clicks OK on the toast
        logout();
        navigate('/login', {
          state: { message: 'Password changed successfully. Please log in again with your new password.' }
        });
      });
      
      // Reset form
      setPasswordForm({
        passwordCurrent: '',
        password: '',
        passwordConfirm: ''
      });
      setUpdatingPassword(false);
    } catch (error) {
      console.error('Error updating password:', error);
      showToast(
        error.response?.data?.message || 'Failed to update password',
        'error'
      );
      setUpdatingPassword(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // Validate location coordinates
    const lat = parseFloat(profileForm.latitude);
    const lng = parseFloat(profileForm.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      showToast('Please select a valid location on the map', 'error');
      return;
    }

    try {
      setUpdatingProfile(true);
      const profileData = {
        fullName: profileForm.fullName,
        location: {
          type: 'Point',
          coordinates: [lng, lat] // [longitude, latitude] - GeoJSON format
        }
      };

      // Only include organizationType if user is a donor
      if (userType === 'donor' && profileForm.organizationType) {
        profileData.organizationType = profileForm.organizationType;
      }

      const response = await authService.updateProfile(profileData);
      updateUser(response.data.user);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(
        error.response?.data?.message || 'Failed to update profile',
        'error'
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Get dashboard path based on user type
  const getDashboardPath = () => {
    if (userType === 'donor') return '/donor/dashboard';
    if (userType === 'volunteer') return '/volunteer/dashboard';
    return '/';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(getDashboardPath())}
            className="mb-4 flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent">
            My Account
          </h1>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Password Update Section */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 sm:mb-6">
              Change Password
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="passwordCurrent"
                  value={passwordForm.passwordCurrent}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={passwordForm.password}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters long
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={passwordForm.passwordConfirm}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Profile Update Section */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 sm:mb-6">
              Update Profile
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              {userType === 'donor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization Type
                  </label>
                  <select
                    name="organizationType"
                    value={profileForm.organizationType}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select organization type</option>
                    {ORGANIZATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locationLoading ? 'Getting Location...' : '📍 Use Current Location'}
                  </button>
                  <button
                    type="button"
                    onClick={useStoredLocation}
                    disabled={!user?.location?.coordinates}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    💾 Use Stored Location
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Click on the map or drag the marker to set your location. Changes will be saved when you click "Update Profile".
                </p>
                <LocationMap
                  latitude={profileForm.latitude}
                  longitude={profileForm.longitude}
                  onLocationChange={handleLocationChange}
                  storedLocation={user?.location}
                />
              </div>
              
              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingProfile ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserAccount;

