import React, { useState, useEffect } from 'react';
import SlideNav from '../appnavbar/slidenav';
import { FaThumbsUp, FaComment, FaImage, FaVideo } from 'react-icons/fa';
import styles from './PostsCommunity.module.css';
import axios from 'axios';
import Logo from '../../assets/logo.png';

const Community = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [userData, setUserData] = useState(null);

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

    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:8070/posts');
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchUserData();
    fetchPosts();
  }, []);

  const handleLike = async (postId) => {
    try {
      if (!userData) {
        alert('Please log in to like posts');
        return;
      }

      const response = await axios.post(`http://localhost:8070/posts/${postId}/like`, {
        userId: userData._id,
        userName: userData.name,
        userEmail: userData.email  // Include userEmail in the request
      });

      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId) => {
    try {
      if (!newComments[postId]?.trim()) {
        return;
      }
      
      if (!userData) {
        alert('Please log in to comment');
        return;
      }

      const response = await axios.post(`http://localhost:8070/posts/${postId}/comment`, {
        userId: userData._id,
        userName: userData.name,
        content: newComments[postId].trim()
      });

      // Update the posts state with the new comment
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? response.data : post
        )
      );

      // Clear the comment input
      setNewComments(prev => ({...prev, [postId]: ''}));

      // Update the comments state if needed
      if (comments[postId]) {
        setComments(prev => ({
          ...prev,
          [postId]: response.data.comments
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const toggleComments = async (postId) => {
    if (!comments[postId]) {
      try {
        const response = await axios.get(`http://localhost:8070/posts/${postId}/comments`);
        setComments(prev => ({...prev, [postId]: response.data}));
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    }
    setComments(prev => ({...prev, [postId]: !prev[postId]}));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.container}>
          <div className={styles.posts}>
            {posts.map((post) => (
              <div key={post._id} className={styles.post}>
                <div className={styles.postHeader}>
                  <img 
                    src={Logo}
                    alt="FTC Club Logo" 
                    className={styles.clubLogo}
                  />
                  <div className={styles.postUserInfo}>
                    <h3>CLUB FTC</h3>
                    <span className={styles.postDate}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className={styles.postContent}>
                  {post.content}
                  
                  {post.media && post.media.length > 0 && (
                    <div className={styles.mediaContainer}>
                      {post.media.map((mediaUrl, index) => {
                        const isVideo = /\.(mp4|mov|avi)$/i.test(mediaUrl);
                        return isVideo ? (
                          <video 
                            key={index}
                            className={styles.postMedia}
                            controls
                          >
                            <source src={`http://localhost:8070/${mediaUrl}`} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            key={index}
                            src={`http://localhost:8070/${mediaUrl}`}
                            alt={`Post media ${index + 1}`}
                            className={styles.postMedia}
                            onClick={() => window.open(`http://localhost:8070/${mediaUrl}`, '_blank')}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.postStats}>
                  <span>{post.likes?.length || 0} likes</span>
                  <span>{post.comments?.length || 0} comments</span>
                </div>

                <div className={styles.postActions}>
                  <button 
                    onClick={() => handleLike(post._id)} 
                    className={`${styles.actionButton} ${
                      post.likes?.some(like => like.userEmail === userData?.email) ? styles.active : ''
                    }`}
                  >
                    <FaThumbsUp /> Like
                  </button>
                  <button onClick={() => toggleComments(post._id)} className={styles.actionButton}>
                    <FaComment /> Comment
                  </button>
                </div>

                {comments[post._id] && (
                  <div className={styles.commentsSection}>
                    <div className={styles.commentInput}>
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComments[post._id] || ''}
                        onChange={(e) => setNewComments(prev => ({
                          ...prev,
                          [post._id]: e.target.value
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleComment(post._id);
                          }
                        }}
                      />
                      <button 
                        onClick={() => handleComment(post._id)}
                        disabled={!newComments[post._id]?.trim()}
                      >
                        Send
                      </button>
                    </div>
                    <div className={styles.commentsList}>
                      {post.comments?.map((comment, index) => (
                        <div key={index} className={styles.commentItem}>
                          <div className={styles.commentHeader}>
                            <strong>{comment.userName}</strong>
                            <span className={styles.commentDate}>
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={styles.commentContent}>
                            {comment.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Community;