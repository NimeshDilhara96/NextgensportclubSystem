import React, { useState, useEffect } from 'react';
import CoachSlideNav from './CoachSlideNav';
import axios from 'axios';
import styles from './sendTraningPlan.module.css';

const SendTrainingPlan = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [userSports, setUserSports] = useState([]);
    const [formData, setFormData] = useState({
        sport: '',
        title: '',
        description: '',
        sessions: [{ date: '', focus: '' }]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch users and their joined sports from Sport model
    useEffect(() => {
        const fetchUsersAndSports = async () => {
            try {
                const res = await axios.get('http://localhost:8070/sports');
                const sports = res.data.sports || [];
                const userMap = {};
                sports.forEach(sport => {
                    (sport.members || []).forEach(member => {
                        if (!userMap[member.userId]) {
                            userMap[member.userId] = {
                                _id: member.userId,
                                name: member.userName,
                                email: member.userEmail,
                                sports: []
                            };
                        }
                        userMap[member.userId].sports.push({ _id: sport._id, name: sport.name });
                    });
                });
                setUsers(Object.values(userMap));
                console.log('Users with sports:', Object.values(userMap));
            } catch {
                setUsers([]);
            }
        };
        fetchUsersAndSports();
    }, []);

    // When user changes, set their joined sports
    useEffect(() => {
        if (!selectedUser) {
            setUserSports([]);
            setFormData(f => ({ ...f, sport: '' }));
            return;
        }
        const user = users.find(u => u._id.toString() === selectedUser.toString());
        setUserSports(user ? user.sports : []);
        setFormData(f => ({ ...f, sport: '' }));
        console.log('Selected user:', user);
        console.log('User sports:', user ? user.sports : []);
    }, [selectedUser, users]);

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
            const token = sessionStorage.getItem('adminToken');
            await axios.post('http://localhost:8070/training-plans', {
                user: selectedUser,
                sport: formData.sport,
                title: formData.title,
                description: formData.description,
                sessions: formData.sessions
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'Training plan sent successfully!' });
            setFormData({
                sport: '',
                title: '',
                description: '',
                sessions: [{ date: '', focus: '' }]
            });
            setSelectedUser('');
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to send training plan.' });
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
                </div>
                {message.text && (
                    <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="user">Select User*</label>
                        <select
                            id="user"
                            value={selectedUser}
                            onChange={e => setSelectedUser(e.target.value)}
                            required
                        >
                            <option value="">-- Select User --</option>
                            {users.map(user => (
                                <option key={user._id} value={user._id.toString()}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="sport">Select Sport*</label>
                        <select
                            id="sport"
                            name="sport"
                            value={formData.sport}
                            onChange={handleInputChange}
                            required
                            disabled={!selectedUser}
                        >
                            <option value="">-- Select Sport --</option>
                            {(userSports || []).map(sport => (
                                <option key={sport._id} value={sport._id}>{sport.name}</option>
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
            </div>
        </>
    );
};

export default SendTrainingPlan;