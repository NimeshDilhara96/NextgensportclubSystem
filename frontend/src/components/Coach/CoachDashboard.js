import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaEnvelope, 
  FaBell,
  FaUser
} from 'react-icons/fa';
import CoachSlideNav from './CoachSlideNav';
import styles from './CoachDashboard.module.css';

const CoachDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    upcomingSessions: [],
    totalClients: 0,
    weeklySessionCount: 0,
    completedSessions: 0,
    recentMessages: [],
    notifications: []
  });
  
  const coachId = sessionStorage.getItem('coachId');
  const coachName = sessionStorage.getItem('coachName');
  const coachSpecialty = sessionStorage.getItem('coachSpecialty');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // In a real implementation, you would make an API call here
        // For now, we'll use mock data
        
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock dashboard data
        const mockData = {
          upcomingSessions: [
            { 
              _id: '1', 
              clientName: 'John Smith', 
              date: '2025-07-11', 
              time: '10:00 AM', 
              status: 'confirmed',
              type: 'Personal Training' 
            },
            { 
              _id: '2', 
              clientName: 'Mary Johnson', 
              date: '2025-07-11', 
              time: '2:30 PM', 
              status: 'confirmed',
              type: 'Tennis Lesson' 
            },
            { 
              _id: '3', 
              clientName: 'Robert Williams', 
              date: '2025-07-12', 
              time: '11:15 AM', 
              status: 'pending',
              type: 'Swimming' 
            },
            { 
              _id: '4', 
              clientName: 'Sarah Davis', 
              date: '2025-07-13', 
              time: '4:00 PM', 
              status: 'confirmed',
              type: 'Personal Training' 
            }
          ],
          totalClients: 16,
          weeklySessionCount: 12,
          completedSessions: 142,
          recentMessages: [
            { _id: '1', from: 'Admin Team', subject: 'Schedule Update', date: '2025-07-10', read: false },
            { _id: '2', from: 'John Smith', subject: 'Question about next session', date: '2025-07-09', read: true }
          ],
          notifications: [
            { _id: '1', type: 'booking', message: 'New session booked with Sarah Davis', date: '2025-07-10' },
            { _id: '2', type: 'system', message: 'Please update your availability for next month', date: '2025-07-09' },
            { _id: '3', type: 'cancellation', message: 'Session with Alex Thompson has been cancelled', date: '2025-07-08' }
          ]
        };
        
        setDashboardData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please refresh the page.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [coachId]);
  
  // Format date to more readable format
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Check if a date is today
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Get status class for sessions
  const getStatusClass = (status) => {
    switch(status) {
      case 'confirmed': return styles.confirmed;
      case 'pending': return styles.pending;
      case 'cancelled': return styles.cancelled;
      default: return '';
    }
  };
  
  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <CoachSlideNav />
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <CoachSlideNav />
        <div className={styles.errorState}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <CoachSlideNav />
      
      <div className={styles.mainContent}>
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeText}>
            <h1>Welcome back, {coachName}!</h1>
            <p>Here's an overview of your coaching activities</p>
          </div>
          <div className={styles.currentDate}>
            <FaCalendarAlt className={styles.calendarIcon} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        
        <div className={styles.statsCards}>
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <FaUsers className={styles.statIcon} />
            </div>
            <div className={styles.statInfo}>
              <h3>{dashboardData.totalClients}</h3>
              <p>Total Clients</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <FaCalendarAlt className={styles.statIcon} />
            </div>
            <div className={styles.statInfo}>
              <h3>{dashboardData.weeklySessionCount}</h3>
              <p>Sessions This Week</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <FaCheckCircle className={styles.statIcon} />
            </div>
            <div className={styles.statInfo}>
              <h3>{dashboardData.completedSessions}</h3>
              <p>Completed Sessions</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIconContainer}>
              <FaClock className={styles.statIcon} />
            </div>
            <div className={styles.statInfo}>
              <h3>{coachSpecialty}</h3>
              <p>Specialty</p>
            </div>
          </div>
        </div>
        
        <div className={styles.dashboardGrid}>
          <div className={`${styles.dashboardCard} ${styles.upcomingSessionsCard}`}>
            <div className={styles.cardHeader}>
              <h2>Upcoming Sessions</h2>
              <Link to="/coach/sessions" className={styles.viewAllLink}>
                View All
              </Link>
            </div>
            
            {dashboardData.upcomingSessions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No upcoming sessions scheduled.</p>
              </div>
            ) : (
              <div className={styles.sessionsList}>
                {dashboardData.upcomingSessions.map(session => (
                  <div key={session._id} className={styles.sessionItem}>
                    <div className={styles.sessionDate}>
                      <div className={`${styles.dateBox} ${isToday(session.date) ? styles.today : ''}`}>
                        {isToday(session.date) ? (
                          <>
                            <span className={styles.dateToday}>TODAY</span>
                            <span className={styles.timeToday}>{session.time}</span>
                          </>
                        ) : (
                          <>
                            <span className={styles.date}>{formatDate(session.date)}</span>
                            <span className={styles.time}>{session.time}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.sessionInfo}>
                      <div className={styles.sessionClient}>
                        <h4>{session.clientName}</h4>
                        <span className={styles.sessionType}>{session.type}</span>
                      </div>
                      <div className={styles.sessionStatus}>
                        <span className={`${styles.statusBadge} ${getStatusClass(session.status)}`}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className={styles.cardActions}>
              <Link to="/coach/schedule" className={styles.cardActionLink}>
                <FaCalendarAlt />
                <span>View Schedule</span>
              </Link>
            </div>
          </div>
          
          <div className={styles.dashboardRightColumn}>
            <div className={`${styles.dashboardCard} ${styles.notificationsCard}`}>
              <div className={styles.cardHeader}>
                <h2>Notifications</h2>
              </div>
              
              {dashboardData.notifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No new notifications.</p>
                </div>
              ) : (
                <div className={styles.notificationsList}>
                  {dashboardData.notifications.map(notification => (
                    <div key={notification._id} className={styles.notificationItem}>
                      <div className={styles.notificationIcon}>
                        {notification.type === 'booking' && <FaCalendarAlt className={`${styles.notificationTypeIcon} ${styles.bookingIcon}`} />}
                        {notification.type === 'system' && <FaBell className={`${styles.notificationTypeIcon} ${styles.systemIcon}`} />}
                        {notification.type === 'cancellation' && <FaExclamationTriangle className={`${styles.notificationTypeIcon} ${styles.cancellationIcon}`} />}
                      </div>
                      <div className={styles.notificationContent}>
                        <p>{notification.message}</p>
                        <span className={styles.notificationDate}>{formatDate(notification.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={`${styles.dashboardCard} ${styles.messagesCard}`}>
              <div className={styles.cardHeader}>
                <h2>Recent Messages</h2>
                <Link to="/coach/messages" className={styles.viewAllLink}>
                  View All
                </Link>
              </div>
              
              {dashboardData.recentMessages.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No messages to display.</p>
                </div>
              ) : (
                <div className={styles.messagesList}>
                  {dashboardData.recentMessages.map(message => (
                    <Link 
                      to={`/coach/messages/${message._id}`} 
                      key={message._id}
                      className={styles.messageLink}
                    >
                      <div className={`${styles.messageItem} ${!message.read ? styles.unread : ''}`}>
                        <div className={styles.messageIcon}>
                          <FaEnvelope className={styles.envelopeIcon} />
                        </div>
                        <div className={styles.messageContent}>
                          <div className={styles.messageHeader}>
                            <h4>{message.from}</h4>
                            <span className={styles.messageDate}>{formatDate(message.date)}</span>
                          </div>
                          <p className={styles.messageSubject}>{message.subject}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              <div className={styles.cardActions}>
                <Link to="/coach/messages" className={styles.cardActionLink}>
                  <FaEnvelope />
                  <span>Check Messages</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`${styles.dashboardCard} ${styles.quickActionsCard}`}>
          <div className={styles.cardHeader}>
            <h2>Quick Actions</h2>
          </div>
          
          <div className={styles.quickActionButtons}>
            <Link to="/coach/clients" className={styles.quickActionButton}>
              <FaUsers className={styles.quickActionIcon} />
              <span>View Clients</span>
            </Link>
            
            <Link to="/coach/availability" className={styles.quickActionButton}>
              <FaClock className={styles.quickActionIcon} />
              <span>Update Availability</span>
            </Link>
            
            <Link to="/coach/profile" className={styles.quickActionButton}>
              <FaUser className={styles.quickActionIcon} />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>
  </div>
)};

export default CoachDashboard;