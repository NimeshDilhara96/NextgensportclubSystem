import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './AdminSlideNav.css';

const AdminSlideNav = () => {
    const navigate = useNavigate();
    const adminUsername = sessionStorage.getItem('adminUsername') || 'Admin';
    const [showDropdown, setShowDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        sessionStorage.removeItem('adminId');
        sessionStorage.removeItem('adminUsername');
        sessionStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };
    
    const toggleDropdown = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        setShowDropdown(prevState => !prevState);
        console.log("Dropdown toggled:", !showDropdown); // Debug log
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

    // For debugging
    useEffect(() => {
        console.log("Dropdown state:", showDropdown);
    }, [showDropdown]);

    return (
        <>
            <button className="mobile-toggle" onClick={toggleSidebar}>
                {sidebarOpen ? '✕' : '☰'}
            </button>

            <div 
                className={`sidebar ${sidebarOpen ? 'open' : ''}`}
            >
                <div className="logo-container">
                    <img src={logo} alt="Club FTC" className="logo" />
                </div>
                <div className="menu-items">
                    <Link 
                        to="/admin/dashboard" 
                        className="overview-header" 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        Overview
                    </Link>
                    <nav>
                        <ul>
                            <li>
                                <Link to="/admin/member-management" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Manage Members
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/add-sport" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Manage Sports
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/facilities" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Manage Facilities
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/manage-coaches" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Manage Coaches
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/events-sponsorships" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Events & Sponsorships
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/club-store" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Club Store
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/create-post" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    Create Post
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/feedbacks" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    FeedBacks
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div 
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
                onClick={() => setSidebarOpen(false)}
            ></div>

            <div className="top-bar">
                <div className="notification-icon">
                    <i className="fas fa-bell"></i>
                </div>
                <div 
                    className={`admin-profile ${showDropdown ? 'active' : ''}`} 
                    ref={dropdownRef} 
                    onClick={toggleDropdown}
                >
                    <span>Welcome, {adminUsername}</span> 
                    <i className="fas fa-chevron-down"></i>
                    {showDropdown && (
                        <div className="profile-dropdown">
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminSlideNav;