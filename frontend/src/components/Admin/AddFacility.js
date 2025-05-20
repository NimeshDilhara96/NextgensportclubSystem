import React, { useState, useEffect } from 'react';
import AdminSlideNav from './AdminSlideNav';
import axios from 'axios';
import styles from './AdminForms.module.css';

const AddFacility = () => {
    const [facilities, setFacilities] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        capacity: 0,
        openTime: '09:00',
        openPeriod: 'AM',
        closeTime: '09:00',
        closePeriod: 'PM',
        availability: 'Available',
        image: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch facilities on component mount
    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const response = await axios.get('http://localhost:8070/facilities');
                setFacilities(response.data.facilities);
            } catch (error) {
                console.error('Error fetching facilities:', error);
            }
        };
        fetchFacilities();
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

    // Handle adding a new facility
    const handleAddFacility = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const facilityData = new FormData();
            
            // Format hours in the required format: "9:00 AM - 9:00 PM"
            const formattedHours = `${formData.openTime} ${formData.openPeriod} - ${formData.closeTime} ${formData.closePeriod}`;
            
            // Add all fields except the separate time fields
            Object.keys(formData).forEach((key) => {
                if (!['openTime', 'openPeriod', 'closeTime', 'closePeriod'].includes(key)) {
                    facilityData.append(key, formData[key]);
                }
            });
            
            // Add the formatted hours
            facilityData.append('hours', formattedHours);

            const token = sessionStorage.getItem('adminToken');
            const response = await axios.post('http://localhost:8070/facilities', facilityData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            setMessage({ type: 'success', text: 'Facility added successfully!' });
            setFacilities([...facilities, response.data.facility]);
            setShowAddModal(false);
        } catch (error) {
            console.error('Error adding facility:', error);
            setMessage({ type: 'error', text: 'Failed to add facility' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AdminSlideNav />

            <div className={styles.container}>
                <button onClick={() => setShowAddModal(true)}>Add Facility</button>

                {message.text && (
                    <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}

                {showAddModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Add New Facility</h2>
                            <form onSubmit={handleAddFacility}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name">Facility Name*</label>
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
                                    <label htmlFor="location">Location*</label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="capacity">Capacity* (Maximum number of concurrent bookings)</label>
                                    <input
                                        type="number"
                                        id="capacity"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                    />
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Operating Hours*</label>
                                    <div className={styles.timeInputContainer}>
                                        <div className={styles.timeInput}>
                                            <label htmlFor="openTime">Opening Time</label>
                                            <div className={styles.timeInputGroup}>
                                                <input
                                                    type="time"
                                                    id="openTime"
                                                    name="openTime"
                                                    value={formData.openTime}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <select 
                                                    name="openPeriod"
                                                    value={formData.openPeriod}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="AM">AM</option>
                                                    <option value="PM">PM</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <span className={styles.timeSeparator}>to</span>
                                        
                                        <div className={styles.timeInput}>
                                            <label htmlFor="closeTime">Closing Time</label>
                                            <div className={styles.timeInputGroup}>
                                                <input
                                                    type="time"
                                                    id="closeTime"
                                                    name="closeTime"
                                                    value={formData.closeTime}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <select 
                                                    name="closePeriod"
                                                    value={formData.closePeriod}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="AM">AM</option>
                                                    <option value="PM">PM</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <p className={styles.helpText}>Format: "9:00 AM - 9:00 PM" (Will be formatted automatically)</p>
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label htmlFor="availability">Availability Status*</label>
                                    <select
                                        id="availability"
                                        name="availability"
                                        value={formData.availability}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Reserved">Reserved</option>
                                        <option value="Closed">Closed</option>
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
                                    {isSubmitting ? 'Adding...' : 'Add Facility'}
                                </button>
                                <button type="button" onClick={() => setShowAddModal(false)}>
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

export default AddFacility;