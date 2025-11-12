import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Layout from '../components/Layout';
import LocationMap from '../components/LocationMap';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    passwordConfirm: '',
    userType: 'donor',
    organizationType: 'individual',
    location: {
      type: 'Point',
      coordinates: [0, 0], // [longitude, latitude]
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [hasJoinedSandbox, setHasJoinedSandbox] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch user's location automatically on component mount (only after joining sandbox)
  useEffect(() => {
    if (hasJoinedSandbox) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasJoinedSandbox]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please use the map to select a location.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [longitude, latitude], // [longitude, latitude]
          },
        }));
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access or use the map to select a location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please use the map to select a location.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or use the map to select a location.';
            break;
          default:
            errorMessage += 'Please use the map to select a location.';
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

  const handleMapLocationChange = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: [lng, lat], // [longitude, latitude]
      },
    }));
    setLocationError('');
  };

  const handleJoinSandbox = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmJoin = () => {
    setShowConfirmDialog(false);
    setHasJoinedSandbox(true);
  };

  const handleCancelJoin = () => {
    setShowConfirmDialog(false);
  };

  const openWhatsApp = () => {
    window.open('http://wa.me/+14155238886?text=join%20grain-especially', '_blank');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.signup(formData);
      // Navigate to OTP verification with phone number
      navigate('/verify-otp', { state: { phoneNumber: formData.phoneNumber, userType: formData.userType } });
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show sandbox join step first
  if (!hasJoinedSandbox) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📱</div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
                Join WhatsApp Sandbox
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                To receive OTP via WhatsApp, please join our Twilio sandbox first
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-3 sm:p-4 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium">
                  Choose one of the following methods to join:
                </p>
              </div>

              {/* Method 1: WhatsApp Button */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">Method 1: Open WhatsApp</h3>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl hover:from-[#20BA5A] hover:to-[#0E7A6B] font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3 group"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Open WhatsApp</span>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 fill-current opacity-75 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                  This will open WhatsApp with a pre-filled message. Just tap send!
                </p>
              </div>

              {/* Method 2: QR Code */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">Method 2: Scan QR Code</h3>
                <div className="flex justify-center">
                  <div className="bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-600">
                    <img
                      src="/whatsapp-qr.png"
                      alt="WhatsApp QR Code"
                      className="w-48 sm:w-56 md:w-64 h-48 sm:h-56 md:h-64 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorMsg = e.target.nextElementSibling;
                        if (errorMsg) errorMsg.style.display = 'block';
                      }}
                    />
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mt-2 hidden">
                      QR code image not found. Please use the WhatsApp button above.
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                  Scan this QR code with your WhatsApp to join the sandbox
                </p>
              </div>

              {/* Confirmation Button */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleJoinSandbox}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  ✓ I have sent the message
                </button>
              </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-200 dark:border-gray-700">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">❓</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Are you sure?</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Have you successfully sent the message "join grain-especially" to the WhatsApp number?
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:space-x-0">
                    <button
                      type="button"
                      onClick={handleCancelJoin}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-base sm:text-lg transition-all duration-200"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmJoin}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
              Join Second Serving
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Create your account and start making a difference</p>
          </div>
          
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-lg">
              <p className="text-sm sm:text-base text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  placeholder="+91XXXXXXXXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  I am a
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                >
                  <option value="donor">🎁 Donor</option>
                  <option value="volunteer">🚚 Volunteer</option>
                </select>
              </div>

              {formData.userType === 'donor' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Organization Type
                  </label>
                  <select
                    name="organizationType"
                    value={formData.organizationType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  >
                    <option value="restaurant">🍽️ Restaurant</option>
                    <option value="wedding">💒 Wedding</option>
                    <option value="event">🎉 Event</option>
                    <option value="institution">🏛️ Institution</option>
                    <option value="individual">👤 Individual</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  📍 Location
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-green-600 rounded-lg hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
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

              {locationError && (
                <div className="p-2.5 sm:p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs sm:text-sm">{locationError}</p>
                </div>
              )}

              {/* Interactive Map */}
              <LocationMap
                latitude={formData.location.coordinates[1]}
                longitude={formData.location.coordinates[0]}
                onLocationChange={handleMapLocationChange}
                storedLocation={null}
              />
              
              {/* Hidden coordinate inputs for form validation */}
              <input
                type="hidden"
                name="coordinates.longitude"
                value={formData.location.coordinates[0]}
                required
              />
              <input
                type="hidden"
                name="coordinates.latitude"
                value={formData.location.coordinates[1]}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
