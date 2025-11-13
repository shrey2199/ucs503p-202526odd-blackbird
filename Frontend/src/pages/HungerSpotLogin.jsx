import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { hungerSpotService } from '../services/hungerSpotService';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SearchableSelect from '../components/SearchableSelect';

const HungerSpotLogin = () => {
  const navigate = useNavigate();
  const { loginHungerSpot } = useAuth();
  const [hungerSpots, setHungerSpots] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedHungerSpot, setSelectedHungerSpot] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHungerSpots();
  }, []);

  // Filter hunger spots by selected state
  const filteredHungerSpots = useMemo(() => {
    if (!selectedState) return [];
    return hungerSpots.filter(spot => spot.location?.state === selectedState);
  }, [hungerSpots, selectedState]);

  // Get unique states from available hunger spots
  const availableStates = useMemo(() => {
    const states = new Set();
    hungerSpots.forEach(spot => {
      if (spot.location?.state) {
        states.add(spot.location.state);
      }
    });
    return Array.from(states).sort();
  }, [hungerSpots]);

  const loadHungerSpots = async () => {
    try {
      setLoadingSpots(true);
      const response = await hungerSpotService.getAllHungerSpots();
      setHungerSpots(response.data || []);
    } catch (err) {
      setError('Failed to load hunger spots. Please try again.');
      console.error('Error loading hunger spots:', err);
    } finally {
      setLoadingSpots(false);
    }
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedHungerSpot(''); // Reset hunger spot selection when state changes
    setFormData({ password: '' }); // Reset password
    if (error) setError('');
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleHungerSpotChange = (hungerSpotId) => {
    setSelectedHungerSpot(hungerSpotId);
    setFormData({ password: '' }); // Reset password when hunger spot changes
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedState) {
      setError('Please select a state');
      return;
    }
    
    if (!selectedHungerSpot) {
      setError('Please select a hunger spot');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await hungerSpotService.login(selectedHungerSpot, formData.password);
      loginHungerSpot(response.data.hungerSpot, response.token);
      navigate('/hunger-spot/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Incorrect password. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🏢</div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
              Hunger Spot Login
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Select your state, hunger spot, and enter your password
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg animate-fade-in">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Select State
              </label>
              <SearchableSelect
                options={availableStates}
                value={selectedState}
                onChange={handleStateChange}
                placeholder={loadingSpots ? "Loading states..." : availableStates.length === 0 ? "No states available" : "-- Select a state --"}
                disabled={loadingSpots || loading || availableStates.length === 0}
                getOptionLabel={(state) => state}
                getOptionValue={(state) => state}
              />
              {loadingSpots && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading hunger spots...</p>
              )}
            </div>

            {selectedState && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Hunger Spot
                </label>
                {filteredHungerSpots.length === 0 ? (
                  <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-base text-center">
                    No hunger spots found in {selectedState}
                  </div>
                ) : (
                  <SearchableSelect
                    options={filteredHungerSpots}
                    value={selectedHungerSpot}
                    onChange={handleHungerSpotChange}
                    placeholder="-- Select a hunger spot --"
                    disabled={loading}
                    getOptionLabel={(spot) => `${spot.name}${spot.location?.address ? ` - ${spot.location.address}` : ''}`}
                    getOptionValue={(spot) => spot._id}
                  />
                )}
              </div>
            )}

            {selectedHungerSpot && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || loadingSpots || !selectedState || !selectedHungerSpot}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <a href="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold hover:underline">
              ← Back to User Login
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default HungerSpotLogin;


