import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaClock, FaUser, FaEnvelope, FaInfo } from 'react-icons/fa';
import CoachSlideNav from './CoachSlideNav';
import styles from './viewsession.module.css';

const ViewSession = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const coachEmail = sessionStorage.getItem('coachEmail');

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                console.log('Fetching sessions for coach:', coachEmail); // Debug log
                const response = await axios.get(`http://localhost:8070/coaches/sessions/${coachEmail}`);
                console.log('Sessions response:', response.data); // Debug log
                setSessions(response.data.sessions);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching sessions:', err); // Debug log
                setError('Failed to fetch sessions');
                setLoading(false);
            }
        };
        
        if (coachEmail) {
            fetchSessions();
        } else {
            setError('Coach email not found');
            setLoading(false);
        }
    }, [coachEmail]);

    const handleStatusChange = async (sessionId, newStatus) => {
        try {
            await axios.patch(`http://localhost:8070/coaches/sessions/${sessionId}/status`, {
                status: newStatus
            });
            // Refresh sessions after update
            // Re-fetch sessions inline since fetchSessions is now inside useEffect
            const response = await axios.get(`http://localhost:8070/coaches/sessions/${coachEmail}`);
            setSessions(response.data.sessions);
        } catch (err) {
            setError('Failed to update session status');
        }
    };
    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            session.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className={styles.dashboardContainer}>
                <CoachSlideNav />
                <div className={styles.container}>
                    <div className={styles.loading}>Loading sessions...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.dashboardContainer}>
                <CoachSlideNav />
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <CoachSlideNav 
                isSidebarOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar}
            />
            <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                <div className={styles.contentHeader}>
                    <h1 className={styles.pageTitle}>Training Sessions</h1>
                </div>
                
                <div className={styles.container}>
                    <div className={styles.filterSection}>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className={styles.statusFilter}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className={styles.loading}>Loading sessions...</div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : filteredSessions.length === 0 ? (
                        <div className={styles.noSessions}>
                            No sessions found
                        </div>
                    ) : (
                        <div className={styles.sessionsGrid}>
                            {filteredSessions.map((session) => (
                                <div key={session._id} className={styles.sessionCard}>
                                    <div className={`${styles.statusBadge} ${styles[session.status]}`}>
                                        {session.status}
                                    </div>
                                    
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.infoRow}>
                                            <FaUser className={styles.icon} />
                                            <span>{session.userName}</span>
                                        </div>
                                        
                                        <div className={styles.infoRow}>
                                            <FaEnvelope className={styles.icon} />
                                            <span>{session.userEmail}</span>
                                        </div>
                                        
                                        <div className={styles.infoRow}>
                                            <FaCalendarAlt className={styles.icon} />
                                            <span>{new Date(session.date).toLocaleDateString()}</span>
                                        </div>
                                        
                                        <div className={styles.infoRow}>
                                            <FaClock className={styles.icon} />
                                            <span>{session.time}</span>
                                        </div>

                                        {session.notes && (
                                            <div className={styles.infoRow}>
                                                <FaInfo className={styles.icon} />
                                                <span>{session.notes}</span>
                                            </div>
                                        )}
                                    </div>

                                    {session.status === 'pending' && (
                                        <div className={styles.actionButtons}>
                                            <button
                                                onClick={() => handleStatusChange(session._id, 'approved')}
                                                className={`${styles.actionButton} ${styles.approveButton}`}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(session._id, 'cancelled')}
                                                className={`${styles.actionButton} ${styles.cancelButton}`}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewSession;