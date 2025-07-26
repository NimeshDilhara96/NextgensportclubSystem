import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ViewMemberPortal = () => {
    const [coach, setCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                console.log('Fetching coach details for email:', coachEmail);
                const res = await axios.get(`http://localhost:8070/coaches/by-email/${encodeURIComponent(coachEmail)}/details`);
                console.log('Coach details response:', res.data);
                setCoach(res.data.coach);
            } catch (err) {
                console.error('Error fetching coach details:', err);
                setError(`Failed to fetch coach details: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchCoachDetails();
    }, [coachEmail]);

    if (loading) return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            fontSize: '18px',
            color: '#666'
        }}>
            Loading coach details...
        </div>
    );
    
    if (error) return (
        <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            borderRadius: '8px',
            color: '#721c24',
            margin: '20px',
            textAlign: 'center'
        }}>
            <h3>Error</h3>
            <p>{error}</p>
        </div>
    );
    
    if (!coach) return (
        <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '8px',
            color: '#666',
            margin: '20px',
            textAlign: 'center'
        }}>
            <h3>No Coach Data Found</h3>
            <p>Unable to retrieve coach information. Please try logging in again.</p>
        </div>
    );

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
                {coach.name} ({coach.specialty})
            </h2>
            <h3 style={{ color: '#555', marginTop: '30px' }}>Assigned Sports & Members</h3>
            {!coach.sports || coach.sports.length === 0 ? (
                <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    textAlign: 'center',
                    color: '#666'
                }}>
                    <p>No sports assigned to this coach yet.</p>
                </div>
            ) : (
                coach.sports.map(sport => (
                    <div key={sport.sportId} style={{ 
                        marginBottom: '2em', 
                        padding: '20px', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px',
                        backgroundColor: '#fff'
                    }}>
                        <h4 style={{ color: '#007bff', marginBottom: '15px' }}>{sport.sportName}</h4>
                        {!sport.members || sport.members.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>No members in this sport.</p>
                        ) : (
                            <div>
                                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                                    Members ({sport.members.length}):
                                </p>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {sport.members.map(member => (
                                        <li key={member.userId} style={{ 
                                            padding: '8px 12px', 
                                            margin: '5px 0', 
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '4px',
                                            borderLeft: '3px solid #007bff'
                                        }}>
                                            <strong>{member.userName}</strong> ({member.userEmail})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default ViewMemberPortal;