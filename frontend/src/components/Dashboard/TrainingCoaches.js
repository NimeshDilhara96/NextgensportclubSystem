import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SlideNav from '../appnavbar/slidenav';
import { FaStar, FaCalendarAlt, FaEnvelope, FaPhone, FaUser, FaSearch, FaFilter, FaCheckCircle, FaExclamationCircle, FaClock, FaCommentAlt } from 'react-icons/fa';
import styles from './TrainingCoaches.module.css';

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

const TrainingCoaches = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('coaches');
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  // Fetch coaches data from backend when component mounts
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await axios.get('http://localhost:8070/coaches');
        if (response.data && response.data.coaches) {
          setCoaches(response.data.coaches);
        }
      } catch (err) {
        // Optionally handle error here
      } finally {
        setLoading(false);
      }
    };
    fetchCoaches();
  }, []);
  const [sessions, setSessions] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [error, setError] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [trainingPlansLoading, setTrainingPlansLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  // Removed unused specialties state
  const [showAllCoaches, setShowAllCoaches] = useState(false);
  
  // Modal states
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: '',
  });
  const [bookingStatus, setBookingStatus] = useState({ type: '', message: '' });

  const [userSports, setUserSports] = useState([]);
  const [userSportsLoading, setUserSportsLoading] = useState(true);
  const [userSportsError, setUserSportsError] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Get day of week name
  const getDayName = (day) => {
    // TODO: Implement this function if needed
    return day;
  };

  // Fetch user training plans
  const fetchTrainingPlans = React.useCallback(async () => {
    setTrainingPlansLoading(true);
    setError(null);

    const token = sessionStorage.getItem('token');
    const userEmail = sessionStorage.getItem('userEmail');
    if (!userEmail) {
      setError('Please login to view your training plans');
      setTrainingPlans([]);
      setTrainingPlansLoading(false);
      return;
    }

    try {
      // Get user ID by email
      // Use the same endpoint and response handling as profile.js
      let userRes;
      try {
        userRes = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
      } catch (err) {
        setError('User not found.');
        setTrainingPlans([]);
        setTrainingPlansLoading(false);
        return;
      }
      if (userRes.data.status !== "success" || !userRes.data.user?._id) {
        setError('User not found.');
        setTrainingPlans([]);
        setTrainingPlansLoading(false);
        return;
      }
      const userId = userRes.data.user._id;
      console.log('User ID for training plans:', userId); // Debug: show userId used for fetching

      // Try with and without token
      let plansRes;
      try {
        plansRes = await axios.get(
          `http://localhost:8070/training-plans/user/${userId}`,
          token ? { headers: { 'Authorization': `Bearer ${token}` } } : {}
        );
      } catch (err) {
        // Try again without token if error is 401/403
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          plansRes = await axios.get(`http://localhost:8070/training-plans/user/${userId}`);
        } else {
          throw err;
        }
      }
      // Debug: log backend response
      if (!plansRes.data.success) {
        setError('Backend error: ' + (plansRes.data.message || 'Unknown error'));
        setTrainingPlans([]);
        setTrainingPlansLoading(false);
        return;
      }
      setTrainingPlans(plansRes.data.plans || []);
    } catch (err) {
      // Show detailed error
      if (err.response) {
        setError(`Failed to fetch training plans: ${err.response.status} ${err.response.data?.message || err.message}`);
      } else {
        setError('Failed to fetch training plans: ' + err.message);
      }
      setTrainingPlans([]);
    } finally {
      setTrainingPlansLoading(false);
    }
  }, []);

  // Fetch user's booked sessions
  const fetchUserSessions = React.useCallback(async () => {
    setSessionsLoading(true);
    setError(null);

    const token = sessionStorage.getItem('token');
    const userEmail = sessionStorage.getItem('userEmail');
    if (!userEmail) {
      setError('Please login to view your sessions');
      setSessions([]);
      setSessionsLoading(false);
      return;
    }

    try {
      // Get user ID by email
      let userRes;
      try {
        userRes = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
      } catch (err) {
        setError('User not found.');
        setSessions([]);
        setSessionsLoading(false);
        return;
      }
      if (userRes.data.status !== "success" || !userRes.data.user?._id) {
        setError('User not found.');
        setSessions([]);
        setSessionsLoading(false);
        return;
      }
      const userId = userRes.data.user._id;

      // Try with and without token
      let sessionsRes;
      try {
        sessionsRes = await axios.get(
          `http://localhost:8070/coaches/sessions/user/${userId}`,
          token ? { headers: { 'Authorization': `Bearer ${token}` } } : {}
        );
      } catch (err) {
        // Try again without token if error is 401/403
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          sessionsRes = await axios.get(`http://localhost:8070/coaches/sessions/user/${userId}`);
        } else {
          throw err;
        }
      }
      if (!sessionsRes.data.success) {
        setError('Backend error: ' + (sessionsRes.data.message || 'Unknown error'));
        setSessions([]);
        setSessionsLoading(false);
        return;
      }
      setSessions(sessionsRes.data.sessions || []);
    } catch (err) {
      if (err.response) {
        setError(`Failed to fetch sessions: ${err.response.status} ${err.response.data?.message || err.message}`);
      } else {
        setError('Failed to fetch sessions: ' + err.message);
      }
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchUserSessions();
    } else if (activeTab === 'training-plans') {
      fetchTrainingPlans();
    }
  }, [activeTab, fetchTrainingPlans, fetchUserSessions]);

  // Fetch user's joined sports from Sport model (not User)
  useEffect(() => {
    const fetchUserSports = async () => {
      setUserSportsLoading(true);
      setUserSportsError(null);
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (!userEmail) {
          setUserSports([]);
          setUserSportsLoading(false);
          return;
        }
        // Fetch all sports
        const response = await axios.get('http://localhost:8070/sports');
        if (response.data && response.data.sports) {
          // Filter sports where user is a member
          const joinedSports = response.data.sports.filter(sport =>
            sport.members && sport.members.some(member => member.userEmail === userEmail)
          );
          setUserSports(joinedSports);
        } else {
          setUserSports([]);
        }
      } catch (err) {
        setUserSportsError('Failed to load your joined sports.');
        setUserSports([]);
      } finally {
        setUserSportsLoading(false);
      }
    };
    fetchUserSports();
  }, []);

  // Update the useEffect for fetching coaches and userSports
  useEffect(() => {
    const fetchCoachesAndSports = async () => {
      try {
        setLoading(true);
        const userEmail = sessionStorage.getItem('userEmail');
        
        // First fetch user's joined sports
        const sportsResponse = await axios.get('http://localhost:8070/sports');
        if (sportsResponse.data && sportsResponse.data.sports) {
          const joinedSports = sportsResponse.data.sports.filter(sport =>
            sport.members && sport.members.some(member => member.userEmail === userEmail)
          );
          setUserSports(joinedSports);
        }

        // Then fetch all coaches
        const coachesResponse = await axios.get('http://localhost:8070/coaches');
        if (coachesResponse.data && coachesResponse.data.coaches) {
          setCoaches(coachesResponse.data.coaches);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch coaches and sports');
      } finally {
        setLoading(false);
      }
    };

    fetchCoachesAndSports();
  }, []);

  // Update the filteredCoaches logic
  const filteredCoaches = React.useMemo(() => {
    return coaches.filter(coach => {
      // Search filter
      const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           coach.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (coach.bio && coach.bio.toLowerCase().includes(searchQuery.toLowerCase()));

      // Specialty filter
      const matchesSpecialty = selectedSpecialty === 'all' || coach.specialty === selectedSpecialty;

      // Sports filter - only apply if not showing all coaches
      let matchesUserSports = true;
      if (!showAllCoaches && userSports.length > 0) {
        // Check if coach's specialty matches any of user's joined sports names
        matchesUserSports = userSports.some(sport => 
          // Check if coach's specialty matches sport name OR if coach is in sport's coaches array
          sport.name.toLowerCase() === coach.specialty.toLowerCase() ||
          (sport.coaches && sport.coaches.includes(coach._id))
        );
      }

      return matchesSearch && matchesSpecialty && matchesUserSports;
    });
  }, [coaches, searchQuery, selectedSpecialty, showAllCoaches, userSports]);

  // Handle view coach details
  const handleViewCoach = (coach) => {
    setSelectedCoach(coach);
    setShowCoachModal(true);
  };

  // Handle booking a coach
  const handleBookCoach = (coach) => {
    setSelectedCoach(coach);
    setBookingData({ date: '', time: '', notes: '' });
    setBookingStatus({ type: '', message: '' });
    setShowBookingModal(true);
  };

  // Handle booking form input changes
  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  // Handle booking form submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      const token = sessionStorage.getItem('token');
      
      if (!userEmail || !token) {
        setBookingStatus({
          type: 'error',
          message: 'You must be logged in to book a session'
        });
        return;
      }
      
      // Use coach email instead of ID for booking
      const response = await axios.post(
        `http://localhost:8070/coaches/book/by-email/${selectedCoach.email}`,
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
      
      if (response.data.success) {
        setBookingStatus({
          type: 'success',
          message: 'Session booked successfully!'
        });
        
        setTimeout(() => {
          setShowBookingModal(false);
          setBookingStatus({ type: '', message: '' });
          if (activeTab === 'sessions') {
            fetchUserSessions();
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setBookingStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to book session'
      });
    }
  };

  // Handle cancellation of a session
  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      const userEmail = sessionStorage.getItem('userEmail');
      
      if (!token || !userEmail) {
        alert('Please login to cancel sessions');
        return;
      }
      
      const response = await axios.delete(`http://localhost:8070/coaches/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: { email: userEmail }
      });
      
      if (response.data.status === 'success') {
        alert('Session cancelled successfully');
        fetchUserSessions();
      } else {
        alert(response.data.message || 'Failed to cancel session');
      }
    } catch (err) {
      console.error('Error cancelling session:', err);
      alert('Session cancelled successfully (Development mode)');
      setSessions(sessions.filter(session => session._id !== sessionId));
    }
  };

  // Show loading indicator
  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={styles.mainContentWrapper}>
          <div className={styles.container} style={lightModeStyles.container}>
            <h1 style={lightModeStyles.text}>Training & Coaches</h1>
            <div className={styles.loadingState}>
              <p>Loading coaches...</p>
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
        <div className={styles.mainContentWrapper}>
          <div className={styles.container} style={lightModeStyles.container}>
            <h1 style={lightModeStyles.text}>Training & Coaches</h1>
            <div className={styles.errorState}>
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
      <SlideNav 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      <div 
        className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
      >
        <div className={styles.container}>
          {/* User's joined sports bar */}
          <div className={styles.userSportsBar}>
            <h3>Your Joined Sports:</h3>
            {userSportsLoading ? (
              <span>Loading...</span>
            ) : userSportsError ? (
              <span className={styles.error}>{userSportsError}</span>
            ) : userSports.length === 0 ? (
              <span>You have not joined any sports yet.</span>
            ) : (
              <div className={styles.userSportsList}>
                {userSports.map(sport => (
                  <span key={sport._id} className={styles.userSportItem}>
                    {sport.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className={styles.header}>
            <h1 style={lightModeStyles.text}>Training & Coaches</h1>
            <p>Book private or group sessions with our expert coaches</p>
          </div>
          
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'coaches' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('coaches')}
            >
              Available Coaches
            </button>
            {/* Removed My Sessions tab */}
            <button 
              className={`${styles.tabButton} ${activeTab === 'training-plans' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('training-plans')}
            >
              Training Plans
            </button>
          </div>
          
          {/* Coaches Tab */}
          {activeTab === 'coaches' && (
            <div className={styles.coachesContainer}>
              <div className={styles.filterControls}>
                <div className={styles.searchBox}>
                  <FaSearch className={styles.searchIcon} />
                  <input 
                    type="text" 
                    placeholder="Search coaches by name or specialty"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className={styles.filterBox}>
                  <FaFilter className={styles.filterIcon} />
                  <select
                    value={selectedSpecialty}
                    onChange={e => setSelectedSpecialty(e.target.value)}
                  >
                    <option value="all">All Specialties</option>
                    {/* Dynamically list specialties from coaches */}
                    {[...new Set(coaches.map(coach => coach.specialty))]
                      .filter(specialty => specialty)
                      .map(specialty => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                  </select>
                </div>
                <div className={styles.showAllToggle}>
                  <label>
                    <input
                      type="checkbox"
                      checked={showAllCoaches}
                      onChange={e => setShowAllCoaches(e.target.checked)}
                    />
                    Show all coaches
                  </label>
                </div>
              </div>
              <div className={styles.coachesGrid}>
                {filteredCoaches.length === 0 ? (
                  <div className={styles.emptyState}>
                    {showAllCoaches ? (
                      <p>No coaches found matching your search criteria.</p>
                    ) : userSports.length === 0 ? (
                      <div>
                        <p>You haven't joined any sports yet.</p>
                        <p>Join a sport to see its assigned coaches, or check "Show all coaches" to see all available coaches.</p>
                      </div>
                    ) : (
                      <div>
                        <p>No coaches found for your joined sports.</p>
                        <p>Try checking "Show all coaches" to see all available coaches.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredCoaches.map(coach => (
                    <div className={styles.coachCard} key={coach._id}>
                      <div className={styles.coachImage}>
                        {coach.image ? (
                          <img src={`http://localhost:8070${coach.image}`} alt={coach.name} />
                        ) : (
                          <div className={styles.noImagePlaceholder}>
                            <FaUser />
                          </div>
                        )}
                      </div>
                      <div className={styles.coachInfo}>
                        <h3>{coach.name}</h3>
                        <p className={styles.specialty}>{coach.specialty}</p>
                        {coach.experience > 0 && (
                          <p className={styles.experience}>
                            <FaStar className={styles.experienceIcon} />
                            {coach.experience} {coach.experience === 1 ? 'year' : 'years'} experience
                          </p>
                        )}
                        {coach.bio && (
                          <p className={styles.bio}>{coach.bio}</p>
                        )}
                        <div className={styles.coachActions}>
                          <button
                            className={styles.viewDetailsButton}
                            onClick={() => handleViewCoach(coach)}
                          >
                            View Details
                          </button>
                          <button
                            className={styles.bookNowButton}
                            onClick={() => handleBookCoach(coach)}
                          >
                            Book Session
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className={styles.sessionsSection}>
              <h2>My Training Sessions</h2>
              
              {sessionsLoading ? (
                <div className={styles.loadingContainer}>
                  <p>Loading your sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className={styles.emptySessions}>
                  <p>You don't have any booked sessions yet.</p>
                  <button 
                    className={styles.browseButton} 
                    onClick={() => setActiveTab('coaches')}
                  >
                    Browse Coaches
                  </button>
                </div>
              ) : (
                <div className={styles.sessionsGrid}>
                  {sessions.map(session => (
                    <div className={styles.sessionCard} key={session._id}>
                      <div className={styles.sessionHeader}>
                        <div className={styles.coachPreview}>
                          {session.coachImage ? (
                            <img 
                              src={`http://localhost:8070${session.coachImage}`} 
                              alt={session.coachName} 
                              className={styles.sessionCoachImage}
                            />
                          ) : (
                            <div className={styles.sessionNoImage}>
                              <FaUser />
                            </div>
                          )}
                          <div>
                            <h3>{session.coachName}</h3>
                            <p>{session.coachSpecialty}</p>
                          </div>
                        </div>
                        <span className={`${styles.statusTag} ${styles[`status${session.status.toLowerCase()}`]}`}>
                          {session.status}
                        </span>
                      </div>
                      
                      <div className={styles.sessionDetails}>
                        <div className={styles.sessionTime}>
                          <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                          <p><strong>Time:</strong> {session.time}</p>
                        </div>
                        
                        {session.notes && (
                          <div className={styles.sessionNotes}>
                            <p><strong>Notes:</strong> {session.notes}</p>
                          </div>
                        )}
                        
                        {session.status !== 'Cancelled' && (
                          <button 
                            className={styles.cancelButton}
                            onClick={() => handleCancelSession(session._id)}
                          >
                            Cancel Session
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                        )}
        </div>
      )}
      
      {/* Training Plans Tab */}
      {activeTab === 'training-plans' && (
        <div className={styles.trainingPlansSection}>
          <h2>My Training Plans</h2>
          
          {trainingPlansLoading ? (
            <div className={styles.loadingContainer}>
              <p>Loading your training plans...</p>
            </div>
          ) : trainingPlans.length === 0 ? (
            <div className={styles.emptyTrainingPlans}>
              <p>You don't have any training plans yet.</p>
              <p>Coaches will send you training plans for your joined sports.</p>
            </div>
          ) : (
            <div className={styles.trainingPlansGrid}>
              {trainingPlans.map(plan => (
                <div className={styles.trainingPlanCard} key={plan._id}>
                  <div className={styles.planHeader}>
                    <h3>{plan.title}</h3>
                    <div className={styles.planMeta}>
                      {plan.sport && (
                        <span className={styles.sportTag}>
                          {typeof plan.sport === 'object' ? plan.sport.name : plan.sport}
                        </span>
                      )}
                      {plan.coach && (
                        <span className={styles.coachTag}>
                          Coach: {typeof plan.coach === 'object' ? plan.coach.name : plan.coach}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {plan.description && (
                    <div className={styles.planDescription}>
                      <p>{plan.description}</p>
                    </div>
                  )}
                  
                  {plan.sessions && plan.sessions.length > 0 && (
                    <div className={styles.planSessions}>
                      <h4>Training Sessions:</h4>
                      <div className={styles.sessionsList}>
                        {plan.sessions.map((session, idx) => (
                          <div key={idx} className={styles.sessionItem}>
                            <div className={styles.sessionDate}>
                              <FaCalendarAlt className={styles.sessionIcon} />
                              {new Date(session.date).toLocaleDateString()}
                            </div>
                            <div className={styles.sessionFocus}>
                              <strong>Focus:</strong> {session.focus}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className={styles.planFooter}>
                    <small>Created: {new Date(plan.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
      
      {/* Coach Details Modal */}
      {showCoachModal && selectedCoach && (
        <div className={styles.modalOverlay} onClick={() => setShowCoachModal(false)}>
          <div className={styles.detailsModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Coach Profile</h2>
              <button className={styles.closeModal} onClick={() => setShowCoachModal(false)}>×</button>
            </div>

            <div className={styles.detailsContent}>
              <div className={styles.profileSection}>
                <div className={styles.profileHeader}>
                  <div className={styles.profileImageContainer}>
                    {selectedCoach.image ? (
                      <img 
                        src={`http://localhost:8070${selectedCoach.image}`} 
                        alt={selectedCoach.name}
                        className={styles.coachProfileImage} 
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        <FaUser size={32} />
                      </div>
                    )}
                  </div>
                  <div className={styles.profileInfo}>
                    <h3>{selectedCoach.name}</h3>
                    <span className={styles.specialtyBadge}>{selectedCoach.specialty}</span>
                    {selectedCoach.experience > 0 && (
                      <div className={styles.experienceBadge}>
                        <FaStar />
                        <span>{selectedCoach.experience} {selectedCoach.experience === 1 ? 'year' : 'years'} experience</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoSection}>
                    <h4>About</h4>
                    <p>{selectedCoach.bio || 'No bio available'}</p>
                  </div>

                  <div className={styles.infoSection}>
                    <h4>Contact Information</h4>
                    <div className={styles.contactList}>
                      <div className={styles.contactItem}>
                        <FaEnvelope />
                        <span>{selectedCoach.email || 'Email not available'}</span>
                      </div>
                      <div className={styles.contactItem}>
                        <FaPhone />
                        <span>{selectedCoach.contact?.phone || 'Phone not available'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedCoach.availability && selectedCoach.availability.length > 0 && (
                    <div className={styles.infoSection}>
                      <h4>Available Days</h4>
                      <div className={styles.availabilityGrid}>
                        {selectedCoach.availability.map(day => (
                          <div key={day} className={styles.availabilityDay}>
                            <FaCalendarAlt />
                            <span>{getDayName(day)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCoach.specializations && selectedCoach.specializations.length > 0 && (
                    <div className={styles.infoSection}>
                      <h4>Specializations</h4>
                      <div className={styles.specializationsList}>
                        {selectedCoach.specializations.map((spec, index) => (
                          <span key={index} className={styles.specializationTag}>{spec}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.bookButton}
                  onClick={() => {
                    setShowCoachModal(false);
                    handleBookCoach(selectedCoach);
                  }}
                >
                  Book a Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Booking Modal */}
      {showBookingModal && selectedCoach && (
        <div className={styles.modalOverlay}>
          <div className={styles.bookingModal}>
            <div className={styles.modalHeader}>
              <h2>Book Session with {selectedCoach.name}</h2>
              <button className={styles.closeModal} onClick={() => setShowBookingModal(false)}>×</button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.coachPreview}>
                <div className={styles.coachImage}>
                  {selectedCoach.image ? (
                    <img src={`http://localhost:8070${selectedCoach.image}`} alt={selectedCoach.name} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <FaUser />
                    </div>
                  )}
                </div>
                <div className={styles.coachInfo}>
                  <h3>{selectedCoach.name}</h3>
                  <span className={styles.specialty}>{selectedCoach.specialty}</span>
                </div>
              </div>

              {bookingStatus.message && (
                <div className={`${styles.statusMessage} ${styles[bookingStatus.type]}`}>
                  {bookingStatus.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                  {bookingStatus.message}
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className={styles.bookingForm}>
                <div className={styles.formGroup}>
                  <label>
                    <FaCalendarAlt />
                    Select Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleBookingInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <FaClock />
                    Select Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={bookingData.time}
                    onChange={handleBookingInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <FaCommentAlt />
                    Session Notes
                  </label>
                  <textarea
                    name="notes"
                    value={bookingData.notes}
                    onChange={handleBookingInputChange}
                    placeholder="Describe your training goals or any specific requirements..."
                    rows="4"
                  />
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    onClick={() => setShowBookingModal(false)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={bookingStatus.type === 'success'}
                  >
                    {bookingStatus.type === 'success' ? 'Booked!' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingCoaches;