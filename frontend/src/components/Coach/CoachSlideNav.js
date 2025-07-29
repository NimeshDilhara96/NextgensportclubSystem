import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import styles from './CoachSlideNav.module.css';

const CoachSlideNav = () => {
    const navigate = useNavigate();
    const coachName = sessionStorage.getItem('coachName') || 'Coach';
    const [showDropdown, setShowDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        sessionStorage.removeItem('coachId');
        sessionStorage.removeItem('coachName');
        sessionStorage.removeItem('coachUsername');
        sessionStorage.removeItem('coachSpecialty');
        sessionStorage.removeItem('coachToken');
        sessionStorage.removeItem('isCoachLoggedIn');
        navigate('/coach/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };
    
    const toggleDropdown = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        setShowDropdown(prevState => !prevState);
    };
    
    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <button className={styles.mobileToggle} onClick={toggleSidebar}>
                {sidebarOpen ? '✕' : '☰'}
            </button>

            <div 
                className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}
            >
                <div className={styles.logoContainer}>
                    <img src={logo} alt="Club FTC" className={styles.logo} />
                </div>
                <div className={styles.menuItems}>
                    <Link 
                        to="/coach/dashboard" 
                        className={styles.overviewHeader} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        Coach Portal
                    </Link>
                    <nav>
                        <ul>
                            <li className={window.location.pathname === '/coach/dashboard' ? styles.active : ''}>
                                <Link to="/coach/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Dashboard
                                </Link>
                            </li>
                            <li className={window.location.pathname === '/coach/sessions' ? styles.active : ''}>
                                <Link to="/coach/sessions" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    My Sessions
                                </Link>
                            </li>
                            <li className={window.location.pathname === '/coach/send-training-plan' ? styles.active : ''}>
                                <Link to="/coach/send-training-plan" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Send Training Plan
                                </Link>
                            </li>
                            <li className={window.location.pathname === '/coach/send-message' ? styles.active : ''}>
                                <Link to="/coach/send-message" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Messages
                                </Link>
                            </li>
                            <li className={window.location.pathname === '/coach/view-member-portal' ? styles.active : ''}>
                                <Link to="/coach/view-member-portal" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Sport members
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div 
                className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.overlayActive : ''}`} 
                onClick={() => setSidebarOpen(false)}
            ></div>

            <div className={styles.topBar}>
                <div className={styles.notificationIcon}>
                    <i className="fas fa-bell"></i>
                </div>
                <div 
                    className={`${styles.adminProfile} ${showDropdown ? styles.profileActive : ''}`} 
                    ref={dropdownRef} 
                    onClick={toggleDropdown}
                >
                    <span>Welcome, {coachName}</span> 
                    <i className="fas fa-chevron-down"></i>
                    {showDropdown && (
                        <div className={styles.profileDropdown}>
                            <Link to="/coach/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <button className={styles.dropdownButton}>My Profile</button>
                            </Link>
                            <button className={styles.dropdownButton} onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CoachSlideNav;