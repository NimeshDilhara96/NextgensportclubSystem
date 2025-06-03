import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Dashboard.module.css'; // Changed to import styles
import SlideNav from '../appnavbar/slidenav';
import Container from '../common/Container';

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
  const navigate = useNavigate();

  // Fetch user data and other dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Get user email from session or local storage
        const userEmail = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
        if (!userEmail) {
          console.error('User email not found in storage');
          navigate('/login');
          return;
        }

        // Fetch user data
        const userResponse = await axios.get(`http://localhost:8070/user/get/${userEmail}`);
        const user = userResponse.data.user;

        // Add role to userData to handle admin-specific navigation
        setUserData({
          name: user.name || 'User',
          membershipType: user.membershipPackage || 'Standard',
          memberSince: new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          nextPayment: user.nextPaymentDate ? new Date(user.nextPaymentDate).toISOString().split('T')[0] : 'N/A',
          role: user.role || 'member', // Store user role
        });

        // Only fetch other dashboard data if user is not admin
        if (user.role !== 'admin') {
          const [membersRes, classesRes, attendanceRes, achievementsRes, scheduleRes, eventsRes, goalsRes, bookingsRes] = await Promise.all([
            axios.get('http://localhost:8070/user/count'),
            axios.get('http://localhost:8070/class/weekly-count'),
            axios.get('http://localhost:8070/attendance/rate'),
            axios.get('http://localhost:8070/achievements/count'),
            axios.get(`http://localhost:8070/training/schedule/${user._id}`),
            axios.get('http://localhost:8070/events/upcoming'),
            axios.get(`http://localhost:8070/goals/${user._id}`),
            axios.get(`http://localhost:8070/user/bookings/${userEmail}`),
          ]);

          setStats([
            {
              icon: "👥",
              title: "Active Members",
              value: membersRes.data.count || 0,
              trend: membersRes.data.trend || 0,
              isPositive: (membersRes.data.trend || 0) > 0,
            },
            {
              icon: "💪",
              title: "Classes This Week",
              value: classesRes.data.count || 0,
              trend: classesRes.data.trend || 0,
              isPositive: (classesRes.data.trend || 0) > 0,
            },
            {
              icon: "📅",
              title: "Attendance Rate",
              value: `${attendanceRes.data.rate || 0}%`,
              trend: attendanceRes.data.trend || 0,
              isPositive: (attendanceRes.data.trend || 0) > 0,
            },
            {
              icon: "🏆",
              title: "Achievements",
              value: achievementsRes.data.count || 0,
              trend: achievementsRes.data.trend || 0,
              isPositive: (achievementsRes.data.trend || 0) > 0,
            },
          ]);

          setTrainingSchedule(scheduleRes.data);
          setUpcomingEvents(eventsRes.data);
          setWorkoutGoals(goalsRes.data);
          setUserBookings(bookingsRes.data.bookings || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
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
            <button className={styles.actionButton}><i className="fas fa-calendar-plus"></i> Book Facility</button>
            <button className={`${styles.actionButton} ${styles.secondary}`}><i className="fas fa-bell"></i> Notifications</button>
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
            <button className={styles.upgradeButton}>Upgrade Membership</button>
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
              <h2>Today's Training</h2>
              <button className={styles.viewAllButton}>View All <i className="fas fa-arrow-right"></i></button>
            </div>
            <div className={styles.scheduleList}>
              {trainingSchedule.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`fas fa-calendar-alt ${styles.emptyIcon}`}></i>
                  <p>No training sessions scheduled for today.</p>
                  <button className={styles.actionButton}>Schedule Training</button>
                </div>
              ) : (
                trainingSchedule.map((session, index) => (
                  <div key={index} className={styles.scheduleItem}>
                    <div className={styles.scheduleTime}>
                      {new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={styles.scheduleDetails}>
                      <h4>{session.trainingType}</h4>
                      <p><i className="fas fa-user-alt"></i> with {session.trainerName}</p>
                    </div>
                    <div className={styles.scheduleActions}>
                      <button className={styles.scheduleBtn}><i className="fas fa-info-circle"></i></button>
                      <button className={styles.scheduleBtn}><i className="fas fa-times"></i></button>
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
              <button className={styles.viewAllButton}>View All <i className="fas fa-arrow-right"></i></button>
            </div>
            <div className={styles.eventsList}>
              {upcomingEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`fas fa-calendar-day ${styles.emptyIcon}`}></i>
                  <p>No upcoming events.</p>
                  <button className={styles.actionButton}>Browse Events</button>
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
                    <button className={styles.joinButton}>Join</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workout Goals */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h2>Workout Goals</h2>
              <button className={styles.viewAllButton}>Add Goal <i className="fas fa-plus"></i></button>
            </div>
            <div className={styles.goalsList}>
              {workoutGoals.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`fas fa-bullseye ${styles.emptyIcon}`}></i>
                  <p>No workout goals set.</p>
                  <button className={styles.actionButton}>Set First Goal</button>
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
              <button className={styles.viewAllButton}>Book More <i className="fas fa-plus"></i></button>
            </div>
            <div className={styles.bookingsList}>
              {userBookings.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`fas fa-dumbbell ${styles.emptyIcon}`}></i>
                  <p>No facility bookings.</p>
                  <button className={styles.actionButton}>Book Facility</button>
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
                          <button className={styles.rebookButton}>Book Again</button>
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
        userRole={userData.role} // Add role to handle different navigation menus
      />
      <Container isSidebarOpen={isSidebarOpen}>
        <div className={styles.dashboardContent}>
          {renderDashboardContent()}

          {/* Footer with branding and version - same for all users */}
          <div className={styles.dashboardFooter}>
            <div className={styles.footerBranding}>
              <div className={styles.footerLogo}>
                <i className="fas fa-running"></i> NextGen Sport Club
              </div>
              <div className={styles.footerCredits}>
                <p>Powered by <span className={styles.highlight}>MommentX</span></p>
                <p>Developed by <span className={styles.highlight}>Nimeshdilhara96</span></p>
                <p className={styles.versionBadge}>UI v2.3</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default Dashboard;