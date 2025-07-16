import React, { useState, useEffect } from 'react';
import AdminSlideNav from './AdminSlideNav';
import axios from 'axios';
import styles from './AdminForms.module.css';

const AddSport = () => {
    const [sports, setSports] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSport, setSelectedSport] = useState(null);
    const [coaches, setCoaches] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        schedule: '',
        coaches: [], // new field for coach IDs
        maxCapacity: 20,
        availability: 'Available',
        image: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch sports on component mount
    useEffect(() => {
        fetchSports();
        // Fetch coaches for assignment
        const fetchCoaches = async () => {
            try {
                const response = await axios.get('http://localhost:8070/coaches');
                if (response.data.success && response.data.coaches) {
                    setCoaches(response.data.coaches);
                }
            } catch (err) {}
        };
        fetchCoaches();
    }, []);
    
    const fetchSports = async () => {
        try {
            const response = await axios.get('http://localhost:8070/sports');
            setSports(response.data.sports);
        } catch (error) {
            console.error('Error fetching sports:', error);
            setMessage({ type: 'error', text: 'Failed to load sports' });
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle image upload
    const handleImageChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    const handleCoachesChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setFormData({ ...formData, coaches: selected });
    };

    // Reset form to default values
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: '',
            schedule: '',
            coaches: [],
            maxCapacity: 20,
            availability: 'Available',
            image: null,
        });
    };

    // Open edit modal and populate form with sport data
    const handleEditClick = (sport) => {
        setSelectedSport(sport);
        setFormData({
            name: sport.name || '',
            description: sport.description || '',
            category: sport.category || '',
            schedule: sport.schedule || '',
            coaches: (sport.coaches || []).map(c => typeof c === 'string' ? c : c._id),
            maxCapacity: sport.maxCapacity || 20,
            availability: sport.availability || 'Available',
            image: null,
        });
        setShowEditModal(true);
    };

    // Handle adding a new sport
    const handleAddSport = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const sportData = new FormData();
            Object.keys(formData).forEach((key) => {
                if (key === 'image' && !formData[key]) return;
                if (key === 'coaches') {
                    sportData.append('coaches', JSON.stringify(formData.coaches));
                } else {
                    sportData.append(key, formData[key]);
                }
            });

            const token = sessionStorage.getItem('adminToken');
            await axios.post('http://localhost:8070/sports/create', sportData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            setMessage({ type: 'success', text: 'Sport added successfully!' });
            await fetchSports(); // Refresh the list
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding sport:', error);
            setMessage({ type: 'error', text: 'Failed to add sport' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Handle updating a sport
    const handleUpdateSport = async (e) => {
        e.preventDefault();
        if (!selectedSport) return;
        
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const sportData = new FormData();
            
            // Add all form fields
            Object.keys(formData).forEach((key) => {
                if (key === 'image' && !formData[key]) {
                    // Don't send image if not changed
                    return;
                }
                if (key === 'coaches') {
                    sportData.append('coaches', JSON.stringify(formData.coaches));
                } else {
                    sportData.append(key, formData[key]);
                }
            });

            const token = sessionStorage.getItem('adminToken');
            await axios.put(
                `http://localhost:8070/sports/${selectedSport._id}`,
                sportData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            setMessage({ type: 'success', text: 'Sport updated successfully!' });
            await fetchSports(); // Refresh the list
            setShowEditModal(false);
            setSelectedSport(null);
            resetForm();
        } catch (error) {
            console.error('Error updating sport:', error);
            setMessage({ type: 'error', text: 'Failed to update sport' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Handle deleting a sport
    const handleDeleteSport = async (sportId) => {
        if (window.confirm('Are you sure you want to delete this sport?')) {
            try {
                const token = sessionStorage.getItem('adminToken');
                await axios.delete(`http://localhost:8070/sports/${sportId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                
                setMessage({ type: 'success', text: 'Sport deleted successfully!' });
                fetchSports(); // Refresh the list
            } catch (error) {
                console.error('Error deleting sport:', error);
                setMessage({ type: 'error', text: 'Failed to delete sport' });
            }
        }
    };

    return (
        <>
            <AdminSlideNav />

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Sport Management</h1>
                    <button 
                        className={styles.addButton}
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                    >
                        Add New Sport
                    </button>
                </div>

                {message.text && (
                    <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}
                
                {/* Sports List as Table */}
                <div className={styles.facilitiesList}>
                    {sports.length === 0 ? (
                        <p>No sports found. Add a sport to get started.</p>
                    ) : (
                        <table className={styles.facilitiesTable}>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Coaches</th>
                                    <th>Capacity</th>
                                    <th>Availability</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sports.map(sport => (
                                    <tr key={sport._id}>
                                        <td>
                                            <img 
                                                src={sport.image ? `http://localhost:8070/${sport.image}` : '/default-sport.jpg'} 
                                                alt={sport.name}
                                                className={styles.facilityImage}
                                                width="50"
                                                height="50"
                                            />
                                        </td>
                                        <td>{sport.name}</td>
                                        <td>{sport.category || 'N/A'}</td>
                                        <td>{(sport.coaches && sport.coaches.length > 0) ? sport.coaches.map(c => c.name || c).join(', ') : 'N/A'}</td>
                                        <td>{sport.maxCapacity}</td>
                                        <td>
                                            <span className={sport.availability === 'Available' ? styles.available : styles.closed}>
                                                {sport.availability}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className={styles.editBtn}
                                                onClick={() => handleEditClick(sport)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className={styles.deleteBtn}
                                                onClick={() => handleDeleteSport(sport._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Add Sport Modal */}
                {showAddModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Add New Sport</h2>
                            <form onSubmit={handleAddSport}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name">Sport Name*</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="description">Description*</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="category">Category</label>
                                    <input
                                        type="text"
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="schedule">Schedule</label>
                                    <input
                                        type="text"
                                        id="schedule"
                                        name="schedule"
                                        value={formData.schedule}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Monday-Friday 9:00 AM - 5:00 PM"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="coaches">Assign Coaches</label>
                                    <select
                                        id="coaches"
                                        name="coaches"
                                        multiple
                                        value={formData.coaches}
                                        onChange={handleCoachesChange}
                                        className={styles.formControl}
                                    >
                                        {coaches.map(coach => (
                                            <option key={coach._id} value={coach._id}>{coach.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="maxCapacity">Max Capacity</label>
                                    <input
                                        type="number"
                                        id="maxCapacity"
                                        name="maxCapacity"
                                        value={formData.maxCapacity}
                                        onChange={handleInputChange}
                                        min="1"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="availability">Availability</label>
                                    <select
                                        id="availability"
                                        name="availability"
                                        value={formData.availability}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Unavailable">Unavailable</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="image">Image</label>
                                    <input
                                        type="file"
                                        id="image"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <div className={styles.buttonGroup}>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={styles.submitBtn}
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Sport'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddModal(false)}
                                        className={styles.cancelBtn}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Sport Modal */}
                {showEditModal && selectedSport && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Edit Sport</h2>
                            <form onSubmit={handleUpdateSport}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-name">Sport Name*</label>
                                    <input
                                        type="text"
                                        id="edit-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-description">Description*</label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-category">Category</label>
                                    <input
                                        type="text"
                                        id="edit-category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-schedule">Schedule</label>
                                    <input
                                        type="text"
                                        id="edit-schedule"
                                        name="schedule"
                                        value={formData.schedule}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Monday-Friday 9:00 AM - 5:00 PM"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-coaches">Assign Coaches</label>
                                    <select
                                        id="edit-coaches"
                                        name="coaches"
                                        multiple
                                        value={formData.coaches}
                                        onChange={handleCoachesChange}
                                        className={styles.formControl}
                                    >
                                        {coaches.map(coach => (
                                            <option key={coach._id} value={coach._id}>{coach.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-maxCapacity">Max Capacity</label>
                                    <input
                                        type="number"
                                        id="edit-maxCapacity"
                                        name="maxCapacity"
                                        value={formData.maxCapacity}
                                        onChange={handleInputChange}
                                        min="1"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-availability">Availability</label>
                                    <select
                                        id="edit-availability"
                                        name="availability"
                                        value={formData.availability}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Unavailable">Unavailable</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-image">Image</label>
                                    {selectedSport.image && (
                                        <div className={styles.currentImage}>
                                            <p>Current image:</p>
                                            <img 
                                                src={`http://localhost:8070/${selectedSport.image}`} 
                                                alt={selectedSport.name}
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
                                        onChange={handleImageChange}
                                    />
                                    <p className={styles.helpText}>Leave empty to keep current image</p>
                                </div>
                                <div className={styles.buttonGroup}>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={styles.submitBtn}
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update Sport'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedSport(null);
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

export default AddSport;