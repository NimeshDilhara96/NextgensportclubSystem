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
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteConfirmError, setDeleteConfirmError] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState('');

  const REQUIRED_DELETE_TEXT = "delete my account";

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingError('');
        const userEmail = sessionStorage.getItem('userEmail');
        console.log('User email from session:', userEmail);
        
        if (!userEmail) {
          setLoadingError('No user session found. Please login again.');
          setUser({});
          return;
        }

        console.log('Fetching user data for:', userEmail);
        const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
        console.log('API response:', response.data);
        
        if (response.data.status === "success" && response.data.user) {
          setUser(response.data.user);
          setEmail(response.data.user.email);
          console.log('User data loaded successfully');
        } else {
          console.log('Unexpected response format:', response.data);
          setLoadingError('Invalid response format from server');
          setUser({});
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.log('Error details:', error.response);
        
        if (error.response?.status === 404) {
          setLoadingError('User not found. Please login again.');
        } else if (error.response?.status === 500) {
          setLoadingError('Server error. Please try again later.');
        } else if (error.code === 'ECONNREFUSED') {
          setLoadingError('Cannot connect to server. Please check if the backend is running.');
        } else {
          setLoadingError(error.response?.data?.message || 'Failed to load user data');
        }
        setUser({});
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

      if (email === user.email) {
        setEmailMsg('New email must be different from current email');
        setIsLoading(false);
        return;
      }

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

      const verifyResponse = await axios.post('http://localhost:8070/user/verifyPassword', {
        email: userEmail,
        password: currentPassword
      });

      if (!verifyResponse.data.success) {
        setPwMsg('Current password is incorrect');
        setIsLoading(false);
        return;
      }

      const updateResponse = await axios.put(`http://localhost:8070/user/updatePassword/${userEmail}`, {
        newPassword: newPassword
      });

      if (updateResponse.data.status === "Password updated") {
        setPwMsg('Password updated successfully!');
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

  // Handle delete confirmation input change
  const handleDeleteConfirmChange = (e) => {
    const value = e.target.value;
    setDeleteConfirmText(value);
    
    if (value.toLowerCase() === REQUIRED_DELETE_TEXT.toLowerCase()) {
      setDeleteConfirmError('');
    } else if (value.length > 0) {
      setDeleteConfirmError('Text does not match. Please type exactly: "delete my account"');
    } else {
      setDeleteConfirmError('');
    }
  };

  // Handle delete password input change
  const handleDeletePasswordChange = (e) => {
    const value = e.target.value;
    setDeletePassword(value);
    
    // Clear password error when user starts typing
    if (deletePasswordError && value.length > 0) {
      setDeletePasswordError('');
    }
  };

  // Handle showing delete confirmation modal
  const handleShowDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
    setDeleteConfirmError('');
    setDeletePassword('');
    setDeletePasswordError('');
    setDeleteMsg('');
  };

  // Handle canceling delete confirmation
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setDeleteConfirmError('');
    setDeletePassword('');
    setDeletePasswordError('');
    setDeleteMsg('');
  };

  const handleDeleteAccount = async () => {
    // Validate confirmation text
    if (deleteConfirmText.toLowerCase() !== REQUIRED_DELETE_TEXT.toLowerCase()) {
      setDeleteConfirmError('You must type "delete my account" exactly to confirm deletion.');
      return;
    }

    // Validate password
    if (!deletePassword) {
      setDeletePasswordError('Password is required to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteMsg('');
    setDeleteConfirmError('');
    setDeletePasswordError('');

    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        setDeleteMsg('No user session found. Please login again.');
        setIsDeleting(false);
        return;
      }

      // First verify the password
      console.log('Verifying password for account deletion...');
      const verifyResponse = await axios.post('http://localhost:8070/user/verifyPassword', {
        email: userEmail,
        password: deletePassword
      });

      if (!verifyResponse.data.success) {
        setDeletePasswordError('Incorrect password. Please enter your current password.');
        setIsDeleting(false);
        return;
      }

      console.log('Password verified, proceeding with account deletion...');
      
      // If password is correct, proceed with deletion
      const response = await axios.delete(`http://localhost:8070/user/delete/${userEmail}`);
      
      console.log('Delete response:', response.data);
      console.log('Response status:', response.status);
      
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
      console.log('Error response:', error.response);
      
      // Check if it's a password verification error
      if (error.response?.status === 401 || error.response?.data?.message?.includes('password')) {
        setDeletePasswordError('Incorrect password. Please enter your current password.');
        setIsDeleting(false);
        return;
      }
      
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
    }
  };

  // Check if delete button should be enabled
  const isDeleteButtonEnabled = 
    deleteConfirmText.toLowerCase() === REQUIRED_DELETE_TEXT.toLowerCase() && 
    deletePassword.length > 0;

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
            <div className={styles.dangerWarning}>
              <div className={styles.warningIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15h-2v-2h2v2zm0-4h-2V6h2v5z"/>
                </svg>
              </div>
              <div>
                <p>
                  <strong style={{ color: '#dc2626', fontWeight: '800', textTransform: 'uppercase' }}>
                    Warning:
                  </strong>
                  <span style={{ color: '#b91c1c', fontWeight: '700', textDecoration: 'underline' }}>
                    {' '}This action cannot be undone.
                  </span>
                  <span style={{ color: '#991b1b', fontWeight: '600' }}>
                    {' '}This will permanently delete your account and remove all your data from our servers.
                  </span>
                </p>
              </div>
            </div>
            <button
              className={styles.dangerButton}
              onClick={handleShowDeleteConfirm}
              type="button"
              disabled={isDeleting}
            >
              Delete My Account
            </button>
            {showDeleteConfirm && (
              <div className={styles.confirmationModal}>
                <div className={styles.modalOverlay} onClick={handleCancelDelete}></div>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h4>Delete Account</h4>
                    <button 
                      className={styles.modalCloseButton}
                      onClick={handleCancelDelete}
                      type="button"
                      disabled={isDeleting}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.deleteConfirmWarning}>
                      <div className={styles.warningIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                      </div>
                      <div>
                        <p>
                          <strong className={styles.criticalText}>Warning:</strong>
                          <span className={styles.criticalWarning}> This action cannot be undone.</span>
                          <span className={styles.dangerText}> This will permanently delete your account and remove all your data from our servers.</span>
                        </p>
                        <p className={styles.warningText}>
                          This will permanently delete your account <strong className={styles.dangerText}>{user.email}</strong> and all associated data.
                        </p>
                      </div>
                    </div>
                    
                    <div className={styles.deleteConfirmSection}>
                      <label className={styles.inputLabel}>
                        Please type <code>delete my account</code> to confirm:
                      </label>
                      <input
                        className={`${styles.inputField} ${deleteConfirmError ? styles.inputError : ''} ${deleteConfirmText.toLowerCase() === REQUIRED_DELETE_TEXT.toLowerCase() ? styles.inputSuccess : ''}`}
                        type="text"
                        placeholder="Type: delete my account"
                        value={deleteConfirmText}
                        onChange={handleDeleteConfirmChange}
                        disabled={isDeleting}
                        autoComplete="off"
                        spellCheck="false"
                      />
                      {deleteConfirmError && (
                        <div className={styles.errorMessage}>
                          {deleteConfirmError}
                        </div>
                      )}
                      {deleteConfirmText.toLowerCase() === REQUIRED_DELETE_TEXT.toLowerCase() && (
                        <div className={styles.successMessage}>
                          ✓ Confirmation text matches
                        </div>
                      )}
                    </div>

                    <div className={styles.deleteConfirmSection}>
                      <label className={styles.inputLabel}>
                        Enter your current password to confirm:
                      </label>
                      <input
                        className={`${styles.inputField} ${deletePasswordError ? styles.inputError : ''} ${deletePassword.length > 0 && !deletePasswordError ? styles.inputSuccess : ''}`}
                        type="password"
                        placeholder="Enter your current password"
                        value={deletePassword}
                        onChange={handleDeletePasswordChange}
                        disabled={isDeleting}
                        autoComplete="current-password"
                      />
                      {deletePasswordError && (
                        <div className={styles.errorMessage}>
                          {deletePasswordError}
                        </div>
                      )}
                      {deletePassword.length > 0 && !deletePasswordError && (
                        <div className={styles.successMessage}>
                          ✓ Password entered
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      className={`${styles.dangerButton} ${!isDeleteButtonEnabled ? styles.disabled : ''}`}
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !isDeleteButtonEnabled}
                    >
                      {isDeleting ? (
                        <>
                          <div className={styles.spinner}></div>
                          Deleting Account...
                        </>
                      ) : (
                        'Delete This Account'
                      )}
                    </button>
                    <button
                      className={styles.secondaryButton}
                      onClick={handleCancelDelete}
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
                    <p>Platform Developer</p>
                  </div>
                </div>
              </div>
              <div className={styles.footerInfo}>
                <p>© {new Date().getFullYear()} Club FTC. All rights reserved.</p>
                <p>Design & Developed by <a href="https://github.com/nimeshdilhara96" target="_blank" rel="noopener noreferrer">MommentX</a> - <a href="https://github.com/nimeshdilhara96" target="_blank" rel="noopener noreferrer">nimeshdilhara96</a></p>
                <p>Version: v5.0.6</p>
              </div>
            </div>
          </footer>
        </div>
      </Container>
    </>
  );
};

export default Settings;