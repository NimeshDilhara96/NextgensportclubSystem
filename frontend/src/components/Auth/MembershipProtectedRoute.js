import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const MembershipProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  useEffect(() => {
    const checkMembership = async () => {
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('userEmail');
      
      if (!token || !userEmail) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
        if (response.data.status === 'success') {
          const user = response.data.user;
          const membershipPackage = user.membershipPackage;
          const membershipStatus = user.membershipStatus;
          const membershipEnd = user.membershipEnd;
          
          // Check if user has an active membership (not free and not expired)
          const hasActiveMembership = 
            membershipPackage && 
            membershipPackage !== 'free' && 
            membershipStatus === 'active' &&
            (!membershipEnd || new Date(membershipEnd) > new Date());
          
          setHasMembership(hasActiveMembership);
          
          if (!hasActiveMembership) {
            setShowMessage(true);
            // Redirect to membership page after 3 seconds
            setTimeout(() => {
              window.location.href = '/membership';
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error checking membership:', error);
        setHasMembership(false);
        setShowMessage(true);
        setTimeout(() => {
          window.location.href = '/membership';
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    checkMembership();
  }, []);
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          🔄 Checking membership status...
        </div>
      </div>
    );
  }
  
  if (showMessage && !hasMembership) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          border: '2px solid #e74c3c'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
          <h2 style={{ 
            color: '#e74c3c', 
            marginBottom: '20px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Membership Required
          </h2>
          <p style={{ 
            fontSize: '18px', 
            marginBottom: '20px', 
            color: '#555',
            lineHeight: '1.5'
          }}>
            Please purchase our club membership to access this premium feature.
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#777',
            marginBottom: '25px'
          }}>
            You will be redirected to the membership page in a few seconds...
          </p>
          <button 
            onClick={() => window.location.href = '/membership'}
            style={{
              padding: '12px 30px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            🚀 Upgrade Now
          </button>
        </div>
      </div>
    );
  }
  
  return hasMembership ? children : <Navigate to="/membership" replace />;
};

export default MembershipProtectedRoute;