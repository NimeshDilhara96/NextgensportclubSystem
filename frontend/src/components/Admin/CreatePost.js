import React, { useState } from 'react';
import AdminSlideNav from './AdminSlideNav';
import { FaImage, FaVideo, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import styles from './CreatePost.module.css';

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            </div>
        </>
    );
};

export default CreatePost; 