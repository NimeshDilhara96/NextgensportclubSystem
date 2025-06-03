import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check if token exists (in sessionStorage, not localStorage)
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('userEmail');
      
      if (!token || !userEmail) {
        setIsChecking(false);
        return;
      }
      
      try {
        // Verify current membership status from server
        const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data?.user?.membershipStatus === 'blocked') {
          // If blocked, clear session and redirect
          sessionStorage.clear();
          setIsAllowed(false);
        } else {
          // Update status in session and allow access
          sessionStorage.setItem('membershipStatus', response.data.user.membershipStatus);
          setIsAllowed(true);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        // On error, default to token check only
        setIsAllowed(true);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Show loading while checking
  if (isChecking) {
    return <div>Verifying your access...</div>;
  }
  
  return isAllowed ? children : <Navigate to="/login" />;
};

export default PrivateRoute;