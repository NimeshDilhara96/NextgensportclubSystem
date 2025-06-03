import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSlideNav from './AdminSlideNav';
import { getMemberCount } from './adminMemberManagement';
import { FaUsers, FaRunning, FaBuilding, FaCalendarCheck, FaShoppingBag, FaBell, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';
import './adminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalSports: 0,
        totalFacilities: 0,
        totalMembers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalOrders: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState([]);
    
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Get member count
                const memberCount = await getMemberCount();
                
                // You can fetch real counts from your API for these as well
                // For now using placeholder values
                const sportCount = 6; 
                const facilityCount = 4;
                const bookingsCount = 28;
                const revenueTotal = 12500;
                const ordersCount = 15;
                
                setStats({
                    totalSports: sportCount,
                    totalFacilities: facilityCount,
                    totalMembers: memberCount,
                    totalBookings: bookingsCount,
                    totalRevenue: revenueTotal,
                    totalOrders: ordersCount
                });
                
                // Sample recent activities data
                setRecentActivities([
                    { id: 1, type: 'member', action: 'New member registered', name: 'John Smith', time: '2 hours ago' },
                    { id: 2, type: 'booking', action: 'Facility booked', name: 'Tennis Court #2', time: '3 hours ago' },
                    { id: 3, type: 'order', action: 'New order placed', name: 'Club Merchandise', time: '5 hours ago' },
                    { id: 4, type: 'member', action: 'Membership renewed', name: 'Sarah Johnson', time: '1 day ago' },
                    { id: 5, type: 'facility', action: 'Maintenance scheduled', name: 'Swimming Pool', time: '1 day ago' }
                ]);
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="admin-dashboard">
            <AdminSlideNav />
            <div className="main-content">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Admin Dashboard</h1>
                    <div className="dashboard-actions">
                        <button className="refresh-btn">
                            <span>Refresh Data</span>
                        </button>
                        <div className="date-display">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
                
                {/* Main Stats Cards */}
                <div className="stats-container">
                    <div className="stat-card">
                        <div className="stat-icon members">
                            <FaUsers />
                        </div>
                        <div className="stat-content">
                            <h3>Total Members</h3>
                            <div className="stat-number">{loading ? '...' : stats.totalMembers}</div>
                        </div>
                        <Link to="/admin/member-management" className="stat-link">View Members</Link>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon sports">
                            <FaRunning />
                        </div>
                        <div className="stat-content">
                            <h3>Total Sports</h3>
                            <div className="stat-number">{loading ? '...' : stats.totalSports}</div>
                        </div>
                        <Link to="/admin/sports" className="stat-link">Manage Sports</Link>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon facilities">
                            <FaBuilding />
                        </div>
                        <div className="stat-content">
                            <h3>Total Facilities</h3>
                            <div className="stat-number">{loading ? '...' : stats.totalFacilities}</div>
                        </div>
                        <Link to="/admin/facilities" className="stat-link">Manage Facilities</Link>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon bookings">
                            <FaCalendarCheck />
                        </div>
                        <div className="stat-content">
                            <h3>Total Bookings</h3>
                            <div className="stat-number">{loading ? '...' : stats.totalBookings}</div>
                        </div>
                        <Link to="/admin/bookings" className="stat-link">View Bookings</Link>
                    </div>
                </div>
                
                {/* Revenue & Orders Section */}
                <div className="revenue-section">
                    <div className="revenue-card">
                        <div className="revenue-header">
                            <h2><FaChartLine /> Revenue Overview</h2>
                            <div className="revenue-period">
                                <select defaultValue="monthly">
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="revenue-stats">
                            <div className="revenue-stat">
                                <div className="revenue-icon">
                                    <FaMoneyBillWave />
                                </div>
                                <div className="revenue-info">
                                    <h3>Total Revenue</h3>
                                    <p className="revenue-amount">{loading ? '...' : formatCurrency(stats.totalRevenue)}</p>
                                    <p className="revenue-change positive">+12.5% from last period</p>
                                </div>
                            </div>
                            
                            <div className="revenue-stat">
                                <div className="revenue-icon">
                                    <FaShoppingBag />
                                </div>
                                <div className="revenue-info">
                                    <h3>Total Orders</h3>
                                    <p className="revenue-amount">{loading ? '...' : stats.totalOrders}</p>
                                    <p className="revenue-change positive">+5.8% from last period</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="chart-placeholder">
                            <div className="chart-message">Revenue chart visualization would display here</div>
                        </div>
                    </div>
                </div>
                
                {/* Recent Activities & Quick Actions Section */}
                <div className="dashboard-bottom">
                    <div className="recent-activities">
                        <div className="panel-header">
                            <h2><FaBell /> Recent Activities</h2>
                            <Link to="/admin/activities" className="view-all">View All</Link>
                        </div>
                        
                        {loading ? (
                            <div className="loading-activities">Loading activities...</div>
                        ) : (
                            <ul className="activity-list">
                                {recentActivities.map(activity => (
                                    <li key={activity.id} className={`activity-item ${activity.type}`}>
                                        <div className="activity-icon"></div>
                                        <div className="activity-content">
                                            <p className="activity-text">
                                                <strong>{activity.action}</strong>: {activity.name}
                                            </p>
                                            <p className="activity-time">{activity.time}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    <div className="quick-actions">
                        <div className="panel-header">
                            <h2>Quick Actions</h2>
                        </div>
                        
                        <div className="action-buttons">
                            <Link to="/admin/member-management" className="action-button add-member">
                                Add New Member
                            </Link>
                            <Link to="/admin/facilities" className="action-button manage-booking">
                                Manage Bookings
                            </Link>
                            <Link to="/admin/create-post" className="action-button create-post">
                                Create Post
                            </Link>
                            <Link to="/admin/club-store" className="action-button view-orders">
                                View Orders
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
