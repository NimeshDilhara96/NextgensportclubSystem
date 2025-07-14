import React, { useState, useEffect } from 'react';
import AdminSlideNav from './AdminSlideNav';
import { FaImage, FaVideo, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import styles from './CreatePost.module.css';

const PostFeed = ({ posts, onDelete, onEdit, onLike, editingPostId, onSaveEdit, onCancelEdit, editContent, setEditContent }) => {
    return (
        <div className={styles.postFeed}>
            {posts.length === 0 ? (
                <div className={styles.noPosts}>No posts yet.</div>
            ) : (
                posts.map(post => (
                    <div key={post._id} className={styles.postCard}>
                        <div className={styles.postHeader}>
                            <span className={styles.postUser}>Admin</span>
                            <span className={styles.postDate}>{new Date(post.createdAt).toLocaleString()}</span>
                        </div>
                        {editingPostId === post._id ? (
                            <>
                                <textarea
                                    className={styles.editContentInput}
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                />
                                <div className={styles.editActions}>
                                    <button className={styles.saveEditBtn} onClick={() => onSaveEdit(post._id)}>Save</button>
                                    <button className={styles.cancelEditBtn} onClick={onCancelEdit}>Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.postContent}>{post.content}</div>
                                {post.media && post.media.length > 0 && (
                                    <div className={styles.postMediaPreview}>
                                        {post.media.map((url, idx) => (
                                            url.match(/\.(mp4|mov|avi)$/i) ? (
                                                <video key={idx} src={`http://localhost:8070/${url}`} controls className={styles.postMedia} />
                                            ) : (
                                                <img key={idx} src={`http://localhost:8070/${url}`} alt="media" className={styles.postMedia} />
                                            )
                                        ))}
                                    </div>
                                )}
                                <div className={styles.postActionsBar}>
                                    <button className={styles.likeBtn} onClick={() => onLike(post._id)}>
                                        👍 Like ({post.likes?.length || 0})
                                    </button>
                                    <button className={styles.editBtn} onClick={() => onEdit(post)}>
                                        ✏️ Edit
                                    </button>
                                    <button className={styles.deleteBtn} onClick={() => onDelete(post._id)}>
                                        🗑️ Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [posts, setPosts] = useState([]);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await axios.get('http://localhost:8070/posts');
            setPosts(res.data);
        } catch (err) {
            // Optionally handle error
        }
    };

    const handleMediaSelect = (e) => {
        const files = Array.from(e.target.files);
        const newMediaFiles = [...mediaFiles, ...files];
        setMediaFiles(newMediaFiles);

        // Create preview URLs
        const newPreviewUrls = files.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' : 'video'
        }));
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    };

    const removeMedia = (index) => {
        const newMediaFiles = mediaFiles.filter((_, i) => i !== index);
        const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
        setMediaFiles(newMediaFiles);
        setPreviewUrls(newPreviewUrls);
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await axios.delete(`http://localhost:8070/posts/${postId}`);
            setPosts(posts.filter(p => p._id !== postId));
        } catch (err) {
            alert('Failed to delete post.');
        }
    };

    const handleEdit = (post) => {
        setEditingPostId(post._id);
        setEditContent(post.content);
    };

    const handleSaveEdit = async (postId) => {
        try {
            await axios.put(`http://localhost:8070/posts/${postId}`, { content: editContent });
            setPosts(posts.map(p => p._id === postId ? { ...p, content: editContent } : p));
            setEditingPostId(null);
            setEditContent('');
        } catch (err) {
            alert('Failed to update post.');
        }
    };

    const handleCancelEdit = () => {
        setEditingPostId(null);
        setEditContent('');
    };

    const handleLike = async (postId) => {
        try {
            await axios.post(`http://localhost:8070/posts/${postId}/like`, {
                userEmail: 'admin@club.com' // For demo, replace with real admin email
            });
            fetchPosts();
        } catch (err) {
            // Optionally handle error
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && mediaFiles.length === 0) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            mediaFiles.forEach((file, index) => {
                formData.append('media', file);
            });

            const adminId = sessionStorage.getItem('adminId');
            const adminUsername = sessionStorage.getItem('adminUsername');
            formData.append('userId', adminId);
            formData.append('userName', adminUsername);

            await axios.post('http://localhost:8070/posts/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Clear form after successful submission
            setContent('');
            setMediaFiles([]);
            setPreviewUrls([]);
            alert('Post created successfully!');
            fetchPosts(); // Refresh posts after creation
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AdminSlideNav />
            <div className={styles.createPostContainer}>
                <div className={styles.createPostCard}>
                    <h2>Create New Post</h2>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className={styles.postContentInput}
                        />

                        {previewUrls.length > 0 && (
                            <div className={styles.mediaPreviewContainer}>
                                {previewUrls.map((media, index) => (
                                    <div key={index} className={styles.mediaPreview}>
                                        {media.type === 'image' ? (
                                            <img src={media.url} alt={`Preview ${index}`} />
                                        ) : (
                                            <video src={media.url} controls />
                                        )}
                                        <button
                                            type="button"
                                            className={styles.removeMedia}
                                            onClick={() => removeMedia(index)}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.postActions}>
                            <div className={styles.mediaButtons}>
                                <label className={styles.mediaButton}>
                                    <FaImage />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleMediaSelect}
                                        hidden
                                    />
                                </label>
                                <label className={styles.mediaButton}>
                                    <FaVideo />
                                    <input
                                        type="file"
                                        accept="video/*"
                                        multiple
                                        onChange={handleMediaSelect}
                                        hidden
                                    />
                                </label>
                            </div>
                            <button
                                type="submit"
                                className={styles.submitPost}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
                <PostFeed
                    posts={posts}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onLike={handleLike}
                    editingPostId={editingPostId}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    editContent={editContent}
                    setEditContent={setEditContent}
                />
            </div>
        </>
    );
};

export default CreatePost; 