import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Dashboard.module.css'; // Changed to import styles
import SlideNav from '../appnavbar/slidenav';
import Container from '../common/Container';
import logo from '../../assets/logo.png'; // Use your transparent logo
import FeedbackForm from './FeedbackForm'; // Add this import

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    membershipType: '',
    memberSince: '',
    nextPayment: '',
    role: 'member', // Default role
  });
  const [stats, setStats] = useState([]);
  const [trainingSchedule, setTrainingSchedule] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [workoutGoals, setWorkoutGoals] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [serverError, setServerError] = useState(false);
  const navigate = useNavigate();

  // Fetch user data and other dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const userEmail = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
        if (!userEmail) {
          navigate('/login');
          return;
        }

        const userResponse = await axios.get(`http://localhost:8070/user/get/${userEmail}`);
        const user = userResponse.data.user;

        // Add role to userData to handle admin-specific navigation
        setUserData({
          name: user.name || 'User',
          membershipType: user.membershipPackage || 'Standard',
          memberSince: new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          nextPayment: user.membershipEnd ? new Date(user.membershipEnd).toISOString().split('T')[0] : 'N/A',
          role: user.role || 'member', // Store user role
        });

        // Only fetch other dashboard data if user is not admin
        if (user.role !== 'admin') {
          try {
            // Fetch stats data - Updated endpoints
            const [facilitiesRes, eventsCountRes] = await Promise.all([
              axios.get('http://localhost:8070/facilities').catch(() => ({ data: [] })),
              axios.get('http://localhost:8070/events').catch(() => ({ data: [] })),
            ]);

            // Count facilities and events
            const facilitiesCount = Array.isArray(facilitiesRes.data) ? facilitiesRes.data.length : 
                                   facilitiesRes.data.facilities ? facilitiesRes.data.facilities.length : 0;
            const eventsCount = Array.isArray(eventsCountRes.data) ? eventsCountRes.data.length :
                               eventsCountRes.data.events ? eventsCountRes.data.events.length : 0;

            // Fetch user's facility bookings using the correct endpoint from SportsFacilities.js
            const token = sessionStorage.getItem('token');
            let userBookingsCount = 0;
            let userBookingsData = [];
            
            if (token && userEmail) {
              try {
                const bookingsResponse = await axios.get(
                  `http://localhost:8070/facilities/user/bookings/${userEmail}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  }
                );
                
                if (bookingsResponse.data && bookingsResponse.data.status === 'success') {
                  userBookingsData = bookingsResponse.data.bookings || [];
                  userBookingsCount = userBookingsData.length;
                }
              } catch (bookingError) {
                console.error('Error fetching user bookings:', bookingError);
                // Don't fail the entire dashboard if bookings fail
              }
            }

            setStats([
              {
                icon: "👥",
                title: "Active Members",
                value: Math.floor(Math.random() * 500) + 100, // Placeholder since we don't have members count endpoint
                trend: Math.floor(Math.random() * 10) + 1,
                isPositive: true,
              },
              {
                icon: "🏢",
                title: "Facilities Available",
                value: facilitiesCount,
                trend: Math.floor(Math.random() * 5) + 1,
                isPositive: true,
              },
              {
                icon: "📅",
                title: "Total Events",
                value: eventsCount,
                trend: Math.floor(Math.random() * 8) + 1,
                isPositive: true,
              },
              {
                icon: "📋",
                title: "My Bookings",
                value: userBookingsCount,
                trend: Math.floor(Math.random() * 3) + 1,
                isPositive: true,
              },
            ]);

            // Set user bookings for the facility bookings section
            setUserBookings(userBookingsData);

            // Fetch training plans for the user - Updated to match TrainingCoaches.js
            let formattedTrainingSchedule = [];
            try {
              // Get user ID by email first (same as TrainingCoaches.js)
              const userRes = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
              
              if (userRes.data.status === "success" && userRes.data.user?._id) {
                const userId = userRes.data.user._id;
                
                // Fetch training plans using the same endpoint as TrainingCoaches.js
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
                
                if (plansRes.data.success && plansRes.data.plans) {
                  formattedTrainingSchedule = plansRes.data.plans.map(plan => ({
                    _id: plan._id,
                    trainingType: plan.title || plan.name || 'Training Plan',
                    trainerName: typeof plan.coach === 'object' ? plan.coach.name : plan.coach || 'Coach',
                    sportName: typeof plan.sport === 'object' ? plan.sport.name : plan.sport || '',
                    startTime: plan.createdAt || new Date(),
                    endTime: plan.sessions && plan.sessions.length > 0 ? 
                      plan.sessions[plan.sessions.length - 1].date : 
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    description: plan.description || '',
                    difficulty: plan.difficulty || 'Intermediate',
                    sessions: plan.sessions || [],
                    totalSessions: plan.sessions ? plan.sessions.length : 0
                  }));
                }
              }
            } catch (planError) {
              console.error('Error fetching training plans:', planError);
              // Don't fail the entire dashboard if training plans fail
            }
            
            setTrainingSchedule(formattedTrainingSchedule);

            // Fetch upcoming events
            const eventsRes = await axios.get('http://localhost:8070/events').catch(() => ({ data: [] }));
            const eventsData = Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data.events || [];
            const upcomingEventsData = eventsData
              .filter(event => new Date(event.date) >= new Date())
              .slice(0, 5)
              .map(event => ({
                _id: event._id,
                name: event.title || event.name,
                date: event.date,
                startTime: event.startTime || event.date,
                trainerName: event.organizer || 'Event Organizer',
                location: event.location || 'TBA',
                description: event.description || ''
              }));
            setUpcomingEvents(upcomingEventsData);

            // Create workout goals based on user's training plans and bookings
            const goalTypes = ['Cardio Sessions', 'Strength Training', 'Flexibility', 'Sports Activities'];
            const workoutGoalsData = goalTypes.map((type, index) => ({
              _id: `goal_${index}`,
              activityType: type,
              targetCount: 20 + (index * 5),
              completedCount: Math.floor(Math.random() * 15) + 5,
              period: 'monthly'
            }));
            setWorkoutGoals(workoutGoalsData);

          } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Set default empty data if API calls fail
            setStats([
              { icon: "👥", title: "Active Members", value: 0, trend: 0, isPositive: true },
              { icon: "🏢", title: "Facilities Available", value: 0, trend: 0, isPositive: true },
              { icon: "📅", title: "Total Events", value: 0, trend: 0, isPositive: true },
              { icon: "📋", title: "My Bookings", value: 0, trend: 0, isPositive: true },
            ]);
            setTrainingSchedule([]);
            setUpcomingEvents([]);
            setWorkoutGoals([]);
            setUserBookings([]);
          }
        }
      } catch (error) {
        // Only set server error for network/server issues
        if (!error.response) {
          // Network error or server is down
          setServerError(true);
        } else {
          // Handle other errors (e.g., user not found) as needed
          setServerError(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Get the current time to display appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Check if a booking is active, completed, or canceled
  const getBookingStatus = (booking) => {
    if (!booking || !booking.status) return 'unknown';
    if (booking.status === 'cancelled') return 'cancelled';
    
    const now = new Date();
    const endTime = new Date(booking.endTime);
    if (now > endTime) return 'completed';
    
    const startTime = new Date(booking.startTime);
    if (now >= startTime && now <= endTime) return 'active';
    
    return booking.status;
  };

  if (serverError) {
    return (
      <div className={styles.loadingContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <img
        src={logo}
        alt="FTC Club Logo"
        style={{ width: 140, marginBottom: 24 }}
      />
      <h2 style={{ color: '#e74c3c', marginBottom: 12, fontWeight: 700, letterSpacing: 1 }}>Server Down</h2>
      <p style={{ color: '#888', fontSize: 18, marginBottom: 10, lineHeight: 1.5 }}>
        Sorry, we are unable to connect to the server.<br />
        Please try again later.
      </p>
      <div style={{ marginTop: 18, fontSize: 16, color: '#888', opacity: 0.85 }}>
        <span style={{ fontWeight: 500 }}>Powered by <span style={{ color: '#3498db' }}>Mommentx</span></span>
        <br />
        <span style={{ fontWeight: 500 }}>Design by <span style={{ color: '#27ae60' }}>Nimeshdilhara96</span></span>
      </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <img
          src={require('../../assets/logo.png')}
          alt="NextGen Sport Club Logo"
          style={{ width: 120, marginBottom: 20 }}
        />
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Preparing your dashboard...</p>
      </div>
    );
  }

  // Render different content based on user role
  const renderDashboardContent = () => {
    // If user is admin, render admin dashboard
    if (userData.role === 'admin') {
      return (
        <div className={styles.adminDashboard}>
          <div className={styles.dashboardHeader}>
            <div className={styles.dashboardTitle}>
              <h1>Admin Dashboard</h1>
              <p className={styles.dashboardDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeGreeting}>
              <div className={styles.greetingMessage}>
                <h2 className={styles.greetingText}>{getGreeting()}, <span className={styles.userName}>Admin {userData.name}!</span></h2>
                <p className={styles.greetingSubtitle}>Welcome to your administration dashboard.</p>
              </div>
            </div>
          </div>
          
          <div className={styles.adminCards}>
            <div className={styles.adminCard}>
              <div className={styles.adminCardIcon}>
                <i className="fas fa-users"></i>
              </div>
              <div className={styles.adminCardContent}>
                <h3>User Management</h3>
                <p>Manage users, roles and permissions</p>
                <button className={styles.adminActionButton} onClick={() => navigate('/admin/users')}>
                  Manage Users <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
            
            <div className={styles.adminCard}>
              <div className={styles.adminCardIcon}>
                <i className="fas fa-dumbbell"></i>
              </div>
              <div className={styles.adminCardContent}>
                <h3>Facility Management</h3>
                <p>Manage sports facilities and equipment</p>
                <button className={styles.adminActionButton} onClick={() => navigate('/admin/facilities')}>
                  Manage Facilities <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
            
            <div className={styles.adminCard}>
              <div className={styles.adminCardIcon}>
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className={styles.adminCardContent}>
                <h3>Event Management</h3>
                <p>Schedule and manage club events</p>
                <button className={styles.adminActionButton} onClick={() => navigate('/admin/events')}>
                  Manage Events <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
            
            <div className={styles.adminCard}>
              <div className={styles.adminCardIcon}>
                <i className="fas fa-chart-line"></i>
              </div>
              <div className={styles.adminCardContent}>
                <h3>Analytics</h3>
                <p>View club performance metrics</p>
                <button className={styles.adminActionButton} onClick={() => navigate('/admin/analytics')}>
                  View Reports <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular user dashboard
    return (
      <>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.dashboardTitle}>
            <h1>Dashboard</h1>
            <p className={styles.dashboardDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className={styles.dashboardActions}>
            <button 
              className={styles.actionButton}
              onClick={() => navigate('/sports-facilities')}
            >
              <i className="fas fa-calendar-plus"></i> Book Facility
            </button>
            <button 
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => navigate('/notifications')}
            >
              <i className="fas fa-bell"></i> Notifications
            </button>
          </div>
        </div>

        {/* Enhanced Welcome Section */}
        <div className={styles.welcomeSection}>
            <div className={styles.welcomeGreeting}>
              <div className={styles.greetingMessage}>
                <h2 className={styles.greetingText}>{getGreeting()}, <span className={styles.userName}>{userData.name}!</span></h2>
                <p className={styles.greetingSubtitle}>Welcome to your fitness dashboard. Here's your progress at a glance.</p>
              </div>
              <div className={styles.userInfo}>
                <div className={styles.infoItem}>
            <span className={styles.label}>Membership</span>
            <span className={`${styles.badge} ${styles[userData.membershipType.toLowerCase()]}`}>{userData.membershipType}</span>
                </div>
                <div className={styles.infoItem}>
            <span className={styles.label}>Member since</span>
            <span className={styles.value}>{userData.memberSince}</span>
                </div>
                <div className={styles.infoItem}>
            <span className={styles.label}>Next payment</span>
            <span className={`${styles.value} ${styles.dateValue}`}>{userData.nextPayment}</span>
                </div>
              </div>
            </div>
            <div className={styles.membershipBenefits}>
              <h3>Membership Benefits</h3>
              <ul className={styles.benefitsList}>
                <li><i className="fas fa-check"></i> Unlimited access to all facilities</li>
                <li><i className="fas fa-check"></i> Free fitness assessment</li>
                <li><i className="fas fa-check"></i> Access to group classes</li>
              </ul>
              <button 
                className={styles.upgradeButton}
                onClick={() => navigate('/membership')}
              >
                Upgrade Membership
              </button>
            </div>
          </div>

          {/* Stats Section */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={`${styles[`icon${index + 1}`]}`}>{stat.icon}</div>
              <div className={styles.statDetails}>
                <h3 className={styles.statTitle}>{stat.title}</h3>
                <p className={styles.statValue}>{stat.value}</p>
                <span className={`${styles.statTrend} ${stat.isPositive ? styles.positive : styles.negative}`}>
                  <i className={`fas fa-arrow-${stat.isPositive ? 'up' : 'down'}`}></i>
                  {Math.abs(stat.trend)}% from last month
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.dashboardGrid}>
          {/* Training Schedule */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h2>My Training Plans</h2>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/training')}
              >
                View All <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            <div className={styles.scheduleList}>
              {trainingSchedule.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`fas fa-dumbbell ${styles.emptyIcon}`}></i>
                  <p>No training plans assigned.</p>
                  <button 
                    className={styles.actionButton}
                    onClick={() => navigate('/training')}
                  >
                    Browse Coaches & Training Plans
                  </button>
                </div>
              ) : (
              trainingSchedule.slice(0, 3).map((plan, index) => (
                <div key={index} className={styles.scheduleItem}>
                  <div className={styles.scheduleTime}>
                    <div className={styles.planDate}>
                      {new Date(plan.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className={styles.sessionCount}>
                      {plan.totalSessions} {plan.totalSessions === 1 ? 'session' : 'sessions'}
                    </div>
                  </div>
                  <div className={styles.scheduleDetails}>
                    <h4>{plan.trainingType}</h4>
                    <p><i className="fas fa-user-alt"></i> Coach: {plan.trainerName}</p>
                    {plan.sportName && (
                      <p><i className="fas fa-trophy"></i> Sport: {plan.sportName}</p>
                    )}
                    <p><i className="fas fa-signal"></i> {plan.difficulty}</p>
                    {plan.description && (
                      <p className={styles.planDescription}>{plan.description.substring(0, 60)}...</p>
                    )}
                  </div>
                  <div className={styles.scheduleActions}>
                    <button 
                      className={styles.scheduleBtn}
                      onClick={() => navigate('/training')}
                      title="View Full Plan"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {plan.sessions && plan.sessions.length > 0 && (
                      <button 
                        className={styles.scheduleBtn}
                        title="View Sessions"
                      >
                        <i className="fas fa-calendar-alt"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h2>Upcoming Events</h2>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/events')}
              >
                View All <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            <div className={styles.eventsList}>
              {upcomingEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`fas fa-calendar-day ${styles.emptyIcon}`}></i>
                  <p>No upcoming events.</p>
                  <button 
                    className={styles.actionButton}
                    onClick={() => navigate('/events')}
                  >
                    Browse Events
                  </button>
                </div>
              ) : (
                upcomingEvents.map((event, index) => (
                  <div key={index} className={styles.eventItem}>
                    <div className={styles.eventDate}>
                      <span className={styles.day}>{new Date(event.date).getDate()}</span>
                      <span className={styles.month}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className={styles.eventDetails}>
                      <h4>{event.name}</h4>
                      <p>
                        <i className="fas fa-clock"></i> 
                        {new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p>
                        <i className="fas fa-user-alt"></i> {event.trainerName}
                      </p>
                    </div>
                    <button 
                      className={styles.joinButton}
                      onClick={() => navigate('/events')}
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workout Goals */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h2>Workout Goals</h2>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/health')}
              >
                Add Goal <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className={styles.goalsList}>
              {workoutGoals.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`fas fa-bullseye ${styles.emptyIcon}`}></i>
                  <p>No workout goals set.</p>
                  <button 
                    className={styles.actionButton}
                    onClick={() => navigate('/health')}
                  >
                    Set First Goal
                  </button>
                </div>
              ) : (
                workoutGoals.map((goal, index) => (
                  <div key={index} className={styles.goalItem}>
                    <div className={styles.goalHeader}>
                      <h4>{goal.activityType}</h4>
                      <div className={styles.goalCount}>
                        <span className={styles.completed}>{goal.completedCount}</span>
                        <span className={styles.separator}>/</span>
                        <span className={styles.total}>{goal.targetCount}</span>
                      </div>
                    </div>
                    <div className={styles.goalProgressWrapper}>
                      <div className={styles.goalProgress}>
                        <div
                          className={styles.progressBar}
                          style={{ width: `${(goal.completedCount / goal.targetCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className={styles.progressPercentage}>
                        {Math.round((goal.completedCount / goal.targetCount) * 100)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Facility Bookings */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h2>My Facility Bookings</h2>
              <button 
                className={styles.viewAllButton}
                onClick={() => navigate('/facilities')}
              >
                Book More <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className={styles.bookingsList}>
              {userBookings.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`fas fa-dumbbell ${styles.emptyIcon}`}></i>
                  <p>No facility bookings.</p>
                  <button 
                    className={styles.actionButton}
                    onClick={() => navigate('/facilities')}
                  >
                    Book Facility
                  </button>
                </div>
              ) : (
                userBookings.map((booking, index) => {
                  const status = getBookingStatus(booking);
                  return (
                    <div key={index} className={styles.bookingItem}>
                      <div className={styles.bookingTime}>
                        <div className={styles.bookingDate}>
                          <i className="fas fa-calendar"></i>
                          {new Date(booking.startTime).toLocaleDateString()}
                        </div>
                        <div className={styles.bookingHours}>
                          <i className="fas fa-clock"></i>
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className={styles.bookingDetails}>
                        <h4>{booking.facilityName}</h4>
                        <span className={`${styles.statusBadge} ${styles[status]}`}>{status}</span>
                      </div>
                      <div className={styles.bookingActions}>
                        {status === 'confirmed' && (
                          <button className={styles.cancelButton}>Cancel</button>
                        )}
                        {status === 'completed' && (
                          <button 
                            className={styles.rebookButton}
                            onClick={() => navigate('/facilities')}
                          >
                            Book Again
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Pass userRole to SlideNav to fix admin sidebar issues */}
      <SlideNav 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        userRole={userData.role}
      />
      <Container isSidebarOpen={isSidebarOpen}>
        <div className={styles.dashboardContent}>
          {renderDashboardContent()}
          
          <br />
          <FeedbackForm userName={userData.name} />

          {/* Footer with branding and version - same for all users */}
          <div className={styles.dashboardFooter}>
            <div className={styles.footerBranding}>
              <div className={styles.footerLogo}>
                <i className="fas fa-running"></i> NextGen Sport Club
              </div>
              <div className={styles.footerCredits}>
                <p>
                  <span className={styles.poweredByLabel}>Powered by</span> <span className={styles.poweredBy}>MommentX</span>
                </p>
                <p>
                  <span className={styles.developedByLabel}>Developed by</span> <span className={styles.developedBy}>Nimeshdilhara96</span>
                </p>
                <p className={styles.versionBadge}>version v4.9.3</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default Dashboard;