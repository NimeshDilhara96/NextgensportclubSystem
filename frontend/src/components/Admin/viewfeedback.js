import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import AdminSlideNav from './AdminSlideNav';
import styles from './CoachManagement.module.css'; // Reuse coach management styles

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
        <>
            <AdminSlideNav />
            <div className={styles.coachManagementContainer}>
                <h1 className={styles.pageTitle}>User Feedback</h1>
                <div className={styles.searchContainer}>
                    <div className={styles.searchBox}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search feedback by user or message..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>
                {error && <div className={styles.errorMessage}>{error}</div>}
                {loading ? (
                    <div className={styles.loadingMessage}>Loading feedback...</div>
                ) : filteredFeedbacks.length === 0 ? (
                    <div className={styles.noCoachesMessage}>
                        <FaExclamationTriangle />
                        <p>No feedback found. {searchQuery ? 'Try a different search term.' : 'No feedback submitted yet.'}</p>
                    </div>
                ) : (
                    <div className={styles.coachesGrid}>
                        {filteredFeedbacks.map(fb => (
                            <div key={fb._id} className={styles.coachCard}>
                                <div className={styles.coachImage}>
                                    <FaUser />
                                </div>
                                <div className={styles.coachDetails}>
                                    <h3>{fb.user}</h3>
                                    <p>{fb.message}</p>
                                    <span style={{ fontSize: '0.9em', color: '#888' }}>
                                        {new Date(fb.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default ViewFeedback;