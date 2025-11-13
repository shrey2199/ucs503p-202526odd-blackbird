import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [hasJoinedSandbox, setHasJoinedSandbox] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openWhatsApp = () => {
    window.open('http://wa.me/+14155238886?text=join%20grain-especially', '_blank');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(phone);
      showToast('OTP sent to your WhatsApp number', 'success');
      navigate('/reset-password', { state: { phone } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
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
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-3 sm:p-4">
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
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>Open WhatsApp</span>
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
              <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleJoinSandbox}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  ✓ I have sent the message
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
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
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔐</div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 dark:from-primary-400 dark:to-green-400 bg-clip-text text-transparent mb-2">
              Forgot Password
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Enter your phone number to receive an OTP
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
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-lg hover:from-primary-700 hover:to-green-700 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;

