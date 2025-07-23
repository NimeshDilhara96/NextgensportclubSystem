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
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  
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

  // (Removed unused getCurrentDateTime function)

  // Helper function to format datetime-local input value from ISO string
  const formatDateTimeForInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to convert datetime-local input value to ISO string
  const convertToISOString = (dateTimeLocalValue) => {
    if (!dateTimeLocalValue) return '';
    return new Date(dateTimeLocalValue).toISOString();
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

  // Fetch user bookings
  const fetchUserBookings = async () => {
    const token = sessionStorage.getItem('token');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (!token || !userEmail) {
      setError('Please login to view your bookings');
      return;
    }
    
    setBookingsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching bookings for:', userEmail);
      
      // Use the new endpoint with email parameter
      const response = await axios.get(`http://localhost:8070/facilities/user/bookings/${userEmail}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Bookings response:', response.data);
      
      if (response.data && response.data.status === 'success') {
        setUserBookings(response.data.bookings || []);
      } else {
        console.error('Unexpected response format:', response.data);
        setUserBookings([]);
      }
    } catch (err) {
      console.error('Error fetching user bookings:', err);
      setError(`Failed to load bookings: ${err.response?.data?.message || err.message}`);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
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

  // Handle leaving a sport
  const handleLeaveSport = async (sportId) => {
    try {
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('userEmail');

      if (!token || !userEmail) {
        alert('Authentication required - please login first');
        return;
      }

      // Send the request with the email in the body
      const response = await axios.post(`http://localhost:8070/sports/leave/${sportId}`, {
        email: userEmail
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        alert('You have left the sport.');
        // Refresh sports data
        const sportsResponse = await axios.get('http://localhost:8070/sports');
        if (sportsResponse.data.status === 'success') {
          setSports(sportsResponse.data.sports);
        } else {
          setSports(sportsResponse.data || []);
        }
      } else {
        alert(response.data.message || 'Failed to leave sport.');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert('Failed to leave sport. Please try again.');
      }
      console.error('Error leaving sport:', err);
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
    
    // Validation
    if (!bookingData.startTime || !bookingData.endTime) {
      setBookingStatus({
        type: 'error',
        message: 'Please select both start and end times'
      });
      return;
    }

    const startDate = new Date(bookingData.startTime);
    const endDate = new Date(bookingData.endTime);
    
    if (endDate <= startDate) {
      setBookingStatus({
        type: 'error',
        message: 'End time must be after start time'
      });
      return;
    }

    if (startDate < new Date()) {
      setBookingStatus({
        type: 'error',
        message: 'Start time cannot be in the past'
      });
      return;
    }
    
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
          startTime: convertToISOString(bookingData.startTime),
          endTime: convertToISOString(bookingData.endTime),
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
          fetchUserBookings(); // Refresh bookings
        }, 2000);
      }
    } catch (err) {
      setBookingStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to book facility'
      });
    }
  };

  // Handle input changes for booking form
  const handleBookingInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear any existing error messages when user starts typing
    if (bookingStatus.type === 'error') {
      setBookingStatus({ type: '', message: '' });
    }
  };

  // Add a function to handle booking cancellation
  const handleCancelBooking = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('userEmail');

      if (!token || !userEmail) {
        alert('Please login to cancel bookings');
        return;
      }

      // booking.facilityId is now available from the backend response
      const response = await axios.delete(
        `http://localhost:8070/facilities/booking/${booking.facilityId}/${booking._id}?email=${encodeURIComponent(userEmail)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        alert('Booking cancelled successfully');
        fetchUserBookings();
      } else {
        alert(response.data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
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
  
  const isUserMember = (sport) => {
    const userEmail = sessionStorage.getItem('userEmail');
    if (!userEmail || !sport.members) return false;
    return sport.members.some(member => member.userEmail === userEmail);
  };

  const now = new Date();
  const upcomingBookings = userBookings.filter(b => new Date(b.endTime) > now);
  const pastBookings = userBookings.filter(b => new Date(b.endTime) <= now);

  return (
    <div className={styles.pageWrapper}>
      <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.container} style={lightModeStyles.container}>
         
          
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
            <button 
              className={`${styles.filterButton} ${activeTab === 'bookings' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('bookings');
                fetchUserBookings(); // Refresh bookings when tab is clicked
              }}
            >
              My Bookings
            </button>
          </div>
          
          {/* Facilities Tab */}
          {activeTab === 'facilities' && (
            <div className={styles.facilitiesList}>
              {facilities.length === 0 ? (
                <p className={styles.noData}>No facilities available at this time</p>
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
          
          {/* Sports Tab */}
          {activeTab === 'sports' && (
            <div className={styles.sportsList}>
              <h1 className={styles.sportsHeader} style={lightModeStyles.accent}>Explore Sports Programs</h1>
              <p className={styles.sportsDescription} style={lightModeStyles.description}>
                Discover and join exciting sports programs. View coaches, schedules, and more!
              </p>
              <div className={styles.sportsGrid}>
                {sports.length === 0 ? (
                  <p className={styles.noData}>No sports programs available at this time</p>
                ) : (
                  sports.map(sport => (
                    <div
                      key={sport._id}
                      className={styles.sportCard}
                      style={{
                        ...lightModeStyles.card,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        borderRadius: 16,
                        border: isUserMember(sport) ? '2px solid #1877f2' : '1px solid #eee',
                        position: 'relative',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ position: 'relative' }}>
                        <img
                          src={sport.image ? `http://localhost:8070/${sport.image}` : 'https://via.placeholder.com/200x120?text=Sport'}
                          alt={sport.name}
                          className={styles.sportImage}
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: '16px 16px 0 0'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            background: '#1877f2',
                            color: '#fff',
                            borderRadius: 12,
                            padding: '2px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
                          }}
                        >
                          {sport.memberCount || 0} Members
                        </span>
                        {isUserMember(sport) && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 10,
                              left: 10,
                              background: '#28a745',
                              color: '#fff',
                              borderRadius: 12,
                              padding: '2px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Joined
                          </span>
                        )}
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h3 style={{ ...lightModeStyles.accent, marginBottom: 8 }}>{sport.name}</h3>
                        <p style={{ ...lightModeStyles.description, marginBottom: 10 }}>{sport.description}</p>
                        <div style={{ marginBottom: 10 }}>
                          {sport.category && (
                            <div style={{ fontSize: 13, marginBottom: 4 }}>
                              <strong>Category:</strong> {sport.category}
                            </div>
                          )}
                          {sport.schedule && (
                            <div style={{ fontSize: 13 }}>
                              <strong>Schedule:</strong> {sport.schedule}
                            </div>
                          )}
                        </div>
                        {sport.coaches && sport.coaches.length > 0 ? (
                          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 13 }}>Coaches:</strong>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {sport.coaches.map(coach => (
                                <div
                                  key={coach._id || coach}
                                  title={coach.name || coach}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: '#f0f2f5',
                                    borderRadius: '50%',
                                    padding: 2,
                                  }}
                                >
                                  {coach.image && (
                                    <img
                                      src={`http://localhost:8070${coach.image}`}
                                      alt={coach.name}
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '1px solid #ddd'
                                      }}
                                    />
                                  )}
                                  <span style={{ fontSize: 13 }}>{coach.name || coach}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginBottom: 10 }}>
                            <strong>Coaches:</strong> <span>No coaches assigned.</span>
                          </div>
                        )}
                        {!isUserMember(sport) ? (
                          <button
                            className={styles.joinButton}
                            style={{
                              background: '#1877f2',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 18px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginTop: 8,
                            }}
                            onClick={() => handleJoinSport(sport._id)}
                            disabled={sport.availability !== 'Available'}
                          >
                            {sport.availability === 'Available' ? 'Join Now' : 'Not Available'}
                          </button>
                        ) : (
                          <button
                            className={styles.cancelButton}
                            style={{
                              background: '#f44336',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 18px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginTop: 8,
                            }}
                            onClick={() => handleLeaveSport(sport._id)}
                            disabled={sport.availability !== 'Available'}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className={styles.bookingsSection}>
              <h2>My Facility Bookings</h2>
              
              {/* Upcoming Bookings */}
              <h3 className={styles.upcomingBookingsTitle}>Upcoming Bookings</h3>
              {bookingsLoading ? (
                <div className={styles.loadingContainer}>
                  <p>Loading your bookings...</p>
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className={styles.emptyBookings}>
                  <p>No upcoming bookings.</p>
                </div>
              ) : (
                <div className={styles.upcomingBookingsGrid}>
                  {upcomingBookings.map(booking => (
                    <div className={styles.upcomingBookingCard} key={booking._id}>
                      <div className={styles.upcomingBookingHeader}>
                        <span className={styles.upcomingBookingFacility}>{booking.facilityName}</span>
                        <span className={styles.upcomingBookingStatus}>{booking.status}</span>
                      </div>
                      <div className={styles.upcomingBookingDetails}>
                        <div className={styles.upcomingBookingTime}>
                          <p><strong>Start:</strong> {new Date(booking.startTime).toLocaleString()}</p>
                          <p><strong>End:</strong> {new Date(booking.endTime).toLocaleString()}</p>
                        </div>
                        {booking.status !== 'Cancelled' && (
                          <button 
                            className={styles.upcomingBookingCancelBtn}
                            onClick={() => handleCancelBooking(booking)}
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Past Bookings */}
              <h3 style={{ marginTop: 30 }}>Past Bookings</h3>
              {pastBookings.length === 0 ? (
                <div className={styles.emptyBookings}>
                  <p>No past bookings.</p>
                </div>
              ) : (
                <div className={styles.bookingsGrid}>
                  {pastBookings.map(booking => (
                    <div className={styles.bookingCard} key={booking._id}>
                      <div className={styles.bookingHeader}>
                        <h3>{booking.facilityName}</h3>
                        <span className={`${styles.statusTag} ${styles[booking.status.toLowerCase()]}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className={styles.bookingDetails}>
                        <div className={styles.bookingTime}>
                          <p><strong>Start:</strong> {new Date(booking.startTime).toLocaleString()}</p>
                          <p><strong>End:</strong> {new Date(booking.endTime).toLocaleString()}</p>
                        </div>
                        
                        {booking.status !== 'Cancelled' && (
                          <button 
                            className={styles.cancelButton}
                            onClick={() => handleCancelBooking(booking)}
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedFacility && (
        <div className={styles.modalOverlay} onClick={() => setShowBookingModal(false)}>
          <div className={styles.modal} style={lightModeStyles.card} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f0f2f5'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1877f2, #42a5f5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  🏢
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#1877f2', fontSize: '20px', fontWeight: '700' }}>
                    Book {selectedFacility.name}
                  </h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    Select your preferred date and time
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBookingModal(false)}
                style={{
                  background: '#f8f9fa',
                  border: 'none',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e9ecef';
                  e.target.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8f9fa';
                  e.target.style.color = '#666';
                }}
              >
                ×
              </button>
            </div>
            
            {/* Status Message */}
            {bookingStatus.message && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                ...(bookingStatus.type === 'success' ? {
                  background: '#d1edff',
                  color: '#0969da',
                  border: '1px solid #0969da'
                } : {
                  background: '#ffebe9',
                  color: '#cf222e',
                  border: '1px solid #cf222e'
                })
              }}>
                <span style={{ fontSize: '16px' }}>
                  {bookingStatus.type === 'success' ? '✅' : '⚠️'}
                </span>
                {bookingStatus.message}
              </div>
            )}
            
            <form onSubmit={handleBookingSubmit}>
              {/* Date Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  📅 Select Date
                </label>
                <input
                  type="date"
                  value={bookingData.startTime ? formatDateTimeForInput(bookingData.startTime).split('T')[0] : ''}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (selectedDate) {
                      // Set start time to 09:00 AM of selected date if not set
                      const startDateTime = bookingData.startTime 
                        ? new Date(bookingData.startTime)
                        : new Date(`${selectedDate}T09:00`);
                      
                      startDateTime.setFullYear(new Date(selectedDate).getFullYear());
                      startDateTime.setMonth(new Date(selectedDate).getMonth());
                      startDateTime.setDate(new Date(selectedDate).getDate());
                      
                      handleBookingInputChange('startTime', startDateTime.toISOString());
                      
                      // Auto set end time to 1 hour later
                      const endDateTime = new Date(startDateTime);
                      endDateTime.setHours(endDateTime.getHours() + 1);
                      handleBookingInputChange('endTime', endDateTime.toISOString());
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                  required
                />
              </div>

              {/* Time Selection - Only show if date is selected */}
              {bookingData.startTime && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '12px'
                  }}>
                    ⏰ Select Time Slot
                  </label>
                  
                  {/* Quick Time Buttons */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    {[
                      { label: '1 Hour', duration: 1 },
                      { label: '2 Hours', duration: 2 },
                      { label: '3 Hours', duration: 3 },
                      { label: '4 Hours', duration: 4 }
                    ].map(({ label, duration }) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => {
                          const start = new Date(bookingData.startTime);
                          const end = new Date(start);
                          end.setHours(start.getHours() + duration);
                          handleBookingInputChange('endTime', end.toISOString());
                        }}
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          color: '#333'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#1877f2';
                          e.target.style.background = '#f0f8ff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#e1e5e9';
                          e.target.style.background = '#fff';
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Time Inputs */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#666',
                        marginBottom: '6px'
                      }}>
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={bookingData.startTime ? formatDateTimeForInput(bookingData.startTime).split('T')[1] : '09:00'}
                        onChange={(e) => {
                          if (bookingData.startTime) {
                            const date = formatDateTimeForInput(bookingData.startTime).split('T')[0];
                            const newDateTime = `${date}T${e.target.value}`;
                            handleBookingInputChange('startTime', convertToISOString(newDateTime));
                            
                            // Auto adjust end time to maintain duration
                            if (bookingData.endTime) {
                              const duration = new Date(bookingData.endTime) - new Date(bookingData.startTime);
                              const newEndTime = new Date(convertToISOString(newDateTime)).getTime() + duration;
                              handleBookingInputChange('endTime', new Date(newEndTime).toISOString());
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#666',
                        marginBottom: '6px'
                      }}>
                        End Time
                      </label>
                      <input
                        type="time"
                        value={bookingData.endTime ? formatDateTimeForInput(bookingData.endTime).split('T')[1] : '10:00'}
                        onChange={(e) => {
                          if (bookingData.startTime) {
                            const date = formatDateTimeForInput(bookingData.startTime).split('T')[0];
                            const newDateTime = `${date}T${e.target.value}`;
                            handleBookingInputChange('endTime', convertToISOString(newDateTime));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Summary */}
              {bookingData.startTime && bookingData.endTime && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f8ff, #e6f3ff)',
                  border: '2px solid #1877f2',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1877f2', fontSize: '16px', fontWeight: '600' }}>
                    📋 Booking Summary
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <strong style={{ color: '#333' }}>Date:</strong>
                      <br />
                      <span style={{ color: '#666' }}>
                        {new Date(bookingData.startTime).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#333' }}>Duration:</strong>
                      <br />
                      <span style={{ color: '#666' }}>
                        {Math.round((new Date(bookingData.endTime) - new Date(bookingData.startTime)) / (1000 * 60 * 60))} hours
                      </span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong style={{ color: '#333' }}>Time:</strong>
                      <br />
                      <span style={{ color: '#666' }}>
                        {new Date(bookingData.startTime).toLocaleTimeString('en-US', { 
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(bookingData.endTime).toLocaleTimeString('en-US', { 
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    background: '#fff',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#f44336';
                    e.target.style.color = '#f44336';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e1e5e9';
                    e.target.style.color = '#666';
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!bookingData.startTime || !bookingData.endTime}
                  style={{
                    padding: '12px 32px',
                    border: 'none',
                    borderRadius: '8px',
                    background: (!bookingData.startTime || !bookingData.endTime) 
                      ? '#cccccc' 
                      : 'linear-gradient(135deg, #1877f2, #42a5f5)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (!bookingData.startTime || !bookingData.endTime) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: (!bookingData.startTime || !bookingData.endTime) 
                      ? 'none' 
                      : '0 4px 12px rgba(24, 119, 242, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(24, 119, 242, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(24, 119, 242, 0.3)';
                    }
                  }}
                >
                  🚀 Confirm Booking
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