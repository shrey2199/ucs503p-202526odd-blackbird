import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get phone number and userType from navigation state
    const phone = location.state?.phoneNumber || '';
    const type = location.state?.userType || '';
    if (!phone || !type) {
      navigate('/signup');
      return;
    }
    setPhoneNumber(phone);
    setUserType(type);
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.verifyOtp(phoneNumber, otp, userType);
      // Login user with token
      login(response.data.user, response.token);
      // Navigate to appropriate dashboard
      const responseUserType = response.data.user.userType;
      navigate(responseUserType === 'donor' ? '/donor/dashboard' : '/volunteer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📱</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
              Verify OTP
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the OTP sent to <span className="font-semibold text-gray-800 dark:text-gray-200">{phoneNumber}</span>
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-lg">
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center text-3xl tracking-[0.5em] font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyOtp;
