import React, { useState, useEffect, useRef } from 'react';
import CoachSlideNav from './CoachSlideNav';
import axios from 'axios';
import styles from './sendmessage.module.css'; // Use local styles

const SendMessage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    // Fetch users (similar to SendTrainingPlan)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get('http://localhost:8070/sports');
                const sports = res.data.sports || [];
                const userMap = {};
                sports.forEach(sport => {
                    (sport.members || []).forEach(member => {
                        if (!userMap[member.userId]) {
                            userMap[member.userId] = {
                                _id: member.userId,
                                name: member.userName,
                                email: member.userEmail,
                            };
                        }
                    });
                });
                setUsers(Object.values(userMap));
            } catch {
                setUsers([]);
            }
        };
        fetchUsers();
    }, []);

    // Fetch messages for selected user (thread between coach and user)
    const fetchMessages = React.useCallback(async () => {
        if (!selectedUser) {
            setMessages([]);
            return;
        }
        try {
            const coachEmail = sessionStorage.getItem('coachEmail');
            const selectedUserObj = users.find(u => u._id === selectedUser);
            const selectedUserEmail = selectedUserObj ? selectedUserObj.email : '';
            const res = await axios.get(
                `http://localhost:8070/messages/thread?userValue=${coachEmail}&userRole=Coach&otherValue=${selectedUserEmail}&otherRole=User`
            );
            setMessages(res.data.messages || []);
        } catch (err) {
            setMessages([]);
        }
    }, [selectedUser, users]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Polling for real-time updates
    useEffect(() => {
        if (!selectedUser) return;
        const interval = setInterval(() => {
            fetchMessages();
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedUser, users, fetchMessages]);

    // Auto-scroll to latest message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        setIsSending(true);
        setError('');
        try {
            const token = sessionStorage.getItem('adminToken');
            const coachEmail = sessionStorage.getItem('coachEmail');
            const selectedUserObj = users.find(u => u._id === selectedUser);
            const selectedUserEmail = selectedUserObj ? selectedUserObj.email : '';
            await axios.post('http://localhost:8070/messages', {
                senderValue: coachEmail,
                senderRole: 'Coach',
                receiverValue: selectedUserEmail,
                receiverRole: 'User',
                message: messageText
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessageText('');
            fetchMessages();
        } catch {
            setError('Failed to send message.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <CoachSlideNav />
            <div className={styles.mainContent}>
                <div className={styles.messengerContentWrapper}>
                    <div className={styles.messengerHeaderSection}>
                        <h1 className={styles.messengerTitle}>Messenger</h1>
                        <p className={styles.messengerSubtitle}>Chat with your users in real time.</p>
                    </div>
                    {/* User Avatars Bar */}
                    <div className={styles.coachAvatarBar}>
                        {users.map(user => (
                            <div
                                key={user._id}
                                className={
                                    styles.coachAvatarWrapper +
                                    (selectedUser === user._id ? ' ' + styles.selectedCoach : '')
                                }
                                onClick={() => setSelectedUser(user._id)}
                                title={user.name}
                            >
                                <div className={styles.coachAvatarCircle}>
                                    <i className="fas fa-user-circle"></i>
                                </div>
                                <div className={styles.coachAvatarName}>{user.name}</div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.messengerGrid}>
                        {/* Chat Header */}
                        {selectedUser && (
                            <div className={styles.chatHeader}>
                                <div className={styles.chatHeaderAvatar}>
                                    <i className="fas fa-user-circle"></i>
                                </div>
                                <div className={styles.chatHeaderInfo}>
                                    <div className={styles.chatHeaderName}>
                                        {users.find(u => u._id === selectedUser)?.name || 'User'}
                                    </div>
                                    <div className={styles.chatHeaderEmail}>
                                        {users.find(u => u._id === selectedUser)?.email || ''}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className={styles.messagesList}>
                            {messages.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <i className={`fas fa-comment-dots ${styles.emptyIcon}`}></i>
                                    <p className={styles.emptyText}>No messages yet.<br/>Start a conversation!</p>
                                </div>
                            ) : (
                                <ul className={styles.messageUl}>
                                    {messages.map((msg, idx) => (
                                        <li
                                            key={idx}
                                            className={
                                                msg.senderRole === 'Coach'
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
                            <button type="submit" disabled={isSending || !selectedUser || !messageText.trim()} className={styles.sendBtn} style={{ borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: '#1976d2', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(25,118,210,0.10)', transition: 'background 0.2s, transform 0.1s', marginLeft: 4 }}>
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                        {error && <div className={styles.errorMessage}>{error}</div>}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SendMessage;