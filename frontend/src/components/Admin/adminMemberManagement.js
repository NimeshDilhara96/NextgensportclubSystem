import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaEnvelope, FaPhone, FaCalendarAlt, FaIdCard, FaVenusMars, FaUserTag } from 'react-icons/fa';
import AdminSlideNav from './AdminSlideNav';
import './adminDashboard.css';

const AdminMemberManagement = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            // Fetch all users
            const response = await axios.get('http://localhost:8070/user');
            const allUsers = response.data;

            // Set members data
            setMembers(allUsers);
            setLoading(false);
            return allUsers.length; // Return the count for the dashboard
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load members. Please try again.');
            setLoading(false);
            return 0;
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleMemberClick = async (email) => {
        try {
            const response = await axios.get(`http://localhost:8070/user/getByEmail/${email}`);
            if (response.data.status === "success") {
                setSelectedMember(response.data.user);
                setShowModal(true);
            }
        } catch (error) {
            console.error('Error fetching member details:', error);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedMember(null);
    };

    // Filter members based on search query
    const filteredMembers = members.filter(member => 
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Function to calculate age from DOB
    const calculateAge = (dob) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const difference = Date.now() - birthDate.getTime();
        const ageDate = new Date(difference);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    // Function to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="admin-dashboard">
            {/* Include AdminSlideNav here */}
            <AdminSlideNav />
            
            <div className="main-content">
                <h1 className="dashboard-title">Member Management</h1>
                
                {/* Members Management Section */}
                <div id="members-section" className="members-section">
                    <div className="section-header">
                        <h2>All Members</h2>
                        <div className="search-bar">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search members by name or email..."
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="loading">Loading members...</div>
                    ) : error ? (
                        <div className="error">{error}</div>
                    ) : (
                        <div className="members-table-container">
                            <table className="members-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Gender</th>
                                        <th>Membership</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((member) => (
                                            <tr key={member._id}>
                                                <td>{member.name || "N/A"}</td>
                                                <td>{member.email || "N/A"}</td>
                                                <td>{member.gender || "N/A"}</td>
                                                <td>
                                                    <span className={`package-badge ${member.membershipPackage || "none"}`}>
                                                        {member.membershipPackage?.charAt(0).toUpperCase() + member.membershipPackage?.slice(1) || 'None'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${member.membershipStatus || "inactive"}`}>
                                                        {member.membershipStatus?.charAt(0).toUpperCase() + member.membershipStatus?.slice(1) || 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(member.joinedDate)}</td>
                                                <td>
                                                    <button 
                                                        className="view-details-btn"
                                                        onClick={() => handleMemberClick(member.email)}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="no-results">No members found matching your search.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Member Details Modal */}
            {showModal && selectedMember && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="member-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Member Details</h2>
                            <button className="close-modal" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-content">
                            <div className="profile-header">
                                <div className="profile-picture">
                                    {selectedMember.profilePicture && selectedMember.profilePicture !== 'default-profile.png' ? 
                                        <img src={`http://localhost:8070/uploads/profile-pictures/${selectedMember.profilePicture}`} alt={selectedMember.name} /> : 
                                        <div className="default-avatar">{selectedMember.name ? selectedMember.name.charAt(0) : 'U'}</div>
                                    }
                                </div>
                                <div className="profile-title">
                                    <h3>{selectedMember.name || "User"}</h3>
                                    <span className={`role-badge ${selectedMember.role || "member"}`}>
                                        {selectedMember.role?.charAt(0).toUpperCase() + selectedMember.role?.slice(1) || 'Member'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="profile-details">
                                <div className="detail-group">
                                    <div className="detail-item">
                                        <FaEnvelope className="detail-icon" />
                                        <div className="detail-content">
                                            <span className="detail-label">Email</span>
                                            <span className="detail-value">{selectedMember.email || "N/A"}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-item">
                                        <FaPhone className="detail-icon" />
                                        <div className="detail-content">
                                            <span className="detail-label">Contact</span>
                                            <span className="detail-value">{selectedMember.contact || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="detail-group">
                                    <div className="detail-item">
                                        <FaCalendarAlt className="detail-icon" />
                                        <div className="detail-content">
                                            <span className="detail-label">Date of Birth</span>
                                            <span className="detail-value">{formatDate(selectedMember.dob)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-item">
                                        <FaIdCard className="detail-icon" />
                                        <div className="detail-content">
                                            <span className="detail-label">Age</span>
                                            <span className="detail-value">{selectedMember.age || calculateAge(selectedMember.dob)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="detail-group">
                                    <div className="detail-item">
                                        <FaVenusMars className="detail-icon" />
                                        <div className="detail-content">
                                            <span className="detail-label">Gender</span>
                                            <span className="detail-value">{selectedMember.gender || "N/A"}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-item">
                                        <FaUserTag className="detail-icon" />
                                        <div className="detail-content">
                                            <span className="detail-label">Membership</span>
                                            <span className="detail-value">
                                                <span className={`package-badge ${selectedMember.membershipPackage || "none"}`}>
                                                    {selectedMember.membershipPackage?.charAt(0).toUpperCase() + selectedMember.membershipPackage?.slice(1) || 'None'}
                                                </span>
                                                <span className={`status-badge ${selectedMember.membershipStatus || "inactive"}`}>
                                                    {selectedMember.membershipStatus?.charAt(0).toUpperCase() + selectedMember.membershipStatus?.slice(1) || 'Inactive'}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="detail-item full-width">
                                    <FaCalendarAlt className="detail-icon" />
                                    <div className="detail-content">
                                        <span className="detail-label">Joined Date</span>
                                        <span className="detail-value">{formatDate(selectedMember.joinedDate)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button className="action-btn edit-btn">Edit Profile</button>
                                <button className="action-btn view-bookings-btn">View Bookings</button>
                                <button className="action-btn view-sports-btn">View Sports</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Export a function to get member count for dashboard
export const getMemberCount = async () => {
    try {
        const response = await axios.get('http://localhost:8070/user');
        return response.data.length;
    } catch (error) {
        console.error('Error fetching member count:', error);
        return 0;
    }
};

export default AdminMemberManagement;