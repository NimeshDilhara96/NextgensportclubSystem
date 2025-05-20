import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSlideNav from './AdminSlideNav';
import './adminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalSports: 6,
        totalFacilities: 4,
        totalMembers: 0
    });

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const response = await axios.get('http://localhost:8070/user');
                setStats(prev => ({
                    ...prev,
                    totalMembers: response.data.length
                }));
            } catch (error) {
                console.error('Error fetching user count:', error);
            }
        };

        fetchUserCount();
    }, []);

    return (
        <div className="admin-dashboard">
            <AdminSlideNav />
            <div className="main-content">
                <div className="stats-container">
                    <div className="stat-card">
                        <h3>Total Sports</h3>
                        <div className="stat-number">{stats.totalSports}</div>
                        <a href="/admin/sports" className="stat-link">Manage Sports</a>
                    </div>
                    <div className="stat-card">
                        <h3>Total Facilities</h3>
                        <div className="stat-number">{stats.totalFacilities}</div>
                        <a href="/admin/facilities" className="stat-link">Manage Facilities</a>
                    </div>
                    <div className="stat-card">
                        <h3>Total Members</h3>
                        <div className="stat-number">{stats.totalMembers}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
