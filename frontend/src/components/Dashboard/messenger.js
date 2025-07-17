import React, { useState, useEffect, useRef } from 'react';
import SlideNav from '../appnavbar/slidenav';
import Container from '../common/Container';
import styles from './Messenger.module.css';
import axios from 'axios';

const Messenger = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [coaches, setCoaches] = useState([]);
    const [selectedCoachEmail, setSelectedCoachEmail] = useState('');
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const prevMessagesLength = useRef(0);
    const prevCoachEmail = useRef('');

    const userEmail = sessionStorage.getItem('userEmail');

    // Fetch coaches (get their emails)
    useEffect(() => {
        const fetchCoaches = async () => {
            try {
                const res = await axios.get('http://localhost:8070/coaches');
                setCoaches(res.data.coaches || []);
            } catch {
                setCoaches([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCoaches();
    }, []);

    // Fetch messages
    const fetchMessages = React.useCallback(async () => {
        if (!selectedCoachEmail) {
            setMessages([]);
            return;
        }
        try {
            console.log('Fetching messages with:', {
              userValue: userEmail,
              userRole: 'user',
              otherValue: selectedCoachEmail,
              otherRole: 'coach'
            });
            const res = await axios.get(
                `http://localhost:8070/messages/thread?userValue=${userEmail}&userRole=user&otherValue=${selectedCoachEmail}&otherRole=coach`
            );
            console.log('Fetched messages:', res.data.messages);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setMessages([]);
        }
    }, [selectedCoachEmail, userEmail]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Polling for real-time updates
    useEffect(() => {
        if (!selectedCoachEmail) return;
        const interval = setInterval(() => {
            fetchMessages();
        }, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [selectedCoachEmail, userEmail, fetchMessages]);

    // Auto-scroll to latest message only when new message arrives or coach changes
    useEffect(() => {
        if (
            messagesEndRef.current &&
            (messages.length > prevMessagesLength.current || selectedCoachEmail !== prevCoachEmail.current)
        ) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessagesLength.current = messages.length;
        prevCoachEmail.current = selectedCoachEmail;
    }, [messages, selectedCoachEmail]);

    // Send message

    const [error, setError] = useState('');

    const handleSend = async (e) => {
        e.preventDefault();
        setIsSending(true);
        setError('');
        try {
            await axios.post('http://localhost:8070/messages', {
                senderValue: userEmail,
                senderRole: 'user',
                receiverValue: selectedCoachEmail,
                receiverRole: 'coach',
                message: messageText
            });
            setMessageText('');
            // Refresh messages, but don't show error if this fails
            try {
                const res = await axios.get(
                    `http://localhost:8070/messages/thread?userValue=${userEmail}&userRole=user&otherValue=${selectedCoachEmail}&otherRole=coach`
                );
                setMessages(res.data.messages || []);
            } catch (fetchErr) {
                // Optionally log, but don't set error for user
                console.error('Failed to fetch messages:', fetchErr);
            }
        } catch (err) {
            // Only show error if POST fails
            console.error('Send message error:', err?.response?.data || err.message);
            setError('Failed to send message. Please try again.');
        }
        setIsSending(false);
    };

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p className={styles.loadingText}>Loading Messenger...</p>
            </div>
        );
    }

    return (
        <>
            <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} userRole="user" />
            <Container isSidebarOpen={isSidebarOpen}>
                <div className={styles.messengerContentWrapper}>
                    <div className={styles.messengerHeaderSection}>
                        <h1 className={styles.messengerTitle}>Messenger</h1>
                        <p className={styles.messengerSubtitle}>Chat with your coaches in real time.</p>
                    </div>
                    {/* Coach Avatars Bar */}
                    <div className={styles.coachAvatarBar}>
                        {coaches.filter(coach => coach.email).map(coach => (
                            <div
                                key={coach._id}
                                className={
                                    styles.coachAvatarWrapper +
                                    (selectedCoachEmail === coach.email ? ' ' + styles.selectedCoach : '')
                                }
                                onClick={() => setSelectedCoachEmail(coach.email)}
                                title={coach.name}
                            >
                                <div className={styles.coachAvatarCircle}>
                                    <i className="fas fa-user-circle"></i>
                                </div>
                                <div className={styles.coachAvatarName}>{coach.name}</div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.messengerGrid} style={{ gridTemplateColumns: '1fr' }}>
                        {/* Remove messengerCard, make chat area direct children */}
                        {selectedCoachEmail && (
                            <div className={styles.chatHeader}>
                                <div className={styles.chatHeaderAvatar}>
                                    <i className="fas fa-user-circle"></i>
                                </div>
                                <div className={styles.chatHeaderInfo}>
                                    <div className={styles.chatHeaderName}>
                                        {coaches.find(c => c.email === selectedCoachEmail)?.name || 'Coach'}
                                    </div>
                                    <div className={styles.chatHeaderEmail}>
                                        {selectedCoachEmail}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className={styles.messagesList}>
                            {messages.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <i className={`fas fa-comment-dots ${styles.emptyIcon}`}></i>
                                    <p className={styles.emptyText}>No messages yet.<br/>Start a conversation with your coach!</p>
                                </div>
                            ) : (
                                <ul className={styles.messageUl}>
                                    {messages.map((msg, idx) => (
                                        <li
                                            key={idx}
                                            className={
                                                msg.senderRole === 'User'
                                                    ? styles.messageBubbleUser
                                                    : styles.messageBubbleCoach
                                            }
                                        >
                                            <div className={styles.messageHeader}>
                                                <span className={styles.senderName}>{msg.senderName}</span>
                                            </div>
                                            <div className={styles.messageBody}>{msg.message}</div>
                                            <div className={styles.messageDate}>
                                                {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </li>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </ul>
                            )}
                        </div>
                        <form onSubmit={handleSend} className={styles.chatInputBar} style={{boxShadow: '0 2px 12px rgba(25,118,210,0.10)', borderRadius: 32, background: '#f9fafb', marginTop: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10}}>
                            {/* Attachment icon (placeholder) */}
                            <button type="button" className={styles.inputIconBtn} tabIndex={-1} disabled>
                                <i className="fas fa-paperclip"></i>
                            </button>
                            {/* Emoji icon (placeholder) */}
                            <button type="button" className={styles.inputIconBtn} tabIndex={-1} disabled>
                                <i className="far fa-smile"></i>
                            </button>
                            <textarea
                                id="message"
                                value={messageText}
                                onChange={e => setMessageText(e.target.value)}
                                required
                                className={styles.textareaInput}
                                placeholder="Type your message..."
                                style={{ flex: 1, minHeight: 36, maxHeight: 80, resize: 'none', borderRadius: 24, padding: '12px 18px', background: '#fff', border: 'none', fontSize: 16, boxShadow: 'none', outline: 'none', margin: 0 }}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                            />
                            <button type="submit" disabled={isSending || !selectedCoachEmail || !messageText.trim()} className={styles.sendBtn} style={{ borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: '#1976d2', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(25,118,210,0.10)', transition: 'background 0.2s, transform 0.1s', marginLeft: 4 }}>
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </Container>
        </>
    );
};

export default Messenger;