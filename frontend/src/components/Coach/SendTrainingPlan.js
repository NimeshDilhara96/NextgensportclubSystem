import React, { useState, useEffect } from 'react';
import CoachSlideNav from './CoachSlideNav';
import axios from 'axios';
import styles from './sendTraningPlan.module.css';

const SendTrainingPlan = () => {
    const [activeTab, setActiveTab] = useState('create'); // 'create', 'manage', 'schedule'
    const [coachAssignedSports, setCoachAssignedSports] = useState([]);
    const [sentPlans, setSentPlans] = useState([]);
    const [editingPlan, setEditingPlan] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [formData, setFormData] = useState({
        sport: '',
        title: '',
        description: '',
        sessions: [{ date: '', focus: '' }]
    });
    const [scheduleData, setScheduleData] = useState({
        sport: '',
        date: '',
        time: '',
        title: '',
        description: '',
        location: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Fetch coach's assigned sports and sent plans
    useEffect(() => {
        const fetchCoachData = async () => {
            try {
                const coachEmail = sessionStorage.getItem('coachEmail');
                const coachId = sessionStorage.getItem('coachId');
                
                if (!coachEmail || !coachId) {
                    setMessage({ type: 'error', text: 'Coach authentication required. Please login again.' });
                    return;
                }

                // Get coach details and assigned sports
                const coachRes = await axios.get(`http://localhost:8070/coaches/by-email/${encodeURIComponent(coachEmail)}/details`);
                const coachSports = coachRes.data.coach.sports || [];
                setCoachAssignedSports(coachSports);
                
                // Fetch sent training plans for each sport
                const allPlans = [];
                for (const sport of coachSports) {
                    try {
                        const plansRes = await axios.get(`http://localhost:8070/training-plans/sport/${sport.sportId}`);
                        if (plansRes.data.success) {
                            // Filter plans created by this coach
                            const coachPlans = plansRes.data.plans.filter(plan => 
                                plan.coach && plan.coach._id === coachId
                            );
                            allPlans.push(...coachPlans);
                        }
                    } catch (err) {
                        console.error(`Error fetching plans for sport ${sport.sportId}:`, err);
                    }
                }
                setSentPlans(allPlans);
                
                if (coachSports.length === 0) {
                    setMessage({ type: 'info', text: 'You are not assigned to any sports yet.' });
                }
            } catch (err) {
                console.error('Error fetching coach data:', err);
                setMessage({ type: 'error', text: 'Failed to fetch coach data.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchCoachData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleScheduleChange = (e) => {
        const { name, value } = e.target;
        setScheduleData({ ...scheduleData, [name]: value });
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

    const resetForm = () => {
        setFormData({
            sport: '',
            title: '',
            description: '',
            sessions: [{ date: '', focus: '' }]
        });
        setEditingPlan(null);
    };

    const resetScheduleForm = () => {
        setScheduleData({
            sport: '',
            date: '',
            time: '',
            title: '',
            description: '',
            location: ''
        });
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

            // Validate sport assignment
            const coachRes = await axios.get(`http://localhost:8070/coaches/by-email/${encodeURIComponent(coachEmail)}/details`);
            const coachSports = coachRes.data.coach.sports || [];
            const coachSportIds = coachSports.map(sport => sport.sportId);
            
            if (!coachSportIds.includes(formData.sport)) {
                setMessage({ type: 'error', text: 'You can only send training plans for sports you are assigned to.' });
                return;
            }

            if (editingPlan) {
                // Update existing plan
                await axios.put(`http://localhost:8070/training-plans/${editingPlan._id}`, {
                    title: formData.title,
                    description: formData.description,
                    sessions: formData.sessions
                }, {
                    headers: { 'Authorization': `Bearer ${coachToken}` }
                });

                setMessage({ type: 'success', text: 'Training plan updated successfully!' });
                
                // Update local state
                setSentPlans(prevPlans => 
                    prevPlans.map(plan => 
                        plan._id === editingPlan._id 
                            ? { ...plan, title: formData.title, description: formData.description, sessions: formData.sessions }
                            : plan
                    )
                );
            } else {
                // Create new plan
                const selectedSport = coachSports.find(sport => sport.sportId === formData.sport);
                if (!selectedSport || !selectedSport.members || selectedSport.members.length === 0) {
                    setMessage({ type: 'error', text: 'No members found in the selected sport.' });
                    return;
                }

                const memberEmails = selectedSport.members.map(member => member.userEmail);
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

                const response = await axios.post('http://localhost:8070/training-plans/bulk', {
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

                // Add new plans to local state
                if (response.data.plans) {
                    setSentPlans(prevPlans => [...prevPlans, ...response.data.plans]);
                }
            }
            
            resetForm();
        } catch (err) {
            console.error('Error with training plan:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to process training plan.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const coachToken = sessionStorage.getItem('coachToken');
            const coachId = sessionStorage.getItem('coachId');
            
            if (!coachToken || !coachId) {
                setMessage({ type: 'error', text: 'Coach authentication required.' });
                return;
            }

            const selectedSport = coachAssignedSports.find(sport => sport.sportId === scheduleData.sport);
            if (!selectedSport || !selectedSport.members || selectedSport.members.length === 0) {
                setMessage({ type: 'error', text: 'No members found in the selected sport.' });
                return;
            }

            const memberEmails = selectedSport.members.map(member => member.userEmail);
            const userIdPromises = memberEmails.map(email =>
                axios.get(`http://localhost:8070/user/getByEmail/${encodeURIComponent(email)}`)
            );
            const userIdResults = await Promise.all(userIdPromises);
            const userIds = userIdResults
                .map(res => res.data && res.data.user && res.data.user._id)
                .filter(id => !!id);

            // Create schedule as a special training plan
            await axios.post('http://localhost:8070/training-plans/bulk', {
                users: userIds,
                sport: scheduleData.sport,
                coach: coachId,
                title: `📅 SCHEDULE: ${scheduleData.title}`,
                description: `
🗓️ Date: ${scheduleData.date}
⏰ Time: ${scheduleData.time}
📍 Location: ${scheduleData.location}
📝 Details: ${scheduleData.description}
                `.trim(),
                sessions: [{
                    date: scheduleData.date,
                    focus: `${scheduleData.title} at ${scheduleData.time} - ${scheduleData.location}`
                }]
            }, {
                headers: { 'Authorization': `Bearer ${coachToken}` }
            });

            setMessage({ 
                type: 'success', 
                text: `Schedule sent successfully to ${userIds.length} members!` 
            });
            resetScheduleForm();
        } catch (err) {
            console.error('Error sending schedule:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to send schedule.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            sport: plan.sport._id || plan.sport,
            title: plan.title,
            description: plan.description || '',
            sessions: plan.sessions || [{ date: '', focus: '' }]
        });
        setActiveTab('create');
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this training plan?')) return;
        
        try {
            const coachToken = sessionStorage.getItem('coachToken');
            await axios.delete(`http://localhost:8070/training-plans/${planId}`, {
                headers: { 'Authorization': `Bearer ${coachToken}` }
            });
            
            setSentPlans(prevPlans => prevPlans.filter(plan => plan._id !== planId));
            setMessage({ type: 'success', text: 'Training plan deleted successfully!' });
        } catch (err) {
            console.error('Error deleting plan:', err);
            setMessage({ type: 'error', text: 'Failed to delete training plan.' });
        }
    };

    const getSportName = (sportId) => {
        const sport = coachAssignedSports.find(s => s.sportId === sportId);
        return sport ? sport.sportName : 'Unknown Sport';
    };

    if (isLoading) {
        return (
            <div className={styles.pageWrapper}>
                <CoachSlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                    <div className={styles.loadingState}>Loading training plan data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <CoachSlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                <div className={styles.contentHeader}>
                    <h1 className={styles.pageTitle}>Training Plan Management</h1>
                </div>

                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.tabButtons}>
                            <button 
                                className={`${styles.tabButton} ${activeTab === 'create' ? styles.active : ''}`}
                                onClick={() => setActiveTab('create')}
                            >
                                {editingPlan ? 'Edit Plan' : 'Create Plan'}
                            </button>
                            <button 
                                className={`${styles.tabButton} ${activeTab === 'manage' ? styles.active : ''}`}
                                onClick={() => setActiveTab('manage')}
                            >
                                Manage Plans ({sentPlans.length})
                            </button>
                            <button 
                                className={`${styles.tabButton} ${activeTab === 'schedule' ? styles.active : ''}`}
                                onClick={() => setActiveTab('schedule')}
                            >
                                Send Schedule
                            </button>
                        </div>
                        
                        {coachAssignedSports.length > 0 && activeTab === 'create' && (
                            <div className={styles.sportsInfo}>
                                <strong>Your Assigned Sports:</strong>
                                <div className={styles.sportsList}>
                                    {coachAssignedSports.map(sport => (
                                        <span key={sport.sportId} className={styles.sportBadge}>
                                            {sport.sportName} ({sport.members ? sport.members.length : 0} members)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {message.text && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Create/Edit Training Plan Tab */}
                    {activeTab === 'create' && (
                        <div className={styles.tabContent}>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="sport">Select Sport*</label>
                                    <select
                                        id="sport"
                                        name="sport"
                                        value={formData.sport}
                                        onChange={handleInputChange}
                                        required
                                        disabled={editingPlan} // Disable sport change when editing
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
                                        rows="4"
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
                                                placeholder="Session Focus"
                                                value={session.focus}
                                                onChange={e => handleSessionChange(idx, 'focus', e.target.value)}
                                                required
                                            />
                                            {formData.sessions.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeSession(idx)} 
                                                    className={styles.deleteBtn}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={addSession} className={styles.addButton}>
                                        Add Session
                                    </button>
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                                        {isSubmitting ? 'Processing...' : editingPlan ? 'Update Plan' : 'Send Training Plan'}
                                    </button>
                                    {editingPlan && (
                                        <button type="button" onClick={resetForm} className={styles.cancelBtn}>
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Manage Plans Tab */}
                    {activeTab === 'manage' && (
                        <div className={styles.tabContent}>
                            <div className={styles.plansGrid}>
                                {sentPlans.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>No training plans created yet.</p>
                                        <button 
                                            onClick={() => setActiveTab('create')} 
                                            className={styles.createFirstBtn}
                                        >
                                            Create Your First Plan
                                        </button>
                                    </div>
                                ) : (
                                    sentPlans.map(plan => (
                                        <div key={plan._id} className={styles.planCard}>
                                            <div className={styles.planHeader}>
                                                <h3>{plan.title}</h3>
                                                <div className={styles.planActions}>
                                                    <button 
                                                        onClick={() => handleEdit(plan)}
                                                        className={styles.editBtn}
                                                        title="Edit Plan"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(plan._id)}
                                                        className={styles.deleteBtn}
                                                        title="Delete Plan"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                            <div className={styles.planMeta}>
                                                <span className={styles.sportName}>
                                                    🏃 {getSportName(plan.sport._id || plan.sport)}
                                                </span>
                                                <span className={styles.planDate}>
                                                    📅 {new Date(plan.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {plan.description && (
                                                <p className={styles.planDescription}>{plan.description}</p>
                                            )}
                                            <div className={styles.sessionsInfo}>
                                                <strong>Sessions: {plan.sessions?.length || 0}</strong>
                                                {plan.sessions?.slice(0, 2).map((session, idx) => (
                                                    <div key={idx} className={styles.sessionPreview}>
                                                        📅 {session.date ? new Date(session.date).toLocaleDateString() : 'No date'} - {session.focus}
                                                    </div>
                                                ))}
                                                {plan.sessions?.length > 2 && (
                                                    <div className={styles.moreSessionsIndicator}>
                                                        +{plan.sessions.length - 2} more sessions...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Send Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <div className={styles.tabContent}>
                            <form onSubmit={handleScheduleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="scheduleSport">Select Sport*</label>
                                    <select
                                        id="scheduleSport"
                                        name="sport"
                                        value={scheduleData.sport}
                                        onChange={handleScheduleChange}
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

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="scheduleDate">Date*</label>
                                        <input
                                            type="date"
                                            id="scheduleDate"
                                            name="date"
                                            value={scheduleData.date}
                                            onChange={handleScheduleChange}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="scheduleTime">Time*</label>
                                        <input
                                            type="time"
                                            id="scheduleTime"
                                            name="time"
                                            value={scheduleData.time}
                                            onChange={handleScheduleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="scheduleTitle">Event Title*</label>
                                    <input
                                        type="text"
                                        id="scheduleTitle"
                                        name="title"
                                        value={scheduleData.title}
                                        onChange={handleScheduleChange}
                                        placeholder="e.g., Training Session, Match, Tournament"
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="scheduleLocation">Location*</label>
                                    <input
                                        type="text"
                                        id="scheduleLocation"
                                        name="location"
                                        value={scheduleData.location}
                                        onChange={handleScheduleChange}
                                        placeholder="e.g., Main Ground, Gym, Pool"
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="scheduleDescription">Additional Details</label>
                                    <textarea
                                        id="scheduleDescription"
                                        name="description"
                                        value={scheduleData.description}
                                        onChange={handleScheduleChange}
                                        placeholder="Any additional information for participants..."
                                        rows="3"
                                    />
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                                        {isSubmitting ? 'Sending...' : 'Send Schedule'}
                                    </button>
                                    <button type="button" onClick={resetScheduleForm} className={styles.resetBtn}>
                                        Reset Form
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SendTrainingPlan;