import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hungerSpotService } from '../services/hungerSpotService';
import Layout from '../components/Layout';

const HungerSpotAccount = () => {
  const { hungerSpot, updateHungerSpot, logout } = useAuth();
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
    name: '',
    contactPersonName: '',
    contactPersonPhone: '',
    address: '',
    state: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Initialize profile form when hungerSpot loads
  useEffect(() => {
    if (hungerSpot) {
      setProfileForm({
        name: hungerSpot.name || '',
        contactPersonName: hungerSpot.contactPerson?.name || '',
        contactPersonPhone: hungerSpot.contactPerson?.phone || '',
        address: hungerSpot.location?.address || '',
        state: hungerSpot.location?.state || ''
      });
    }
  }, [hungerSpot]);

  // Indian states and union territories
  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

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
      const response = await hungerSpotService.updatePassword(
        passwordForm.passwordCurrent,
        passwordForm.password,
        passwordForm.passwordConfirm
      );
      
      // Show success toast and redirect after user clicks OK
      showToast('Password changed successfully. Please log in again with your new password.', 'success', () => {
        // This callback runs when user clicks OK on the toast
        logout();
        navigate('/hunger-spot/login', {
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

    try {
      setUpdatingProfile(true);
      const profileData = {
        name: profileForm.name,
        contactPerson: {
          name: profileForm.contactPersonName,
          phone: profileForm.contactPersonPhone
        },
        location: {
          address: profileForm.address,
          state: profileForm.state,
          type: 'Point',
          coordinates: hungerSpot?.location?.coordinates || [0, 0] // Keep existing coordinates
        }
      };

      const response = await hungerSpotService.updateProfile(profileData);
      updateHungerSpot(response.data.hungerSpot);
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/hunger-spot/dashboard')}
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
                  Hunger Spot Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={profileForm.contactPersonName}
                  onChange={handleProfileChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Person Phone
                </label>
                <input
                  type="tel"
                  name="contactPersonPhone"
                  value={profileForm.contactPersonPhone}
                  onChange={handleProfileChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  required
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State
                </label>
                <select
                  name="state"
                  value={profileForm.state}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select a state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
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

export default HungerSpotAccount;

