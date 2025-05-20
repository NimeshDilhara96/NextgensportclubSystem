import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SlideNav from '../appnavbar/slidenav';
import styles from './SportsFacilities.module.css';

// Light mode styles
const lightModeStyles = {
  container: {
    backgroundColor: '#f0f2f5',
    color: '#333'
  },
  card: {
    backgroundColor: '#ffffff',
    color: '#333'
  },
  text: {
    color: '#333'
  },
  description: {
    color: '#666'
  },
  accent: {
    color: '#1877f2'
  }
};

const SportsFacilities = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('facilities');
  const [facilities, setFacilities] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add these state variables at the top of your component
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [bookingData, setBookingData] = useState({
    startTime: '',
    endTime: '',
  });
  const [bookingStatus, setBookingStatus] = useState({ type: '', message: '' });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch facilities and sports data from the backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch facilities - Keep as is for now (assuming you'll implement this endpoint)
        try {
          const facilitiesResponse = await axios.get('http://localhost:8070/facilities');
          if (facilitiesResponse.data.status === 'success') {
            setFacilities(facilitiesResponse.data.facilities);
          }
        } catch (facilityError) {
          console.error('Error fetching facilities:', facilityError);
          // Don't fail completely if facilities fetch fails
          setFacilities([]); 
        }

        // Fetch sports - Updated to match your backend endpoint
        const sportsResponse = await axios.get('http://localhost:8070/sports');
        console.log('Sports response:', sportsResponse.data);
        
        if (sportsResponse.data.status === 'success') {
          setSports(sportsResponse.data.sports);
        } else {
          // Handle case where response doesn't have expected structure
          setSports(sportsResponse.data || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle joining a sport - Updated to match your backend endpoint
  const handleJoinSport = async (sportId) => {
    try {
      // Get token and email from sessionStorage (not localStorage)
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('userEmail');
      
      if (!token || !userEmail) {
        alert('Authentication required - please login first');
        return;
      }
      
      // Send the request with the email in the body
      const response = await axios.post(`http://localhost:8070/sports/join/${sportId}`, {
        email: userEmail // This is what your backend expects
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === 'success') {
        alert('Successfully joined the sport!');
        // Refresh sports data
        const sportsResponse = await axios.get('http://localhost:8070/sports');
        if (sportsResponse.data.status === 'success') {
          setSports(sportsResponse.data.sports);
        } else {
          setSports(sportsResponse.data || []);
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert('Failed to join sport. Please try again.');
      }
      console.error('Error joining sport:', err);
    }
  };

  // Replace the existing handleBookFacility function with this:
  const handleBookFacility = (facility) => {
    setSelectedFacility(facility);
    setBookingData({ startTime: '', endTime: '' });
    setBookingStatus({ type: '', message: '' });
    setShowBookingModal(true);
  };

  // Add this new function to handle booking form submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get user email from session storage
      const userEmail = sessionStorage.getItem('userEmail');
      const token = sessionStorage.getItem('token');
      
      if (!userEmail || !token) {
        setBookingStatus({
          type: 'error',
          message: 'You must be logged in to book a facility'
        });
        return;
      }
      
      // Send booking request to backend
      const response = await axios.post(
        `http://localhost:8070/facilities/book/${selectedFacility._id}`,
        {
          ...bookingData,
          userEmail
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setBookingStatus({
          type: 'success',
          message: 'Facility booked successfully!'
        });
        
        // Close modal after short delay
        setTimeout(() => {
          setShowBookingModal(false);
          setBookingStatus({ type: '', message: '' });
        }, 2000);
      }
    } catch (err) {
      setBookingStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to book facility'
      });
    }
  };

  // Add this function to handle booking form input changes
  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  // Show loading indicator
  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.container} style={lightModeStyles.container}>
            <h1 style={lightModeStyles.text}>Sports & Facilities</h1>
            <div className={styles.loading}>
              <p>Loading data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.container} style={lightModeStyles.container}>
            <h1 style={lightModeStyles.text}>Sports & Facilities</h1>
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.pageWrapper}>
      <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.container} style={lightModeStyles.container}>
          <h1 style={lightModeStyles.text}>Sports & Facilities</h1>
          <p style={lightModeStyles.description}>Welcome to Next Gen Sport Club's sports programs and facilities. Explore our offerings and join today!</p>
          
          <div className={styles.filterContainer}>
            <button 
              className={`${styles.filterButton} ${activeTab === 'facilities' ? styles.active : ''}`}
              onClick={() => setActiveTab('facilities')}
            >
              Facilities
            </button>
            <button 
              className={`${styles.filterButton} ${activeTab === 'sports' ? styles.active : ''}`}
              onClick={() => setActiveTab('sports')}
            >
              Sports
            </button>
          </div>
          
          {activeTab === 'facilities' && (
            <div className={styles.facilitiesList}>
              {facilities.length === 0 ? (
                <p className={styles.noData}>No facilities available at this time.</p>
              ) : (
                facilities.map(facility => (
                  <div key={facility._id} className={styles.facility} style={lightModeStyles.card}>
                    <img 
                      src={facility.image ? `http://localhost:8070/${facility.image}` : 'https://via.placeholder.com/100x100?text=Facility'} 
                      alt={facility.name} 
                      className={styles.facilityImage}
                    />
                    <div className={styles.facilityDetails}>
                      <h2 className={styles.facilityName} style={lightModeStyles.accent}>{facility.name}</h2>
                      <p className={styles.facilityDescription} style={lightModeStyles.description}>{facility.description}</p>
                      <div className={styles.facilityInfo}>
                        <p style={lightModeStyles.description}><strong>Hours:</strong> {facility.hours}</p>
                        <p style={lightModeStyles.description}><strong>Status:</strong> 
                          <span className={`${styles.status} ${facility.availability === 'Available' ? styles.available : styles.unavailable}`}>
                            {facility.availability}
                          </span>
                        </p>
                      </div>
                      <button 
                        className={styles.facilityButton}
                        onClick={() => handleBookFacility(facility)}
                        disabled={facility.availability !== 'Available'}
                      >
                        {facility.availability === 'Available' ? 'Book Now' : 'Not Available'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'sports' && (
            <div className={styles.sportsList}>
              <div className={styles.sportsGrid}>
                {sports.length === 0 ? (
                  <p className={styles.noData}>No sports programs available at this time</p>
                ) : (
                  sports.map(sport => (
                    <div key={sport._id} className={styles.sportCard} style={lightModeStyles.card}>
                      <img 
                        src={sport.image ? `http://localhost:8070/${sport.image}` : 'https://via.placeholder.com/100x100?text=Sport'} 
                        alt={sport.name} 
                        className={styles.sportImage}
                      />
                      <h3 className={styles.sportName} style={lightModeStyles.accent}>{sport.name}</h3>
                      <p className={styles.sportDescription} style={lightModeStyles.description}>{sport.description}</p>
                      <div className={styles.sportMembers} style={lightModeStyles.description}>
                        <span className={styles.memberCount} style={lightModeStyles.accent}>
                          {sport.memberCount || 0}
                        </span> active members
                      </div>
                      <div className={styles.sportInfo}>
                        {sport.category && (
                          <p>
                            <span className={styles.sportInfoLabel}>Category:</span> 
                            <span className={styles.sportInfoValue}>{sport.category}</span>
                          </p>
                        )}
                        {sport.instructorName && (
                          <p>
                            <span className={styles.sportInfoLabel}>Instructor:</span> 
                            <span className={styles.sportInfoValue}>{sport.instructorName}</span>
                          </p>
                        )}
                        {sport.schedule && (
                          <p>
                            <span className={styles.sportInfoLabel}>Schedule:</span> 
                            <span className={styles.sportInfoValue}>{sport.schedule}</span>
                          </p>
                        )}
                      </div>
                      <button 
                        className={styles.joinButton}
                        onClick={() => handleJoinSport(sport._id)}
                        disabled={sport.availability !== 'Available'}
                      >
                        {sport.availability === 'Available' ? 'Join Now' : 'Not Available'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedFacility && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={lightModeStyles.card}>
            <h2>Book {selectedFacility.name}</h2>
            
            {bookingStatus.message && (
              <div className={`${styles.statusMessage} ${bookingStatus.type === 'success' ? styles.successMessage : styles.errorMessage}`}>
                {bookingStatus.message}
              </div>
            )}
            
            <form onSubmit={handleBookingSubmit} className={styles.bookingForm}>
              <div className={styles.formGroup}>
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={bookingData.startTime}
                  onChange={handleBookingInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="endTime">End Time</label>
                <input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  value={bookingData.endTime}
                  onChange={handleBookingInputChange}
                  required
                />
              </div>
              
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.submitButton}>
                  Book Now
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowBookingModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsFacilities;