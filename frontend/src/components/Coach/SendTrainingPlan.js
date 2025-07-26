import React, { useState, useEffect } from 'react';
import CoachSlideNav from './CoachSlideNav';
import axios from 'axios';
import styles from './sendTraningPlan.module.css';

const SendTrainingPlan = () => {
    const [coachAssignedSports, setCoachAssignedSports] = useState([]);
    const [formData, setFormData] = useState({
        sport: '',
        title: '',
        description: '',
        sessions: [{ date: '', focus: '' }]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch coach's assigned sports
    useEffect(() => {
        const fetchCoachSports = async () => {
            try {
                const coachEmail = sessionStorage.getItem('coachEmail');
                if (!coachEmail) {
                    setMessage({ type: 'error', text: 'Coach authentication required. Please login again.' });
                    return;
                }

                // Get coach details to see which sports they're assigned to
                const coachRes = await axios.get(`http://localhost:8070/coaches/by-email/${encodeURIComponent(coachEmail)}/details`);
                const coachSports = coachRes.data.coach.sports || [];
                setCoachAssignedSports(coachSports);
                
                if (coachSports.length === 0) {
                    setMessage({ type: 'info', text: 'You are not assigned to any sports yet.' });
                }
            } catch (err) {
                console.error('Error fetching coach sports:', err);
                setMessage({ type: 'error', text: 'Failed to fetch coach sports.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchCoachSports();
    }, []);



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSessionChange = (idx, field, value) => {
        const updated = [...formData.sessions];
        updated[idx][field] = value;
        setFormData({ ...formData, sessions: updated });
    };

    const addSession = () => {
        setFormData({ ...formData, sessions: [...formData.sessions, { date: '', focus: '' }] });
    };

    const removeSession = (idx) => {
        const updated = formData.sessions.filter((_, i) => i !== idx);
        setFormData({ ...formData, sessions: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            const coachToken = sessionStorage.getItem('coachToken');
            const coachId = sessionStorage.getItem('coachId');
            const coachEmail = sessionStorage.getItem('coachEmail');
            
            if (!coachToken || !coachId || !coachEmail) {
                setMessage({ type: 'error', text: 'Coach authentication required. Please login again.' });
                return;
            }

            // Validate that the selected sport is one of the coach's assigned sports
            const coachRes = await axios.get(`http://localhost:8070/coaches/by-email/${encodeURIComponent(coachEmail)}/details`);
            const coachSports = coachRes.data.coach.sports || [];
            const coachSportIds = coachSports.map(sport => sport.sportId);
            
            if (!coachSportIds.includes(formData.sport)) {
                setMessage({ type: 'error', text: 'You can only send training plans for sports you are assigned to.' });
                return;
            }

            // Get the selected sport details to find all members
            const selectedSport = coachSports.find(sport => sport.sportId === formData.sport);
            if (!selectedSport || !selectedSport.members || selectedSport.members.length === 0) {
                setMessage({ type: 'error', text: 'No members found in the selected sport.' });
                return;
            }

            // Send training plan to all members of the selected sport
            const memberEmails = selectedSport.members.map(member => member.userEmail);

            // Fetch user IDs for all member emails
            const userIdPromises = memberEmails.map(email =>
                axios.get(`http://localhost:8070/user/getByEmail/${encodeURIComponent(email)}`)
            );
            const userIdResults = await Promise.all(userIdPromises);
            const userIds = userIdResults
                .map(res => res.data && res.data.user && res.data.user._id)
                .filter(id => !!id);

            if (userIds.length === 0) {
                setMessage({ type: 'error', text: 'No valid user IDs found for members.' });
                return;
            }

            await axios.post('http://localhost:8070/coaches/training-plans/bulk', {
                users: userIds,
                sport: formData.sport,
                coach: coachId,
                title: formData.title,
                description: formData.description,
                sessions: formData.sessions
            }, {
                headers: { 'Authorization': `Bearer ${coachToken}` }
            });

            setMessage({ 
                type: 'success', 
                text: `Training plan sent successfully to ${userIds.length} members!` 
            });
            setFormData({
                sport: '',
                title: '',
                description: '',
                sessions: [{ date: '', focus: '' }]
            });
        } catch (err) {
            console.error('Error sending training plan:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to send training plan.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <CoachSlideNav />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Send Training Plan</h1>
                    {coachAssignedSports.length > 0 && (
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '10px', 
                            backgroundColor: '#f0f8ff', 
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}>
                            <strong>Your Assigned Sports:</strong>
                            <div style={{ marginTop: '5px' }}>
                                {coachAssignedSports.map(sport => (
                                    <span key={sport.sportId} style={{ 
                                        display: 'inline-block', 
                                        margin: '2px 8px 2px 0',
                                        padding: '4px 8px',
                                        backgroundColor: '#e6f3ff',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        {sport.sportName} ({sport.members ? sport.members.length : 0} members)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {message.text && (
                    <div className={
                        message.type === 'success' ? styles.successMessage : 
                        message.type === 'error' ? styles.errorMessage :
                        message.type === 'info' ? styles.infoMessage : styles.errorMessage
                    }>
                        {message.text}
                    </div>
                )}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        Loading sports...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="sport">Select Sport*</label>
                            <select
                                id="sport"
                                name="sport"
                                value={formData.sport}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">-- Select Sport --</option>
                                {coachAssignedSports.map(sport => (
                                    <option key={sport.sportId} value={sport.sportId}>
                                        {sport.sportName} ({sport.members ? sport.members.length : 0} members)
                                    </option>
                                ))}
                            </select>
                        </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="title">Plan Title*</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Sessions</label>
                        {formData.sessions.map((session, idx) => (
                            <div key={idx} className={styles.sessionRow}>
                                <input
                                    type="date"
                                    value={session.date}
                                    onChange={e => handleSessionChange(idx, 'date', e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Focus"
                                    value={session.focus}
                                    onChange={e => handleSessionChange(idx, 'focus', e.target.value)}
                                    required
                                />
                                {formData.sessions.length > 1 && (
                                    <button type="button" onClick={() => removeSession(idx)} className={styles.deleteBtn}>Remove</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addSession} className={styles.addButton}>Add Session</button>
                    </div>
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                            {isSubmitting ? 'Sending...' : 'Send Training Plan'}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </>
    );
};

export default SendTrainingPlan;