import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import AdminSlideNav from './AdminSlideNav';
import styles from './adminMemberManagement.module.css'; // Updated import

const ViewFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('http://localhost:8070/feedbacks');
            setFeedbacks(response.data);
        } catch (err) {
            setError('Failed to fetch feedbacks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredFeedbacks = feedbacks.filter(fb =>
        fb.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fb.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.admin_dashboard}>
            <AdminSlideNav />
            <div className={styles.main_content}>
                <h1 className={styles.dashboard_title}>User Feedback</h1>
                <div className={styles.members_section}>
                    <div className={styles.section_header}>
                        <h2>All Feedback</h2>
                        <div className={styles.search_bar}>
                            <FaSearch className={styles.search_icon} />
                            <input
                                type="text"
                                placeholder="Search feedback by user or message..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className={styles.loading}>Loading feedback...</div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : (
                        <div className={styles.members_table_container}>
                            <table className={styles.members_table}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Message</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFeedbacks.length > 0 ? (
                                        filteredFeedbacks.map(fb => (
                                            <tr key={fb._id}>
                                                <td>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <FaUser style={{ color: '#2196f3' }} />
                                                        {fb.user}
                                                    </span>
                                                </td>
                                                <td>{fb.message}</td>
                                                <td>{new Date(fb.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className={styles.no_results}>
                                                <FaExclamationTriangle style={{ marginRight: 8 }} />
                                                No feedback found. {searchQuery ? 'Try a different search term.' : 'No feedback submitted yet.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewFeedback;