import React, { useState, useEffect } from 'react';
import SlideNav from '../appnavbar/slidenav';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUsers, FaCheck, FaHandshake, FaEnvelope, FaPhone, FaGlobe } from 'react-icons/fa';
import styles from './Event.module.css';
import axios from 'axios';
import Logo from '../../assets/logo.png';

const Event = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'sponsors'
  const [rsvpLoading, setRsvpLoading] = useState(null); // Track which event is being processed

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
          const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
          if (response.data.status === "success") {
            setUserData(response.data.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8070/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSponsors = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8070/sponsors');
        setSponsors(response.data);
      } catch (error) {
        console.error('Error fetching sponsors:', error);
        setError('Failed to load sponsors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'sponsors') {
      fetchSponsors();
    }
  }, [activeTab]);

  // Simplified handleRSVP function using only email

  const handleRSVP = async (eventId) => {
    try {
      // Get the logged-in user's email from sessionStorage
      const userEmail = sessionStorage.getItem('userEmail');
      
      if (!userEmail) {
        alert('Please log in to RSVP for events');
        return;
      }

      setRsvpLoading(eventId); // Set loading state

      // Check if user is already attending
      const event = events.find(e => e._id === eventId);
      const isAlreadyAttending = event.attendees?.some(
        attendee => attendee.userEmail === userEmail
      );

      if (isAlreadyAttending) {
        // Cancel RSVP
        const response = await axios.delete(`http://localhost:8070/events/${eventId}/rsvp`, {
          data: {
            userEmail: userEmail
          }
        });

        if (response.data.event) {
          // Update the events state with the updated event
          setEvents(events.map(event => 
            event._id === eventId ? response.data.event : event
          ));
          alert('Successfully cancelled your RSVP!');
        }
      } else {
        // Make RSVP - send only email, let backend find user
        const response = await axios.post(`http://localhost:8070/events/${eventId}/rsvp`, {
          userEmail: userEmail
        });

        if (response.data.event) {
          // Update the events state with the updated event
          setEvents(events.map(event => 
            event._id === eventId ? response.data.event : event
          ));
          alert('Successfully registered for the event!');
        }
      }
    } catch (error) {
      console.error('Error handling RSVP:', error);
      
      // Show specific error message from server
      const errorMessage = error.response?.data?.msg || 'Failed to process RSVP. Please try again.';
      alert(errorMessage);
    } finally {
      setRsvpLoading(null); // Clear loading state
    }
  };

  const toggleEventDetails = (eventId) => {
    if (selectedEvent === eventId) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(eventId);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time from 24hr to 12hr format
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <>
      <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.container}>
          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${activeTab === 'events' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <FaCalendarAlt /> Events
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'sponsors' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('sponsors')}
            >
              <FaHandshake /> Sponsors
            </button>
          </div>

          {/* Events Tab */}
          {activeTab === 'events' && (
            <>
              <h1 className={styles.pageTitle}>Upcoming Events</h1>
              
              {loading && <div className={styles.loading}>Loading events...</div>}
              {error && <div className={styles.error}>{error}</div>}
              
              <div className={styles.events}>
                {events.length === 0 && !loading ? (
                  <div className={styles.noEvents}>No events scheduled at the moment.</div>
                ) : (
                  events.map((event) => (
                    <div key={event._id} className={styles.event}>
                      <div className={styles.eventHeader}>
                        <img 
                          src={event.image ? `http://localhost:8070/${event.image}` : Logo}
                          alt={event.title} 
                          className={styles.eventImage}
                        />
                        <div className={styles.eventInfo}>
                          <h3>{event.title}</h3>
                          <div className={styles.eventMeta}>
                            <span className={styles.eventDate}>
                              <FaCalendarAlt /> {formatDate(event.date)}
                            </span>
                            <span className={styles.eventTime}>
                              <FaClock /> {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.eventContent}>
                        <p className={styles.eventLocation}>
                          <FaMapMarkerAlt /> {event.location}
                        </p>
                        <p className={styles.eventDescription}>
                          {selectedEvent === event._id 
                            ? event.description 
                            : event.description.length > 150 
                              ? `${event.description.substring(0, 150)}...` 
                              : event.description}
                        </p>
                        {event.description.length > 150 && (
                          <button 
                            className={styles.showMoreBtn}
                            onClick={() => toggleEventDetails(event._id)}
                          >
                            {selectedEvent === event._id ? 'Show Less' : 'Read More'}
                          </button>
                        )}
                      </div>

                      <div className={styles.eventStats}>
                        <span className={styles.attendeeCount}>
                          <FaUsers /> {event.attendees?.length || 0} attending
                        </span>
                      </div>

                      <div className={styles.eventActions}>
                        <button 
                          onClick={() => handleRSVP(event._id)} 
                          className={`${styles.actionButton} ${
                            event.attendees?.some(attendee => attendee.userEmail === sessionStorage.getItem('userEmail')) 
                              ? styles.active 
                              : ''
                          }`}
                          disabled={rsvpLoading === event._id}
                        >
                          {rsvpLoading === event._id ? (
                            <>
                              <FaClock /> Processing...
                            </>
                          ) : event.attendees?.some(attendee => attendee.userEmail === sessionStorage.getItem('userEmail')) ? (
                            <>
                              <FaCheck /> Attending
                            </>
                          ) : (
                            <>
                              <FaCalendarAlt /> RSVP
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Sponsors Tab */}
          {activeTab === 'sponsors' && (
            <>
              <h1 className={styles.pageTitle}>Our Sponsors</h1>
              
              {loading && <div className={styles.loading}>Loading sponsors...</div>}
              {error && <div className={styles.error}>{error}</div>}
              
              <div className={styles.sponsors}>
                {sponsors.length === 0 && !loading ? (
                  <div className={styles.noSponsors}>No sponsors at the moment.</div>
                ) : (
                  sponsors.map((sponsor) => (
                    <div key={sponsor._id} className={styles.sponsor}>
                      <div className={styles.sponsorHeader}>
                        <img 
                          src={sponsor.logo ? `http://localhost:8070/${sponsor.logo}` : Logo}
                          alt={sponsor.name} 
                          className={styles.sponsorLogo}
                        />
                        <div className={styles.sponsorInfo}>
                          <h3>{sponsor.name}</h3>
                          <p className={styles.sponsorType}>{sponsor.type}</p>
                        </div>
                      </div>

                      <div className={styles.sponsorContent}>
                        <p className={styles.sponsorDescription}>
                          {sponsor.description}
                        </p>
                        
                        <div className={styles.sponsorDetails}>
                          <div className={styles.sponsorContact}>
                            <h4>Contact Information</h4>
                            <p><strong>Contact Person:</strong> {sponsor.contactName}</p>
                            <p><FaEnvelope /> {sponsor.email}</p>
                            <p><FaPhone /> {sponsor.phone}</p>
                            {sponsor.website && (
                              <p><FaGlobe /> <a href={sponsor.website} target="_blank" rel="noopener noreferrer">{sponsor.website}</a></p>
                            )}
                          </div>
                          
                          <div className={styles.sponsorshipPeriod}>
                            <h4>Sponsorship Period</h4>
                            <p>{formatDate(sponsor.startDate)} - {formatDate(sponsor.endDate)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Event;