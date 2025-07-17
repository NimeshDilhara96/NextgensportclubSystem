import React, { useState } from 'react';
import axios from 'axios';
import styles from './feedbackform.module.css'; // Use custom styles

const FeedbackForm = ({ userName }) => {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:8070/feedbacks', {
        user: userName || 'Anonymous',
        message
      });
      setSuccess('Thank you for your feedback!');
      setMessage('');
    } catch (err) {
      setError('Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.feedbackFormContainer}>
      <form onSubmit={handleSubmit} className={styles.feedbackForm}>
        <h4>Send Feedback</h4>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Your feedback..."
          required
          className={styles.feedbackTextarea}
        />
        <button type="submit" disabled={loading || !message} className={styles.feedbackButton}>
          {loading ? 'Sending...' : 'Send'}
        </button>
        {success && <div className={styles.successMessage}>{success}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}
      </form>
    </div>
  );
};

export default FeedbackForm;