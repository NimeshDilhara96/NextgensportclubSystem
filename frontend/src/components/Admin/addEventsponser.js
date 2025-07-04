import React, { useState, useEffect } from 'react';
import AdminSlideNav from './AdminSlideNav';
import axios from 'axios';
import styles from './AdminForms.module.css';
import { 
    FaCalendarPlus, FaHandshake, FaTags, FaTrash, FaEdit, 
    FaImage, FaMapMarkerAlt, FaClock, FaGlobe, FaPhone, FaEnvelope 
} from 'react-icons/fa';

const AddEventSponser = () => {
    // Tab state to toggle between Events and Sponsors
    const [activeTab, setActiveTab] = useState('events'); // 'events' or 'sponsors'
    
    // Events state
    const [events, setEvents] = useState([]);
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [showEditEventModal, setShowEditEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventFormData, setEventFormData] = useState({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        image: null,
    });
    
    // Sponsors state
    const [sponsors, setSponsors] = useState([]);
    const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
    const [showEditSponsorModal, setShowEditSponsorModal] = useState(false);
    const [selectedSponsor, setSelectedSponsor] = useState(null);
    const [sponsorFormData, setSponsorFormData] = useState({
        name: '',
        type: '',
        contactName: '',
        email: '',
        phone: '',
        website: '',
        startDate: '',
        endDate: '',
        amount: '',
        description: '',
        logo: null,
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch data on component mount
    useEffect(() => {
        if (activeTab === 'events') {
            fetchEvents();
        } else {
            fetchSponsors();
        }
    }, [activeTab]);

    // Events API calls
    const fetchEvents = async () => {
        try {
            setMessage({ type: '', text: '' });
            const response = await axios.get('http://localhost:8070/events');
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
            setMessage({ type: 'error', text: 'Failed to load events' });
        }
    };

    // Sponsors API calls
    const fetchSponsors = async () => {
        try {
            setMessage({ type: '', text: '' });
            const response = await axios.get('http://localhost:8070/sponsors');
            setSponsors(response.data);
        } catch (error) {
            console.error('Error fetching sponsors:', error);
            setMessage({ type: 'error', text: 'Failed to load sponsors' });
        }
    };

    // Event form handlers
    const handleEventInputChange = (e) => {
        const { name, value } = e.target;
        setEventFormData({ ...eventFormData, [name]: value });
    };

    const handleEventImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setEventFormData({
                ...eventFormData,
                image: e.target.files[0]
            });
        }
    };

    const resetEventForm = () => {
        setEventFormData({
            title: '',
            description: '',
            date: '',
            startTime: '',
            endTime: '',
            location: '',
            image: null,
        });
    };

    // Sponsor form handlers
    const handleSponsorInputChange = (e) => {
        const { name, value } = e.target;
        setSponsorFormData({ ...sponsorFormData, [name]: value });
    };

    const handleSponsorLogoChange = (e) => {
        setSponsorFormData({ ...sponsorFormData, logo: e.target.files[0] });
    };

    const resetSponsorForm = () => {
        setSponsorFormData({
            name: '',
            type: '',
            contactName: '',
            email: '',
            phone: '',
            website: '',
            startDate: '',
            endDate: '',
            amount: '',
            description: '',
            logo: null,
        });
    };

    // Handle adding a new event - simplified like CreatePost
    const handleAddEvent = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            // Validate form data
            if (!eventFormData.title || !eventFormData.description || 
                !eventFormData.date || !eventFormData.startTime || 
                !eventFormData.endTime || !eventFormData.location) {
                setMessage({ type: 'error', text: 'All fields are required' });
                setIsSubmitting(false);
                return;
            }
            
            const formData = new FormData();
            
            // Append all form fields - similar to CreatePost
            formData.append('title', eventFormData.title);
            formData.append('description', eventFormData.description);
            formData.append('date', eventFormData.date);
            formData.append('startTime', eventFormData.startTime);
            formData.append('endTime', eventFormData.endTime);
            formData.append('location', eventFormData.location);
            
            // Only append image if provided
            if (eventFormData.image) {
                formData.append('image', eventFormData.image);
            }
            
            // Log FormData contents for debugging
            console.log('Sending event data:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value instanceof File ? value.name : value}`);
            }

            // Simplified request without auth token (like CreatePost)
            const response = await axios.post(
                'http://localhost:8070/events',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Add event response:', response.data);
            
            setMessage({ type: 'success', text: 'Event added successfully!' });
            await fetchEvents(); // Refresh the list
            setShowAddEventModal(false);
            resetEventForm();
        } catch (error) {
            console.error('Error adding event:', error);
            const errorMsg = error.response?.data?.msg || error.response?.data?.error || 'Failed to add event';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle editing an event
    const handleEditEventClick = (event) => {
        setSelectedEvent(event);
        setEventFormData({
            title: event.title,
            description: event.description,
            date: event.date ? event.date.substring(0, 10) : '',
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            image: null // Don't set the image here, just keep it null until a new one is selected
        });
        setShowEditEventModal(true);
    };

    // Update the handleUpdateEvent function - simplified like CreatePost
    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        if (!selectedEvent) return;
        
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            
            // Append all form fields - similar to CreatePost
            formData.append('title', eventFormData.title);
            formData.append('description', eventFormData.description);
            formData.append('date', eventFormData.date);
            formData.append('startTime', eventFormData.startTime);
            formData.append('endTime', eventFormData.endTime);
            formData.append('location', eventFormData.location);
            
            // Only append image if a new one is selected
            if (eventFormData.image && eventFormData.image instanceof File) {
                formData.append('image', eventFormData.image);
            }
            
            // Log FormData for debugging
            console.log('Sending update data:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value instanceof File ? value.name : value}`);
            }

            // Simplified request without auth token (like CreatePost)
            const response = await axios.put(
                `http://localhost:8070/events/${selectedEvent._id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Update response:', response.data);
            
            setMessage({ type: 'success', text: 'Event updated successfully!' });
            await fetchEvents(); // Refresh the events list
            setShowEditEventModal(false);
            resetEventForm();
        } catch (error) {
            console.error('Error updating event:', error);
            const errorMsg = error.response?.data?.msg || error.response?.data?.error || 'Failed to update event';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting an event
    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                const token = sessionStorage.getItem('adminToken');
                await axios.delete(`http://localhost:8070/events/${eventId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                
                setMessage({ type: 'success', text: 'Event deleted successfully!' });
                fetchEvents(); // Refresh the list
            } catch (error) {
                console.error('Error deleting event:', error);
                setMessage({ type: 'error', text: 'Failed to delete event' });
            }
        }
    };

    // Handle adding a new sponsor
    const handleAddSponsor = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const sponsorData = new FormData();
            Object.keys(sponsorFormData).forEach((key) => {
                if (sponsorFormData[key] !== null) {
                    sponsorData.append(key, sponsorFormData[key]);
                }
            });

            const token = sessionStorage.getItem('adminToken');
            await axios.post('http://localhost:8070/sponsors', sponsorData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            setMessage({ type: 'success', text: 'Sponsor added successfully!' });
            await fetchSponsors(); // Refresh the list
            setShowAddSponsorModal(false);
            resetSponsorForm();
        } catch (error) {
            console.error('Error adding sponsor:', error);
            setMessage({ type: 'error', text: 'Failed to add sponsor' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle editing a sponsor
    const handleEditSponsorClick = (sponsor) => {
        setSelectedSponsor(sponsor);
        setSponsorFormData({
            name: sponsor.name || '',
            type: sponsor.type || '',
            contactName: sponsor.contactName || '',
            email: sponsor.email || '',
            phone: sponsor.phone || '',
            website: sponsor.website || '',
            startDate: sponsor.startDate ? new Date(sponsor.startDate).toISOString().split('T')[0] : '',
            endDate: sponsor.endDate ? new Date(sponsor.endDate).toISOString().split('T')[0] : '',
            amount: sponsor.amount || '',
            description: sponsor.description || '',
            logo: null, // Reset logo for editing
        });
        setShowEditSponsorModal(true);
    };

    const handleUpdateSponsor = async (e) => {
        e.preventDefault();
        if (!selectedSponsor) return;
        
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const sponsorData = new FormData();
            
            // Add all form fields
            Object.keys(sponsorFormData).forEach((key) => {
                if (key === 'logo' && !sponsorFormData[key]) {
                    // Don't send logo if not changed
                    return;
                }
                if (sponsorFormData[key] !== null) {
                    sponsorData.append(key, sponsorFormData[key]);
                }
            });

            const token = sessionStorage.getItem('adminToken');
            await axios.put(
                `http://localhost:8070/sponsors/${selectedSponsor._id}`,
                sponsorData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            setMessage({ type: 'success', text: 'Sponsor updated successfully!' });
            await fetchSponsors(); // Refresh the list
            setShowEditSponsorModal(false);
            setSelectedSponsor(null);
            resetSponsorForm();
        } catch (error) {
            console.error('Error updating sponsor:', error);
            setMessage({ type: 'error', text: 'Failed to update sponsor' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting a sponsor
    const handleDeleteSponsor = async (sponsorId) => {
        if (window.confirm('Are you sure you want to delete this sponsor?')) {
            try {
                const token = sessionStorage.getItem('adminToken');
                await axios.delete(`http://localhost:8070/sponsors/${sponsorId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                
                setMessage({ type: 'success', text: 'Sponsor deleted successfully!' });
                fetchSponsors(); // Refresh the list
            } catch (error) {
                console.error('Error deleting sponsor:', error);
                setMessage({ type: 'error', text: 'Failed to delete sponsor' });
            }
        }
    };

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <>
            <AdminSlideNav />

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Event & Sponsor Management</h1>
                    <div className={styles.tabContainer}>
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'events' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('events')}
                        >
                            <FaCalendarPlus /> Events
                        </button>
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'sponsors' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('sponsors')}
                        >
                            <FaHandshake /> Sponsors
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}

                {/* Events Tab Content */}
                {activeTab === 'events' && (
                    <div className={styles.tabContent}>
                        <div className={styles.actionBar}>
                            <button 
                                className={styles.addButton}
                                onClick={() => {
                                    resetEventForm();
                                    setShowAddEventModal(true);
                                }}
                            >
                                <FaCalendarPlus /> Add New Event
                            </button>
                        </div>

                        {/* Events List */}
                        <div className={styles.facilitiesList}>
                            {events.length === 0 ? (
                                <p>No events found. Add an event to get started.</p>
                            ) : (
                                <table className={styles.facilitiesTable}>
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Title</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Location</th>
                                            <th>Attendees</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(event => (
                                            <tr key={event._id}>
                                                <td>
                                                    <img 
                                                        src={event.image ? `http://localhost:8070/${event.image}` : '/default-event.jpg'} 
                                                        alt={event.title}
                                                        className={styles.facilityImage}
                                                        width="50"
                                                        height="50"
                                                    />
                                                </td>
                                                <td>{event.title}</td>
                                                <td>{formatDate(event.date)}</td>
                                                <td>{`${event.startTime || 'N/A'} - ${event.endTime || 'N/A'}`}</td>
                                                <td>{event.location || 'N/A'}</td>
                                                <td>{event.attendees?.length || 0}</td>
                                                <td>
                                                    <button 
                                                        className={styles.editBtn}
                                                        onClick={() => handleEditEventClick(event)}
                                                    >
                                                        <FaEdit /> Edit
                                                    </button>
                                                    <button 
                                                        className={styles.deleteBtn}
                                                        onClick={() => handleDeleteEvent(event._id)}
                                                    >
                                                        <FaTrash /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Sponsors Tab Content */}
                {activeTab === 'sponsors' && (
                    <div className={styles.tabContent}>
                        <div className={styles.actionBar}>
                            <button 
                                className={styles.addButton}
                                onClick={() => {
                                    resetSponsorForm();
                                    setShowAddSponsorModal(true);
                                }}
                            >
                                <FaHandshake /> Add New Sponsor
                            </button>
                        </div>

                        {/* Sponsors List */}
                        <div className={styles.facilitiesList}>
                            {sponsors.length === 0 ? (
                                <p>No sponsors found. Add a sponsor to get started.</p>
                            ) : (
                                <table className={styles.facilitiesTable}>
                                    <thead>
                                        <tr>
                                            <th>Logo</th>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Contact</th>
                                            <th>Period</th>
                                            <th>Amount</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sponsors.map(sponsor => (
                                            <tr key={sponsor._id}>
                                                <td>
                                                    <img 
                                                        src={sponsor.logo ? `http://localhost:8070/${sponsor.logo}` : '/default-sponsor.jpg'} 
                                                        alt={sponsor.name}
                                                        className={styles.facilityImage}
                                                        width="50"
                                                        height="50"
                                                    />
                                                </td>
                                                <td>{sponsor.name}</td>
                                                <td>{sponsor.type || 'N/A'}</td>
                                                <td>{sponsor.contactName || 'N/A'}</td>
                                                <td>{`${formatDate(sponsor.startDate)} - ${formatDate(sponsor.endDate)}`}</td>
                                                <td>${sponsor.amount || '0'}</td>
                                                <td>
                                                    <button 
                                                        className={styles.editBtn}
                                                        onClick={() => handleEditSponsorClick(sponsor)}
                                                    >
                                                        <FaEdit /> Edit
                                                    </button>
                                                    <button 
                                                        className={styles.deleteBtn}
                                                        onClick={() => handleDeleteSponsor(sponsor._id)}
                                                    >
                                                        <FaTrash /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Add Event Modal */}
                {showAddEventModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2><FaCalendarPlus /> Add New Event</h2>
                            <form onSubmit={handleAddEvent}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="title">Event Title*</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={eventFormData.title}
                                        onChange={handleEventInputChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="description">Description*</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={eventFormData.description}
                                        onChange={handleEventInputChange}
                                        required
                                        rows="4"
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="date">
                                            <FaCalendarPlus /> Date*
                                        </label>
                                        <input
                                            type="date"
                                            id="date"
                                            name="date"
                                            value={eventFormData.date}
                                            onChange={handleEventInputChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="startTime">
                                            <FaClock /> Start Time*
                                        </label>
                                        <input
                                            type="time"
                                            id="startTime"
                                            name="startTime"
                                            value={eventFormData.startTime}
                                            onChange={handleEventInputChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="endTime">
                                            <FaClock /> End Time*
                                        </label>
                                        <input
                                            type="time"
                                            id="endTime"
                                            name="endTime"
                                            value={eventFormData.endTime}
                                            onChange={handleEventInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="location">
                                        <FaMapMarkerAlt /> Location*
                                    </label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={eventFormData.location}
                                        onChange={handleEventInputChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="image">
                                        <FaImage /> Event Image
                                    </label>
                                    <input
                                        type="file"
                                        id="image"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleEventImageChange}
                                    />
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={styles.submitBtn}
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Event'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddEventModal(false)}
                                        className={styles.cancelBtn}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Event Modal */}
                {showEditEventModal && selectedEvent && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2><FaEdit /> Edit Event</h2>
                            <form onSubmit={handleUpdateEvent}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-title">Event Title*</label>
                                    <input
                                        type="text"
                                        id="edit-title"
                                        name="title"
                                        value={eventFormData.title}
                                        onChange={handleEventInputChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-description">Description*</label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        value={eventFormData.description}
                                        onChange={handleEventInputChange}
                                        required
                                        rows="4"
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-date">
                                            <FaCalendarPlus /> Date*
                                        </label>
                                        <input
                                            type="date"
                                            id="edit-date"
                                            name="date"
                                            value={eventFormData.date}
                                            onChange={handleEventInputChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-startTime">
                                            <FaClock /> Start Time*
                                        </label>
                                        <input
                                            type="time"
                                            id="edit-startTime"
                                            name="startTime"
                                            value={eventFormData.startTime}
                                            onChange={handleEventInputChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-endTime">
                                            <FaClock /> End Time*
                                        </label>
                                        <input
                                            type="time"
                                            id="edit-endTime"
                                            name="endTime"
                                            value={eventFormData.endTime}
                                            onChange={handleEventInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-location">
                                        <FaMapMarkerAlt /> Location*
                                    </label>
                                    <input
                                        type="text"
                                        id="edit-location"
                                        name="location"
                                        value={eventFormData.location}
                                        onChange={handleEventInputChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-image">
                                        <FaImage /> Event Image
                                    </label>
                                    {selectedEvent.image && (
                                        <div className={styles.currentImage}>
                                            <p>Current image:</p>
                                            <img 
                                                src={`http://localhost:8070/${selectedEvent.image}`} 
                                                alt={selectedEvent.title}
                                                className={styles.previewImage} 
                                                width="100"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="edit-image"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleEventImageChange}
                                    />
                                    <p className={styles.helpText}>Leave empty to keep current image</p>
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={styles.submitBtn}
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update Event'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setShowEditEventModal(false);
                                            setSelectedEvent(null);
                                        }}
                                        className={styles.cancelBtn}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Sponsor Modal */}
                {showAddSponsorModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2><FaHandshake /> Add New Sponsor</h2>
                            <form onSubmit={handleAddSponsor}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name">Sponsor Name*</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={sponsorFormData.name}
                                        onChange={handleSponsorInputChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="type">
                                        <FaTags /> Sponsorship Type*
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={sponsorFormData.type}
                                        onChange={handleSponsorInputChange}
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Platinum">Platinum</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Bronze">Bronze</option>
                                        <option value="Event">Event Specific</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={sponsorFormData.description}
                                        onChange={handleSponsorInputChange}
                                        rows="3"
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="contactName">Contact Person</label>
                                        <input
                                            type="text"
                                            id="contactName"
                                            name="contactName"
                                            value={sponsorFormData.contactName}
                                            onChange={handleSponsorInputChange}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="email">
                                            <FaEnvelope /> Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={sponsorFormData.email}
                                            onChange={handleSponsorInputChange}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="phone">
                                            <FaPhone /> Phone
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={sponsorFormData.phone}
                                            onChange={handleSponsorInputChange}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="website">
                                            <FaGlobe /> Website
                                        </label>
                                        <input
                                            type="url"
                                            id="website"
                                            name="website"
                                            value={sponsorFormData.website}
                                            onChange={handleSponsorInputChange}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="startDate">Start Date*</label>
                                        <input
                                            type="date"
                                            id="startDate"
                                            name="startDate"
                                            value={sponsorFormData.startDate}
                                            onChange={handleSponsorInputChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="endDate">End Date*</label>
                                        <input
                                            type="date"
                                            id="endDate"
                                            name="endDate"
                                            value={sponsorFormData.endDate}
                                            onChange={handleSponsorInputChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="amount">Sponsorship Amount ($)</label>
                                        <input
                                            type="number"
                                            id="amount"
                                            name="amount"
                                            value={sponsorFormData.amount}
                                            onChange={handleSponsorInputChange}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="logo">
                                        <FaImage /> Sponsor Logo
                                    </label>
                                    <input
                                        type="file"
                                        id="logo"
                                        name="logo"
                                        accept="image/*"
                                        onChange={handleSponsorLogoChange}
                                    />
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={styles.submitBtn}
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Sponsor'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddSponsorModal(false)}
                                        className={styles.cancelBtn}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Sponsor Modal */}
                {showEditSponsorModal && selectedSponsor && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2><FaEdit /> Edit Sponsor</h2>
                            <form onSubmit={handleUpdateSponsor}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-name">Sponsor Name*</label>
                                    <input
                                        type="text"
                                        id="edit-name"
                                        name="name"
                                        value={sponsorFormData.name}
                                        onChange={handleSponsorInputChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-type">
                                        <FaTags /> Sponsorship Type*
                                    </label>
                                    <select
                                        id="edit-type"
                                        name="type"
                                        value={sponsorFormData.type}
                                        onChange={handleSponsorInputChange}
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Platinum">Platinum</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Bronze">Bronze</option>
                                        <option value="Event">Event Specific</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-description">Description</label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        value={sponsorFormData.description}
                                        onChange={handleSponsorInputChange}
                                        rows="3"
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-contactName">Contact Person</label>
                                        <input
                                            type="text"
                                            id="edit-contactName"
                                            name="contactName"
                                            value={sponsorFormData.contactName}
                                            onChange={handleSponsorInputChange}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-email">
                                            <FaEnvelope /> Email
                                        </label>
                                        <input
                                            type="email"
                                            id="edit-email"
                                            name="email"
                                            value={sponsorFormData.email}
                                            onChange={handleSponsorInputChange}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-phone">
                                            <FaPhone /> Phone
                                        </label>
                                        <input
                                            type="tel"
                                            id="edit-phone"
                                            name="phone"
                                            value={sponsorFormData.phone}
                                            onChange={handleSponsorInputChange}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-website">
                                            <FaGlobe /> Website
                                        </label>
                                        <input
                                            type="url"
                                            id="edit-website"
                                            name="website"
                                            value={sponsorFormData.website}
                                            onChange={handleSponsorInputChange}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-startDate">Start Date*</label>
                                        <input
                                            type="date"
                                            id="edit-startDate"
                                            name="startDate"
                                            value={sponsorFormData.startDate}
                                            onChange={handleSponsorInputChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-endDate">End Date*</label>
                                        <input
                                            type="date"
                                            id="edit-endDate"
                                            name="endDate"
                                            value={sponsorFormData.endDate}
                                            onChange={handleSponsorInputChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="edit-amount">Sponsorship Amount ($)</label>
                                        <input
                                            type="number"
                                            id="edit-amount"
                                            name="amount"
                                            value={sponsorFormData.amount}
                                            onChange={handleSponsorInputChange}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-logo">
                                        <FaImage /> Sponsor Logo
                                    </label>
                                    {selectedSponsor.logo && (
                                        <div className={styles.currentImage}>
                                            <p>Current logo:</p>
                                            <img 
                                                src={`http://localhost:8070/${selectedSponsor.logo}`} 
                                                alt={selectedSponsor.name}
                                                className={styles.previewImage} 
                                                width="100"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="edit-logo"
                                        name="logo"
                                        accept="image/*"
                                        onChange={handleSponsorLogoChange}
                                    />
                                    <p className={styles.helpText}>Leave empty to keep current logo</p>
                                </div>

                                <div className={styles.buttonGroup}>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={styles.submitBtn}
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update Sponsor'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setShowEditSponsorModal(false);
                                            setSelectedSponsor(null);
                                        }}
                                        className={styles.cancelBtn}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AddEventSponser;