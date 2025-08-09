import React, { useState, useEffect } from 'react';
import SlideNav from '../appnavbar/slidenav';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUsers, FaCheck, FaHandshake, FaEnvelope, FaPhone, FaGlobe, FaFileAlt, FaTimes, FaUser, FaHome } from 'react-icons/fa';
import styles from './Event.module.css';
import axios from 'axios';
import Logo from '../../assets/logo.png';

const Event = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'sponsors'
  const [rsvpLoading, setRsvpLoading] = useState(null);
  
  // Application Modal State
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [userApplications, setUserApplications] = useState([]);
  
  // Application Form State
  const [applicationForm, setApplicationForm] = useState({
    applicantName: '',
    applicantEmail: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    occupation: '',
    monthlyIncome: '',
    reasonForApplication: '',
    specificNeeds: '',
    hasReceivedSponsorshipBefore: false,
    previousSponsorshipDetails: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    documents: []
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
          const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
          if (response.data.status === "success") {
            setApplicationForm(prev => ({
              ...prev,
              applicantName: response.data.user.name || '',
              applicantEmail: userEmail
            }));
          }
          
          // Fetch user's applications
          try {
            const appsResponse = await axios.get(`http://localhost:8070/sponsorship-applications/user/${userEmail}`);
            setUserApplications(appsResponse.data);
          } catch (error) {
            console.error('Error fetching applications:', error);
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

  const handleRSVP = async (eventId) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      
      if (!userEmail) {
        alert('Please log in to RSVP for events');
        return;
      }

      setRsvpLoading(eventId);

      const event = events.find(e => e._id === eventId);
      const isAlreadyAttending = event.attendees?.some(
        attendee => attendee.userEmail === userEmail
      );

      if (isAlreadyAttending) {
        const response = await axios.delete(`http://localhost:8070/events/${eventId}/rsvp`, {
          data: { userEmail: userEmail }
        });

        if (response.data.event) {
          setEvents(events.map(event => 
            event._id === eventId ? response.data.event : event
          ));
          alert('Successfully cancelled your RSVP!');
        }
      } else {
        const response = await axios.post(`http://localhost:8070/events/${eventId}/rsvp`, {
          userEmail: userEmail
        });

        if (response.data.event) {
          setEvents(events.map(event => 
            event._id === eventId ? response.data.event : event
          ));
          alert('Successfully registered for the event!');
        }
      }
    } catch (error) {
      console.error('Error handling RSVP:', error);
      const errorMessage = error.response?.data?.msg || 'Failed to process RSVP. Please try again.';
      alert(errorMessage);
    } finally {
      setRsvpLoading(null);
    }
  };

  const handleApplyForSponsorship = (sponsor) => {
    const userEmail = sessionStorage.getItem('userEmail');
    if (!userEmail) {
      alert('Please log in to apply for sponsorship programs');
      return;
    }

    // Check if user has already applied for this sponsor
    const hasApplied = userApplications.some(app => app.appliedFor._id === sponsor._id);
    if (hasApplied) {
      alert('You have already applied for this sponsorship program');
      return;
    }

    setSelectedSponsor(sponsor);
    setShowApplicationModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setApplicationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setApplicationForm(prev => ({
      ...prev,
      documents: files
    }));
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setApplicationLoading(true);

    try {
      const formData = new FormData();
      
      // Append all form fields
      Object.keys(applicationForm).forEach(key => {
        if (key === 'documents') {
          applicationForm.documents.forEach(file => {
            formData.append('documents', file);
          });
        } else {
          formData.append(key, applicationForm[key]);
        }
      });
      
      formData.append('appliedFor', selectedSponsor._id);

      const response = await axios.post('http://localhost:8070/sponsorship-applications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert(response.data.message);
        setShowApplicationModal(false);
        
        // Reset form
        setApplicationForm({
          applicantName: applicationForm.applicantName,
          applicantEmail: applicationForm.applicantEmail,
          phone: '',
          dateOfBirth: '',
          address: '',
          occupation: '',
          monthlyIncome: '',
          reasonForApplication: '',
          specificNeeds: '',
          hasReceivedSponsorshipBefore: false,
          previousSponsorshipDetails: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          documents: []
        });

        // Refresh user applications
        const userEmail = sessionStorage.getItem('userEmail');
        const appsResponse = await axios.get(`http://localhost:8070/sponsorship-applications/user/${userEmail}`);
        setUserApplications(appsResponse.data);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      const errorMessage = error.response?.data?.msg || 'Failed to submit application. Please try again.';
      alert(errorMessage);
    } finally {
      setApplicationLoading(false);
    }
  };

  const toggleEventDetails = (eventId) => {
    setSelectedEvent(selectedEvent === eventId ? null : eventId);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getApplicationStatus = (sponsorId) => {
    const application = userApplications.find(app => app.appliedFor._id === sponsorId);
    return application ? application.status : null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'under_review': return '#f59e0b';
      default: return '#6b7280';
    }
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
              <div className={styles.headerSection}>
                <h1 className={styles.pageTitle}>Upcoming Events</h1>
                <p className={styles.pageSubtitle}>Join our exciting events and activities</p>
              </div>
              
              {loading && <div className={styles.loading}>Loading events...</div>}
              {error && <div className={styles.error}>{error}</div>}
              
              <div className={styles.events}>
                {events.length === 0 && !loading ? (
                  <div className={styles.noEvents}>No events scheduled at the moment.</div>
                ) : (
                  events.map((event) => {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    const isExpired = eventDate < now.setHours(0,0,0,0);
                    return (
                      <div key={event._id} className={styles.event}>
                        <div className={styles.eventHeader}>
                          <div className={styles.eventImageContainer}>
                            <img 
                              src={event.image ? `http://localhost:8070/${event.image}` : Logo}
                              alt={event.title} 
                              className={styles.eventImage}
                            />
                            <div className={styles.eventBadge}>
                              {isExpired ? 'Past Event' : 'Upcoming'}
                            </div>
                          </div>
                          <div className={styles.eventInfo}>
                            <h3>{event.title}</h3>
                            <div className={styles.eventMeta}>
                              <span className={styles.eventDate}>
                                <FaCalendarAlt /> {formatDate(event.date)}
                              </span>
                              <span className={styles.eventTime}>
                                <FaClock /> {formatTime(event.startTime)} - {formatTime(event.endTime)}
                              </span>
                              <span className={styles.eventLocation}>
                                <FaMapMarkerAlt /> {event.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.eventContent}>
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
                          <div className={styles.attendeeAvatars}>
                            {event.attendees?.slice(0, 3).map((attendee, index) => (
                              <div key={index} className={styles.attendeeAvatar}>
                                {attendee.name ? attendee.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            ))}
                            {event.attendees?.length > 3 && (
                              <div className={styles.attendeeAvatar}>
                                +{event.attendees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.eventActions}>
                          {!isExpired && (
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
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* Sponsors Tab */}
          {activeTab === 'sponsors' && (
            <>
              <div className={styles.headerSection}>
                <h1 className={styles.pageTitle}>Sponsorship Programs</h1>
                <p className={styles.pageSubtitle}>Apply for sponsorship benefits and support</p>
              </div>
              
              {loading && <div className={styles.loading}>Loading sponsors...</div>}
              {error && <div className={styles.error}>{error}</div>}
              
              <div className={styles.sponsors}>
                {sponsors.length === 0 && !loading ? (
                  <div className={styles.noSponsors}>No sponsorship programs available at the moment.</div>
                ) : (
                  sponsors.map((sponsor) => {
                    const applicationStatus = getApplicationStatus(sponsor._id);
                    return (
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
                              <h4>Program Information</h4>
                              <p><strong>Contact Person:</strong> {sponsor.contactName}</p>
                              <p><FaEnvelope /> {sponsor.email}</p>
                              <p><FaPhone /> {sponsor.phone}</p>
                              {sponsor.website && (
                                <p><FaGlobe /> <a href={sponsor.website} target="_blank" rel="noopener noreferrer">{sponsor.website}</a></p>
                              )}
                            </div>
                            
                            <div className={styles.sponsorshipPeriod}>
                              <h4>Program Period</h4>
                              <p><strong>Start:</strong> {formatDate(sponsor.startDate)}</p>
                              <p><strong>End:</strong> {formatDate(sponsor.endDate)}</p>
                              {applicationStatus && (
                                <p style={{ color: getStatusColor(applicationStatus), fontWeight: 'bold', textTransform: 'capitalize' }}>
                                  <strong>Status:</strong> {applicationStatus.replace('_', ' ')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className={styles.eventActions} style={{ marginTop: '20px' }}>
                            {applicationStatus ? (
                              <button 
                                className={`${styles.actionButton} ${styles.active}`}
                                disabled
                              >
                                <FaCheck /> Application {applicationStatus.replace('_', ' ')}
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleApplyForSponsorship(sponsor)}
                                className={styles.actionButton}
                              >
                                <FaFileAlt /> Apply for Benefits
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Apply for {selectedSponsor?.name} Benefits</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowApplicationModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmitApplication} className={styles.applicationForm}>
              <div className={styles.formSection}>
                <h3><FaUser /> Personal Information</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="applicantName"
                      value={applicationForm.applicantName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      name="applicantEmail"
                      value={applicationForm.applicantEmail}
                      onChange={handleInputChange}
                      required
                      readOnly
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={applicationForm.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={applicationForm.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3><FaHome /> Address & Background</h3>
                <div className={styles.formGroup}>
                  <label>Full Address *</label>
                  <textarea
                    name="address"
                    value={applicationForm.address}
                    onChange={handleInputChange}
                    required
                    rows="3"
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Occupation *</label>
                    <input
                      type="text"
                      name="occupation"
                      value={applicationForm.occupation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Monthly Income *</label>
                    <input
                      type="number"
                      name="monthlyIncome"
                      value={applicationForm.monthlyIncome}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3><FaFileAlt /> Application Details</h3>
                <div className={styles.formGroup}>
                  <label>Why are you applying for this sponsorship? *</label>
                  <textarea
                    name="reasonForApplication"
                    value={applicationForm.reasonForApplication}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    placeholder="Please explain your reasons for applying..."
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>What specific needs do you have? *</label>
                  <textarea
                    name="specificNeeds"
                    value={applicationForm.specificNeeds}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    placeholder="Please describe your specific needs..."
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="hasReceivedSponsorshipBefore"
                      checked={applicationForm.hasReceivedSponsorshipBefore}
                      onChange={handleInputChange}
                    />
                    I have received sponsorship benefits before
                  </label>
                </div>
                
                {applicationForm.hasReceivedSponsorshipBefore && (
                  <div className={styles.formGroup}>
                    <label>Previous Sponsorship Details</label>
                    <textarea
                      name="previousSponsorshipDetails"
                      value={applicationForm.previousSponsorshipDetails}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Please provide details about previous sponsorships..."
                    />
                  </div>
                )}
              </div>

              <div className={styles.formSection}>
                <h3><FaPhone /> Emergency Contact</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Emergency Contact Name *</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={applicationForm.emergencyContactName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Emergency Contact Phone *</label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={applicationForm.emergencyContactPhone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3><FaFileAlt /> Supporting Documents</h3>
                <div className={styles.formGroup}>
                  <label>Upload Documents (ID, Income proof, etc.)</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                  <small>Maximum 5 files, 10MB each. Accepted formats: JPG, PNG, PDF, DOC, DOCX</small>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowApplicationModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={applicationLoading}
                >
                  {applicationLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Event;