import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // Check if user is logged in (you can modify this according to your auth logic)
  const isAuthenticated = localStorage.getItem('token'); // or however you store your auth token

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute; 