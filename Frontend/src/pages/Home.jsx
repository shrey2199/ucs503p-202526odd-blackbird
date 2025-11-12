import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Home = () => {
  const { user, userType } = useAuth();

  if (user) {
    // User is logged in, redirect to their dashboard
    const dashboardPath = userType === 'donor' ? '/donor/dashboard' : '/volunteer/dashboard';
    window.location.href = dashboardPath;
    return null;
  }

  return (
    <Layout>
      <div className="text-center py-8 sm:py-12 md:py-20 px-4">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6 flex justify-center">
            <img
              src="/Logo.png"
              alt="Second Serving Logo"
              className="h-20 sm:h-24 md:h-32 w-auto animate-bounce"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-primary-600 via-green-600 to-primary-600 dark:from-primary-400 dark:via-green-400 dark:to-primary-400 bg-clip-text text-transparent animate-pulse leading-tight sm:leading-[1.2] pb-2 px-2">
            Welcome to Second Serving
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 font-medium px-4">
            Connecting food donors with volunteers to fight hunger
          </p>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Join our mission to reduce food waste and feed those in need. Every donation makes a difference.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-8 sm:mt-12 px-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-green-600 text-white rounded-xl hover:from-primary-700 hover:to-green-700 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span>Get Started</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-green-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-2 border-primary-600 dark:border-primary-400 rounded-xl hover:bg-primary-50 dark:hover:bg-gray-700 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Login
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto px-4">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎁</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Donate Food</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Easily donate excess food from your restaurant, event, or home</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚚</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Volunteer</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Help transport donations to those in need in your community</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">❤️</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Make Impact</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Together we can reduce food waste and fight hunger</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
