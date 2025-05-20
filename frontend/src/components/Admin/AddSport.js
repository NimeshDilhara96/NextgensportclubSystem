import React, { useState, useEffect } from 'react';
import AdminSlideNav from './AdminSlideNav';
import axios from 'axios';
import styles from './AdminForms.module.css';

const AddSport = () => {
    // State variables
    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'add'
    const [sports, setSports] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSport, setSelectedSport] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        schedule: '',
        instructorName: '',
        maxCapacity: 20,
        availability: 'Available',
        image: null, // For image upload
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch sports on component mount
    useEffect(() => {
        const fetchSports = async () => {
            try {
                const response = await axios.get('http://localhost:8070/sports');
                setSports(response.data.sports);
            } catch (error) {
                console.error('Error fetching sports:', error);
            }
        };
        fetchSports();
    }, []);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle image upload
    const handleImageChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    // Handle adding a new sport
    const handleAddSport = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const sportData = new FormData();
            Object.keys(formData).forEach((key) => {
                sportData.append(key, formData[key]);
            });

            const token = sessionStorage.getItem('adminToken');
            const response = await axios.post('http://localhost:8070/sports/create', sportData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            setMessage({ type: 'success', text: 'Sport added successfully!' });
            setSports([...sports, response.data.sport]); // Update the sports list
            setShowAddModal(false); // Close the modal
        } catch (error) {
            console.error('Error adding sport:', error);
            setMessage({ type: 'error', text: 'Failed to add sport' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle editing a sport
    const handleEditSport = (sport) => {
        setSelectedSport(sport);
        setFormData({
            name: sport.name,
            description: sport.description,
            category: sport.category || '',
            schedule: sport.schedule || '',
            instructorName: sport.instructorName || '',
            maxCapacity: sport.maxCapacity || 20,
            availability: sport.availability || 'Available',
            image: null, // Reset image for editing
        });
        setShowEditModal(true); // Open the edit modal
    };

    // Handle updating a sport
    const handleUpdateSport = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const sportData = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== null) {
                    sportData.append(key, formData[key]);
                }
            });

            const token = sessionStorage.getItem('adminToken');
            const response = await axios.put(
                `http://localhost:8070/sports/${selectedSport._id}`,
                sportData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            setSports(
                sports.map((sport) =>
                    sport._id === selectedSport._id ? response.data.sport : sport
                )
            );

            setMessage({ type: 'success', text: 'Sport updated successfully!' });
            setShowEditModal(false); // Close the modal
        } catch (error) {
            console.error('Error updating sport:', error);
            setMessage({ type: 'error', text: 'Failed to update sport' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Admin Sidebar Navigation */}
            <AdminSlideNav />

            {/* Main Container */}
            <div className={styles.container}>
                {/* Toggle Buttons */}
                <div className={styles.toggleButtons}>
                    <button
                        className={viewMode === 'edit' ? styles.activeButton : ''}
                        onClick={() => setViewMode('edit')}
                    >
                        Edit Sport
                    </button>
                    <button
                        className={viewMode === 'add' ? styles.activeButton : ''}
                        onClick={() => setShowAddModal(true)}
                    >
                        Add Sport
                    </button>
                </div>

                {/* Edit Sport View */}
                {viewMode === 'edit' && (
                    <div className={styles.sportsContainer}>
                        {sports.map((sport) => (
                            <div key={sport._id} className={styles.sportCard}>
                                <img src={`http://localhost:8070/${sport.image}`} alt={sport.name} />
                                <h3>{sport.name}</h3>
                                <p>{sport.description}</p>
                                <button onClick={() => handleEditSport(sport)}>Edit</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Display Message */}
                {message.text && (
                    <div
                        className={
                            message.type === 'success'
                                ? styles.successMessage
                                : styles.errorMessage
                        }
                    >
                        {message.text}
                    </div>
                )}

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
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="instructorName">Instructor Name</label>
                                    <input
                                        type="text"
                                        id="instructorName"
                                        name="instructorName"
                                        value={formData.instructorName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="maxCapacity">Max Capacity</label>
                                    <input
                                        type="number"
                                        id="maxCapacity"
                                        name="maxCapacity"
                                        value={formData.maxCapacity}
                                        onChange={handleInputChange}
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
                                <button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Adding...' : 'Add Sport'}
                                </button>
                                <button type="button" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Sport Modal */}
                {showEditModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Edit Sport</h2>
                            <form onSubmit={handleUpdateSport}>
                                {/* Same fields as Add Sport Modal */}
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
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="instructorName">Instructor Name</label>
                                    <input
                                        type="text"
                                        id="instructorName"
                                        name="instructorName"
                                        value={formData.instructorName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="maxCapacity">Max Capacity</label>
                                    <input
                                        type="number"
                                        id="maxCapacity"
                                        name="maxCapacity"
                                        value={formData.maxCapacity}
                                        onChange={handleInputChange}
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
                                <button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating...' : 'Update Sport'}
                                </button>
                                <button type="button" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AddSport;