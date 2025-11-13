import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, hungerSpot, userType, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check if user is logged in (either user or hungerSpot)
  const isAuthenticated = user || hungerSpot;

  if (!isAuthenticated) {
    // Redirect to appropriate login page
    if (requiredUserType === 'hungerSpot') {
      return <Navigate to="/hunger-spot/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

