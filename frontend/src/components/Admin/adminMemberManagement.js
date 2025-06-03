import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaEnvelope, FaPhone, FaCalendarAlt, FaIdCard, FaVenusMars, FaUserTag, FaLock, FaLockOpen } from 'react-icons/fa';
import AdminSlideNav from './AdminSlideNav';
import styles from './adminMemberManagement.module.css'; // Updated import to use CSS module

const AdminMemberManagement = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionMessage, setActionMessage] = useState('');

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
        setActionMessage('');
    };

    // Function to toggle member access (block/unblock)
    const toggleMemberAccess = async (memberId, currentStatus) => {
        try {
            setActionInProgress(true);
            const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
            
            // Send request to update member status
            const response = await axios.patch(`http://localhost:8070/user/updateStatus/${memberId}`, {
                membershipStatus: newStatus
            });
            
            if (response.data.status === "success") {
                // Update the member in the local state
                const updatedMembers = members.map(member => 
                    member._id === memberId ? {...member, membershipStatus: newStatus} : member
                );
                setMembers(updatedMembers);
                
                // If the modal is open with this member, update the selected member
                if (selectedMember && selectedMember._id === memberId) {
                    setSelectedMember({...selectedMember, membershipStatus: newStatus});
                }
                
                setActionMessage(newStatus === 'blocked' ? 
                    'Member has been blocked successfully.' : 
                    'Member has been unblocked successfully.');
            } else {
                setActionMessage('Failed to update member status. Please try again.');
            }
        } catch (error) {
            console.error('Error updating member status:', error);
            setActionMessage('An error occurred. Please try again.');
        } finally {
            setActionInProgress(false);
        }
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
        <div className={styles.admin_dashboard}>
            {/* Include AdminSlideNav here */}
            <AdminSlideNav />
            
            <div className={styles.main_content}>
                <h1 className={styles.dashboard_title}>Member Management</h1>
                
                {/* Members Management Section */}
                <div id="members-section" className={styles.members_section}>
                    <div className={styles.section_header}>
                        <h2>All Members</h2>
                        <div className={styles.search_bar}>
                            <FaSearch className={styles.search_icon} />
                            <input
                                type="text"
                                placeholder="Search members by name or email..."
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className={styles.loading}>Loading members...</div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : (
                        <div className={styles.members_table_container}>
                            <table className={styles.members_table}>
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
                                                    <span className={`${styles.package_badge} ${styles[member.membershipPackage || "none"]}`}>
                                                        {member.membershipPackage?.charAt(0).toUpperCase() + member.membershipPackage?.slice(1) || 'None'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.status_badge} ${styles[member.membershipStatus || "inactive"]}`}>
                                                        {member.membershipStatus?.charAt(0).toUpperCase() + member.membershipStatus?.slice(1) || 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(member.joinedDate)}</td>
                                                <td>
                                                    <button 
                                                        className={styles.view_details_btn}
                                                        onClick={() => handleMemberClick(member.email)}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className={styles.no_results}>No members found matching your search.</td>
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
                <div className={styles.modal_overlay} onClick={closeModal}>
                    <div className={styles.member_modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modal_header}>
                            <h2>Member Details</h2>
                            <button className={styles.close_modal} onClick={closeModal}>×</button>
                        </div>
                        <div className={styles.modal_content}>
                            {actionMessage && (
                                <div className={`${styles.action_message} ${actionMessage.includes('success') ? styles.success : styles.error}`}>
                                    {actionMessage}
                                </div>
                            )}
                            
                            <div className={styles.profile_header}>
                                <div className={styles.profile_picture}>
                                    {selectedMember.profilePicture && selectedMember.profilePicture !== 'default-profile.png' ? 
                                        <img src={`http://localhost:8070/uploads/profile-pictures/${selectedMember.profilePicture}`} alt={selectedMember.name} /> : 
                                        <div className={styles.default_avatar}>{selectedMember.name ? selectedMember.name.charAt(0) : 'U'}</div>
                                    }
                                </div>
                                <div className={styles.profile_title}>
                                    <h3>{selectedMember.name || "User"}</h3>
                                    <span className={`${styles.role_badge} ${styles[selectedMember.role || "member"]}`}>
                                        {selectedMember.role?.charAt(0).toUpperCase() + selectedMember.role?.slice(1) || 'Member'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className={styles.profile_details}>
                                <div className={styles.detail_group}>
                                    <div className={styles.detail_item}>
                                        <FaEnvelope className={styles.detail_icon} />
                                        <div className={styles.detail_content}>
                                            <span className={styles.detail_label}>Email</span>
                                            <span className={styles.detail_value}>{selectedMember.email || "N/A"}</span>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.detail_item}>
                                        <FaPhone className={styles.detail_icon} />
                                        <div className={styles.detail_content}>
                                            <span className={styles.detail_label}>Contact</span>
                                            <span className={styles.detail_value}>{selectedMember.contact || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={styles.detail_group}>
                                    <div className={styles.detail_item}>
                                        <FaCalendarAlt className={styles.detail_icon} />
                                        <div className={styles.detail_content}>
                                            <span className={styles.detail_label}>Date of Birth</span>
                                            <span className={styles.detail_value}>{formatDate(selectedMember.dob)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.detail_item}>
                                        <FaIdCard className={styles.detail_icon} />
                                        <div className={styles.detail_content}>
                                            <span className={styles.detail_label}>Age</span>
                                            <span className={styles.detail_value}>{selectedMember.age || calculateAge(selectedMember.dob)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={styles.detail_group}>
                                    <div className={styles.detail_item}>
                                        <FaVenusMars className={styles.detail_icon} />
                                        <div className={styles.detail_content}>
                                            <span className={styles.detail_label}>Gender</span>
                                            <span className={styles.detail_value}>{selectedMember.gender || "N/A"}</span>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.detail_item}>
                                        <FaUserTag className={styles.detail_icon} />
                                        <div className={styles.detail_content}>
                                            <span className={styles.detail_label}>Membership</span>
                                            <span className={styles.detail_value}>
                                                <span className={`${styles.package_badge} ${styles[selectedMember.membershipPackage || "none"]}`}>
                                                    {selectedMember.membershipPackage?.charAt(0).toUpperCase() + selectedMember.membershipPackage?.slice(1) || 'None'}
                                                </span>
                                                <span className={`${styles.status_badge} ${styles[selectedMember.membershipStatus || "inactive"]}`}>
                                                    {selectedMember.membershipStatus?.charAt(0).toUpperCase() + selectedMember.membershipStatus?.slice(1) || 'Inactive'}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`${styles.detail_item} ${styles.full_width}`}>
                                    <FaCalendarAlt className={styles.detail_icon} />
                                    <div className={styles.detail_content}>
                                        <span className={styles.detail_label}>Joined Date</span>
                                        <span className={styles.detail_value}>{formatDate(selectedMember.joinedDate)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modal_actions}>
                                <button className={`${styles.action_btn} ${styles.edit_btn}`}>Edit Profile</button>
                                
                                {/* Block/Unblock button */}
                                <button 
                                    className={`${styles.action_btn} ${selectedMember.membershipStatus === 'blocked' ? styles.unblock_btn : styles.block_btn}`}
                                    onClick={() => toggleMemberAccess(selectedMember._id, selectedMember.membershipStatus)}
                                    disabled={actionInProgress}
                                >
                                    {actionInProgress ? 'Processing...' : 
                                        selectedMember.membershipStatus === 'blocked' ? 
                                        <><FaLockOpen /> Unblock Access</> : 
                                        <><FaLock /> Block Access</>
                                    }
                                </button>
                                
                                <button className={`${styles.action_btn} ${styles.view_bookings_btn}`}>View Bookings</button>
                                <button className={`${styles.action_btn} ${styles.view_sports_btn}`}>View Sports</button>
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