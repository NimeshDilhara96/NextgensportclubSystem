import React, { useState } from 'react';
import SlideNav from '../appnavbar/slidenav';
import Container from '../common/Container';
import styles from './settings.module.css';
import logo from '../../assets/logo.png';
import mommentxLogo from '../../assets/MommentX-removebg-preview.png';

const AccountSettings = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleNewPasswordChange = (e) => setNewPassword(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailMsg('Email updated successfully!');
    setTimeout(() => setEmailMsg(''), 2000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg('Passwords do not match.');
      return;
    }
    setPwMsg('Password updated successfully!');
    setTimeout(() => setPwMsg(''), 2000);
  };

  const handleDeleteAccount = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setDeleteMsg('Account deleted (demo only).');
      setIsDeleting(false);
    }, 1800);
  };

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
          <p className={styles.sectionDescription}>Update your email address for account notifications</p>
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
              />
            </div>
            <button className={styles.primaryButton} type="submit">
              Update Email
            </button>
            {emailMsg && <div className={styles.successMessage}>{emailMsg}</div>}
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
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>New Password</label>
              <input
                className={styles.inputField}
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                required
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
              />
            </div>
            <button className={styles.primaryButton} type="submit">
              Update Password
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
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {deleteMsg && <div className={styles.successMessage}>{deleteMsg}</div>}
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