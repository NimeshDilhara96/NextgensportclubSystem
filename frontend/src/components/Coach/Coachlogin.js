import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './coachLogin.module.css';

const CoachLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8070/coaches/login', credentials);
      
      // Check if login was successful and coach data exists
      if (response.data.success && response.data.coach) {
        sessionStorage.setItem('coachEmail', response.data.coach.email); // <-- ADD THIS LINE
        // Store coach data in session storage
        sessionStorage.setItem('coachId', response.data.coach._id);
        sessionStorage.setItem('coachName', response.data.coach.name);
        sessionStorage.setItem('coachUsername', response.data.coach.username);
        sessionStorage.setItem('coachSpecialty', response.data.coach.specialty);
        sessionStorage.setItem('coachToken', response.data.token);
        sessionStorage.setItem('isCoachLoggedIn', 'true');
        
        // Navigate to coach dashboard
        navigate('/coach/dashboard', { replace: true });
      } else {
        setError('Invalid login response. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.coachLoginPage}>
      <div className={styles.coachLoginContainer}>
        <div className={styles.coachLoginBox}>
          <div className={styles.coachLoginHeader}>
            <h2>Coach Login</h2>
            <p>Access your coaching dashboard</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <button 
              type="submit" 
              className={styles.loginButton} 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className={styles.loginFooter}>
            <p>Forgot your password? Contact admin.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachLogin;