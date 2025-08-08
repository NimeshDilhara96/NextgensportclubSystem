import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SlideNav from '../appnavbar/slidenav';
import Container from '../common/Container';
import styles from './settings.module.css';
import logo from '../../assets/logo.png';
import mommentxLogo from '../../assets/MommentX-removebg-preview.png';

const AccountSettings = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState('');

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingError('');
        const userEmail = sessionStorage.getItem('userEmail');
        console.log('User email from session:', userEmail); // Debug log
        
        if (!userEmail) {
          setLoadingError('No user session found. Please login again.');
          setUser({}); // Set empty object to stop loading
          return;
        }

        console.log('Fetching user data for:', userEmail); // Debug log
        const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
        console.log('API response:', response.data); // Debug log
        
        if (response.data.status === "success" && response.data.user) {
          setUser(response.data.user);
          setEmail(response.data.user.email);
          console.log('User data loaded successfully'); // Debug log
        } else {
          console.log('Unexpected response format:', response.data); // Debug log
          setLoadingError('Invalid response format from server');
          setUser({}); // Set empty object to stop loading
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.log('Error details:', error.response); // Debug log
        
        if (error.response?.status === 404) {
          setLoadingError('User not found. Please login again.');
        } else if (error.response?.status === 500) {
          setLoadingError('Server error. Please try again later.');
        } else if (error.code === 'ECONNREFUSED') {
          setLoadingError('Cannot connect to server. Please check if the backend is running.');
        } else {
          setLoadingError(error.response?.data?.message || 'Failed to load user data');
        }
        setUser({}); // Set empty object to stop loading
      }
    };

    fetchUserData();
  }, []);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleCurrentPasswordChange = (e) => setCurrentPassword(e.target.value);
  const handleNewPasswordChange = (e) => setNewPassword(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailMsg('');

    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        setEmailMsg('No user session found. Please login again.');
        setIsLoading(false);
        return;
      }

      // Check if email is different from current
      if (email === user.email) {
        setEmailMsg('New email must be different from current email');
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailMsg('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      const response = await axios.put(`http://localhost:8070/user/updateByEmail/${userEmail}`, {
        email: email
      });

      if (response.data.status === "User updated") {
        setUser(response.data.user);
        // Update session storage with new email
        sessionStorage.setItem('userEmail', email);
        setEmailMsg('Email updated successfully!');
        setTimeout(() => setEmailMsg(''), 3000);
      } else {
        setEmailMsg(response.data.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('duplicate')) {
        setEmailMsg('This email is already registered with another account');
      } else {
        setEmailMsg(error.response?.data?.message || 'Failed to update email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPwMsg('');

    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        setPwMsg('No user session found. Please login again.');
        setIsLoading(false);
        return;
      }

      // Validation
      if (!currentPassword) {
        setPwMsg('Current password is required');
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setPwMsg('New password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPwMsg('New passwords do not match');
        setIsLoading(false);
        return;
      }

      if (currentPassword === newPassword) {
        setPwMsg('New password must be different from current password');
        setIsLoading(false);
        return;
      }

      // First verify current password
      const verifyResponse = await axios.post('http://localhost:8070/user/verifyPassword', {
        email: userEmail,
        password: currentPassword
      });

      if (!verifyResponse.data.success) {
        setPwMsg('Current password is incorrect');
        setIsLoading(false);
        return;
      }

      // Update password
      const updateResponse = await axios.put(`http://localhost:8070/user/updatePassword/${userEmail}`, {
        newPassword: newPassword
      });

      if (updateResponse.data.status === "Password updated") {
        setPwMsg('Password updated successfully!');
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwMsg(''), 3000);
      } else {
        setPwMsg(updateResponse.data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPwMsg(error.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteMsg('');

    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        setDeleteMsg('No user session found. Please login again.');
        setIsDeleting(false);
        return;
      }

      console.log('Attempting to delete user:', userEmail); // Debug log
      
      const response = await axios.delete(`http://localhost:8070/user/delete/${userEmail}`);
      
      console.log('Delete response:', response.data); // Debug log
      console.log('Response status:', response.status); // Debug log
      
      // Check for various success indicators
      const isSuccess = 
        response.data.status === "User deleted" ||
        response.data.status === "success" ||
        response.data.message === "User deleted successfully" ||
        response.data.message === "Account deleted successfully" ||
        response.status === 200;

      if (isSuccess) {
        setDeleteMsg('Account deleted successfully. Redirecting to login...');
        
        // Clear session storage
        sessionStorage.clear();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        console.log('Unexpected success response format:', response.data);
        setDeleteMsg(response.data.message || response.data.status || 'Unexpected response format');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      console.log('Error response:', error.response); // Debug log
      
      // If the error is actually a successful deletion (some backends return 200 but axios treats as error)
      if (error.response && error.response.status === 200) {
        setDeleteMsg('Account deleted successfully. Redirecting to login...');
        sessionStorage.clear();
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      if (error.response) {
        setDeleteMsg(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        setDeleteMsg('No response from server. Please check your connection.');
      } else {
        setDeleteMsg('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Show loading state
  if (user === null) {
    return (
      <div className={styles.settingsCard}>
        <div className={styles.cardContent}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div className="spinner" style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
            <p>Loading user data...</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              If this takes too long, please check your internet connection or try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadingError) {
    return (
      <div className={styles.settingsCard}>
        <div className={styles.cardContent}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ color: '#e74c3c', marginBottom: '20px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3>Error Loading Data</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>{loadingError}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if user object is empty
  if (user && Object.keys(user).length === 0) {
    return (
      <div className={styles.settingsCard}>
        <div className={styles.cardContent}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No User Data</h3>
            <p>Please login again to access your settings.</p>
            <button 
              onClick={() => window.location.href = '/login'} 
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settingsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C8.07 2 6.5 3.57 6.5 5.5C6.5 7.43 8.07 9 10 9C11.93 9 13.5 7.43 13.5 5.5C13.5 3.57 11.93 2 10 2ZM10 7C9.17 7 8.5 6.33 8.5 5.5C8.5 4.67 9.17 4 10 4C10.83 4 11.5 4.67 11.5 5.5C11.5 6.33 10.83 7 10 7ZM10 11C6.69 11 4 13.69 4 17C4 17.55 4.45 18 5 18C5.55 18 6 17.55 6 17C6 14.79 7.79 13 10 13C12.21 13 14 14.79 14 17C14 17.55 14.45 18 15 18C15.55 18 16 17.55 16 17C16 13.69 13.31 11 10 11Z" fill="currentColor"/>
          </svg>
        </div>
        <div className={styles.cardTitle}>
          <h2>Account Settings</h2>
          <p>Manage your account details and preferences</p>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.settingsSection}>
          <h3>Email Address</h3>
          <p className={styles.sectionDescription}>
            Current email: <strong>{user.email}</strong>
          </p>
          <form onSubmit={handleEmailSubmit} className={styles.settingsForm}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>New Email Address</label>
              <input
                className={styles.inputField}
                type="email"
                placeholder="Enter new email"
                value={email}
                onChange={handleEmailChange}
                required
                disabled={isLoading}
              />
            </div>
            <button 
              className={styles.primaryButton} 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Email'}
            </button>
            {emailMsg && (
              <div className={emailMsg.includes('success') ? styles.successMessage : styles.errorMessage}>
                {emailMsg}
              </div>
            )}
          </form>
        </div>

        <div className={styles.settingsSection}>
          <h3>Password</h3>
          <p className={styles.sectionDescription}>Change your password to keep your account secure</p>
          <form onSubmit={handlePasswordSubmit} className={styles.settingsForm}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Current Password</label>
              <input
                className={styles.inputField}
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={handleCurrentPasswordChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>New Password</label>
              <input
                className={styles.inputField}
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={handleNewPasswordChange}
                required
                minLength="6"
                disabled={isLoading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Confirm New Password</label>
              <input
                className={styles.inputField}
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                disabled={isLoading}
              />
            </div>
            <button 
              className={styles.primaryButton} 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
            {pwMsg && (
              <div className={pwMsg.includes('success') ? styles.successMessage : styles.errorMessage}>
                {pwMsg}
              </div>
            )}
          </form>
        </div>

        <div className={styles.settingsSection}>
          <h3>Delete Account</h3>
          <p className={styles.sectionDescription}>
            Permanently delete your account and all associated data
          </p>
          <div className={styles.dangerZone}>
            <button
              className={styles.dangerButton}
              onClick={() => setShowDeleteConfirm(true)}
              type="button"
              disabled={isDeleting}
            >
              Delete My Account
            </button>
            {showDeleteConfirm && (
              <div className={styles.confirmationModal}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h4>Delete Account</h4>
                  </div>
                  <div className={styles.modalBody}>
                    <p>Are you sure you want to delete your account? This action is <strong>permanent</strong> and cannot be undone.</p>
                    <p><strong>Email:</strong> {user.email}</p>
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      className={styles.dangerButton}
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                    </button>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setShowDeleteConfirm(false)}
                      type="button"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {deleteMsg && (
              <div className={deleteMsg.includes('success') ? styles.successMessage : styles.errorMessage}>
                {deleteMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TermsAndPolicy = () => (
  <div className={styles.settingsCard}>
    <div className={styles.cardHeader}>
      <div className={styles.cardIcon}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 4C4 2.89 4.89 2 6 2H14C15.11 2 16 2.89 16 4V16C16 17.11 15.11 18 14 18H6C4.89 18 4 17.11 4 16V4ZM6 4V16H14V4H6ZM8 6H12V8H8V6ZM8 10H12V12H8V10ZM8 14H10V16H8V14Z" fill="currentColor"/>
        </svg>
      </div>
      <div className={styles.cardTitle}>
        <h2>Club Terms & Policy</h2>
        <p>Review our terms of service and privacy policy</p>
      </div>
    </div>
    
    <div className={styles.cardContent}>
      <div className={styles.termsContent}>
        <div className={styles.termsSection}>
          <h3>Terms of Service</h3>
          <p>
            By using our club and MommentX platform, you agree to abide by our community guidelines and all applicable laws. You are responsible for your account and any activity conducted under it. Do not share your password with others. We reserve the right to suspend or terminate accounts that violate our terms.
          </p>
        </div>
        
        <div className={styles.termsSection}>
          <h3>Privacy Policy</h3>
          <p>
            We value your privacy. Your personal data is stored securely and is never sold to third parties. We use your information to provide and improve our services. You can request deletion of your data at any time by using the account deletion feature above.
          </p>
        </div>
        
        <div className={styles.termsSection}>
          <h3>Data Usage</h3>
          <p>
            We collect minimal data necessary for your experience. For more details, contact our support team.
          </p>
        </div>
        
        <div className={styles.termsSection}>
          <h3>Platform Information</h3>
          <p>
            <strong>Club FTC</strong> is powered by <strong>MommentX</strong> — your trusted club management partner, providing comprehensive solutions for modern sports organizations.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const Settings = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('account');

  return (
    <>
      <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <Container isSidebarOpen={isSidebarOpen}>
        <div className={styles.settingsContainer}>
          <div className={styles.settingsHeader}>
            <div className={styles.headerContent}>
              <h1>Settings</h1>
              <p className={styles.headerSubtitle}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className={styles.settingsLayout}>
            <div className={styles.settingsSidebar}>
              <nav className={styles.settingsNav}>
                <button
                  className={`${styles.navItem} ${activeTab === 'account' ? styles.active : ''}`}
                  onClick={() => setActiveTab('account')}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2C8.07 2 6.5 3.57 6.5 5.5C6.5 7.43 8.07 9 10 9C11.93 9 13.5 7.43 13.5 5.5C13.5 3.57 11.93 2 10 2ZM10 11C6.69 11 4 13.69 4 17C4 17.55 4.45 18 5 18C5.55 18 6 17.55 6 17C6 14.79 7.79 13 10 13C12.21 13 14 14.79 14 17C14 17.55 14.45 18 15 18C15.55 18 16 17.55 16 17C16 13.69 13.31 11 10 11Z" fill="currentColor"/>
                  </svg>
                  <span>Account Settings</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeTab === 'terms' ? styles.active : ''}`}
                  onClick={() => setActiveTab('terms')}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 4C4 2.89 4.89 2 6 2H14C15.11 2 16 2.89 16 4V16C16 17.11 15.11 18 14 18H6C4.89 18 4 17.11 4 16V4ZM6 4V16H14V4H6ZM8 6H12V8H8V6ZM8 10H12V12H8V10ZM8 14H10V16H8V14Z" fill="currentColor"/>
                  </svg>
                  <span>Terms & Policy</span>
                </button>
              </nav>
            </div>

            <div className={styles.settingsMain}>
              {activeTab === 'account' ? <AccountSettings /> : <TermsAndPolicy />}
            </div>
          </div>

          <footer className={styles.settingsFooter}>
            <div className={styles.footerContent}>
              <div className={styles.footerBranding}>
                <div className={styles.brandingItem}>
                  <img src={logo} alt="Club FTC" className={styles.clubLogo} />
                  <div className={styles.brandingText}>
                    <h4>Club FTC</h4>
                    <p>NextGen Sport Club Platform</p>
                  </div>
                </div>
                <div className={styles.brandingDivider}>×</div>
                <div className={styles.brandingItem}>
                  <img src={mommentxLogo} alt="MommentX" className={styles.mommentxLogo} />
                  <div className={styles.brandingText}>
                    <h4>MommentX</h4>
                    <p>Platform Developer</p>
                  </div>
                </div>
              </div>
              <div className={styles.footerInfo}>
                <p>© {new Date().getFullYear()} Club FTC. All rights reserved.</p>
                <p>Design & Developed by <strong>MommentX</strong> - nimeshdilhara96</p>
              </div>
            </div>
          </footer>
        </div>
      </Container>
    </>
  );
};

export default Settings;