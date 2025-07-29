import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './viewmember.module.css';
import CoachSlideNav from './CoachSlideNav';

const ViewMemberPortal = () => {
    const [coach, setCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Get coachEmail from sessionStorage
    const coachEmail = sessionStorage.getItem('coachEmail');

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

    if (loading) return (
        <div className={styles.dashboardContainer}>
            <CoachSlideNav />
            <div className={styles.container}>
                <div className={styles.infoMessage}>
                    Loading coach details...
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className={styles.dashboardContainer}>
            <CoachSlideNav />
            <div className={styles.container}>
                <div className={styles.errorMessage}>
                    <h3>Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        </div>
    );

    if (!coach) return (
        <div className={styles.dashboardContainer}>
            <CoachSlideNav />
            <div className={styles.container}>
                <div className={styles.infoMessage}>
                    <h3>No Coach Data Found</h3>
                    <p>Unable to retrieve coach information. Please try logging in again.</p>
                </div>
            </div>
        </div>
    );

    // Flatten all members from all sports
    const allMembers = coach.sports ? coach.sports.flatMap(sport =>
        (sport.members || []).map(member => ({
            ...member,
            sportName: sport.sportName,
            membershipPackage: member.membershipPackage || 'None',
            membershipStatus: member.membershipStatus || 'Inactive',
        }))
    ) : [];

    // Filter members by search
    const filteredMembers = allMembers.filter(member =>
        member.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.dashboardContainer}>
            <CoachSlideNav />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Member Management</h1>
                    <div className={styles.coachInfoBox}>
                        <strong>Coach Name:</strong> {coach.name}<br />
                        <strong>Specialty:</strong> {coach.specialty}
                    </div>
                </div>
                <div className={styles.members_section}>
                    <div className={styles.section_header}>
                        <h2>All Members</h2>
                        <div className={styles.search_bar}>
                            <input
                                type="text"
                                placeholder="Search members by name or email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.search_input}
                            />
                        </div>
                    </div>
                    {filteredMembers.length === 0 ? (
                        <div className={styles.noMembers}>No members found matching your search.</div>
                    ) : (
                        <div className={styles.members_table_container}>
                            <table className={styles.members_table}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Sport</th>
                                        <th>Membership</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map(member => (
                                        <tr key={member.userId}>
                                            <td>{member.userName}</td>
                                            <td>{member.userEmail}</td>
                                            <td>{member.sportName}</td>
                                            <td>
                                                <span className={`${styles.package_badge} ${styles[member.membershipPackage.toLowerCase()]}`}>{member.membershipPackage}</span>
                                            </td>
                                            <td>
                                                <span className={`${styles.status_badge} ${styles[member.membershipStatus.toLowerCase()]}`}>{member.membershipStatus}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewMemberPortal;