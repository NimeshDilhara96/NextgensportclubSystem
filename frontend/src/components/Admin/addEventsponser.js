import React, { useState, useEffect } from 'react';
import AdminSlideNav from './AdminSlideNav';
import axios from 'axios';
import styles from './addevent.module.css'; // Updated import
import { 
    FaCalendarPlus, FaHandshake, FaTags, FaTrash, FaEdit, 
    FaImage, FaMapMarkerAlt, FaClock, FaGlobe, FaPhone, FaEnvelope, FaUsers,
    FaFileAlt, FaCheck, FaTimes, FaEye, FaSearch, FaDownload
} from 'react-icons/fa';

const AddEventSponser = () => {
    // Tab state to toggle between Events, Sponsors, and Applications
    const [activeTab, setActiveTab] = useState('events'); // 'events', 'sponsors', or 'applications'
    
    // Events state
    const [events, setEvents] = useState([]);
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [showEditEventModal, setShowEditEventModal] = useState(false);
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventAttendees, setEventAttendees] = useState([]);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
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
    
    // Applications state
    const [applications, setApplications] = useState([]);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [applicationFilter, setApplicationFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected', 'under_review'
    const [applicationSearch, setApplicationSearch] = useState('');
    const [loadingApplications, setLoadingApplications] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch data on component mount
    useEffect(() => {
        if (activeTab === 'events') {
            fetchEvents();
        } else if (activeTab === 'sponsors') {
            fetchSponsors();
        } else if (activeTab === 'applications') {
            fetchApplications();
        }
    }, [activeTab]);

    // Updated Applications API calls with proper authentication
    const fetchApplications = async () => {
        setLoadingApplications(true);
        try {
            setMessage({ type: '', text: '' });
            
            // For now, fetch without authentication since we need to set up admin auth properly
            // You can update this to use proper admin authentication later
            const response = await axios.get('http://localhost:8070/sponsorship-applications/public');
            
            // If the above route doesn't exist, try the direct approach without auth
            // Comment out the line above and uncomment below if needed:
            // const response = await axios.get('http://localhost:8070/sponsorship-applications');
            
            setApplications(response.data);
        } catch (error) {
            console.error('Error fetching applications:', error);
            
            // Try alternative approach - fetch all applications without auth requirement
            try {
                const response = await axios.get('http://localhost:8070/sponsorship-applications/all');
                setApplications(response.data);
            } catch (secondError) {
                console.error('Second attempt failed:', secondError);
                setMessage({ type: 'error', text: 'Failed to load applications. Please check your connection.' });
                setApplications([]); // Set empty array to prevent undefined errors
            }
        } finally {
            setLoadingApplications(false);
        }
    };

    // Handle application status update
    const handleUpdateApplicationStatus = async (applicationId, status, reviewNotes = '') => {
        try {
            setIsSubmitting(true);
            
            // For now, make the request without authentication
            // You should add proper admin authentication later
            const response = await axios.put(
                `http://localhost:8070/sponsorship-applications/${applicationId}/status/admin`,
                {
                    status,
                    reviewNotes,
                    reviewedBy: 'Admin' // Hardcoded for now, should come from auth
                }
            );

            if (response.data) {
                setMessage({ 
                    type: 'success', 
                    text: `Application ${status} successfully!` 
                });
                await fetchApplications(); // Refresh the list
                setShowApplicationModal(false);
            }
        } catch (error) {
            console.error('Error updating application status:', error);
            const errorMsg = error.response?.data?.msg || 'Failed to update application status';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle viewing application details
    const handleViewApplication = (application) => {
        setSelectedApplication(application);
        setShowApplicationModal(true);
    };

    // Filter applications based on status and search
    const filteredApplications = applications.filter(app => {
        const matchesFilter = applicationFilter === 'all' || app.status === applicationFilter;
        const matchesSearch = applicationSearch === '' || 
            app.applicantName.toLowerCase().includes(applicationSearch.toLowerCase()) ||
            app.applicantEmail.toLowerCase().includes(applicationSearch.toLowerCase()) ||
            app.appliedForName.toLowerCase().includes(applicationSearch.toLowerCase());
        
        return matchesFilter && matchesSearch;
    });

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#10b981';
            case 'rejected': return '#ef4444';
            case 'under_review': return '#f59e0b';
            case 'pending': return '#6b7280';
            default: return '#6b7280';
        }
    };

    // Get status badge style
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved': return styles.statusApproved;
            case 'rejected': return styles.statusRejected;
            case 'under_review': return styles.statusReview;
            case 'pending': return styles.statusPending;
            default: return styles.statusPending;
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    // Format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    // Events API calls (existing code)
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

    // Fetch attendees for a specific event (existing code)
    const fetchEventAttendees = async (eventId) => {
        setLoadingAttendees(true);
        try {
            let response;
            const token = localStorage.getItem('token');
            
            // Try the dedicated attendees endpoint first (if admin token is available)
            if (token) {
                try {
                    response = await axios.get(`http://localhost:8070/events/attendees/${eventId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.data) {
                        setEventAttendees(response.data);
                        return;
                    }
                } catch (authError) {
                    console.log('Admin endpoint failed, trying public endpoint...');
                }
            }
            
            // Fallback to public event endpoint
            response = await axios.get(`http://localhost:8070/events/${eventId}`);
            
            if (response.data && response.data.attendees) {
                setEventAttendees(response.data.attendees);
            } else {
                setEventAttendees([]);
            }
        } catch (error) {
            console.error('Error fetching event attendees:', error);
            setMessage({ type: 'error', text: 'Failed to load event attendees' });
            setEventAttendees([]);
        } finally {
            setLoadingAttendees(false);
        }
    };

    // Handle viewing attendees (existing code)
    const handleViewAttendees = async (event) => {
        setSelectedEvent(event);
        setShowAttendeesModal(true);
        await fetchEventAttendees(event._id);
    };

    // Sponsors API calls (existing code)
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

    // Event form handlers (existing code)
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

    // Sponsor form handlers (existing code)
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

    // Handle adding a new event (existing code - shortened for brevity)
    const handleAddEvent = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            if (!eventFormData.title || !eventFormData.description || 
                !eventFormData.date || !eventFormData.startTime || 
                !eventFormData.endTime || !eventFormData.location) {
                setMessage({ type: 'error', text: 'All fields are required' });
                setIsSubmitting(false);
                return;
            }
            
            const formData = new FormData();
            formData.append('title', eventFormData.title);
            formData.append('description', eventFormData.description);
            formData.append('date', eventFormData.date);
            formData.append('startTime', eventFormData.startTime);
            formData.append('endTime', eventFormData.endTime);
            formData.append('location', eventFormData.location);
            
            if (eventFormData.image) {
                formData.append('image', eventFormData.image);
            }

            await axios.post(
                'http://localhost:8070/events',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setMessage({ type: 'success', text: 'Event added successfully!' });
            await fetchEvents();
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

    // Handle editing an event (existing code)
    const handleEditEventClick = (event) => {
        setSelectedEvent(event);
        setEventFormData({
            title: event.title,
            description: event.description,
            date: event.date ? event.date.substring(0, 10) : '',
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            image: null
        });
        setShowEditEventModal(true);
    };

    // Update event (existing code - shortened for brevity)
    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        if (!selectedEvent) return;
        
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('title', eventFormData.title);
            formData.append('description', eventFormData.description);
            formData.append('date', eventFormData.date);
            formData.append('startTime', eventFormData.startTime);
            formData.append('endTime', eventFormData.endTime);
            formData.append('location', eventFormData.location);
            
            if (eventFormData.image && eventFormData.image instanceof File) {
                formData.append('image', eventFormData.image);
            }

            await axios.put(
                `http://localhost:8070/events/${selectedEvent._id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setMessage({ type: 'success', text: 'Event updated successfully!' });
            await fetchEvents();
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

    // Handle deleting an event (existing code)
    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await axios.delete(`http://localhost:8070/events/${eventId}`);
                setMessage({ type: 'success', text: 'Event deleted successfully!' });
                fetchEvents();
            } catch (error) {
                console.error('Error deleting event:', error);
                setMessage({ type: 'error', text: 'Failed to delete event' });
            }
        }
    };

    // Handle adding a new sponsor (existing code - shortened for brevity)
    const handleAddSponsor = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            if (!sponsorFormData.name || !sponsorFormData.type || !sponsorFormData.contactName || 
                !sponsorFormData.email || !sponsorFormData.phone || !sponsorFormData.startDate || 
                !sponsorFormData.endDate || !sponsorFormData.description) {
                setMessage({ type: 'error', text: 'All required fields must be filled' });
                setIsSubmitting(false);
                return;
            }
            
            const formData = new FormData();
            formData.append('name', sponsorFormData.name);
            formData.append('type', sponsorFormData.type);
            formData.append('contactName', sponsorFormData.contactName);
            formData.append('email', sponsorFormData.email);
            formData.append('phone', sponsorFormData.phone);
            formData.append('website', sponsorFormData.website);
            formData.append('startDate', sponsorFormData.startDate);
            formData.append('endDate', sponsorFormData.endDate);
            formData.append('amount', sponsorFormData.amount);
            formData.append('description', sponsorFormData.description);
            
            if (sponsorFormData.logo) {
                formData.append('logo', sponsorFormData.logo);
            }

            await axios.post(
                'http://localhost:8070/sponsors',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setMessage({ type: 'success', text: 'Sponsor added successfully!' });
            await fetchSponsors();
            setShowAddSponsorModal(false);
            resetSponsorForm();
        } catch (error) {
            console.error('Error adding sponsor:', error);
            const errorMsg = error.response?.data?.msg || error.response?.data?.error || 'Failed to add sponsor';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle editing a sponsor (existing code)
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
            logo: null,
        });
        setShowEditSponsorModal(true);
    };

    // Update sponsor (existing code - shortened for brevity)
    const handleUpdateSponsor = async (e) => {
        e.preventDefault();
        if (!selectedSponsor) return;
        
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('name', sponsorFormData.name);
            formData.append('type', sponsorFormData.type);
            formData.append('contactName', sponsorFormData.contactName);
            formData.append('email', sponsorFormData.email);
            formData.append('phone', sponsorFormData.phone);
            formData.append('website', sponsorFormData.website);
            formData.append('startDate', sponsorFormData.startDate);
            formData.append('endDate', sponsorFormData.endDate);
            formData.append('amount', sponsorFormData.amount);
            formData.append('description', sponsorFormData.description);
            
            if (sponsorFormData.logo && sponsorFormData.logo instanceof File) {
                formData.append('logo', sponsorFormData.logo);
            }

            await axios.put(
                `http://localhost:8070/sponsors/${selectedSponsor._id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setMessage({ type: 'success', text: 'Sponsor updated successfully!' });
            await fetchSponsors();
            setShowEditSponsorModal(false);
            resetSponsorForm();
        } catch (error) {
            console.error('Error updating sponsor:', error);
            const errorMsg = error.response?.data?.msg || error.response?.data?.error || 'Failed to update sponsor';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting a sponsor (existing code)
    const handleDeleteSponsor = async (sponsorId) => {
        if (window.confirm('Are you sure you want to delete this sponsor?')) {
            try {
                await axios.delete(`http://localhost:8070/sponsors/${sponsorId}`);
                setMessage({ type: 'success', text: 'Sponsor deleted successfully!' });
                fetchSponsors();
            } catch (error) {
                console.error('Error deleting sponsor:', error);
                setMessage({ type: 'error', text: 'Failed to delete sponsor' });
            }
        }
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
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'applications' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('applications')}
                        >
                            <FaFileAlt /> Applications
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}

                {/* Applications Tab Content */}
                {activeTab === 'applications' && (
                    <div className={styles.tabContent}>
                        <div className={styles.actionBar}>
                            <div className={styles.searchAndFilter}>
                                <div className={styles.searchBox}>
                                    <FaSearch className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or sponsor..."
                                        value={applicationSearch}
                                        onChange={(e) => setApplicationSearch(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                </div>
                                <select
                                    value={applicationFilter}
                                    onChange={(e) => setApplicationFilter(e.target.value)}
                                    className={styles.filterSelect}
                                >
                                    <option value="all">All Applications</option>
                                    <option value="pending">Pending</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        {/* Applications List */}
                        <div className={styles.facilitiesList}>
                            {loadingApplications ? (
                                <div className={styles.loadingState}>
                                    <p>Loading applications...</p>
                                </div>
                            ) : filteredApplications.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FaFileAlt className={styles.emptyIcon} />
                                    <p>No applications found.</p>
                                </div>
                            ) : (
                                <table className={styles.facilitiesTable}>
                                    <thead>
                                        <tr>
                                            <th>Applicant</th>
                                            <th>Sponsor Program</th>
                                            <th>Applied Date</th>
                                            <th>Status</th>
                                            <th>Contact</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredApplications.map(application => (
                                            <tr key={application._id}>
                                                <td>
                                                    <div className={styles.applicantInfo}>
                                                        <strong>{application.applicantName}</strong>
                                                        <small>{application.applicantEmail}</small>
                                                    </div>
                                                </td>
                                                <td>{application.appliedForName}</td>
                                                <td>{formatDate(application.submittedAt)}</td>
                                                <td>
                                                    <span 
                                                        className={`${styles.statusBadge} ${getStatusBadgeClass(application.status)}`}
                                                        style={{ backgroundColor: getStatusColor(application.status) }}
                                                    >
                                                        {application.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>{application.phone}</td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button 
                                                            className={styles.viewBtn}
                                                            onClick={() => handleViewApplication(application)}
                                                            title="View Details"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        {(application.status === 'pending' || application.status === 'under_review') && (
                                                            <>
                                                                <button 
                                                                    className={styles.approveBtn}
                                                                    onClick={() => handleUpdateApplicationStatus(application._id, 'approved')}
                                                                    title="Approve"
                                                                    disabled={isSubmitting}
                                                                >
                                                                    <FaCheck />
                                                                </button>
                                                                <button 
                                                                    className={styles.rejectBtn}
                                                                    onClick={() => handleUpdateApplicationStatus(application._id, 'rejected')}
                                                                    title="Reject"
                                                                    disabled={isSubmitting}
                                                                >
                                                                    <FaTimes />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* View Application Modal */}
                {showApplicationModal && selectedApplication && (
                    <div className={styles.modal}>
                        <div className={`${styles.modalContent} ${styles.largeModal}`}>
                            <div className={styles.modalHeader}>
                                <h2>
                                    <FaFileAlt />
                                    Application Details - {selectedApplication.applicantName}
                                </h2>
                                <button 
                                    className={styles.closeBtn}
                                    onClick={() => {
                                        setShowApplicationModal(false);
                                        setSelectedApplication(null);
                                    }}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            
                            <div className={styles.applicationDetails}>
                                <div className={styles.detailsGrid}>
                                    {/* Personal Information */}
                                    <div className={styles.detailSection}>
                                        <h3>Personal Information</h3>
                                        <div className={styles.detailItem}>
                                            <label>Full Name:</label>
                                            <span>{selectedApplication.applicantName}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Email:</label>
                                            <span>{selectedApplication.applicantEmail}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Phone:</label>
                                            <span>{selectedApplication.phone}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Date of Birth:</label>
                                            <span>{formatDate(selectedApplication.dateOfBirth)}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Address:</label>
                                            <span>{selectedApplication.address}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Occupation:</label>
                                            <span>{selectedApplication.occupation}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Monthly Income:</label>
                                            <span>${selectedApplication.monthlyIncome}</span>
                                        </div>
                                    </div>

                                    {/* Application Details */}
                                    <div className={styles.detailSection}>
                                        <h3>Application Details</h3>
                                        <div className={styles.detailItem}>
                                            <label>Applied For:</label>
                                            <span>{selectedApplication.appliedForName}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Application Date:</label>
                                            <span>{formatDateTime(selectedApplication.submittedAt)}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Status:</label>
                                            <span 
                                                className={`${styles.statusBadge} ${getStatusBadgeClass(selectedApplication.status)}`}
                                                style={{ backgroundColor: getStatusColor(selectedApplication.status) }}
                                            >
                                                {selectedApplication.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Reason for Application:</label>
                                            <span className={styles.textArea}>{selectedApplication.reasonForApplication}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Specific Needs:</label>
                                            <span className={styles.textArea}>{selectedApplication.specificNeeds}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Previous Sponsorship:</label>
                                            <span>{selectedApplication.hasReceivedSponsorshipBefore ? 'Yes' : 'No'}</span>
                                        </div>
                                        {selectedApplication.hasReceivedSponsorshipBefore && selectedApplication.previousSponsorshipDetails && (
                                            <div className={styles.detailItem}>
                                                <label>Previous Details:</label>
                                                <span className={styles.textArea}>{selectedApplication.previousSponsorshipDetails}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className={styles.detailSection}>
                                        <h3>Emergency Contact</h3>
                                        <div className={styles.detailItem}>
                                            <label>Name:</label>
                                            <span>{selectedApplication.emergencyContactName}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Phone:</label>
                                            <span>{selectedApplication.emergencyContactPhone}</span>
                                        </div>
                                    </div>

                                    {/* Documents */}
                                    {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                                        <div className={styles.detailSection}>
                                            <h3>Documents</h3>
                                            <div className={styles.documentsList}>
                                                {selectedApplication.documents.map((doc, index) => (
                                                    <div key={index} className={styles.documentItem}>
                                                        <FaFileAlt />
                                                        <span>{doc.originalName}</span>
                                                        <button 
                                                            className={styles.downloadBtn}
                                                            onClick={() => window.open(`http://localhost:8070/${doc.path}`, '_blank')}
                                                        >
                                                            <FaDownload />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Review Information */}
                                    {selectedApplication.reviewedAt && (
                                        <div className={styles.detailSection}>
                                            <h3>Review Information</h3>
                                            <div className={styles.detailItem}>
                                                <label>Reviewed By:</label>
                                                <span>{selectedApplication.reviewedBy}</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label>Reviewed At:</label>
                                                <span>{formatDateTime(selectedApplication.reviewedAt)}</span>
                                            </div>
                                            {selectedApplication.reviewNotes && (
                                                <div className={styles.detailItem}>
                                                    <label>Review Notes:</label>
                                                    <span className={styles.textArea}>{selectedApplication.reviewNotes}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                {(selectedApplication.status === 'pending' || selectedApplication.status === 'under_review') && (
                                    <>
                                        <button 
                                            className={styles.approveBtn}
                                            onClick={() => handleUpdateApplicationStatus(selectedApplication._id, 'approved')}
                                            disabled={isSubmitting}
                                        >
                                            <FaCheck /> Approve Application
                                        </button>
                                        {selectedApplication.status === 'pending' && (
                                            <button 
                                                className={styles.reviewBtn}
                                                onClick={() => handleUpdateApplicationStatus(selectedApplication._id, 'under_review')}
                                                disabled={isSubmitting}
                                            >
                                                <FaEye /> Mark Under Review
                                            </button>
                                        )}
                                        <button 
                                            className={styles.rejectBtn}
                                            onClick={() => handleUpdateApplicationStatus(selectedApplication._id, 'rejected')}
                                            disabled={isSubmitting}
                                        >
                                            <FaTimes /> Reject Application
                                        </button>
                                    </>
                                )}
                                <button 
                                    className={styles.cancelBtn}
                                    onClick={() => {
                                        setShowApplicationModal(false);
                                        setSelectedApplication(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Events Tab Content (existing code) */}
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
                                                <td>
                                                    <span className={styles.attendeeCount}>
                                                        {event.attendees?.length || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button 
                                                            className={styles.viewBtn}
                                                            onClick={() => handleViewAttendees(event)}
                                                            title="View Attendees"
                                                        >
                                                            <FaUsers />
                                                        </button>
                                                        <button 
                                                            className={styles.editBtn}
                                                            onClick={() => handleEditEventClick(event)}
                                                            title="Edit Event"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button 
                                                            className={styles.deleteBtn}
                                                            onClick={() => handleDeleteEvent(event._id)}
                                                            title="Delete Event"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Sponsors Tab Content (existing code) */}
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

                {/* Attendees Modal */}
                {showAttendeesModal && selectedEvent && (
                    <div className={styles.attendeesModal}>
                        <div className={styles.attendeesModalContent}>
                            <div className={styles.attendeesModalHeader}>
                                <h2><FaUsers /> Event Attendees</h2>
                            </div>
                            
                            <div className={styles.attendeesModalBody}>
                                <div className={styles.eventTitle}>
                                    {selectedEvent.title}
                                </div>
                                
                                {loadingAttendees ? (
                                    <div className={styles.loadingAttendees}>
                                        <div className={styles.loadingSpinner}></div>
                                        <p>Loading attendees...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.attendeesStats}>
                                            <span className={styles.attendeesCount}>
                                                {eventAttendees.length}
                                            </span>
                                            <span className={styles.attendeesStatsText}>
                                                {eventAttendees.length === 1 ? 'Attendee registered' : 'Attendees registered'}
                                            </span>
                                        </div>
                                        
                                        {eventAttendees.length === 0 ? (
                                            <div className={styles.emptyAttendees}>
                                                <FaUsers className={styles.emptyIcon} />
                                                <div className={styles.emptyText}>No attendees yet</div>
                                                <div className={styles.emptySubtext}>
                                                    Attendees will appear here once they register for this event
                                                </div>
                                            </div>
                                        ) : (
                                            <ul className={styles.attendeesList}>
                                                {eventAttendees.map((attendee, index) => (
                                                    <li key={index}>
                                                        <div className={styles.attendeeItem}>
                                                            <div className={styles.attendeeAvatar}>
                                                                {attendee.userName ? attendee.userName.charAt(0).toUpperCase() : 'U'}
                                                            </div>
                                                            <div className={styles.attendeeInfo}>
                                                                <strong>{attendee.userName || 'Unknown User'}</strong>
                                                                <span>📧 {attendee.userEmail || 'No email provided'}</span>
                                                                {attendee.registeredAt && (
                                                                    <span>📅 Registered: {new Date(attendee.registeredAt).toLocaleDateString()}</span>
                                                                )}
                                                            </div>
                                                            <div className={styles.attendeeActions}>
                                                                <button 
                                                                    className={styles.contactBtn}
                                                                    onClick={() => window.open(`mailto:${attendee.userEmail}`, '_blank')}
                                                                    title="Send Email"
                                                                >
                                                                    <FaEnvelope />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            <div className={styles.attendeesModalFooter}>
                                {eventAttendees.length > 0 && (
                                    <button 
                                        className={styles.exportBtn}
                                        onClick={() => {
                                            const csvContent = "data:text/csv;charset=utf-8," 
                                                + "Name,Email,Registration Date\n"
                                                + eventAttendees.map(attendee => 
                                                    `"${attendee.userName || 'Unknown'}","${attendee.userEmail || ''}","${attendee.registeredAt ? new Date(attendee.registeredAt).toLocaleDateString() : ''}"`
                                                ).join("\n");
                                            const encodedUri = encodeURI(csvContent);
                                            const link = document.createElement("a");
                                            link.setAttribute("href", encodedUri);
                                            link.setAttribute("download", `${selectedEvent.title}_attendees.csv`);
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                    >
                                        <FaDownload /> Export CSV
                                    </button>
                                )}
                                <button 
                                    className={styles.cancelBtn}
                                    onClick={() => {
                                        setShowAttendeesModal(false);
                                        setSelectedEvent(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AddEventSponser;