import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './AdminSlideNav.css';

const AdminSlideNav = () => {
    const navigate = useNavigate();
    const adminUsername = sessionStorage.getItem('adminUsername');
    const [showDropdown, setShowDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        sessionStorage.removeItem('adminId');
        sessionStorage.removeItem('adminUsername');
        sessionStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

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
                    <div className="overview-header">Overview</div>
                    <nav>
                        <ul>
                            <li>Manage Members</li>
                            <li><Link to="/admin/add-sport">Manage Sports</Link></li>
                            <li><Link to="/admin/facilities">Manage Facilities</Link></li>
                            <li>Manage Coaches</li>
                            <li>Events & Sponsorships</li>
                            <li>Club Store</li>
                            <li><Link to="/admin/create-post">Create Post</Link></li>
                            <li>FeedBacks</li>
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
                <div className="admin-profile" onClick={() => setShowDropdown(!showDropdown)}>
                    Welcome, {adminUsername} <i className="fas fa-chevron-down"></i>
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