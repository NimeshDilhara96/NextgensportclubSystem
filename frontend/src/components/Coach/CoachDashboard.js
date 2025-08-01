import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaClock, 
  FaCheckCircle, 
  FaUser,
  FaClipboardList,
  FaComments
} from 'react-icons/fa';
import CoachSlideNav from './CoachSlideNav';
import styles from './CoachDashboard.module.css';

const CoachDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingSessions: [],
    totalClients: 0,
    weeklySessionCount: 0,
    completedSessions: 0,
    recentMessages: [],
    notifications: []
  });
  
  const coachId = sessionStorage.getItem('coachId');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const coachEmail = sessionStorage.getItem('coachEmail');
        
        // Fetch sessions
        const sessionsResponse = await axios.get(`http://localhost:8070/coaches/sessions/${coachEmail}`);
        const upcomingSessions = sessionsResponse.data.sessions || [];

        // Fetch coach details with populated sports and members
        const membersResponse = await axios.get(`http://localhost:8070/coaches/by-email/${encodeURIComponent(coachEmail)}/details`);
        const coachDetails = membersResponse.data.coach;

        // Calculate total members from sports
        let totalMembers = 0;
        if (coachDetails.sports && Array.isArray(coachDetails.sports)) {
          coachDetails.sports.forEach(sport => {
            if (sport.members) {
              // Only count active members
              const activeMembers = Array.isArray(sport.members) 
                ? sport.members.filter(member => member.status === 'active').length 
                : 0;
              totalMembers += activeMembers;
            }
          });
        }

        setDashboardData({
          upcomingSessions: upcomingSessions.slice(0, 5),
          totalClients: totalMembers, // Use total count instead of unique members
          weeklySessionCount: upcomingSessions.filter(session => {
            const sessionDate = new Date(session.date);
            const today = new Date();
            const weekFromNow = new Date();
            weekFromNow.setDate(today.getDate() + 7);
            return sessionDate >= today && sessionDate <= weekFromNow;
          }).length,
          completedSessions: upcomingSessions.filter(session => 
            session.status === 'completed'
          ).length,
          recentMessages: [],
          notifications: []
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please refresh the page.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [coachId]);

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <CoachSlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.loadingState}>Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <CoachSlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.errorState}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <CoachSlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.contentHeader}>
          <h1 className={styles.pageTitle}>Coach Dashboard</h1>
        </div>

        <div className={styles.dashboardContainer}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><FaUsers /></div>
              <div className={styles.statInfo}>
                <h3>{dashboardData.totalClients}</h3>
                <p>Total Members</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><FaCalendarAlt /></div>
              <div className={styles.statInfo}>
                <h3>{dashboardData.weeklySessionCount}</h3>
                <p>Sessions This Week</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><FaCheckCircle /></div>
              <div className={styles.statInfo}>
                <h3>{dashboardData.completedSessions}</h3>
                <p>Completed Sessions</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <Link to="/coach/view-members" className={styles.actionCard}>
              <FaUsers className={styles.actionIcon} />
              <span>View Members</span>
            </Link>
            <Link to="/coach/view-sessions" className={styles.actionCard}>
              <FaCalendarAlt className={styles.actionIcon} />
              <span>Training Sessions</span>
            </Link>
            <Link to="/coach/send-message" className={styles.actionCard}>
              <FaComments className={styles.actionIcon} />
              <span>Send Message</span>
            </Link>
            <Link to="/coach/training-plan" className={styles.actionCard}>
              <FaClipboardList className={styles.actionIcon} />
              <span>Training Plans</span>
            </Link>
          </div>

          {/* Recent Sessions */}
          <div className={styles.recentSessions}>
            <h2>Recent Training Sessions</h2>
            <div className={styles.sessionsList}>
              {dashboardData.upcomingSessions.length === 0 ? (
                <div className={styles.emptyState}>No recent sessions found</div>
              ) : (
                dashboardData.upcomingSessions.map(session => (
                  <div key={session._id} className={styles.sessionCard}>
                    <div className={styles.sessionInfo}>
                      <div className={styles.sessionDate}>
                        <FaCalendarAlt />
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                      <div className={styles.sessionTime}>
                        <FaClock />
                        {session.time}
                      </div>
                    </div>
                    <div className={styles.sessionUser}>
                      <FaUser />
                      {session.userName}
                    </div>
                    <div className={`${styles.sessionStatus} ${styles[session.status]}`}>
                      {session.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;