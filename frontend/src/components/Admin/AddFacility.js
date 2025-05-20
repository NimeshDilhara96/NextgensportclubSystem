import React, { useState, useEffect } from 'react';
import AdminSlideNav from './AdminSlideNav';
import axios from 'axios';
import styles from './AdminForms.module.css';

const AddFacility = () => {
    const [facilities, setFacilities] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentFacility, setCurrentFacility] = useState(null);
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
        fetchFacilities();
    }, []);
    
    const fetchFacilities = async () => {
        try {
            const response = await axios.get('http://localhost:8070/facilities');
            setFacilities(response.data.facilities);
        } catch (error) {
            console.error('Error fetching facilities:', error);
            setMessage({ type: 'error', text: 'Failed to load facilities' });
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

    // Reset form to default values
    const resetForm = () => {
        setFormData({
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
    };

    // Open edit modal and populate form with facility data
    const handleEditClick = (facility) => {
        // Parse operating hours to populate time fields
        const hoursArray = facility.hours.split('-');
        let openTimeStr = '09:00';
        let openPeriodStr = 'AM';
        let closeTimeStr = '09:00';
        let closePeriodStr = 'PM';
        
        if (hoursArray.length === 2) {
            const openPart = hoursArray[0].trim();
            const closePart = hoursArray[1].trim();
            
            // Extract time and period for opening
            const openMatch = openPart.match(/(\d+:\d+)\s?(AM|PM)?/i);
            if (openMatch) {
                openTimeStr = openMatch[1];
                openPeriodStr = openMatch[2] || 'AM';
            }
            
            // Extract time and period for closing
            const closeMatch = closePart.match(/(\d+:\d+)\s?(AM|PM)?/i);
            if (closeMatch) {
                closeTimeStr = closeMatch[1];
                closePeriodStr = closeMatch[2] || 'PM';
            }
        }
        
        setCurrentFacility(facility);
        setFormData({
            name: facility.name || '',
            description: facility.description || '',
            location: facility.location || '',
            capacity: facility.capacity || 0,
            openTime: openTimeStr,
            openPeriod: openPeriodStr,
            closeTime: closeTimeStr,
            closePeriod: closePeriodStr,
            availability: facility.availability || 'Available',
            image: null, // Can't populate file input, but keep existing image if no new one
        });
        setShowEditModal(true);
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
            await axios.post('http://localhost:8070/facilities', facilityData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            setMessage({ type: 'success', text: 'Facility added successfully!' });
            await fetchFacilities(); // Refresh the list
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding facility:', error);
            setMessage({ type: 'error', text: 'Failed to add facility' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Handle updating an existing facility
    const handleUpdateFacility = async (e) => {
        e.preventDefault();
        if (!currentFacility) return;
        
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const facilityData = new FormData();
            
            // Format hours in the required format: "9:00 AM - 9:00 PM"
            const formattedHours = `${formData.openTime} ${formData.openPeriod} - ${formData.closeTime} ${formData.closePeriod}`;
            
            // Add all fields except the separate time fields
            Object.keys(formData).forEach((key) => {
                if (!['openTime', 'openPeriod', 'closeTime', 'closePeriod'].includes(key)) {
                    if (key === 'image' && !formData[key]) {
                        // Don't send image if not changed
                        return;
                    }
                    facilityData.append(key, formData[key]);
                }
            });
            
            // Add the formatted hours
            facilityData.append('hours', formattedHours);

            const token = sessionStorage.getItem('adminToken');
            await axios.put(`http://localhost:8070/facilities/${currentFacility._id}`, facilityData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            setMessage({ type: 'success', text: 'Facility updated successfully!' });
            await fetchFacilities(); // Refresh the list
            setShowEditModal(false);
            setCurrentFacility(null);
            resetForm();
        } catch (error) {
            console.error('Error updating facility:', error);
            setMessage({ type: 'error', text: 'Failed to update facility' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Handle deleting a facility
    const handleDeleteFacility = async (facilityId) => {
        if (window.confirm('Are you sure you want to delete this facility? All associated bookings will be canceled.')) {
            try {
                const token = sessionStorage.getItem('adminToken');
                await axios.delete(`http://localhost:8070/facilities/${facilityId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                
                setMessage({ type: 'success', text: 'Facility deleted successfully!' });
                fetchFacilities(); // Refresh the list
            } catch (error) {
                console.error('Error deleting facility:', error);
                setMessage({ type: 'error', text: 'Failed to delete facility' });
            }
        }
    };

    return (
        <>
            <AdminSlideNav />

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Facility Management</h1>
                    <button 
                        className={styles.addButton}
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                    >
                        Add New Facility
                    </button>
                </div>

                {message.text && (
                    <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}
                
                {/* Facilities List */}
                <div className={styles.facilitiesList}>
                    {facilities.length === 0 ? (
                        <p>No facilities found. Add a facility to get started.</p>
                    ) : (
                        <table className={styles.facilitiesTable}>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Operating Hours</th>
                                    <th>Availability</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facilities.map(facility => (
                                    <tr key={facility._id}>
                                        <td>
                                            <img 
                                                src={facility.image ? `http://localhost:8070/${facility.image}` : '/default-facility.jpg'} 
                                                alt={facility.name}
                                                className={styles.facilityImage}
                                                width="50"
                                                height="50"
                                            />
                                        </td>
                                        <td>{facility.name}</td>
                                        <td>{facility.location}</td>
                                        <td>{facility.hours}</td>
                                        <td>
                                            <span className={styles[facility.availability.toLowerCase()]}>
                                                {facility.availability}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className={styles.editBtn}
                                                onClick={() => handleEditClick(facility)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className={styles.deleteBtn}
                                                onClick={() => handleDeleteFacility(facility._id)}
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

                {/* Add Facility Modal */}
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
                                <div className={styles.buttonGroup}>
                                    <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                                        {isSubmitting ? 'Adding...' : 'Add Facility'}
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
                
                {/* Edit Facility Modal */}
                {showEditModal && currentFacility && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Edit Facility</h2>
                            <form onSubmit={handleUpdateFacility}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-name">Facility Name*</label>
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
                                    <label htmlFor="edit-location">Location*</label>
                                    <input
                                        type="text"
                                        id="edit-location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-capacity">Capacity* (Maximum number of concurrent bookings)</label>
                                    <input
                                        type="number"
                                        id="edit-capacity"
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
                                            <label htmlFor="edit-openTime">Opening Time</label>
                                            <div className={styles.timeInputGroup}>
                                                <input
                                                    type="time"
                                                    id="edit-openTime"
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
                                            <label htmlFor="edit-closeTime">Closing Time</label>
                                            <div className={styles.timeInputGroup}>
                                                <input
                                                    type="time"
                                                    id="edit-closeTime"
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
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label htmlFor="edit-availability">Availability Status*</label>
                                    <select
                                        id="edit-availability"
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
                                    <label htmlFor="edit-image">Image</label>
                                    {currentFacility.image && (
                                        <div className={styles.currentImage}>
                                            <p>Current image:</p>
                                            <img 
                                                src={`http://localhost:8070/${currentFacility.image}`} 
                                                alt={currentFacility.name}
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
                                    <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                                        {isSubmitting ? 'Updating...' : 'Update Facility'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setCurrentFacility(null);
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

export default AddFacility;