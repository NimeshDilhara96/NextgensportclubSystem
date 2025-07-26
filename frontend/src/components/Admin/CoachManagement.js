import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaImage, 
    FaTimes, 
    FaUserPlus, 
    FaEdit, 
    FaTrash, 
    FaSearch, 
    FaUser, 
    FaExclamationTriangle,
    FaListAlt,
    FaPlus
} from 'react-icons/fa';
import AdminSlideNav from './AdminSlideNav';
import styles from './CoachManagement.module.css';

const CoachManagement = () => {
    // Active tab state
    const [activeTab, setActiveTab] = useState('add'); // 'add' or 'manage'
    
    // Shared data
    const specialties = [
        'Personal Training',
        'Swimming',
        'Tennis',
        'Basketball',
        'Football',
        'Yoga',
        'Pilates',
        'Cricket',
        'Nutrition',
        'Strength & Conditioning',
        'Rehabilitation',
        'Boxing',
        'Martial Arts',
        'Golf',
        'Other'
    ];

    const availabilityOptions = [
        { day: 'Monday', value: 'monday' },
        { day: 'Tuesday', value: 'tuesday' },
        { day: 'Wednesday', value: 'wednesday' },
        { day: 'Thursday', value: 'thursday' },
        { day: 'Friday', value: 'friday' },
        { day: 'Saturday', value: 'saturday' },
        { day: 'Sunday', value: 'sunday' }
    ];

    // AddCoach states
    const [coachData, setCoachData] = useState({
        username: '',
        password: '',
        name: '',
        specialty: '',
        experience: '',
        bio: '',
        email: '',
        phone: '',
        availability: [],
        sports: [] // Added for sports assignment
    });
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // ManageCoaches states
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [editImage, setEditImage] = useState(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [coachToDelete, setCoachToDelete] = useState(null);

    // Fetch sports when component mounts
    const [sports, setSports] = useState([]);

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchCoaches();
        }
        const fetchSports = async () => {
            try {
                const response = await axios.get('http://localhost:8070/sports');
                if (response.data.status === 'success') {
                    setSports(response.data.sports);
                }
            } catch (err) {
                // handle error
            }
        };
        fetchSports();
    }, [activeTab]);

    const fetchCoaches = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('http://localhost:8070/coaches');
            if (response.data.success && response.data.coaches) {
                setCoaches(response.data.coaches);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error fetching coaches:', error);
            setError('Failed to fetch coaches. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ====== Add Coach Functions ======
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCoachData({
            ...coachData,
            [name]: value
        });
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size should be less than 5MB');
                return;
            }
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImage(null);
        setPreviewUrl(null);
    };

    const handleAvailabilityChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setCoachData({
                ...coachData,
                availability: [...coachData.availability, value]
            });
        } else {
            setCoachData({
                ...coachData,
                availability: coachData.availability.filter(day => day !== value)
            });
        }
    };

    // Removed unused handleSportsChange function

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validate form data
        if (!coachData.username || !coachData.password || !coachData.name || !coachData.specialty) {
            setError('Username, password, name, and specialty are required fields');
            return;
        }

        if (coachData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            
            // Append text data
            Object.keys(coachData).forEach(key => {
                if (key === 'availability' || key === 'sports') {
                    formData.append(key, JSON.stringify(coachData[key]));
                } else {
                    formData.append(key, coachData[key]);
                }
            });
            
            // Append image if exists
            if (image) {
                formData.append('image', image);
            }

            await axios.post('http://localhost:8070/coaches/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Reset form on success
            setCoachData({
                username: '',
                password: '',
                name: '',
                specialty: '',
                experience: '',
                bio: '',
                email: '',
                phone: '',
                availability: [],
                sports: []
            });
            setImage(null);
            setPreviewUrl(null);
            setSuccess(true);
            
            // Refresh coaches list if we're in manage tab
            if (activeTab === 'manage') {
                fetchCoaches();
            }
        } catch (error) {
            console.error('Error adding coach:', error);
            setError(error.response?.data?.message || 'Failed to add coach. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ====== Manage Coaches Functions ======
    const openEditModal = (coach) => {
        setSelectedCoach({
            ...coach,
            password: '' // Clear password for security
        });
        
        // If coach has an image, set the preview
        if (coach.image) {
            setEditPreviewUrl(`http://localhost:8070${coach.image}`);
        } else {
            setEditPreviewUrl(null);
        }
        
        setShowModal(true);
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedCoach({
            ...selectedCoach,
            [name]: value
        });
    };

    const handleEditImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Image size should be less than 5MB');
                return;
            }
            setEditImage(file);
            setEditPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeEditImage = () => {
        setEditImage(null);
        setEditPreviewUrl(null);
        
        // If we're editing and removing the existing image
        if (selectedCoach && selectedCoach.image) {
            setSelectedCoach({
                ...selectedCoach,
                image: null
            });
        }
    };

    const handleEditAvailabilityChange = (e) => {
        const { value, checked } = e.target;
        let updatedAvailability = [...(selectedCoach.availability || [])];
        
        if (checked) {
            if (!updatedAvailability.includes(value)) {
                updatedAvailability.push(value);
            }
        } else {
            updatedAvailability = updatedAvailability.filter(day => day !== value);
        }
        
        setSelectedCoach({
            ...selectedCoach,
            availability: updatedAvailability
        });
    };

    // Removed unused handleSportsEditChange function

    const handleUpdateCoach = async (e) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            
            // Append basic text data
            formData.append('name', selectedCoach.name);
            formData.append('specialty', selectedCoach.specialty);
            formData.append('experience', selectedCoach.experience || 0);
            formData.append('bio', selectedCoach.bio || '');
            formData.append('email', selectedCoach.email || '');
            formData.append('phone', selectedCoach.phone || '');
            formData.append('isActive', selectedCoach.isActive !== false);
            
            // Only append password if it has been changed
            if (selectedCoach.password) {
                formData.append('password', selectedCoach.password);
            }
            
            // Append availability as JSON string
            formData.append('availability', JSON.stringify(selectedCoach.availability || []));
            formData.append('sports', JSON.stringify(selectedCoach.sports || [])); // Append sports
            
            // Append image if a new one was selected
            if (editImage) {
                formData.append('image', editImage);
            }

            await axios.put(`http://localhost:8070/coaches/${selectedCoach._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh the coaches list
            await fetchCoaches();
            
            // Close modal and reset state
            setShowModal(false);
            setSelectedCoach(null);
            setEditImage(null);
            setEditPreviewUrl(null);
            
        } catch (error) {
            console.error('Error updating coach:', error);
            alert('Failed to update coach. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (coach) => {
        setCoachToDelete(coach);
        setShowDeleteModal(true);
    };

    const handleDeleteCoach = async () => {
        if (!coachToDelete || !coachToDelete._id) return;
        
        try {
            await axios.delete(`http://localhost:8070/coaches/${coachToDelete._id}`);
            
            // Refresh coaches list
            await fetchCoaches();
            
            // Close modal
            setShowDeleteModal(false);
            setCoachToDelete(null);
            
        } catch (error) {
            console.error('Error deleting coach:', error);
            alert('Failed to delete coach. Please try again.');
        }
    };

    // Filter coaches based on search query
    const filteredCoaches = coaches.filter(coach => 
        coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <AdminSlideNav />
            <div className={styles.coachManagementContainer}>
                <h1 className={styles.pageTitle}>Coach Management</h1>
                
                <div className={styles.tabsContainer}>
                    <button 
                        className={`${styles.tabButton} ${activeTab === 'add' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('add')}
                    >
                        <FaPlus /> Add Coach
                    </button>
                    <button 
                        className={`${styles.tabButton} ${activeTab === 'manage' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('manage')}
                    >
                        <FaListAlt /> Manage Coaches
                    </button>
                </div>

                {activeTab === 'add' && (
                    <div className={styles.addCoachSection}>
                        <div className={styles.addCoachCard}>
                            <h2><FaUserPlus /> Add New Coach</h2>
                            
                            {error && <div className={styles.errorMessage}>{error}</div>}
                            {success && <div className={styles.successMessage}>Coach added successfully!</div>}
                            
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="username">Username*</label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={coachData.username}
                                            onChange={handleInputChange}
                                            className={styles.formControl}
                                            required
                                        />
                                    </div>
                                    
                                    <div className={styles.formGroup}>
                                        <label htmlFor="password">Password*</label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={coachData.password}
                                            onChange={handleInputChange}
                                            className={styles.formControl}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="name">Full Name*</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={coachData.name}
                                            onChange={handleInputChange}
                                            className={styles.formControl}
                                            required
                                        />
                                    </div>
                                    
                                    <div className={styles.formGroup}>
                                        <label htmlFor="specialty">Specialty*</label>
                                        <select
                                            id="specialty"
                                            name="specialty"
                                            value={coachData.specialty}
                                            onChange={handleInputChange}
                                            className={styles.formControl}
                                            required
                                        >
                                            <option value="">Select a specialty</option>
                                            {specialties.map(specialty => (
                                                <option key={specialty} value={specialty}>{specialty}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="experience">Experience (years)</label>
                                        <input
                                            type="number"
                                            id="experience"
                                            name="experience"
                                            value={coachData.experience}
                                            onChange={handleInputChange}
                                            min="0"
                                            className={styles.formControl}
                                        />
                                    </div>
                                    
                                    <div className={styles.formGroup}>
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={coachData.email}
                                            onChange={handleInputChange}
                                            className={styles.formControl}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="text"
                                        id="phone"
                                        name="phone"
                                        value={coachData.phone}
                                        onChange={handleInputChange}
                                        className={styles.formControl}
                                    />
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label htmlFor="bio">Bio/Description</label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        value={coachData.bio}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className={styles.formControl}
                                        placeholder="Coach's background, qualifications, and coaching philosophy..."
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Availability</label>
                                    <div className={styles.availabilityOptions}>
                                        {availabilityOptions.map(option => (
                                            <div key={option.value} className={styles.checkboxGroup}>
                                                <input
                                                    type="checkbox"
                                                    id={option.value}
                                                    value={option.value}
                                                    checked={coachData.availability.includes(option.value)}
                                                    onChange={handleAvailabilityChange}
                                                />
                                                <label htmlFor={option.value}>{option.day}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Assign Sports</label>
                                    <div className={styles.sportsCheckboxList}>
                                        {sports.map(sport => (
                                            <label key={sport._id} className={styles.sportCheckboxItem}>
                                                <input
                                                    type="checkbox"
                                                    value={sport._id}
                                                    checked={coachData.sports.includes(sport._id)}
                                                    onChange={e => {
                                                        const checked = e.target.checked;
                                                        const value = e.target.value;
                                                        setCoachData(prev => {
                                                            if (checked) {
                                                                return { ...prev, sports: [...prev.sports, value] };
                                                            } else {
                                                                return { ...prev, sports: prev.sports.filter(id => id !== value) };
                                                            }
                                                        });
                                                    }}
                                                />
                                                {sport.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {previewUrl && (
                                    <div className={styles.imagePreviewContainer}>
                                        <div className={styles.imagePreview}>
                                            <img src={previewUrl} alt="Coach preview" />
                                            <button
                                                type="button"
                                                className={styles.removeImage}
                                                onClick={removeImage}
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className={styles.formActions}>
                                    <div className={styles.uploadButton}>
                                        <label className={styles.imageButton}>
                                            <FaImage /> Upload Profile Photo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                hidden
                                            />
                                        </label>
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        className={styles.submitButton}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Adding Coach...' : 'Add Coach'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'manage' && (
                    <div className={styles.manageCoachesSection}>
                        <div className={styles.searchContainer}>
                            <div className={styles.searchBox}>
                                <FaSearch className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Search coaches by name or specialty..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={styles.searchInput}
                                />
                            </div>
                        </div>

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        {loading ? (
                            <div className={styles.loadingMessage}>Loading coaches...</div>
                        ) : filteredCoaches.length === 0 ? (
                            <div className={styles.noCoachesMessage}>
                                <FaExclamationTriangle />
                                <p>No coaches found. {searchQuery ? 'Try a different search term.' : 'Add some coaches to get started.'}</p>
                            </div>
                        ) : (
                            <div className={styles.coachesGrid}>
                                {filteredCoaches.map(coach => (
                                    <div key={coach._id} className={`${styles.coachCard} ${!coach.isActive ? styles.inactiveCoach : ''}`}>
                                        <div className={styles.coachImage}>
                                            {coach.image ? (
                                                <img src={`http://localhost:8070${coach.image}`} alt={coach.name} />
                                            ) : (
                                                <div className={styles.noImagePlaceholder}>
                                                    <FaUser />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.coachDetails}>
                                            <h3>{coach.name} {!coach.isActive && <span className={styles.inactiveBadge}>Inactive</span>}</h3>
                                            <p className={styles.specialty}>{coach.specialty}</p>
                                            {coach.experience > 0 && (
                                                <p className={styles.experience}>{coach.experience} {coach.experience === 1 ? 'year' : 'years'} experience</p>
                                            )}
                                            <div className={styles.coachActions}>
                                                <button
                                                    className={styles.editButton}
                                                    onClick={() => openEditModal(coach)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    className={styles.deleteButton}
                                                    onClick={() => openDeleteModal(coach)}
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Edit Coach Modal */}
                        {showModal && selectedCoach && (
                            <div className={styles.modalOverlay}>
                                <div className={styles.modal}>
                                    <div className={styles.modalHeader}>
                                        <h3>Edit Coach</h3>
                                        <button className={styles.closeButton} onClick={() => setShowModal(false)}>×</button>
                                    </div>
                                    <div className={styles.modalBody}>
                                        <form onSubmit={handleUpdateCoach}>
                                            <div className={styles.formRow}>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="name">Full Name*</label>
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        name="name"
                                                        value={selectedCoach.name}
                                                        onChange={handleEditInputChange}
                                                        className={styles.formControl}
                                                        required
                                                    />
                                                </div>
                                                
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="specialty">Specialty*</label>
                                                    <select
                                                        id="specialty"
                                                        name="specialty"
                                                        value={selectedCoach.specialty}
                                                        onChange={handleEditInputChange}
                                                        className={styles.formControl}
                                                        required
                                                    >
                                                        <option value="">Select a specialty</option>
                                                        {specialties.map(specialty => (
                                                            <option key={specialty} value={specialty}>{specialty}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className={styles.formRow}>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="experience">Experience (years)</label>
                                                    <input
                                                        type="number"
                                                        id="experience"
                                                        name="experience"
                                                        value={selectedCoach.experience || ''}
                                                        onChange={handleEditInputChange}
                                                        min="0"
                                                        className={styles.formControl}
                                                    />
                                                </div>
                                                
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="password">New Password (leave blank to keep current)</label>
                                                    <input
                                                        type="password"
                                                        id="password"
                                                        name="password"
                                                        value={selectedCoach.password}
                                                        onChange={handleEditInputChange}
                                                        className={styles.formControl}
                                                        placeholder="Enter only if changing password"
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.formRow}>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="email">Email</label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={selectedCoach.email || ''}
                                                        onChange={handleEditInputChange}
                                                        className={styles.formControl}
                                                    />
                                                </div>
                                                
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="phone">Phone Number</label>
                                                    <input
                                                        type="text"
                                                        id="phone"
                                                        name="phone"
                                                        value={selectedCoach.phone || ''}
                                                        onChange={handleEditInputChange}
                                                        className={styles.formControl}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label htmlFor="bio">Bio/Description</label>
                                                <textarea
                                                    id="bio"
                                                    name="bio"
                                                    value={selectedCoach.bio || ''}
                                                    onChange={handleEditInputChange}
                                                    rows="4"
                                                    className={styles.formControl}
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <div className={styles.statusToggle}>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            name="isActive"
                                                            checked={selectedCoach.isActive !== false}
                                                            onChange={(e) => setSelectedCoach({
                                                                ...selectedCoach,
                                                                isActive: e.target.checked
                                                            })}
                                                        />
                                                        Active Status
                                                    </label>
                                                    <span className={styles.statusDescription}>
                                                        {selectedCoach.isActive !== false ? 
                                                            'Coach is currently active and visible to users' : 
                                                            'Coach is inactive and hidden from users'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Availability</label>
                                                <div className={styles.availabilityOptions}>
                                                    {availabilityOptions.map(option => (
                                                        <div key={option.value} className={styles.checkboxGroup}>
                                                            <input
                                                                type="checkbox"
                                                                id={`edit-${option.value}`}
                                                                value={option.value}
                                                                checked={(selectedCoach.availability || []).includes(option.value)}
                                                                onChange={handleEditAvailabilityChange}
                                                            />
                                                            <label htmlFor={`edit-${option.value}`}>{option.day}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Assign Sports</label>
                                                <div className={styles.sportsCheckboxList}>
                                                    {sports.map(sport => (
                                                        <label key={sport._id} className={styles.sportCheckboxItem}>
                                                            <input
                                                                type="checkbox"
                                                                value={sport._id}
                                                                checked={selectedCoach.sports.includes(sport._id)}
                                                                onChange={e => {
                                                                    const checked = e.target.checked;
                                                                    const value = e.target.value;
                                                                    setSelectedCoach(prev => {
                                                                        if (checked) {
                                                                            return { ...prev, sports: [...prev.sports, value] };
                                                                        } else {
                                                                            return { ...prev, sports: prev.sports.filter(id => id !== value) };
                                                                        }
                                                                    });
                                                                }}
                                                            />
                                                            {sport.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {editPreviewUrl && (
                                                <div className={styles.imagePreviewContainer}>
                                                    <div className={styles.imagePreview}>
                                                        <img src={editPreviewUrl} alt="Coach preview" />
                                                        <button
                                                            type="button"
                                                            className={styles.removeImage}
                                                            onClick={removeEditImage}
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={styles.formActions}>
                                                <div className={styles.uploadButton}>
                                                    <label className={styles.imageButton}>
                                                        <FaImage /> {editPreviewUrl ? 'Change Photo' : 'Upload Photo'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleEditImageSelect}
                                                            hidden
                                                        />
                                                    </label>
                                                </div>
                                                
                                                <button
                                                    type="submit"
                                                    className={styles.submitButton}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? 'Updating...' : 'Update Coach'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete Confirmation Modal */}
                        {showDeleteModal && coachToDelete && (
                            <div className={styles.modalOverlay}>
                                <div className={`${styles.modal} ${styles.deleteModal}`}>
                                    <div className={styles.modalHeader}>
                                        <h3>Confirm Deletion</h3>
                                        <button className={styles.closeButton} onClick={() => setShowDeleteModal(false)}>×</button>
                                    </div>
                                    <div className={styles.modalBody}>
                                        <div className={styles.deleteWarning}>
                                            <FaExclamationTriangle className={styles.warningIcon} />
                                            <p>Are you sure you want to delete coach <strong>{coachToDelete.name}</strong>?</p>
                                            <p className={styles.warningText}>This action cannot be undone.</p>
                                        </div>
                                        
                                        <div className={styles.deleteActions}>
                                            <button 
                                                className={styles.cancelButton}
                                                onClick={() => setShowDeleteModal(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                className={styles.confirmDeleteButton}
                                                onClick={handleDeleteCoach}
                                            >
                                                Delete Coach
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default CoachManagement;