import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './slidenav.css';
import logo from '../../assets/logo.png';

const SlideNav = ({ isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
          const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
          if (response.data.status === "success") {
            setUserData(response.data.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Add these sample data arrays
  const notifications = [
    { id: 1, text: "New event announcement", time: "2 mins ago", isRead: false },
    { id: 2, text: "Your membership is expiring soon", time: "1 hour ago", isRead: false },
    { id: 3, text: "New training plan available", time: "3 hours ago", isRead: true },
  ];

  const messages = [
    { id: 1, sender: "John Doe", text: "Hey, about the training...", time: "5 mins ago", avatar: "https://via.placeholder.com/32" },
    { id: 2, sender: "Jane Smith", text: "When is the next event?", time: "30 mins ago", avatar: "https://via.placeholder.com/32" },
    { id: 3, sender: "Mike Johnson", text: "Thanks for the update!", time: "2 hours ago", avatar: "https://via.placeholder.com/32" },
  ];

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    try {
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
    <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <div className="logo-section">
        <img src={logo} alt="Club FTC" />
        <h2>Club FTC</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={isActiveRoute('/dashboard')}>
            <Link to="/dashboard">
              <span className="icon">⚡</span>
              <span>Dashboard Overview</span>
            </Link>
          </li>
          <li className={isActiveRoute('/membership')}>
            <Link to="/membership">
              <span className="icon">💻</span>
              <span>Membership Details</span>
            </Link>
          </li>
          <li className={isActiveRoute('/community')}>
            <Link to="/community">
              <span className="icon">👥</span>
              <span>Posts & Community</span>
            </Link>
          </li>
          <li className={isActiveRoute('/facilities')}>
            <Link to="/facilities">
              <span className="icon">🏃</span>
              <span>Sports & Facilities</span>
            </Link>
          </li>
          <li className={isActiveRoute('/training')}>
            <Link to="/training">
              <span className="icon">💪</span>
              <span>Training Plans</span>
            </Link>
          </li>
          <li className={isActiveRoute('/events')}>
            <Link to="/events">
              <span className="icon">📅</span>
              <span>Events & Sponsorships</span>
            </Link>
          </li>
          <li className={isActiveRoute('/store')}>
            <Link to="/store">
              <span className="icon">🛍️</span>
              <span>Club Store</span>
            </Link>
          </li>
          <li className={isActiveRoute('/health')}>
            <Link to="/health">
              <span className="icon">⚕️</span>
              <span>Health Insights</span>
            </Link>
          </li>
          <li className={isActiveRoute('/settings')}>
            <Link to="/settings">
              <span className="icon">⚙️</span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-brand">
        <span className="mommentx-logo">MommentX</span>
        <span className="brand-divider"> | </span>
        <span className="nimesh-logo">Design Nimeshdilhara96</span>
      </div>
      </div>

      <header className="dashboard-header">
        <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="search" placeholder="Search anything..." />
        </div>
        <div className="user-controls">
          <div className="icon-buttons">
            <div className="message-container">
              <button 
                className="message-btn"
                onClick={() => {
                  setShowMessages(!showMessages);
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                }}
              >
                <span className="icon">💬</span>
                <span className="notification-badge">3</span>
              </button>
              {showMessages && (
                <div className="popup-menu messages-menu">
                  <div className="popup-header">
                    <h3>Messages</h3>
                    <button className="view-all">View All</button>
                  </div>
                  <div className="popup-content">
                    {messages.map(message => (
                      <div key={message.id} className="message-item">
                        <img src={message.avatar} alt={message.sender} className="sender-avatar" />
                        <div className="message-content">
                          <div className="message-sender">{message.sender}</div>
                          <div className="message-text">{message.text}</div>
                          <div className="message-time">{message.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="notification-container">
              <button 
                className="notification-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMessages(false);
                  setShowProfileMenu(false);
                }}
              >
                <span className="icon">🔔</span>
                <span className="notification-badge">5</span>
              </button>
              {showNotifications && (
                <div className="popup-menu notifications-menu">
                  <div className="popup-header">
                    <h3>Notifications</h3>
                    <button className="view-all">View All</button>
                  </div>
                  <div className="popup-content">
                    {notifications.map(notification => (
                      <div key={notification.id} className={`notification-item ${!notification.isRead ? 'unread' : ''}`}>
                        <div className="notification-text">{notification.text}</div>
                        <div className="notification-time">{notification.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="user-profile-container">
            <div className="user-profile" onClick={toggleProfileMenu}>
              <img 
                src={userData?.profilePicture 
                  ? `http://localhost:8070/uploads/profile-pictures/${userData.profilePicture}`
                  : 'https://via.placeholder.com/40'} 
                alt="Profile" 
                className="profile-photo"
              />
              <div className="user-info">
                <span className="user-name">{userData?.name || 'Loading...'}</span>
                
              </div>
              <span className="dropdown-arrow">▼</span>
            </div>
            {showProfileMenu && (
              <div className="profile-menu">
                <Link to="/profile">My Profile</Link>
                <Link to="/account">Account Settings</Link>
                <Link to="/billing">Billing & Payments</Link>
                <Link to="/help">Help Center</Link>
                <div className="divider"></div>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default SlideNav;