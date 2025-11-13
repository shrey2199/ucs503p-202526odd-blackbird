import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import Login from './pages/Login';
import HungerSpotLogin from './pages/HungerSpotLogin';
import DonorDashboard from './pages/DonorDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import HungerSpotDashboard from './pages/HungerSpotDashboard';
import HungerSpotAccount from './pages/HungerSpotAccount';
import UserAccount from './pages/UserAccount';
import AcceptDonation from './pages/AcceptDonation';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <DarkModeProvider>
      <ToastProvider>
        <AuthProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hunger-spot/login" element={<HungerSpotLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/donor/dashboard"
            element={
              <ProtectedRoute requiredUserType="donor">
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/dashboard"
            element={
              <ProtectedRoute requiredUserType="volunteer">
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hunger-spot/dashboard"
            element={
              <ProtectedRoute requiredUserType="hungerSpot">
                <HungerSpotDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hunger-spot/account"
            element={
              <ProtectedRoute requiredUserType="hungerSpot">
                <HungerSpotAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <UserAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/accept/:foodId"
            element={<AcceptDonation />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
        </AuthProvider>
      </ToastProvider>
    </DarkModeProvider>
  );
}

export default App;
