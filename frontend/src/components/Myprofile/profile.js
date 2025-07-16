import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './profile.css';
import SlideNav from '../appnavbar/slidenav';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    gender: '',
    dob: '',
    age: '',
    membershipPackage: '',
    membershipStatus: '',
    profilePicture: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [joinedSports, setJoinedSports] = useState([]); // NEW: store sport details

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userEmail = sessionStorage.getItem('userEmail');
        
        if (!userEmail) {
          setError('No user email found in session');
          setIsLoading(false);
          return;
        }

        // Fetch user data
        const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
        if (response.data.status === "success") {
          const userData = response.data.user;
          setUser(userData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            contact: userData.contact || '',
            gender: userData.gender || '',
            dob: userData.dob ? userData.dob.split('T')[0] : '',
            age: userData.age || '',
            membershipPackage: userData.membershipPackage || 'none',
            membershipStatus: userData.membershipStatus || 'inactive',
            profilePicture: userData.profilePicture || ''
          });
        } else {
          setError(response.data.message || 'Failed to fetch user data');
        }

        // --- NEW: Fetch all sports and filter joined ---
        const sportsRes = await axios.get('http://localhost:8070/sports');
        if (sportsRes.data && sportsRes.data.sports) {
          const joined = sportsRes.data.sports.filter(sport =>
            sport.members && sport.members.some(member => member.userEmail === userEmail)
          );
          setJoinedSports(joined);
        } else {
          setJoinedSports([]);
        }
        // --- END NEW ---
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.response?.data?.message || 'Failed to fetch user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      const response = await axios.put(`http://localhost:8070/user/updateByEmail/${userEmail}`, formData);
      
      if (response.data.status === "User updated") {
        setUser(response.data.user);
        setFormData(prev => ({
          ...prev,
          ...response.data.user
        }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to current user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      contact: user.contact || '',
      gender: user.gender || '',
      dob: user.dob ? user.dob.split('T')[0] : '',
      age: user.age || '',
      membershipPackage: user.membershipPackage || 'none',
      membershipStatus: user.membershipStatus || 'inactive',
      profilePicture: user.profilePicture || ''
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await axios.put(
        `http://localhost:8070/user/updateProfilePicture/${user.email}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (response.data && response.data.user) {
        setUser(response.data.user);
        setFormData(prev => ({
          ...prev,
          profilePicture: response.data.user.profilePicture
        }));
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!user) {
    return <div className="no-data">No user data found</div>;
  }

  return (
    <>
      <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-image-container">
            <img 
              src={formData.profilePicture 
                ? `http://localhost:8070/uploads/profile-pictures/${formData.profilePicture}`
                : 'https://via.placeholder.com/150'} 
              alt="Profile" 
              className="profile-image" 
            />
            <label className="image-upload-label" title="Change Profile Picture">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="image-upload-input" 
              />
              <i className="fas fa-camera upload-icon"></i>
            </label>
          </div>
          <h1>{user?.name}</h1>
          <div className="member-info">
            <span className="member-since">Member since {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'N/A'}</span>
            <span className={`membership-badge ${formData.membershipPackage}`}>
              {formData.membershipPackage?.toUpperCase()}
            </span>
            <span className={`status-badge ${formData.membershipStatus}`}>
              {formData.membershipStatus}
            </span>
          </div>
        </div>

        <div className="profile-content">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Age:</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Contact:</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Gender:</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth:</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob?.split('T')[0]}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Membership Package:</label>
                <select 
                  name="membershipPackage" 
                  value={formData.membershipPackage} 
                  onChange={handleInputChange}
                  disabled
                >
                  <option value="none">None</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div className="form-group">
                <label>Membership Status:</label>
                <div className={`status-badge ${formData.membershipStatus}`}>
                  {formData.membershipStatus}
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="save-btn">Save Changes</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-group">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-group">
                <label>Age:</label>
                <span>{user.age}</span>
              </div>
              <div className="detail-group">
                <label>Contact:</label>
                <span>{user.contact}</span>
              </div>
              <div className="detail-group">
                <label>Gender:</label>
                <span>{user.gender}</span>
              </div>
              <div className="detail-group">
                <label>Date of Birth:</label>
                <span>{user.dob ? new Date(user.dob).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div className="detail-group">
                <label>Role:</label>
                <span>{user.role}</span>
              </div>
              <div className="detail-group">
                <label>Membership Package:</label>
                <span className={`membership-badge ${user.membershipPackage}`}>
                  {user.membershipPackage?.toUpperCase() || 'NONE'}
                </span>
              </div>
              <div className="detail-group">
                <label>Membership Status:</label>
                <span className={`status-badge ${user.membershipStatus}`}>
                  {user.membershipStatus || 'INACTIVE'}
                </span>
              </div>
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* --- NEW: Joined Sports Section --- */}
          <div className="joined-sports-section" style={{ marginTop: 30 }}>
            <h2>Joined Sports</h2>
            {joinedSports.length === 0 ? (
              <p>You have not joined any sports yet.</p>
            ) : (
              <div className="joined-sports-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                {joinedSports.map((sport) => (
                  <div key={sport._id} className="sport-card" style={{
                    border: '1px solid #eee',
                    borderRadius: 8,
                    padding: 16,
                    minWidth: 180,
                    textAlign: 'center',
                    background: '#fafafa'
                  }}>
                    <img
                      src={sport.image?.startsWith('http') ? sport.image : `http://localhost:8070/${sport.image}`}
                      alt={sport.name}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                    />
                    <div style={{ fontWeight: 600 }}>{sport.name}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{sport.category}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* --- END NEW --- */}
        </div>
      </div>
    </>
  );
};

export default Profile;
