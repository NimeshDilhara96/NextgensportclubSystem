import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    FaSearch, 
    FaFilter, 
    FaUser, 
    FaEnvelope, 
    FaDumbbell, 
    FaClock,
    FaExclamationCircle 
} from 'react-icons/fa';
import CoachSlideNav from './CoachSlideNav';
import styles from './viewmember.module.css';

const ViewMemberPortal = () => {
    const [coach, setCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSport, setSelectedSport] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const coachEmail = sessionStorage.getItem('coachEmail');

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        if (!coachEmail) {
            setError('Coach email not found. Please login again.');
            setLoading(false);
            return;
        }
        const fetchCoachDetails = async () => {
            try {
                const res = await axios.get(`http://localhost:8070/coaches/by-email/${encodeURIComponent(coachEmail)}/details`);
                setCoach(res.data.coach);
            } catch (err) {
                setError(`Failed to fetch coach details: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchCoachDetails();
    }, [coachEmail]);

    // Get all unique sports from coach's assigned sports
    const uniqueSports = coach?.sports ? [...new Set(coach.sports.map(sport => sport.name))] : [];

    // Filter members based on search, sport, and status
    const filteredMembers = React.useMemo(() => {
        if (!coach?.sports) return [];

        let members = coach.sports.flatMap(sport =>
            (sport.members || []).map(member => ({
                ...member,
                sportName: sport.name
            }))
        );

        // Apply filters
        return members.filter(member => {
            const matchesSearch = (
                member.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            const matchesSport = selectedSport === 'all' || member.sportName === selectedSport;
            
            const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;

            return matchesSearch && matchesSport && matchesStatus;
        });
    }, [coach, searchQuery, selectedSport, selectedStatus]);

    if (loading) {
        return (
            <div className={styles.pageWrapper}>
                <CoachSlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                    <div className={styles.loadingState}>Loading member data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.pageWrapper}>
                <CoachSlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                    <div className={styles.errorState}>
                        <FaExclamationCircle />
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <CoachSlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                <div className={styles.contentHeader}>
                    <h1 className={styles.pageTitle}>Member Management</h1>
                    <div className={styles.coachInfoBox}>
                        <div className={styles.coachDetail}>
                            <FaUser className={styles.icon} />
                            <span>{coach?.name}</span>
                        </div>
                        <div className={styles.coachDetail}>
                            <FaDumbbell className={styles.icon} />
                            <span>{coach?.specialty}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <div className={styles.searchBox}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search members by name or email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className={styles.filterBox}>
                        <FaFilter className={styles.filterIcon} />
                        <select
                            value={selectedSport}
                            onChange={e => setSelectedSport(e.target.value)}
                        >
                            <option value="all">All Sports</option>
                            {uniqueSports.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>

                <div className={styles.statsSection}>
                    <div className={styles.statCard}>
                        <h3>Total Members</h3>
                        <p>{filteredMembers.length}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Active Members</h3>
                        <p>{filteredMembers.filter(m => m.status === 'active').length}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Sports Count</h3>
                        <p>{uniqueSports.length}</p>
                    </div>
                </div>

                {filteredMembers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaUser className={styles.emptyIcon} />
                        <p>No members found matching your criteria</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.membersTable}>
                            <thead>
                                <tr>
                                    <th>Member Name</th>
                                    <th>Email</th>
                                    <th>Sport</th>
                                    <th>Joined Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map((member, index) => (
                                    <tr key={`${member.userEmail}-${index}`}>
                                        <td>
                                            <div className={styles.memberInfo}>
                                                <FaUser className={styles.memberIcon} />
                                                {member.userName}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.memberInfo}>
                                                <FaEnvelope className={styles.memberIcon} />
                                                {member.userEmail}
                                            </div>
                                        </td>
                                        <td>{member.sportName}</td>
                                        <td>
                                            <div className={styles.memberInfo}>
                                                <FaClock className={styles.memberIcon} />
                                                {new Date(member.joinedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[member.status]}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewMemberPortal;