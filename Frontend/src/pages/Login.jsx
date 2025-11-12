import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get returnTo from location state
  const returnTo = location.state?.returnTo;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any event bubbling that might cause reload
    
    // Clear previous error only when submitting
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(
        formData.phoneNumber,
        formData.password,
        userType
      );
      // Login user with token
      login(response.data.user, response.token);
      
      // Check if there's a return path (from AcceptDonation page)
      if (returnTo) {
        navigate(returnTo);
      } else {
        // Navigate to appropriate dashboard
        const userType = response.data.user.userType;
        navigate(userType === 'donor' ? '/donor/dashboard' : '/volunteer/dashboard');
      }
    } catch (err) {
      // Set error message and keep it visible
      const errorMessage = err.response?.data?.message || 'Incorrect phone number or password. Please try again.';
      setError(errorMessage);
      setLoading(false); // Stop loading so user can try again
    }
  };

  // Show userType selection if not selected yet
  if (!userType) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔐</div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Choose your account type to continue</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <button
                type="button"
                onClick={() => setUserType('donor')}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3"
              >
                <span className="text-xl sm:text-2xl">🎁</span>
                <span>Login as Donor</span>
              </button>

              <button
                type="button"
                onClick={() => setUserType('volunteer')}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3"
              >
                <span className="text-xl sm:text-2xl">🚚</span>
                <span>Login as Volunteer</span>
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <a href="/signup" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold hover:underline">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔐</div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Sign in as <span className="font-semibold capitalize">{userType}</span>
            </p>
            <button
              type="button"
              onClick={() => setUserType('')}
              className="mt-2 text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
            >
              Change account type
            </button>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fade-in">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => {
                  handleChange(e);
                  // Clear error when user starts typing
                  if (error) setError('');
                }}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                placeholder="+91XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) => {
                  handleChange(e);
                  // Clear error when user starts typing
                  if (error) setError('');
                }}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
