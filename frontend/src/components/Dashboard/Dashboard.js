import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import SlideNav from '../appnavbar/slidenav';
import Container from '../common/Container';

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    membershipType: '',
    memberSince: '',
    nextPayment: ''
  });
  const [stats, setStats] = useState([]);
  const [trainingSchedule, setTrainingSchedule] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [workoutGoals, setWorkoutGoals] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const navigate = useNavigate();

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');
        
        // Fetch user data
        const userResponse = await axios.get(`http://localhost:8070/user/${userId}`);
        setUserData({
          name: userResponse.data.name || 'User',
          membershipType: userResponse.data.membershipType || 'Standard',
          memberSince: new Date(userResponse.data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          nextPayment: new Date(userResponse.data.nextPaymentDate).toISOString().split('T')[0]
        });

        // Fetch all other data using Promise.all
        const [membersRes, classesRes, attendanceRes, achievementsRes, scheduleRes, eventsRes, goalsRes] = 
          await Promise.all([
            axios.get('http://localhost:8070/user/count'),
            axios.get('http://localhost:8070/class/weekly-count'),
            axios.get('http://localhost:8070/attendance/rate'),
            axios.get('http://localhost:8070/achievements/count'),
            axios.get(`http://localhost:8070/training/schedule/${userId}`),
            axios.get('http://localhost:8070/events/upcoming'),
            axios.get(`http://localhost:8070/goals/${userId}`)
          ]);

        setStats([
          {
            icon: "👥",
            title: "Active Members",
            value: membersRes.data.count || 0,
            trend: membersRes.data.trend || 0,
            isPositive: (membersRes.data.trend || 0) > 0
          },
          {
            icon: "💪",
            title: "Classes This Week",
            value: classesRes.data.count || 0,
            trend: classesRes.data.trend || 0,
            isPositive: (classesRes.data.trend || 0) > 0
          },
          {
            icon: "📅",
            title: "Attendance Rate",
            value: `${attendanceRes.data.rate || 0}%`,
            trend: attendanceRes.data.trend || 0,
            isPositive: (attendanceRes.data.trend || 0) > 0
          },
          {
            icon: "🏆",
            title: "Achievements",
            value: achievementsRes.data.count || 0,
            trend: achievementsRes.data.trend || 0,
            isPositive: (achievementsRes.data.trend || 0) > 0
          }
        ]);

        setTrainingSchedule(scheduleRes.data);
        setUpcomingEvents(eventsRes.data);
        setWorkoutGoals(goalsRes.data);

        // Fetch user bookings
        const userBookingsResponse = await axios.get(`http://localhost:8070/user/${userId}/bookings`);
        if (userBookingsResponse.data.bookings) {
          setUserBookings(userBookingsResponse.data.bookings);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setUserData({
          name: 'User',
          membershipType: 'Standard',
          memberSince: 'January 2024',
          nextPayment: '2024-02-15'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Effect to check and update booking statuses every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Update displayed booking status for completed bookings
      setUserBookings(prevBookings => 
        prevBookings.map(booking => {
          const now = new Date();
          const endTime = new Date(booking.endTime);
          
          // If booking has ended but is still marked as confirmed, update it to completed
          if (now > endTime && booking.status === 'confirmed') {
            return { ...booking, status: 'completed' };
          }
          return booking;
        })
      );
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Function to check if booking is active or expired
  const getBookingStatus = (booking) => {
    const now = new Date();
    const endTime = new Date(booking.endTime);
    
    if (booking.status === 'cancelled') return 'cancelled';
    if (now > endTime) return 'completed';
    return booking.status;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Add this to your main App or Dashboard component
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    
    // Function to check if account is blocked
    const checkBlockStatus = async () => {
      try {
        const response = await axios.get('http://localhost:8070/user/checkStatus', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.isBlocked) {
          // Clear session data and redirect to login with message
          sessionStorage.clear();
          navigate('/login', { 
            state: { message: "Your account has been blocked. Please contact the administrator." }
          });
        }
      } catch (error) {
        if (error.response?.status === 403) {
          // 403 Forbidden - account is blocked
          sessionStorage.clear();
          navigate('/login', { 
            state: { message: "Your account has been blocked. Please contact the administrator." }
          });
        }
        console.error("Status check error:", error);
      }
    };
    
    // Check status immediately and then every 5 minutes
    checkBlockStatus();
    const intervalId = setInterval(checkBlockStatus, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const renderDashboardContent = () => (
    <div className="dashboard-content">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome back, {userData.name}! 👋</h1>
        <div className="membership-info">
          <span className="badge premium">🌟 {userData.membershipType}</span>
          <p>Member since: {userData.memberSince}</p>
          <p>Next payment: {userData.nextPayment}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-details">
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-trend ${stat.isPositive ? 'positive' : 'negative'}`}>
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Training Schedule */}
        <div className="dashboard-card">
          <h2>Today's Training</h2>
          <div className="schedule-list">
            {trainingSchedule.map((session, index) => (
              <div key={index} className="schedule-item">
                <div className="schedule-time">
                  {new Date(session.startTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </div>
                <div className="schedule-details">
                  <h4>{session.trainingType}</h4>
                  <p>with {session.trainerName}</p>
                </div>
                <span className={`status ${session.status.toLowerCase()}`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="dashboard-card">
          <h2>Upcoming Events</h2>
          <div className="events-list">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="event-item">
                <div className="event-date">
                  <span className="day">{new Date(event.date).getDate()}</span>
                  <span className="month">
                    {new Date(event.date).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
                <div className="event-details">
                  <h4>{event.name}</h4>
                  <p>{new Date(event.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} with {event.trainerName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workout Goals */}
        <div className="dashboard-card">
          <h2>Workout Goals</h2>
          <div className="goals-list">
            {workoutGoals.map((goal, index) => (
              <div key={index} className="goal-item">
                <div className="goal-info">
                  <h4>{goal.activityType}</h4>
                  <p>{goal.completedCount} of {goal.targetCount} completed</p>
                </div>
                <div className="goal-progress">
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${(goal.completedCount / goal.targetCount) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Facility Bookings */}
        <div className="dashboard-card">
          <h2>My Facility Bookings</h2>
          <div className="bookings-list">
            {userBookings.length === 0 ? (
              <p className="no-bookings">You have no facility bookings.</p>
            ) : (
              userBookings.map((booking, index) => {
                const currentStatus = getBookingStatus(booking);
                return (
                  <div key={index} className="booking-item">
                    <div className="booking-time">
                      <div className="booking-date">
                        {new Date(booking.startTime).toLocaleDateString()}
                      </div>
                      <div>
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="booking-details">
                      <h4>{booking.facilityName}</h4>
                    </div>
                    <span className={`status ${currentStatus.toLowerCase()}`}>
                      {currentStatus}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SlideNav 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
      />
      <Routes>
        <Route 
          path="/" 
          element={
            <Container isSidebarOpen={isSidebarOpen}>
              {renderDashboardContent()}
            </Container>
          } 
        />
      </Routes>
    </>
  );
};

export default Dashboard;